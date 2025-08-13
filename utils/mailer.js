const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // ✅ Use STARTTLS
    secure: false, // ⚠️ must be false for port 587
    // service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendReminderEmail = (to, taskTitle, dueDate) => {
    const mailOptions = {
        from: `"Project Tracker" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Reminder: "${taskTitle}" is due soon!`,
        text: `Don't forget! Your task "${taskTitle}" is coming up.${dueDate ? `\nDue on: ${new Date(dueDate).toDateString()}` : ''
            }`

    };

    return transporter.sendMail(mailOptions);
};
const sendProjectInviteEmail = (to, projectName, teamCode) => {
    const mailOptions = {
        from: `"Project Tracker" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Invitation to join project: ${projectName}`,
        text: `You have been invited to join the project "${projectName}".\n\n` +
            `Use this team code to join: ${teamCode}\n\n` +
            `Log in to the app and use the "Join Team" option.`
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendReminderEmail, sendProjectInviteEmail };
// module.exports = sendReminderEmail;
