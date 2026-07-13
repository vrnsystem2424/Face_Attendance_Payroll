const nodemailer = require('nodemailer');

// ════════════════════════════════════════
// GMAIL TRANSPORTER
// ════════════════════════════════════════
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

// ════════════════════════════════════════
// SEND OTP EMAIL
// ════════════════════════════════════════
const sendOTPEmail = async (toEmail, otp, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"AttendEase System" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: '🔐 Password Reset OTP - AttendEase',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#faf8f5;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:500px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#1A1A2E 0%,#16213E 100%);padding:35px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:12px;">
                <div style="width:48px;height:48px;background:linear-gradient(135deg,#E8590C,#D14800);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;">
                  <span style="color:white;font-size:22px;">🏢</span>
                </div>
                <div style="text-align:left;">
                  <h1 style="margin:0;color:white;font-size:22px;font-weight:700;">AttendEase</h1>
                  <p style="margin:0;color:#9CA3AF;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Workforce Management</p>
                </div>
              </div>
            </div>

            <!-- Orange Bar -->
            <div style="height:4px;background:linear-gradient(90deg,#E8590C,#F4A261,#E8590C);"></div>

            <!-- Body -->
            <div style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#1A1A2E;font-size:24px;font-weight:700;">Password Reset Request</h2>
              <p style="margin:0 0 24px;color:#6B7280;font-size:15px;line-height:1.6;">
                Hi <strong style="color:#1A1A2E;">${name}</strong>, we received a request to reset your password.
              </p>

              <!-- OTP Box -->
              <div style="background:#FFF3E8;border:2px dashed #E8590C;border-radius:16px;padding:28px;text-align:center;margin:24px 0;">
                <p style="margin:0 0 8px;color:#9CA3AF;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Your OTP Code</p>
                <div style="font-size:42px;font-weight:800;color:#E8590C;letter-spacing:10px;font-family:'Courier New',monospace;">
                  ${otp}
                </div>
                <p style="margin:12px 0 0;color:#6B7280;font-size:13px;">
                  ⏰ Valid for <strong style="color:#E8590C;">10 minutes</strong> only
                </p>
              </div>

              <!-- Warning -->
              <div style="background:#FEF3F2;border-left:4px solid #EF4444;border-radius:8px;padding:14px 18px;margin:20px 0;">
                <p style="margin:0;color:#DC2626;font-size:13px;">
                  🔒 <strong>Security Notice:</strong> Never share this OTP with anyone. Our team will never ask for it.
                </p>
              </div>

              <p style="color:#9CA3AF;font-size:13px;line-height:1.6;margin:20px 0 0;">
                If you didn't request this, please ignore this email. Your account remains secure.
              </p>
            </div>

            <!-- Footer -->
            <div style="background:#F9FAFB;padding:20px 40px;border-top:1px solid #F3F4F6;text-align:center;">
              <p style="margin:0;color:#9CA3AF;font-size:12px;">
                © 2024 AttendEase · Workforce Management System
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to: ${toEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    throw new Error('Email send nahi ho saka');
  }
};

module.exports = { sendOTPEmail };