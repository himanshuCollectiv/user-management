const verificationEmailTemplate = ({
  name,
  verificationLink,
  expiryTime,
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <title>Verify Your Email</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f4f6f8;
          font-family: Arial, Helvetica, sans-serif;
          color: #333333;
        "
      >

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="background-color: #f4f6f8; padding: 40px 15px;"
        >
          <tr>
            <td align="center">

              <!-- Main Container -->
              <table
                width="600"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  max-width: 600px;
                  width: 100%;
                  background-color: #ffffff;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
                "
              >

                <!-- Header -->
                <tr>
                  <td
                    align="center"
                    style="
                      background-color: #2563eb;
                      padding: 30px 20px;
                    "
                  >
                    <h1
                      style="
                        margin: 0;
                        color: #ffffff;
                        font-size: 28px;
                        font-weight: 700;
                      "
                    >
                      UMS
                    </h1>

                    <p
                      style="
                        margin: 8px 0 0;
                        color: #dbeafe;
                        font-size: 14px;
                      "
                    >
                      User Management System
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 40px 30px;">

                    <h2
                      style="
                        margin: 0 0 20px;
                        font-size: 24px;
                        color: #111827;
                      "
                    >
                      Verify Your Email
                    </h2>

                    <p
                      style="
                        margin: 0 0 15px;
                        font-size: 16px;
                        line-height: 1.6;
                      "
                    >
                      Hello <strong>${name}</strong>,
                    </p>

                    <p
                      style="
                        margin: 0 0 20px;
                        font-size: 15px;
                        line-height: 1.7;
                        color: #4b5563;
                      "
                    >
                      Thank you for registering with UMS. Please verify your
                      email address by clicking the button below.
                    </p>

                    <!-- Verify Button -->
                    <table
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                      align="center"
                      style="margin: 30px auto;"
                    >
                      <tr>
                        <td
                          align="center"
                          style="
                            background-color: #2563eb;
                            border-radius: 8px;
                          "
                        >
                          <a
                            href="${verificationLink}"
                            target="_blank"
                            style="
                              display: inline-block;
                              padding: 14px 28px;
                              color: #ffffff;
                              text-decoration: none;
                              font-size: 15px;
                              font-weight: 600;
                              border-radius: 8px;
                            "
                          >
                            Verify Email
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Expiry Information -->
                    <div
                      style="
                        background-color: #eff6ff;
                        border-left: 4px solid #2563eb;
                        padding: 12px 15px;
                        margin: 25px 0;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          font-size: 14px;
                          line-height: 1.5;
                          color: #374151;
                        "
                      >
                        This verification link will expire after
                        <strong>${expiryTime}</strong>.
                      </p>
                    </div>

                    <p
                      style="
                        margin: 20px 0 0;
                        font-size: 13px;
                        line-height: 1.6;
                        color: #6b7280;
                      "
                    >
                      If the button above doesn't work, copy and paste the
                      following link into your browser:
                    </p>

                    <p
                      style="
                        margin: 8px 0 0;
                        font-size: 12px;
                        line-height: 1.5;
                        word-break: break-all;
                      "
                    >
                      <a
                        href="${verificationLink}"
                        style="
                          color: #2563eb;
                          text-decoration: none;
                        "
                      >
                        ${verificationLink}
                      </a>
                    </p>

                    <p
                      style="
                        margin: 25px 0 0;
                        font-size: 13px;
                        line-height: 1.6;
                        color: #6b7280;
                      "
                    >
                      If you did not create this account, you can safely
                      ignore this email.
                    </p>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td
                    align="center"
                    style="
                      background-color: #f9fafb;
                      padding: 20px;
                      border-top: 1px solid #e5e7eb;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        font-size: 12px;
                        color: #9ca3af;
                      "
                    >
                      © 2026 UMS. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>

      </body>
    </html>
  `;
};

module.exports = verificationEmailTemplate;