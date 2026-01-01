const { SESClient } = require("@aws-sdk/client-ses");

// Apne .env file se keys uthaiye (IAM User se jo mili thi)
const REGION = "eu-north-1"; // Apni AWS region yahan dalein

const sesClient = new SESClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

module.exports = { sesClient };
