// One-time script: saare users ki photos (Cloudinary / Unsplash / Shutterstock) ko S3 par copy karta hai
// aur DB mein photoURL update karta hai.
//   Dry run (kuch change nahi hoga): node migrateImagesToS3.js --dry-run
//   Actual run:                       node migrateImagesToS3.js
const mongoose = require("mongoose");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();
const { s3Client, getS3Url, BUCKET } = require("./src/utils/s3");

const DRY_RUN = process.argv.includes("--dry-run");
const DEFAULT_AVATAR_SRC =
  "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg";
const DEFAULT_AVATAR_KEY = "defaults/avatar.jpg";

const EXT_BY_TYPE = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

// keyBase ke aage extension content-type se lagta hai (default avatar ka key fixed hai)
async function copyToS3(srcUrl, keyBase, fixedKey) {
  const res = await fetch(srcUrl);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const contentType = (res.headers.get("content-type") || "image/jpeg").split(";")[0];
  const key = fixedKey || `${keyBase}${EXT_BY_TYPE[contentType] || ".jpg"}`;
  const body = Buffer.from(await res.arrayBuffer());
  await s3Client.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType })
  );
  return getS3Url(key);
}

async function migrate() {
  if (!BUCKET) throw new Error("AWS_S3_BUCKET .env mein set nahi hai");
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to DB${DRY_RUN ? " (DRY RUN)" : ""}...`);

  const users = mongoose.connection.db.collection("users");
  const all = await users.find({}, { projection: { photoURL: 1 } }).toArray();
  const s3Prefix = getS3Url("");

  let defaultUrl = null;
  let migrated = 0, skipped = 0, failed = 0;

  for (const u of all) {
    const src = u.photoURL;
    if (!src || src.startsWith(s3Prefix)) {
      skipped++;
      continue;
    }
    try {
      let newUrl;
      if (src === DEFAULT_AVATAR_SRC) {
        // Default avatar ek hi baar upload hota hai, sab users usi ko point karte hain
        if (!defaultUrl) {
          defaultUrl = DRY_RUN
            ? getS3Url(DEFAULT_AVATAR_KEY)
            : await copyToS3(src, null, DEFAULT_AVATAR_KEY);
        }
        newUrl = defaultUrl;
      } else {
        const keyBase = `devtinder_profiles/${u._id}-${Date.now()}`;
        newUrl = DRY_RUN ? getS3Url(`${keyBase}.jpg`) : await copyToS3(src, keyBase);
      }
      if (!DRY_RUN) {
        await users.updateOne({ _id: u._id }, { $set: { photoURL: newUrl } });
      }
      migrated++;
      console.log(`✅ ${u._id}: ${new URL(src).hostname} -> ${newUrl}`);
    } catch (err) {
      failed++;
      console.log(`❌ ${u._id}: ${src} (${err.message})`);
    }
  }

  // Agar kisi user ke paas default avatar nahi tha, tab bhi naye signups ke liye upload kar do
  if (!defaultUrl && !DRY_RUN) {
    await copyToS3(DEFAULT_AVATAR_SRC, null, DEFAULT_AVATAR_KEY);
    console.log(`✅ Default avatar uploaded -> ${getS3Url(DEFAULT_AVATAR_KEY)}`);
  }

  console.log(`\nDone. Migrated: ${migrated}, Skipped: ${skipped}, Failed: ${failed}`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
