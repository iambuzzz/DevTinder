const cron = require("node-cron");
const User = require("../models/user");
// const { sendEmail } = require("./sendEmail");
const emailQueue = require("../queues/mailQueue");
const sendWeeklyMails = async () => {
  console.log("Starting Weekly Newsletter Job...");

  try {
    const users = await User.find({}, "emailId firstName").lean();
    if (!users.length) return console.log("No users found to send emails.");

    // const BATCH_SIZE = 10; // Ek baar mein 10 mails
    // const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds ka gap taaki server saans le sake

    // for (let i = 0; i < users.length; i += BATCH_SIZE) {
    //   const currentBatch = users.slice(i, i + BATCH_SIZE);

    //   // 2. Batch ko parallel bhej rahe hain
    //   await Promise.all(
    //     currentBatch.map(async (user) => {
    //       try {
    //         const subject = `Hey ${user.firstName}, Trending on DevTinder this week! 🚀`;
    //         const bodyHtml = `
    //           <div style="font-family: sans-serif;">
    //             <h2>Weekly Digest for ${user.firstName}</h2>
    //             <p>Developers with skills like yours are getting 2x more matches this week!</p>
    //             <p>Check out who's looking at your profile.</p>
    //             <br>
    //             <a href="https://iambuzzdev.in/" style="background: #e74c3c; color: white; padding: 10px; text-decoration: none; border-radius: 5px;">View My Matches</a>
    //             <br>
    //             <hr>
    //             <p style="font-size: 10px; color: gray;">If you don't want these updates, <a href="#">unsubscribe here</a>.</p>
    //           </div>
    //         `;
    //         //   await sendEmail(
    //         //     user.emailId,
    //         //     subject,
    //         //     bodyHtml,
    //         //     "Check your weekly matches on DevTinder!"
    //         //   );
    //         await emailQueue.add(
    //           {
    //             email: user.emailId,
    //             subject: subject,
    //             html: bodyHtml,
    //             text: "Check your weekly matches on DevTinder!",
    //           },
    //           {
    //             attempts: 3,
    //             backoff: 5000,
    //           }
    //         );
    //       } catch (mailErr) {
    //         console.error(
    //           `Failed to send to ${user.emailId}:`,
    //           mailErr.message
    //         );
    //       }
    //     })
    //   );

    //   console.log(
    //     `Successfully sent batch: ${i + 1} to ${Math.min(
    //       i + BATCH_SIZE,
    //       users.length
    //     )}`
    //   );

    //   // 3. Agle batch se pehle thoda wait karo (Non-blocking)
    //   if (i + BATCH_SIZE < users.length) {
    //     await new Promise((resolve) =>
    //       setTimeout(resolve, DELAY_BETWEEN_BATCHES)
    //     );
    //   }
    // }
    // console.log("Weekly Newsletter Job Completed Successfully!");

    const jobs = users.map((user) => ({
      data: {
        email: user.emailId,
        subject: `Hey ${user.firstName}, Trending on DevTinder this week! 🚀`,
        html: `
          <div style="font-family: sans-serif;">
            <h2>Weekly Digest for ${user.firstName}</h2>
            <p>Check out who's looking at your profile.</p>
            <a href="https://iambuzzdev.in/" style="background: #e74c3c; color: white; padding: 10px; text-decoration: none; border-radius: 5px;">View My Matches</a>
          </div>`,
        text: "Check your weekly matches on DevTinder!",
      },
      opts: {
        attempts: 3,
        backoff: 5000,
        removeOnComplete: false, // Ab ye Redis mein hi rahega
        limit: { max: 100 }, // Sirf last 100 mails rakho memory bachane ke liye
      },
    }));

    // 3. Ek baar mein saare jobs Queue mein daal do (No Loop Delay needed!)
    // Bull ise manage kar lega
    await emailQueue.addBulk(jobs);

    console.log(
      `Successfully queued ${users.length} emails! Workers are now processing them in the background.`
    );
  } catch (err) {
    console.error("Critical Error in Cron Job:", err);
  }
};

// cron.schedule("59 7 * * 4", sendWeeklyMails);
