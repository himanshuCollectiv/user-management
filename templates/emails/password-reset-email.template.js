const passwordResetEmailTemplate = ({
  name,
  resetLink,
  expiryTime,
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f4f6f8;
  font-family: Arial, Helvetica, sans-serif;
">
  <div style="
    max-width: 600px;
    margin: 40px auto;
    background-color: #ffffff;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  ">

    <div style="
      background-color: #2563eb;
      padding: 24px;
      text-align: center;
    ">
      <h1 style="
        margin: 0;
        color: #ffffff;
        font-size: 26px;
      ">
        Reset Your Password
      </h1>
    </div>

    <div style="padding: 32px;">
      <p style="
        margin: 0 0 16px;
        color: #333333;
        font-size: 16px;
      ">
        Hello ${name},
      </p>

      <p style="
        margin: 0 0 16px;
        color: #555555;
        font-size: 15px;
        line-height: 1.6;
      ">
        We received a request to reset the password for your UMS account.
        Click the button below to create a new password.
      </p>

      <div style="
        text-align: center;
        margin: 30px 0;
      ">
        <a
          href="${resetLink}"
          style="
            display: inline-block;
            padding: 13px 24px;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-size: 15px;
            font-weight: bold;
          "
        >
          Reset Password
        </a>
      </div>

      <p style="
        margin: 0 0 12px;
        color: #666666;
        font-size: 14px;
        line-height: 1.5;
      ">
        This password reset link will expire in
        <strong>${expiryTime}</strong>.
      </p>

      <p style="
        margin: 0 0 12px;
        color: #666666;
        font-size: 14px;
        line-height: 1.5;
      ">
        If you did not request a password reset, you can safely ignore
        this email.
      </p>

      <p style="
        margin: 24px 0 0;
        color: #333333;
        font-size: 14px;
      ">
        Regards,<br />
        <strong>UMS Team</strong>
      </p>
    </div>

    <div style="
      padding: 18px;
      background-color: #f8fafc;
      text-align: center;
      color: #888888;
      font-size: 12px;
    ">
      This is an automated email. Please do not reply.
    </div>

  </div>
</body>
</html>
`;
};

module.exports = passwordResetEmailTemplate;