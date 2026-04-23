const nodemailer = require('nodemailer');

// Create transporter (configure based on environment)
let transporter;

const initializeTransporter = () => {
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('✅ Email service configured');
  } else {
    console.log('⚠️  Email service not configured (SMTP settings missing)');
    // Create a test account for development
    if (process.env.NODE_ENV === 'development') {
      nodemailer.createTestAccount().then(account => {
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: account.user,
            pass: account.pass,
          },
        });
        console.log('📧 Development email account created:', account.user);
      });
    }
  }
};

/**
 * Send user invitation email
 */
const sendInvitationEmail = async ({ to, inviterName, companyName, inviteLink, role }) => {
  if (!transporter) {
    console.log('Email not sent (no transporter):', { to, inviteLink });
    return { success: false, reason: 'Email service not configured' };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@personaplatform.com',
    to,
    subject: `You've been invited to join ${companyName} on Persona Platform`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to Persona Platform</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Persona Platform</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">You're Invited!</h2>
          
          <p style="color: #4b5563;">
            <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on Persona Platform as a <strong>${role}</strong>.
          </p>
          
          <p style="color: #4b5563;">
            Persona Platform helps teams understand and communicate better through AI-powered persona simulation.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            This invitation will expire in 7 days. If you didn't expect this email, you can safely ignore it.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${inviteLink}" style="color: #667eea;">${inviteLink}</a>
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
You've been invited to join ${companyName} on Persona Platform!

${inviterName} has invited you to join as a ${role}.

Click this link to accept the invitation:
${inviteLink}

This invitation will expire in 7 days.

If you didn't expect this email, you can safely ignore it.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    // If using ethereal, log preview URL
    if (info.messageId && process.env.NODE_ENV === 'development') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send questionnaire invitation email
 */
const sendQuestionnaireEmail = async ({ to, companyName, questionnaireName, accessLink }) => {
  if (!transporter) {
    console.log('Email not sent (no transporter):', { to, accessLink });
    return { success: false, reason: 'Email service not configured' };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@personaplatform.com',
    to,
    subject: `${companyName} - Please complete the ${questionnaireName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📋 Questionnaire</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">${questionnaireName}</h2>
          
          <p style="color: #4b5563;">
            <strong>${companyName}</strong> has invited you to complete a questionnaire to help build better team personas.
          </p>
          
          <p style="color: #4b5563;">
            Your responses will help create AI personas that improve team communication and understanding.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${accessLink}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Complete Questionnaire
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            This should take about 5-10 minutes to complete.
          </p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  initializeTransporter,
  sendInvitationEmail,
  sendQuestionnaireEmail,
};
