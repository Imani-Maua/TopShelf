const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

/**
 * Send email using Nodemailer
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text version of email
 * @param {string} html - HTML version of email
 * @returns {Promise} - Nodemailer send result
 */
const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: '"TopShelf Admin" <admin@topshelf.com>',
            to: to,
            subject: subject,
            text: text || 'Please view this email in HTML format',
            html: html,
        });

        console.log(`✅ Email sent successfully to: ${to}`);
        console.log(`📧 Message ID: ${info.messageId}`);
        console.log(`📬 Mailtrap Preview: https://mailtrap.io/inboxes`);

        return info;
    }
    catch (error) {
        console.error(`❌ Error sending email to ${to}:`, error.message);
        console.error('Full error:', error);
        throw error;
    }
};

module.exports = { sendEmail };