// --- Imports ---
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const authMiddleware = require('./authMiddleware');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');

// Import new services
const notificationService = require('./services/notificationService');
const progressService = require('./services/progressService');
const earningsService = require('./services/earningsService');

// --- App & Port Setup ---
const app = express();
const port = 5000;

// --- Middleware ---
app.use(express.json());

const allowedOrigins = [
  'http://localhost:3000',
  'https://drivigo-web-appv1.vercel.app'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// --- Configurations ---
const connectionString = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

const geocodingService = mbxGeocoding({ accessToken: MAPBOX_TOKEN });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const pool = new Pool({
  connectionString,
});

// --- API Endpoints ---

// SIGNUP
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required.' });
    }
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, passwordHash, role]
    );
    res.status(201).json({
      message: 'User created successfully!',
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({
      message: 'Logged in successfully!',
      token: token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// FIND INSTRUCTORS
app.post('/api/instructors/find', async (req, res) => {
  try {
    const { startDate, timeSlot, location } = req.body;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bookingDay = days[new Date(startDate).getDay()];
    const query = `
      SELECT ip.id, ip.car_model, u.email as instructor_email, u.id as user_id
      FROM instructor_profiles ip
      JOIN users u ON ip.user_id = u.id
      JOIN instructor_availability ia ON ip.id = ia.instructor_id
      WHERE
        ia.day_of_week = $1 AND
        ia.time_slot = $2 AND
        ST_DWithin(ip.service_area, ST_MakePoint($3, $4), 5000);
    `;
    const values = [bookingDay, timeSlot, location.longitude, location.latitude];
    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (error) {
    console.error('Error finding instructors:', error);
    res.status(500).json({ message: 'Server error while finding instructors.' });
  }
});

// CREATE PAYMENT ORDER
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const options = {
      amount: 50000,
      currency: 'INR',
      receipt: `receipt_order_${new Date().getTime()}`
    };
    const order = await razorpay.orders.create(options);
    if (!order) return res.status(500).send('Error creating order');
    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Server error while creating order.' });
  }
});

// VERIFY PAYMENT AND CREATE BOOKING
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingData } = req.body;
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign.toString()).digest('hex');
    
    if (razorpay_signature === expectedSign) {
      const { learner_user_id, instructor_user_id, session_plan, start_date, time_slot } = bookingData;
      const query = `INSERT INTO bookings (learner_user_id, instructor_user_id, session_plan, start_date, time_slot, razorpay_payment_id, status) VALUES ($1, $2, $3, $4, $5, $6, 'confirmed') RETURNING id;`;
      const values = [learner_user_id, instructor_user_id, session_plan, start_date, time_slot, razorpay_payment_id];
      const result = await pool.query(query, values);
      
      // Send booking confirmation notification
      const userQuery = 'SELECT name FROM users WHERE id = $1';
      const instructorQuery = 'SELECT name, phone_number FROM users u JOIN instructor_profiles ip ON u.id = ip.user_id WHERE u.id = $1';
      
      const [learnerResult, instructorResult] = await Promise.all([
        pool.query(userQuery, [learner_user_id]),
        pool.query(instructorQuery, [instructor_user_id])
      ]);

      // Send notifications
      await notificationService.sendNotification(
        learner_user_id,
        'booking_confirmation_email',
        {
          student_name: learnerResult.rows[0]?.name || 'Student',
          instructor_name: instructorResult.rows[0]?.name || 'Instructor',
          lesson_date: start_date,
          lesson_time: time_slot,
          car_model: 'Available car',
          instructor_phone: instructorResult.rows[0]?.phone_number || 'Available'
        },
        ['push', 'email']
      );

      // Record earnings for instructor
      await earningsService.recordEarnings({
        instructor_user_id,
        booking_id: result.rows[0].id,
        lesson_date: start_date,
        amount_earned: 500.00, // Default lesson price
        razorpay_payment_id
      });

      res.status(200).json({ message: 'Payment verified and booking created successfully!', bookingId: result.rows[0].id });
    } else {
      res.status(400).json({ message: 'Invalid signature sent!' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Server error during payment verification.' });
  }
});

// GET INSTRUCTOR PROFILE
app.get('/api/instructor/profile', authMiddleware, async (req, res) => {
  try {
    const profileData = await pool.query(
      `SELECT u.name, u.email, ip.photo_url, ip.car_model, ip.phone_number 
       FROM users u
       LEFT JOIN instructor_profiles ip ON u.id = ip.user_id
       WHERE u.id = $1`,
      [req.user.userId]
    );
    if (profileData.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found.' });
    }
    res.json(profileData.rows[0]);
  } catch (error) {
    console.error('Error fetching instructor profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE INSTRUCTOR PROFILE
app.put('/api/instructor/profile', authMiddleware, async (req, res) => {
  try {
    const { name, car_model, photo_url, phone_number, service_address } = req.body;
    const userId = req.user.userId;

    await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, userId]);

    let serviceAreaPoint = null;
    if (service_address) {
      const geoData = await geocodingService.forwardGeocode({
        query: service_address, limit: 1, countries: ['IN']
      }).send();
      if (geoData && geoData.body.features.length) {
        const [longitude, latitude] = geoData.body.features[0].center;
        serviceAreaPoint = `POINT(${longitude} ${latitude})`;
      }
    }

    const profileQuery = `
      INSERT INTO instructor_profiles (user_id, car_model, photo_url, phone_number, service_area)
      VALUES ($1, $2, $3, $4, ST_SetSRID(ST_GeomFromText($5), 4326))
      ON CONFLICT (user_id)
      DO UPDATE SET
        car_model = EXCLUDED.car_model,
        photo_url = EXCLUDED.photo_url,
        phone_number = EXCLUDED.phone_number,
        service_area = COALESCE(ST_SetSRID(ST_GeomFromText($5), 4326), instructor_profiles.service_area);
    `;
    await pool.query(profileQuery, [userId, car_model, photo_url, phone_number, serviceAreaPoint]);
    res.json({ message: 'Profile updated successfully!' });
  } catch (error) {
    console.error('Error updating instructor profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET INSTRUCTOR AVAILABILITY
app.get('/api/instructor/availability', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT ia.day_of_week, ia.time_slot FROM instructor_availability ia
      JOIN instructor_profiles ip ON ia.instructor_id = ip.id
      WHERE ip.user_id = $1;
    `;
    const { rows } = await pool.query(query, [req.user.userId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE INSTRUCTOR AVAILABILITY
app.put('/api/instructor/availability', authMiddleware, async (req, res) => {
  const newAvailability = req.body.availability;
  const client = await pool.connect();
  try {
    const profileResult = await client.query('SELECT id FROM instructor_profiles WHERE user_id = $1', [req.user.userId]);
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ message: 'Instructor profile not found.' });
    }
    const instructorId = profileResult.rows[0].id;
    await client.query('BEGIN');
    await client.query('DELETE FROM instructor_availability WHERE instructor_id = $1', [instructorId]);
    if (newAvailability && newAvailability.length > 0) {
      const insertQuery = 'INSERT INTO instructor_availability (instructor_id, day_of_week, time_slot) VALUES ($1, $2, $3)';
      for (const slot of newAvailability) {
        await client.query(insertQuery, [instructorId, slot.day, slot.slot]);
      }
    }
    await client.query('COMMIT');
    res.json({ message: 'Availability updated successfully!' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating availability:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// GET INSTRUCTOR BOOKINGS
app.get('/api/instructor/bookings', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT b.id, b.start_date, b.time_slot, learner_user.email as learner_email
      FROM bookings AS b
      JOIN users AS learner_user ON b.learner_user_id = learner_user.id
      WHERE b.instructor_user_id = $1 AND b.status = 'confirmed'
      ORDER BY b.start_date, b.time_slot;
    `;
    const { rows } = await pool.query(query, [req.user.userId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching instructor bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET LEARNER BOOKINGS
app.get('/api/learner/bookings', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        b.id, b.start_date, b.time_slot, b.session_plan,
        instructor_user.email as instructor_email,
        ip.phone_number,
        ip.car_model
      FROM bookings AS b
      JOIN users AS instructor_user ON b.instructor_user_id = instructor_user.id
      LEFT JOIN instructor_profiles AS ip ON b.instructor_user_id = ip.user_id
      WHERE b.learner_user_id = $1 AND b.status = 'confirmed'
      ORDER BY b.start_date;
    `;
    const { rows } = await pool.query(query, [req.user.userId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching learner bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET SINGLE BOOKING DETAILS
app.get('/api/booking/:bookingId', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const query = `
      SELECT 
        b.id, b.start_date, b.time_slot, b.session_plan,
        learner.email as learner_email,
        instructor.email as instructor_email
      FROM bookings b
      JOIN users learner ON b.learner_user_id = learner.id
      JOIN users instructor ON b.instructor_user_id = instructor.id
      WHERE b.id = $1;
    `;
    const { rows } = await pool.query(query, [bookingId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Server Listen ---
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// ======= NEW API ENDPOINTS FOR ENHANCED FEATURES =======

// --- PUSH NOTIFICATION ENDPOINTS ---

// Subscribe to push notifications
app.post('/api/notifications/subscribe', authMiddleware, async (req, res) => {
  try {
    const { endpoint, p256dh, auth, deviceType } = req.body;
    const userId = req.user.userId;

    const query = `
      INSERT INTO notification_subscriptions (user_id, endpoint, p256dh_key, auth_key, device_type)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, endpoint) 
      DO UPDATE SET 
        p256dh_key = EXCLUDED.p256dh_key,
        auth_key = EXCLUDED.auth_key,
        is_active = true
    `;

    await pool.query(query, [userId, endpoint, p256dh, auth, deviceType || 'web']);
    res.json({ success: true, message: 'Push notification subscription saved' });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unsubscribe from push notifications
app.delete('/api/notifications/unsubscribe', authMiddleware, async (req, res) => {
  try {
    const { endpoint } = req.body;
    const userId = req.user.userId;

    await pool.query(
      'UPDATE notification_subscriptions SET is_active = false WHERE user_id = $1 AND endpoint = $2',
      [userId, endpoint]
    );

    res.json({ success: true, message: 'Unsubscribed from push notifications' });
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user notifications
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;

    const query = `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- PROGRESS TRACKING ENDPOINTS ---

// Record lesson progress (instructor only)
app.post('/api/progress/record', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Only instructors can record progress' });
    }

    const progressData = {
      ...req.body,
      instructor_user_id: req.user.userId
    };

    const result = await progressService.recordLessonProgress(progressData);
    
    if (result.success) {
      // Send completion notification to student
      await notificationService.sendNotification(
        progressData.learner_user_id,
        'lesson_completion_push',
        { student_name: 'Student' },
        ['push']
      );

      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error recording progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student progress (student can view their own, instructor can view their students)
app.get('/api/progress/student/:studentId?', authMiddleware, async (req, res) => {
  try {
    let studentId = req.params.studentId;
    
    // If no studentId provided and user is a learner, show their own progress
    if (!studentId && req.user.role === 'learner') {
      studentId = req.user.userId;
    }

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID required' });
    }

    const result = await progressService.getStudentProgress(studentId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get instructor teaching history
app.get('/api/progress/instructor', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Only instructors can view teaching history' });
    }

    const result = await progressService.getInstructorTeachingHistory(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching instructor teaching history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get progress for specific booking
app.get('/api/progress/booking/:bookingId', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const result = await progressService.getBookingProgress(bookingId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching booking progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get skill analysis for student
app.get('/api/progress/skills/:studentId?', authMiddleware, async (req, res) => {
  try {
    let studentId = req.params.studentId;
    
    if (!studentId && req.user.role === 'learner') {
      studentId = req.user.userId;
    }

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID required' });
    }

    const result = await progressService.getSkillAnalysis(studentId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching skill analysis:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate progress report
app.get('/api/progress/report/:studentId?', authMiddleware, async (req, res) => {
  try {
    let studentId = req.params.studentId;
    
    if (!studentId && req.user.role === 'learner') {
      studentId = req.user.userId;
    }

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID required' });
    }

    const result = await progressService.generateProgressReport(studentId);
    res.json(result);
  } catch (error) {
    console.error('Error generating progress report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- INSTRUCTOR EARNINGS ENDPOINTS ---

// Get earnings dashboard
app.get('/api/earnings/dashboard', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Only instructors can view earnings' });
    }

    const { period = 'month' } = req.query;
    const result = await earningsService.getEarningsDashboard(req.user.userId, period);
    res.json(result);
  } catch (error) {
    console.error('Error fetching earnings dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed earnings report
app.get('/api/earnings/report', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Only instructors can view earnings' });
    }

    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const result = await earningsService.getEarningsReport(req.user.userId, startDate, endDate);
    res.json(result);
  } catch (error) {
    console.error('Error generating earnings report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payment analytics
app.get('/api/earnings/analytics', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Only instructors can view analytics' });
    }

    const result = await earningsService.getPaymentAnalytics(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending payments
app.get('/api/earnings/pending', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Only instructors can view pending payments' });
    }

    const result = await earningsService.getPendingPayments(req.user.userId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- DEVICE AND MOBILE RESPONSIVENESS ENDPOINTS ---

// Register device info
app.post('/api/device/register', authMiddleware, async (req, res) => {
  try {
    const { device_id, device_type, platform, app_version, push_token } = req.body;
    const userId = req.user.userId;

    const query = `
      INSERT INTO user_devices (user_id, device_id, device_type, platform, app_version, push_token)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (device_id)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        device_type = EXCLUDED.device_type,
        platform = EXCLUDED.platform,
        app_version = EXCLUDED.app_version,
        push_token = EXCLUDED.push_token,
        last_active = CURRENT_TIMESTAMP
    `;

    await pool.query(query, [userId, device_id, device_type, platform, app_version, push_token]);
    res.json({ success: true, message: 'Device registered successfully' });
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update device last active
app.put('/api/device/heartbeat', authMiddleware, async (req, res) => {
  try {
    const { device_id } = req.body;
    const userId = req.user.userId;

    await pool.query(
      'UPDATE user_devices SET last_active = CURRENT_TIMESTAMP WHERE user_id = $1 AND device_id = $2',
      [userId, device_id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating device heartbeat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- UTILITY ENDPOINTS ---

// Manual notification sending (for testing)
app.post('/api/notifications/send', authMiddleware, async (req, res) => {
  try {
    const { userId, type, data, channels } = req.body;
    
    // Only allow sending to self or if admin/instructor role
    if (userId !== req.user.userId && req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await notificationService.sendNotification(userId, type, data, channels);
    res.json(result);
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Schedule reminder cron job (call this endpoint to trigger reminders)
app.post('/api/notifications/schedule-reminders', async (req, res) => {
  try {
    // Add basic API key authentication for this endpoint
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await notificationService.scheduleReminders();
    res.json({ success: true, message: 'Reminders scheduled successfully' });
  } catch (error) {
    console.error('Error scheduling reminders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get VAPID public key for push notifications
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ 
    publicKey: process.env.VAPID_PUBLIC_KEY 
  });
});
