const nodemailer = require("nodemailer");
const { google } = require("googleapis");

const verificationEmailTemplate = require("../templates/emails/verification.email.template")

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const sendEmail = async ({ to, subject, text, html }) => {
  const accessToken = await oauth2Client.getAccessToken();

  console.log("ACCESS TOKEN:", accessToken.token);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GMAIL_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });

  return transporter.sendMail({
    from: `"UMS" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

const sendVerificationEmail = async ({
  to,
  name,
  verificationLink,
  expiryTime,
}) => {
  const html = verificationEmailTemplate({
    name,
    verificationLink,
    expiryTime,
  });

  return sendEmail({
    to,
    subject: "Verify Your Email - UMS",
    html,
  });
};

module.exports = { sendEmail, sendVerificationEmail };