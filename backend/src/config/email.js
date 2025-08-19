import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter based on configuration
const createTransporter = () => {
  // Prefer explicit SMTP config if provided (support both SMTP_* and EMAIL_* naming)
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = process.env.SMTP_PORT || process.env.EMAIL_PORT;
  const secureRaw = (process.env.SMTP_SECURE ?? process.env.EMAIL_SECURE ?? '').toString();
  const secure = ['true', '1', 'yes'].includes(secureRaw.toLowerCase());
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

  if (host) {
    return nodemailer.createTransport({
      host,
      port: Number(port || 587),
      secure,
      auth: (user && pass) ? { user, pass } : undefined
    });
  }

  // Fallback to service-based transport (e.g., Gmail)
  if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // No SMTP or service configured: return a logging-only transporter (no delivery)
  console.warn('⚠️ No SMTP host/service configured. Using logging-only transporter.');
  return {
    sendMail: async (mailOptions) => {
      console.log('📧 [NO-SEND] Email (createTransporter logging-only):', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        from: mailOptions.from
      });
      return { messageId: 'no-send-' + Date.now() };
    }
  };
};

let transporter = null;

// Initialize transporter
const initializeTransporter = async () => {
  try {
    const hasRealSMTP = !!(process.env.SMTP_HOST || process.env.EMAIL_HOST);
    const hasUserPass = !!(
      (process.env.SMTP_USER && (process.env.SMTP_PASS)) ||
      (process.env.EMAIL_USER && (process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD))
    );
    const hasService = !!(process.env.EMAIL_SERVICE && process.env.EMAIL_USER && (process.env.EMAIL_PASS));

    // Decide if we should use Ethereal (dev preview) or a real transporter
    const shouldUseEthereal = (
      !hasRealSMTP && !hasService && !hasUserPass && process.env.NODE_ENV !== 'production'
    );

    if (shouldUseEthereal) {
      // Do NOT use Ethereal. Create a logging-only transporter to avoid accidental sends.
      console.warn('⚠️ No SMTP credentials configured. Emails will NOT be sent. Configure SMTP or EMAIL_* env vars.');
      transporter = {
        sendMail: async (mailOptions) => {
          console.log('📧 [NO-SEND] Email (logging-only):', {
            to: mailOptions.to,
            subject: mailOptions.subject,
            from: mailOptions.from
          });
          return { messageId: 'no-send-' + Date.now() };
        }
      };
      console.log('📧 Email transporter: Logging-only (no Ethereal, no delivery)');
    } else {
      // Use real SMTP/Service if configured
      transporter = createTransporter();
      const mode = hasService ? `service=${process.env.EMAIL_SERVICE}` : `smtp=${process.env.SMTP_HOST || process.env.EMAIL_HOST}`;
      console.log('📧 Email transporter: Real configuration in use ->', mode);
    }
  } catch (error) {
    console.error('❌ Failed to initialize email transporter:', error);
    // Create a fallback transporter that logs instead of sending
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('📧 Email would be sent (fallback mode):', {
          to: mailOptions.to,
          subject: mailOptions.subject,
          text: mailOptions.text?.substring(0, 100) + '...'
        });
        return { messageId: 'fallback-' + Date.now() };
      }
    };
  }
};

// Initialize on module load
initializeTransporter();

/**
 * Send email using configured transporter
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content (optional)
 * @param {Array} options.attachments - Email attachments (optional)
 */
export const sendEmail = async (options) => {
  try {
    if (!transporter) {
      await initializeTransporter();
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Eagles Events <noreply@eagleevents.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments || []
    };

    const info = await transporter.sendMail(mailOptions);

    const previewUrl = nodemailer.getTestMessageUrl?.(info);
    if (previewUrl) {
      console.log('📧 Email sent successfully!');
      console.log('📧 Preview URL:', previewUrl);
    } else if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Email sent successfully (no preview URL). To:', options.to);
    } else {
      console.log('📧 Email sent successfully to:', options.to);
    }
    
    return info;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

/**
 * Verify email configuration
 */
export const verifyEmailConfig = async () => {
  try {
    if (!transporter) {
      await initializeTransporter();
    }
    
    await transporter.verify();
    console.log('✅ Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Email configuration verification failed:', error);
    return false;
  }
};

export default {
  sendEmail,
  verifyEmailConfig
};
