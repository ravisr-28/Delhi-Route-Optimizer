const nodemailer = require('nodemailer');

// For development, we'll use a mock transport or log to console
// In production, these should be in .env
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    auth: {
        user: process.env.EMAIL_USER || 'mock_user',
        pass: process.env.EMAIL_PASS || 'mock_pass'
    }
});

const sendWelcomeEmail = async (email) => {
    const mailOptions = {
        from: '"Delhi Route Optimizer" <noreply@delhirouteoptimizer.com>',
        to: email,
        subject: 'Welcome to Delhi Route Optimizer Newsletter!',
        text: `Thank you for subscribing to our newsletter!

You will now receive updates on:
- Metro line status changes
- New route optimization features
- DTC & Cluster bus service updates

Happy commuting!
The Delhi Route Optimizer Team`,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Welcome to Delhi Route Optimizer!</h2>
        <p>Thank you for subscribing to our newsletter.</p>
        <p>You will now receive updates on:</p>
        <ul>
          <li>Metro line status changes</li>
          <li>New route optimization features</li>
          <li>DTC & Cluster bus service updates</li>
        </ul>
        <p>Happy commuting!</p>
        <hr>
        <p style="font-size: 12px; color: #666;">You're receiving this because you signed up on our website. If you'd like to unsubscribe, please click the link in our next update.</p>
      </div>
    `
    };

    try {
        // If not configured, just log
        if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'mock_user') {
            console.log('📧 [MOCK EMAIL] To:', email, 'Subject:', mailOptions.subject);
            return { success: true, message: 'Mock email logged' };
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendWelcomeEmail };