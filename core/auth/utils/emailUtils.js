

/**
 * Generate invite email content
 */
function generateInviteEmail(email, firstname, inviteToken, frontendUrl) {
    const inviteLink = `${frontendUrl}/set-password?token=${inviteToken}`;

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #34A853 0%, #2E7D32 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background: #34A853; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to TopShelf!</h1>
        </div>
        <div class="content">
            <p>Hi ${firstname},</p>
            <p>You've been invited to join the TopShelf Bonus Management System. Click the button below to set your password and activate your account.</p>
            <p style="text-align: center;">
                <a href="${inviteLink}" class="button">Set Your Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px; font-size: 0.9em;">
                ${inviteLink}
            </p>
            <p><strong>Note:</strong> This invite link will expire in 7 days.</p>
        </div>
        <div class="footer">
            <p>If you didn't expect this email, please ignore it.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
}

module.exports = {
    generateInviteEmail
};
