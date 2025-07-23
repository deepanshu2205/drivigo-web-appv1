const cors = require('cors');
require('dotenv').config();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./authMiddleware');

const app = express();
app.use(express.json()); 
app.use(cors());
const port = 5000;

// --- RAZORPAY CONFIGURATION ---
const razorpay = new Razorpay({
  key_id: 'process.env.RAZORPAY_KEY_ID',       // <-- PASTE YOUR KEY ID HERE
  key_secret: 'process.env.RAZORPAY_KEY_SECRET', // <-- PASTE YOUR KEY SECRET HERE
});

// We will replace this line in the next step
const connectionString = 'process.env.DATABASE_URL';

const pool = new Pool({
  connectionString,
});

// --- SIGNUP ENDPOINT ---
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

// --- LOGIN ENDPOINT ---
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
    const JWT_SECRET = 'process.env.JWT_SECRET';
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

// --- FINAL DYNAMIC INSTRUCTOR SEARCH ENDPOINT ---
app.post('/api/instructors/find', async (req, res) => {
  try {
    // The request body now contains a location object with coordinates
    const { startDate, timeSlot, location } = req.body;

    // --- 1. Get the day of the week from the start date ---
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bookingDay = days[new Date(startDate).getDay()];

    // --- 2. The Database Query (Now fully dynamic) ---
    // Find instructors who are available on the correct day/time
    // AND whose service area is within 5km of the user's selected coordinates.
    const query = `
      SELECT
        ip.id,
        ip.car_model,
        u.email as instructor_email,
        u.id as user_id
      FROM instructor_profiles ip
      JOIN users u ON ip.user_id = u.id
      JOIN instructor_availability ia ON ip.id = ia.instructor_id
      WHERE
        ia.day_of_week = $1 AND
        ia.time_slot = $2 AND
        ST_DWithin(
          ip.service_area,
          ST_MakePoint($3, $4), -- Use longitude and latitude from the request
          5000 -- service radius in meters (5 km)
        );
    `;

    // The location object from the frontend contains longitude and latitude
    const values = [bookingDay, timeSlot, location.longitude, location.latitude];
    const { rows } = await pool.query(query, values);

    res.json(rows);

  } catch (error) {
    console.error('Error finding instructors:', error);
    res.status(500).json({ message: 'Server error while finding instructors.' });
  }
});

// --- CREATE RAZORPAY ORDER ENDPOINT ---
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const options = {
      // For now, let's hardcode the amount. 
      // This should be calculated based on the session plan.
      amount: 50000, // Amount in the smallest currency unit (e.g., 50000 paise = ₹500)
      currency: 'INR',
      receipt: `receipt_order_${new Date().getTime()}`
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).send('Error creating order');
    }

    res.json(order);

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Server error while creating order.' });
  }
});

// --- VERIFY PAYMENT AND SAVE BOOKING (DEBUG VERSION) ---
app.post('/api/payment/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingDetails, instructor, learner } = req.body;

    console.log("--- STARTING PAYMENT VERIFICATION ---");

    // IMPORTANT: Paste your Key Secret here one last time
    const KEY_SECRET = 'p3NdctLMxhZfBdkXX0VFV913';
    
    // Sanity check: Does the Key Secret look correct?
    console.log("Is the Key Secret present?", KEY_SECRET ? 'Yes' : 'No, it is empty or missing!');
    console.log("Does it look like a secret (long string, not starting with rzp_test_)?");

    const bodyToSign = razorpay_order_id + '|' + razorpay_payment_id;
    console.log("String being signed on our server:", bodyToSign);

    const expectedSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(bodyToSign)
      .digest('hex');

    console.log("Signature we received from Razorpay:", razorpay_signature);
    console.log("Signature we generated on the server:", expectedSignature);

    if (expectedSignature === razorpay_signature) {
      console.log("✅ SUCCESS: Signatures match!");
      // ... (database saving logic) ...
      const query = `INSERT INTO bookings (learner_user_id, instructor_user_id, session_plan, start_date, time_slot, razorpay_payment_id, status) VALUES ($1, $2, $3, $4, $5, $6, 'confirmed') RETURNING id;`;
      const values = [learner.userId, instructor.user_id, bookingDetails.sessionPlan, bookingDetails.startDate, bookingDetails.timeSlot, razorpay_payment_id];
      const newBooking = await pool.query(query, values);
      res.json({ status: 'success', message: 'Payment verified!', bookingId: newBooking.rows[0].id });

    } else {
      console.log("❌ FAILURE: Signatures DO NOT match!");
      res.status(400).json({ status: 'failure', message: 'Payment verification failed.' });
    }

  } catch (error) {
    console.error('🔴 CRASH in /api/payment/verify:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// --- GET INSTRUCTOR PROFILE ENDPOINT ---
app.get('/api/instructor/profile', authMiddleware, async (req, res) => {
  try {
    // req.user.userId is available because of our authMiddleware
    const profileData = await pool.query(
      `SELECT u.email, ip.photo_url, ip.car_model 
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

// --- UPDATE INSTRUCTOR PROFILE ENDPOINT ---
app.put('/api/instructor/profile', authMiddleware, async (req, res) => {
  try {
    const { car_model, photo_url } = req.body;
    const userId = req.user.userId;

    // This is an "UPSERT" query.
    // It tries to INSERT a new profile. If a profile for that user_id
    // already exists (ON CONFLICT), it will UPDATE the existing one instead.
    const query = `
      INSERT INTO instructor_profiles (user_id, car_model, photo_url)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET
        car_model = EXCLUDED.car_model,
        photo_url = EXCLUDED.photo_url;
    `;

    await pool.query(query, [userId, car_model, photo_url]);
    
    res.json({ message: 'Profile updated successfully!' });

  } catch (error) {
    console.error('Error updating instructor profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- GET INSTRUCTOR AVAILABILITY ENDPOINT ---
app.get('/api/instructor/availability', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT ia.day_of_week, ia.time_slot
      FROM instructor_availability ia
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

// --- UPDATE INSTRUCTOR AVAILABILITY ENDPOINT ---
app.put('/api/instructor/availability', authMiddleware, async (req, res) => {
  const newAvailability = req.body.availability; // Expecting an array of { day, slot }
  const client = await pool.connect(); // Get a client from the pool for a transaction

  try {
    // Get the instructor's profile ID from their user ID
    const profileResult = await client.query(
      'SELECT id FROM instructor_profiles WHERE user_id = $1',
      [req.user.userId]
    );
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ message: 'Instructor profile not found.' });
    }
    const instructorId = profileResult.rows[0].id;

    // Start a database transaction
    await client.query('BEGIN');

    // 1. Delete all old availability for this instructor
    await client.query('DELETE FROM instructor_availability WHERE instructor_id = $1', [instructorId]);

    // 2. Insert the new availability slots
    if (newAvailability && newAvailability.length > 0) {
      const insertQuery = 'INSERT INTO instructor_availability (instructor_id, day_of_week, time_slot) VALUES ($1, $2, $3)';
      for (const slot of newAvailability) {
        await client.query(insertQuery, [instructorId, slot.day, slot.slot]);
      }
    }

    // 3. Commit the transaction
    await client.query('COMMIT');
    
    res.json({ message: 'Availability updated successfully!' });

  } catch (error) {
    // If anything goes wrong, roll back the transaction
    await client.query('ROLLBACK');
    console.error('Error updating availability:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    // Release the client back to the pool
    client.release();
  }
});

// --- GET INSTRUCTOR'S UPCOMING BOOKINGS ---
// --- GET INSTRUCTOR'S UPCOMING BOOKINGS (FINAL CORRECTED VERSION) ---
app.get('/api/instructor/bookings', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        b.id, b.start_date, b.time_slot, 
        learner_user.email as learner_email
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

// --- GET LEARNER'S UPCOMING BOOKINGS ---
// --- GET LEARNER'S UPCOMING BOOKINGS (FINAL CORRECTED VERSION) ---
// --- GET LEARNER'S UPCOMING BOOKINGS (FINAL, CORRECTED QUERY) ---
// --- GET LEARNER'S UPCOMING BOOKINGS (FINAL, CORRECTED QUERY) ---
// --- GET LEARNER'S UPCOMING BOOKINGS (FINAL CORRECTED VERSION) ---
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

// --- GET A SINGLE BOOKING'S DETAILS ---
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});