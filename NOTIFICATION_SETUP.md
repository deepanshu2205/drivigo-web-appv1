# Notification System Setup Guide

## Overview
This notification system provides real-time notifications for instructors when they receive new bookings. It includes:

- **Real-time WebSocket notifications**
- **Visual notification bell with unread count**
- **Sound notifications**
- **Browser notifications**
- **Notification history and management**

## Backend Setup

### 1. Install Dependencies
The server already includes `socket.io` in `server/package.json`. Run:
```bash
cd server
npm install
```

### 2. Database Setup
Run the SQL script to create the notifications table:
```bash
# Connect to your PostgreSQL database and run:
psql -d your_database_name -f server/create_notifications_table.sql
```

Or manually execute the SQL commands in `server/create_notifications_table.sql`.

### 3. Start the Server
```bash
cd server
npm start
```

## Frontend Setup

### 1. Install Dependencies
The client already includes `socket.io-client` in `client/package.json`. Run:
```bash
cd client
npm install
```

### 2. Add Notification Sound (Optional)
Replace `client/public/notification-sound.mp3` with an actual notification sound file.

### 3. Start the Client
```bash
cd client
npm start
```

## Features

### For Instructors:
- **Real-time notifications** when new bookings are received
- **Visual notification bell** in the dashboard header
- **Unread count badge** with pulsing animation
- **Sound notifications** (if sound file is provided)
- **Browser notifications** (if permission is granted)
- **Notification history** with read/unread status
- **Mark all as read** functionality

### Notification Types:
- **New Booking**: Sent when an instructor receives a new booking
- **Custom notifications**: Can be extended for other events

## How It Works

1. **WebSocket Connection**: The frontend connects to the server via WebSocket
2. **Authentication**: Users authenticate with their JWT token
3. **Real-time Updates**: When a booking is created, the server sends a notification to the instructor
4. **Visual Feedback**: The notification bell shows unread count and opens a dropdown
5. **Sound & Browser Notifications**: Additional audio and browser notifications for immediate attention

## API Endpoints

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `GET /api/notifications/unread-count` - Get unread notification count

## Customization

### Adding New Notification Types
1. Update the `sendNotificationToInstructor` function in `server/server.js`
2. Add new notification types in the `getNotificationIcon` function in `NotificationBell.js`
3. Handle new notification types in the frontend components

### Styling
- Notification styles are in `client/src/index.css`
- Customize colors, animations, and layout as needed

### Sound
- Replace `client/public/notification-sound.mp3` with your preferred sound
- Adjust volume in `NotificationContext.js` (currently set to 0.5)

## Troubleshooting

### WebSocket Connection Issues
- Check that the server is running on the correct port
- Verify CORS settings in `server/server.js`
- Check browser console for connection errors

### Database Issues
- Ensure the notifications table is created
- Check database connection in `server/db.js`
- Verify user authentication is working

### Sound Not Working
- Ensure the sound file exists at `client/public/notification-sound.mp3`
- Check browser autoplay policies
- Verify file format is supported (MP3 recommended)

## Security Considerations

- Notifications are user-specific and authenticated
- WebSocket connections require valid JWT tokens
- Database queries use parameterized statements
- CORS is properly configured for production domains

## Production Deployment

1. Update CORS origins in `server/server.js` for your production domain
2. Ensure WebSocket connections work through your proxy/load balancer
3. Set up proper SSL certificates for secure WebSocket connections
4. Configure environment variables for production
5. Set up database backups for notification data 