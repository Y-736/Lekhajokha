const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendApprovalEmail = async (email, name) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your Retailer Application Has Been Approved',
    html: `<p>Dear ${name},</p>
           <p>Congratulations! Your retailer application has been approved.</p>
           <p>You can now access your retailer dashboard.</p>`
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`Approval email sent to ${email}: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`Failed to send approval email to ${email}:`, error);
    throw error;
  }
};

const sendRejectionEmail = async (email, name, notes) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your Retailer Application Status',
    html: `<p>Dear ${name},</p>
           <p>We regret to inform you that your retailer application has been rejected.</p>
           ${notes ? `<p>Admin notes: ${notes}</p>` : ''}
           <p>Please contact support if you have questions.</p>`
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`Rejection email sent to ${email}: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`Failed to send rejection email to ${email}:`, error);
    throw error;
  }
};

module.exports = {
  sendApprovalEmail,
  sendRejectionEmail
};