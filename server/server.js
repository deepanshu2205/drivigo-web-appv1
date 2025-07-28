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
const http = require('http');
const socketIo = require('socket.io');

// --- App & Port Setup ---
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://drivigo-web-appv1.vercel.app',
      'https://drivigo-web-appv1-git-cursor-enha-dbd96a-deepanshu-drivigo-team.vercel.app'
    ],
    methods: ["GET", "POST"]
  }
});
const port = 5000;

// --- WebSocket Connection Management ---
const connectedUsers = new Map(); // userId -> socket

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      connectedUsers.set(decoded.userId, socket);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      console.log(`User ${decoded.userId} (${decoded.role}) authenticated`);
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  });
  
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

// --- Notification Helper Functions ---
const sendNotificationToInstructor = async (instructorUserId, notificationData) => {
  try {
    // Save notification to database
    const query = `
      INSERT INTO notifications (user_id, type, title, message, data, is_read)
      VALUES ($1, $2, $3, $4, $5, false)
      RETURNING id;
    `;
    const values = [
      instructorUserId,
      notificationData.type,
      notificationData.title,
      notificationData.message,
      JSON.stringify(notificationData.data)
    ];
    
    const result = await pool.query(query, values);
    const notificationId = result.rows[0].id;
    
    // Send real-time notification via WebSocket
    const instructorSocket = connectedUsers.get(instructorUserId);
    if (instructorSocket) {
      instructorSocket.emit('newNotification', {
        id: notificationId,
        ...notificationData,
        timestamp: new Date().toISOString()
      });
    }
    
    return notificationId;
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// --- Middleware ---
app.use(express.json());

const allowedOrigins = [
  'http://localhost:3000',
  'https://drivigo-web-appv1.vercel.app',
  'https://drivigo-web-appv1-git-cursor-enha-dbd96a-deepanshu-drivigo-team.vercel.app'
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

// VERIFY PAYMENT
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingDetails, instructor, learner } = req.body;
    const bodyToSign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(bodyToSign)
      .digest('hex');
    if (expectedSignature === razorpay_signature) {
      const query = `INSERT INTO bookings (learner_user_id, instructor_user_id, session_plan, start_date, time_slot, razorpay_payment_id, status) VALUES ($1, $2, $3, $4, $5, $6, 'confirmed') RETURNING id;`;
      const values = [learner.userId, instructor.user_id, bookingDetails.sessionPlan, bookingDetails.startDate, bookingDetails.timeSlot, razorpay_payment_id];
      const newBooking = await pool.query(query, values);
      
      // Send notification to instructor about new booking
      await sendNotificationToInstructor(instructor.user_id, {
        type: 'new_booking',
        title: 'New Booking Received! 🎉',
        message: `You have a new booking from ${learner.email} for ${bookingDetails.sessionPlan} on ${new Date(bookingDetails.startDate).toLocaleDateString()} at ${bookingDetails.timeSlot}`,
        data: {
          bookingId: newBooking.rows[0].id,
          learnerEmail: learner.email,
          sessionPlan: bookingDetails.sessionPlan,
          startDate: bookingDetails.startDate,
          timeSlot: bookingDetails.timeSlot
        }
      });
      
      res.json({ status: 'success', message: 'Payment verified!', bookingId: newBooking.rows[0].id });
    } else {
      res.status(400).json({ status: 'failure', message: 'Payment verification failed.' });
    }
  } catch (error) {
    console.error('Error in /api/payment/verify:', error);
    res.status(500).json({ message: 'Server error.' });
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

// GET USER NOTIFICATIONS
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT id, type, title, message, data, is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50;
    `;
    const { rows } = await pool.query(query, [req.user.userId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// MARK NOTIFICATION AS READ
app.put('/api/notifications/:notificationId/read', authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING id;
    `;
    const { rows } = await pool.query(query, [notificationId, req.user.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// MARK ALL NOTIFICATIONS AS READ
app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1 AND is_read = false;
    `;
    await pool.query(query, [req.user.userId]);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET UNREAD NOTIFICATION COUNT
app.get('/api/notifications/unread-count', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND is_read = false;
    `;
    const { rows } = await pool.query(query, [req.user.userId]);
    res.json({ count: parseInt(rows[0].count) });
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Server Listen ---
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
