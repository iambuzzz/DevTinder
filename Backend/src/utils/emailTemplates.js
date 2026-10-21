// Email templates (inline styles + tables, taaki Gmail/Outlook sab mein sahi dikhe)
const APP_URL = "https://devtinder.iambuzzdev.in";

// firstName user input hai, HTML mein daalne se pehle escape karo
const escapeHtml = (str = "") =>
  String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const layout = ({ preheader, heading, body, ctaText, ctaUrl }) => `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(79,70,229,0.12);">
        <tr>
          <td style="background:#4f46e5;background-image:linear-gradient(135deg,#6366f1,#a855f7);padding:36px 32px;text-align:center;">
            <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">&lt;/&gt; DevTinder</div>
            <div style="font-size:13px;color:#e0e7ff;margin-top:6px;">Where developers connect</div>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px 8px;">
            <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#111827;">${heading}</h1>
            ${body}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:16px 32px 36px;">
            <a href="${ctaUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:999px;">${ctaText}</a>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 32px;text-align:center;font-size:12px;color:#9ca3af;line-height:1.6;">
            You received this email because you have an account on DevTinder.<br/>
            <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;">devtinder.iambuzzdev.in</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const featureRow = (emoji, title, desc) => `
  <tr>
    <td width="44" valign="top" style="padding:10px 0;font-size:22px;">${emoji}</td>
    <td valign="top" style="padding:10px 0;">
      <div style="font-size:15px;font-weight:700;color:#111827;">${title}</div>
      <div style="font-size:14px;color:#6b7280;line-height:1.5;">${desc}</div>
    </td>
  </tr>`;

const welcomeEmail = (firstName) => {
  const name = escapeHtml(firstName);
  return {
    subject: `Welcome to DevTinder, ${firstName}! 🚀`,
    html: layout({
      preheader: "Your developer network starts here.",
      heading: `Hey ${name}, welcome aboard! 👋`,
      body: `
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
          You just joined a community of developers looking to build, collaborate and grow together.
          Here's how to get the most out of DevTinder:
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${featureRow("🧑‍💻", "Complete your profile", "Add a photo, your skills and a short bio so the right people find you.")}
          ${featureRow("🔥", "Start swiping", "Mark developers as Interested or Ignore. Matches happen when it's mutual.")}
          ${featureRow("💬", "Chat in real time", "Once connected, message your matches instantly.")}
        </table>`,
      ctaText: "Complete my profile",
      ctaUrl: `${APP_URL}/profile`,
    }),
    text: `Hey ${firstName}, welcome to DevTinder!\n\n1. Complete your profile: add a photo, skills and bio.\n2. Start swiping: mark developers as Interested or Ignore.\n3. Chat in real time with your connections.\n\nGet started: ${APP_URL}/profile`,
  };
};

const premiumEmail = (firstName, { amount, paymentId }) => {
  const name = escapeHtml(firstName);
  const amountText = `₹${(amount / 100).toLocaleString("en-IN")}`;
  return {
    subject: "You're now a DevTinder Premium member ⭐",
    html: layout({
      preheader: "Your Premium membership is active.",
      heading: `Thank you, ${name}! You're Premium now ⭐`,
      body: `
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
          Your payment was successful and your Premium membership is now active. Here's what you've unlocked:
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${featureRow("♾️", "Unlimited swipes", "No daily limits. Discover as many developers as you want.")}
          ${featureRow("👀", "See who likes you", "Know who's interested before you swipe.")}
          ${featureRow("💌", "Direct messages", "Reach out to developers directly.")}
          ${featureRow("⚡", "Priority support", "Your queries jump to the front of the line.")}
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#f5f3ff;border-radius:12px;">
          <tr><td style="padding:16px 20px;font-size:13px;color:#4c1d95;line-height:1.8;">
            <strong>Payment receipt</strong><br/>
            Amount paid: <strong>${amountText}</strong><br/>
            Payment ID: ${escapeHtml(paymentId)}
          </td></tr>
        </table>`,
      ctaText: "Explore Premium",
      ctaUrl: `${APP_URL}/premium`,
    }),
    text: `Thank you ${firstName}! Your DevTinder Premium membership is active.\n\nUnlocked: Unlimited swipes, See who likes you, Direct messages, Priority support.\n\nAmount paid: ${amountText}\nPayment ID: ${paymentId}\n\n${APP_URL}/premium`,
  };
};

module.exports = { welcomeEmail, premiumEmail };
