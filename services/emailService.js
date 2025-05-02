const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
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

  return transporter.sendMail(mailOptions);
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

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendApprovalEmail,
  sendRejectionEmail
};