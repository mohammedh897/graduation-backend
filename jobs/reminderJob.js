const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const sendReminderEmail = require('../utils/mailer');

const runReminders = () => {
    cron.schedule('*/ * * 8 * *', async () => {
        console.log('📣 Running reminder job...');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const tasks = await Task.find({
            reminderDate: { $gte: today, $lt: tomorrow },
            reminderSent: false
        });
        console.log(`🔍 Found ${tasks.length} task(s) with reminder today`);


        for (const task of tasks) {
            console.log(`🕒 ReminderDate = ${task.reminderDate.toDateString()}`);
            const user = await User.findById(task.userId);

            if (user) {
                console.log(`🔔 Sending email to ${user.username} for "${task.title}"`);

                // For demo: assume user's email = username + @gmail.com
                const email = user.email; // replace with user.email if you store real emails

                try {
                    await sendReminderEmail(email, task.title, task.dueDate);
                    await Task.findByIdAndUpdate(task._id, { reminderSent: true });
                    console.log("📅 Due date value:", task.dueDate);
                    console.log(`✅ Email sent to ${email}`);
                } catch (err) {
                    console.error(`❌ Failed to send email to ${email}`, err.message);
                }
            }
        }
    });
};

module.exports = runReminders;
