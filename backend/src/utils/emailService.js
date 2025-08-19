import nodemailer from 'nodemailer';

// Create transporter for SMTP. If missing creds in development, fall back to Ethereal test account.
let transporterPromise = (async () => {
  const hasCreds = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
  const isDev = (process.env.NODE_ENV || 'development') !== 'production';

  if (!hasCreds && isDev) {
    console.warn('[emailService] No SMTP creds found. Using Ethereal test account (development only).');
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
})();

/**
 * Send an email via Nodemailer.
 * Supports either an options object or positional args for backward compatibility.
 *
 * Usage:
 *   sendEmail({ to, subject, text, html });
 *   sendEmail(to, subject, text);
 *   sendEmail(to, subject, undefined, html);
 */
export const sendEmail = async (...args) => {
  try {
    // Normalize arguments
    let to, subject, text, html, attachments;
    if (typeof args[0] === 'object' && args[0] !== null) {
      ({ to, subject, text, html, attachments } = args[0]);
    } else {
      [to, subject, text, html, attachments] = args;
    }

    if (!to || !subject || (!text && !html)) {
      throw new Error('sendEmail requires: to, subject, and text or html');
    }

    const mailOptions = {
      from: `"Eagle Events" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      ...(attachments ? { attachments } : {}),
    };

    // Always attempt to send; also log for visibility
    console.log('\n===== SENDING EMAIL =====');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (text) console.log(`Text length: ${text.length}`);
    if (html) console.log(`HTML length: ${html.length}`);
    console.log('=========================\n');

    const transporter = await transporterPromise;
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    if (info.response) console.log('SMTP response:', info.response);
    const isEthereal = (transporter.options?.host || '').includes('ethereal');
    if (isEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log('Preview URL (Ethereal):', previewUrl);
    }
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};
