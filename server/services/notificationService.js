const nodemailer = require('nodemailer');
const twilio = require('twilio');
const webpush = require('web-push');
const { Pool } = require('pg');

// Initialize services
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Email configuration
const emailTransporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// SMS configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Push notification configuration
webpush.setVapidDetails(
  'mailto:' + process.env.EMAIL_USER,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

class NotificationService {
  // Main method to send notifications
  async sendNotification(userId, type, data, channels = ['push', 'email']) {
    try {
      const notificationData = await this.createNotification(userId, type, data);
      const results = {};

      for (const channel of channels) {
        switch (channel) {
          case 'push':
            results.push = await this.sendPushNotification(userId, notificationData);
            break;
          case 'email':
            results.email = await this.sendEmail(userId, notificationData);
            break;
          case 'sms':
            results.sms = await this.sendSMS(userId, notificationData);
            break;
        }
      }

      // Update notification record with sent timestamps
      await this.updateNotificationSentStatus(notificationData.id, results);
      
      return { success: true, notificationId: notificationData.id, results };
    } catch (error) {
      console.error('Notification service error:', error);
      return { success: false, error: error.message };
    }
  }

  // Create notification record in database
  async createNotification(userId, type, data) {
    const template = await this.getTemplate(type);
    if (!template) {
      throw new Error(`Template not found for type: ${type}`);
    }

    const title = this.processTemplate(template.subject || template.content.split('.')[0], data);
    const message = this.processTemplate(template.content, data);

    const query = `
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, title, message
    `;
    
    const result = await pool.query(query, [
      userId, 
      type, 
      title, 
      message, 
      JSON.stringify(data)
    ]);

    return result.rows[0];
  }

  // Get notification template
  async getTemplate(templateName) {
    const query = 'SELECT * FROM notification_templates WHERE template_name = $1 AND is_active = true';
    const result = await pool.query(query, [templateName]);
    return result.rows[0];
  }

  // Process template variables
  processTemplate(template, data) {
    let processed = template;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value);
    }
    return processed;
  }

  // Send push notification
  async sendPushNotification(userId, notificationData) {
    try {
      const subscriptionsQuery = `
        SELECT endpoint, p256dh_key, auth_key 
        FROM notification_subscriptions 
        WHERE user_id = $1 AND is_active = true
      `;
      const subscriptions = await pool.query(subscriptionsQuery, [userId]);

      const results = [];
      for (const sub of subscriptions.rows) {
        try {
          const pushConfig = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key
            }
          };

          const payload = JSON.stringify({
            title: notificationData.title,
            body: notificationData.message,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: {
              url: this.getNotificationUrl(notificationData.type)
            }
          });

          await webpush.sendNotification(pushConfig, payload);
          results.push({ success: true, endpoint: sub.endpoint });
        } catch (error) {
          console.error('Push notification failed for endpoint:', sub.endpoint, error);
          results.push({ success: false, endpoint: sub.endpoint, error: error.message });
        }
      }

      return { success: true, results };
    } catch (error) {
      console.error('Push notification service error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send email notification
  async sendEmail(userId, notificationData) {
    try {
      const userQuery = 'SELECT email, name FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: notificationData.title,
        html: this.generateEmailHTML(notificationData.title, notificationData.message, user.name)
      };

      await emailTransporter.sendMail(mailOptions);
      return { success: true, recipient: user.email };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send SMS notification
  async sendSMS(userId, notificationData) {
    try {
      const userQuery = 'SELECT phone_number FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [userId]);
      
      if (userResult.rows.length === 0 || !userResult.rows[0].phone_number) {
        throw new Error('User phone number not found');
      }

      const phoneNumber = userResult.rows[0].phone_number;
      
      await twilioClient.messages.create({
        body: notificationData.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      return { success: true, recipient: phoneNumber };
    } catch (error) {
      console.error('SMS sending error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update notification sent status
  async updateNotificationSentStatus(notificationId, results) {
    const updates = [];
    const values = [notificationId];
    let paramCount = 1;

    if (results.push?.success) {
      updates.push(`push_sent_at = $${++paramCount}`);
      values.push(new Date());
    }
    if (results.email?.success) {
      updates.push(`email_sent_at = $${++paramCount}`);
      values.push(new Date());
    }
    if (results.sms?.success) {
      updates.push(`sms_sent_at = $${++paramCount}`);
      values.push(new Date());
    }

    if (updates.length > 0) {
      const query = `UPDATE notifications SET ${updates.join(', ')} WHERE id = $1`;
      await pool.query(query, values);
    }
  }

  // Generate email HTML template
  generateEmailHTML(title, message, userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Drivigo</h1>
          </div>
          <div class="content">
            <h2>Hi ${userName || 'User'},</h2>
            <p>${message}</p>
            <p>Best regards,<br>Team Drivigo</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Drivigo. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Get URL for notification action
  getNotificationUrl(type) {
    const urlMap = {
      'booking_confirmation': '/dashboard',
      'lesson_reminder': '/dashboard',
      'payment_received': '/instructor-earnings',
      'lesson_completion': '/progress'
    };
    return urlMap[type] || '/dashboard';
  }

  // Schedule reminder notifications
  async scheduleReminders() {
    try {
      // Get bookings for tomorrow
      const query = `
        SELECT 
          b.id, b.learner_user_id, b.instructor_user_id, b.start_date, b.time_slot,
          u_learner.name as learner_name, u_learner.email as learner_email,
          u_instructor.name as instructor_name, u_instructor.email as instructor_email,
          ip.car_model, ip.phone_number as instructor_phone
        FROM bookings b
        JOIN users u_learner ON b.learner_user_id = u_learner.id
        JOIN users u_instructor ON b.instructor_user_id = u_instructor.id
        LEFT JOIN instructor_profiles ip ON b.instructor_user_id = ip.user_id
        WHERE b.start_date = CURRENT_DATE + INTERVAL '1 day'
        AND b.status = 'confirmed'
      `;
      
      const bookings = await pool.query(query);

      for (const booking of bookings.rows) {
        // Send reminder to learner
        await this.sendNotification(
          booking.learner_user_id,
          'lesson_reminder_sms',
          {
            lesson_time: booking.time_slot,
            instructor_name: booking.instructor_name,
            car_model: booking.car_model
          },
          ['push', 'sms']
        );
      }

      console.log(`Sent ${bookings.rows.length} reminder notifications`);
    } catch (error) {
      console.error('Error scheduling reminders:', error);
    }
  }
}

module.exports = new NotificationService();