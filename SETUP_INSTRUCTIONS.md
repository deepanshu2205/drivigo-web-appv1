# Drivigo Enhanced Features Setup Guide

This guide will help you set up the enhanced Drivigo application with all the new features including push notifications, progress tracking, earnings dashboard, and mobile responsiveness.

## 🚀 New Features Added

1. **Push Notifications** - Real-time notifications for booking confirmations and reminders
2. **Student Progress Tracking** - Comprehensive lesson history and skill analysis
3. **Mobile-Responsive Design** - Optimized experience across all devices
4. **Instructor Earnings Dashboard** - Detailed analytics and earnings tracking
5. **Automated Email/SMS Notifications** - Multi-channel communication system

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## 🔧 Installation Steps

### 1. Clone and Install Dependencies

```bash
# Navigate to your project directory
cd drivigo

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Database Setup

```bash
# Create a new PostgreSQL database
createdb drivigo_enhanced

# Run the database schema
cd ../server
psql -d drivigo_enhanced -f database-schema.sql
```

### 3. Environment Configuration

```bash
# Copy the environment template
cd server
cp .env.example .env

# Edit the .env file with your configurations
nano .env
```

#### Required Environment Variables:

**Database:**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/drivigo_enhanced
JWT_SECRET=your_super_secret_jwt_key
```

**Email Notifications (Gmail):**
```env
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

**SMS Notifications (Twilio):**
```env
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Push Notifications (VAPID Keys):**
```bash
# Generate VAPID keys
npx web-push generate-vapid-keys

# Add to .env file
VAPID_PUBLIC_KEY=your_generated_public_key
VAPID_PRIVATE_KEY=your_generated_private_key
```

**Payment Gateway:**
```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

**MapBox (for location services):**
```env
MAPBOX_TOKEN=your_mapbox_access_token
```

### 4. Start the Application

```bash
# Start the server (from server directory)
cd server
npm start

# Start the client (from client directory)
cd ../client
npm start
```

## 📱 Mobile Setup

### Progressive Web App (PWA)
The application now supports PWA features for mobile devices:

1. **Installation Prompt**: Users can install the app on their mobile devices
2. **Offline Support**: Basic caching for improved offline experience
3. **Push Notifications**: Real-time notifications even when app is closed

### Icons Required
Add these icon files to `client/public/`:
- `icon-192x192.png`
- `icon-512x512.png`
- `badge-72x72.png`

## 🔔 Notification Setup

### Email Configuration (Gmail)
1. Enable 2FA on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `EMAIL_PASSWORD`

### SMS Configuration (Twilio)
1. Create a Twilio account
2. Get your Account SID and Auth Token
3. Purchase a phone number
4. Add credentials to `.env`

### Push Notifications
1. Generate VAPID keys using `npx web-push generate-vapid-keys`
2. Add keys to server `.env`
3. Service worker automatically registers for push notifications

## 📊 Features Configuration

### Progress Tracking
The system automatically tracks:
- Lesson completion and ratings
- Skills practiced per lesson
- Total driving hours
- Performance analytics
- Personalized recommendations

### Earnings Dashboard (Instructors)
Features include:
- Real-time earnings tracking
- Student analytics
- Payment processing status
- Performance metrics
- Exportable reports

### Mobile Responsiveness
- Automatic device detection
- Responsive layouts for mobile/tablet/desktop
- Touch-friendly interface
- Mobile-specific navigation

## 🗃️ Database Schema

The enhanced database includes these new tables:
- `student_progress` - Lesson progress tracking
- `instructor_earnings` - Earnings and payments
- `notifications` - Notification history
- `notification_subscriptions` - Push notification subscriptions
- `user_devices` - Device tracking for analytics
- `notification_templates` - Email/SMS templates

## 🚦 Testing the Features

### 1. Test Push Notifications
```bash
# Use the notification center in the app
# Or test via API:
curl -X POST http://localhost:5000/api/notifications/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "type": "booking_confirmation_email", "data": {"student_name": "Test User"}, "channels": ["push"]}'
```

### 2. Test Progress Tracking
1. Complete a lesson booking
2. Instructor can record progress via API or UI
3. Student can view progress in `/progress` page

### 3. Test Earnings Dashboard
1. Complete a paid lesson
2. Navigate to `/earnings` (instructor only)
3. View analytics and charts

### 4. Test Mobile Responsiveness
1. Open app on mobile device
2. Check navigation (emoji icons on mobile)
3. Test touch interactions
4. Verify PWA installation prompt

## 🔧 Scheduled Tasks

Set up a cron job for reminder notifications:

```bash
# Add to crontab (runs daily at 10 AM)
0 10 * * * curl -X POST http://localhost:5000/api/notifications/schedule-reminders \
  -H "x-api-key: YOUR_INTERNAL_API_KEY"
```

## 🛠️ Troubleshooting

### Common Issues:

1. **Push notifications not working:**
   - Verify VAPID keys are correct
   - Check browser permissions
   - Ensure HTTPS in production

2. **Database connection errors:**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists

3. **Email/SMS not sending:**
   - Verify credentials in .env
   - Check network connectivity
   - Review service provider settings

4. **Mobile layout issues:**
   - Clear browser cache
   - Check Tailwind CSS is loading
   - Verify responsive classes

## 📈 Analytics & Monitoring

The enhanced app now tracks:
- User device information
- Notification delivery status
- Progress completion rates
- Earnings analytics
- Mobile vs desktop usage

## 🔒 Security Notes

1. **Never commit `.env` files**
2. **Use strong JWT secrets**
3. **Enable HTTPS in production**
4. **Regularly rotate API keys**
5. **Validate all user inputs**

## 🚀 Production Deployment

1. **Build the client:**
   ```bash
   cd client
   npm run build
   ```

2. **Set environment to production:**
   ```env
   NODE_ENV=production
   ```

3. **Use process manager:**
   ```bash
   pm2 start server.js --name drivigo-server
   ```

4. **Setup reverse proxy (nginx):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
       }
       
       location /api {
           proxy_pass http://localhost:5000;
       }
   }
   ```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs: `tail -f logs/app.log`
3. Check browser console for client-side errors
4. Verify all environment variables are set correctly

---

**🎉 Congratulations!** Your enhanced Drivigo application is now ready with all the new features including push notifications, progress tracking, earnings dashboard, mobile responsiveness, and automated notifications!