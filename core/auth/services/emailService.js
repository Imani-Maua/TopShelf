const nodemailer = require('nodemailer');
const { generateInviteEmail } = require('../utils/emailUtils');

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});



const sendEmail = async(to, subject, text, html) => {
    try {
        const inviteLink = `${frontendUrl}/set-password?token=${inviteToken}`;
        const text = ''
       
        const info = await transporter.sendMail({
            from: '"TopShelf Admin" <admin@topshelf.com>',
            to: to,
            subject: subject,
            text: text,
            html : html,
        });
        console.log("Message sent to:,%s", info.messageId);
        return info;
    }
    catch(error){
        console.log("Error sending email:", error);
        throw error;
    }
};

module.exports = { sendEmail };