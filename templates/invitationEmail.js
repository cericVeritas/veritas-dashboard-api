const escapeHtml = value => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const invitationEmail = ({ recipientName, invitationUrl, year }) => `
    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You're Invited!</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f3f4f6; font-family:Arial, Helvetica, sans-serif; color:#4b5563;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f3f4f6;">
            <tr>
                <td align="center" style="padding:36px 16px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:760px; background-color:#ffffff;">
                        <tr>
                            <td style="padding:64px 72px 48px;">
                                <h1 style="margin:0 0 34px; color:#111827; font-size:32px; line-height:1.25; font-weight:700;">You're Invited!</h1>
                                <p style="margin:0 0 28px; font-size:20px; line-height:1.5;">Hi ${escapeHtml(recipientName)},</p>
                                <p style="margin:0 0 38px; font-size:20px; line-height:1.65;">We are excited to invite you to our upcoming event. Click the button below to view the details and secure your spot.</p>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td align="center">
                                            <a href="${escapeHtml(invitationUrl)}" target="_blank" style="display:inline-block; padding:17px 38px; background-color:#0d82ff; border-radius:6px; color:#ffffff; font-size:18px; line-height:1; font-weight:700; text-decoration:none;">View Invitation</a>
                                        </td>
                                    </tr>
                                </table>
                                <div style="margin-top:40px; border-top:1px solid #e5e7eb;"></div>
                                <p style="margin:38px 0 0; text-align:center; font-size:17px; line-height:1.5; color:#6b7280;">&copy; ${escapeHtml(year)} Veritas Allies. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
`;

export default invitationEmail;
