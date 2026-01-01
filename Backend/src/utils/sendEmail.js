const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const REGION = "ap-south-1";

const sesClient = new SESClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const sendEmail = async (toAddress, subject, bodyHtml, bodyText) => {
  const params = {
    Destination: {
      ToAddresses: ["ambujjais1@gmail.com"],
    },
    Message: {
      Body: {
        Html: { Charset: "UTF-8", Data: bodyHtml },
        Text: { Charset: "UTF-8", Data: bodyText },
      },
      Subject: { Charset: "UTF-8", Data: subject },
    },
    Source: "support@iambuzzdev.in",
  };

  try {
    const data = await sesClient.send(new SendEmailCommand(params));
    console.log("Success: Email sent! ID:", data.MessageId);
    return data;
  } catch (err) {
    console.error("Error: Email failed!", err);
    throw err;
  }
};

// CommonJS export
module.exports = { sendEmail };
