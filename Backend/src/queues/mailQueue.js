const Queue = require("bull");
const { sendEmail } = require("../utils/sendEmail");

// 1. Queue Create Karo (Redis se connect karke)
const emailQueue = new Queue("email-sending", {
  redis: { port: 6379, host: "127.0.0.1" },
});
// Redis connection check
emailQueue.client.on("error", (err) => {
  console.error(
    "❌ REDIS ERROR: Bhai Redis start karna bhool gaye kya? Check karo: brew services start redis"
  );
});
emailQueue.client.on("connect", () => {
  console.log("✅ Redis connected: Bull Queue is ready!");
});
// 2. Worker (Process) Likho
// Ye background mein chalta rahega
emailQueue.process(2, async (job) => {
  const { email, subject, html, text } = job.data;
  console.log(`Processing email to: ${email}`);

  // Asli email yahan jayega
  await sendEmail(email, subject, html, text);
});

module.exports = emailQueue;
