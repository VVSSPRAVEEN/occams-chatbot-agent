const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    // Use SendGrid if API key is provided, otherwise use nodemailer
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.useSendGrid = true;
    } else {
      // Configure nodemailer for development
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER || 'your-email@gmail.com',
          pass: process.env.EMAIL_PASS || 'your-app-password'
        }
      });
      this.useSendGrid = false;
    }
  }

  async sendMeetingConfirmation(email, meeting) {
    const subject = 'Meeting Confirmation - Occams Advisory';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Meeting Confirmed</h2>
        <p>Dear ${meeting.name},</p>
        <p>Your meeting with Occams Advisory has been confirmed.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Meeting Details:</h3>
          <p><strong>Date:</strong> ${new Date(meeting.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${meeting.time}</p>
          <p><strong>Purpose:</strong> ${meeting.purpose}</p>
        </div>
        
        <p>We look forward to speaking with you. If you need to reschedule, please contact us.</p>
        
        <p>Best regards,<br>Occams Advisory Team</p>
      </div>
    `;

    await this.sendEmail(email, subject, html);
  }

  async sendConversationSummary(email, conversation) {
    const subject = 'Your Conversation Summary - Occams Advisory';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Conversation Summary</h2>
        <p>Here's a summary of your recent conversation with Occams Advisory:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          ${conversation.messages.map(msg => `
            <div style="margin-bottom: 15px;">
              <strong>${msg.role === 'user' ? 'You' : 'Occams Advisory'}:</strong>
              <p style="margin: 5px 0;">${msg.content}</p>
            </div>
          `).join('')}
        </div>
        
        <p>If you have any further questions, feel free to reach out to us.</p>
        
        <p>Best regards,<br>Occams Advisory Team</p>
      </div>
    `;

    await this.sendEmail(email, subject, html);
  }

  async sendEmail(to, subject, html) {
    try {
      if (this.useSendGrid) {
        const msg = {
          to,
          from: process.env.EMAIL_FROM || 'noreply@occamsadvisory.com',
          subject,
          html
        };
        await sgMail.send(msg);
      } else {
        await this.transporter.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@occamsadvisory.com',
          to,
          subject,
          html
        });
      }
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();