const { Resend } = require("resend");

// Resend free tier: 3000 emails/month. Domain verify hone tak sirf onboarding@resend.dev se
// aur sirf apne account ke email par bhej sakte ho.
const FROM = process.env.EMAIL_FROM || "DevTinder <onboarding@resend.dev>";

let resend;
const getClient = () => {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
};

const sendEmail = async (toAddress, subject, bodyHtml, bodyText) => {
  const { data, error } = await getClient().emails.send({
    from: FROM,
    to: [toAddress],
    subject,
    html: bodyHtml,
    text: bodyText,
  });

  if (error) {
    console.error("Error: Email failed!", error);
    throw new Error(error.message);
  }
  console.log("Success: Email sent! ID:", data.id);
  return data;
};

// CommonJS export
module.exports = { sendEmail };
