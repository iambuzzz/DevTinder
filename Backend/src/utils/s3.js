const { S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const multer = require("multer");
const path = require("path");

// IAM user ko S3 PutObject permission chahiye
const REGION = process.env.AWS_REGION || "eu-north-1";
const BUCKET = process.env.AWS_S3_BUCKET;

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

// Public URL of an object (bucket policy se public-read hai)
const getS3Url = (key) =>
  `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const uploadUtils = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: (req, file, cb) => cb(null, BUCKET),
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      cb(null, `devtinder_profiles/${req.user._id}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only jpg, jpeg and png images are allowed"));
  },
});

module.exports = { s3Client, getS3Url, uploadUtils, BUCKET, REGION };
