const Queue = require("bull");
const { sendEmail } = require("../utils/sendEmail");

// 1. Queue Create Karo (Redis se connect karke)
const emailQueue = new Queue("email-sending", {
  redis: { port: 6379, host: process.env.REDIS_HOST || "127.0.0.1" },
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

// Fire-and-forget: email fail hone se signup/payment fail nahi hona chahiye
const queueEmail = (email, { subject, html, text }) =>
  emailQueue
    .add({ email, subject, html, text }, { attempts: 3, backoff: 5000, removeOnComplete: true })
    .catch((err) => console.error("Email queue error:", err.message));

module.exports = emailQueue;
module.exports.queueEmail = queueEmail;
