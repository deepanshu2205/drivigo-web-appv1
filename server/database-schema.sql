-- Drivigo Database Schema with Enhanced Features

-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Existing Users table (assuming it exists)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('learner', 'instructor')) NOT NULL,
    name VARCHAR(255),
    phone_number VARCHAR(20),
    profile_picture_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Existing Instructor Profiles table (enhanced)
CREATE TABLE IF NOT EXISTS instructor_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    car_model VARCHAR(255),
    photo_url TEXT,
    phone_number VARCHAR(20),
    service_area GEOMETRY(POINT, 4326),
    experience_years INTEGER DEFAULT 0,
    hourly_rate DECIMAL(10,2) DEFAULT 500.00,
    bio TEXT,
    total_earnings DECIMAL(12,2) DEFAULT 0.00,
    total_lessons_taught INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Existing Instructor Availability table
CREATE TABLE IF NOT EXISTS instructor_availability (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER REFERENCES instructor_profiles(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    learner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    instructor_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_plan TEXT,
    start_date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    duration_hours DECIMAL(3,1) DEFAULT 1.0,
    total_amount DECIMAL(10,2) DEFAULT 500.00,
    razorpay_payment_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    pickup_location GEOMETRY(POINT, 4326),
    pickup_address TEXT,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New table: Student Progress Tracking
CREATE TABLE student_progress (
    id SERIAL PRIMARY KEY,
    learner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    instructor_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    lesson_date DATE NOT NULL,
    lesson_type VARCHAR(50) DEFAULT 'practical',
    skills_practiced TEXT[], -- Array of skills like ['parallel_parking', 'highway_driving']
    performance_rating INTEGER CHECK (performance_rating BETWEEN 1 AND 5),
    instructor_notes TEXT,
    areas_to_improve TEXT[],
    lesson_completed BOOLEAN DEFAULT FALSE,
    driving_hours_logged DECIMAL(4,2) DEFAULT 0.00,
    total_driving_hours DECIMAL(6,2) DEFAULT 0.00, -- Cumulative hours
    next_lesson_recommendations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New table: Push Notification Subscriptions
CREATE TABLE notification_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    device_type VARCHAR(20) DEFAULT 'web',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, endpoint)
);

-- New table: Notification History
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'booking_confirmation', 'lesson_reminder', 'payment_received', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data for the notification
    is_read BOOLEAN DEFAULT FALSE,
    sent_via VARCHAR(20)[], -- Array like ['push', 'email', 'sms']
    email_sent_at TIMESTAMP,
    sms_sent_at TIMESTAMP,
    push_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New table: Instructor Earnings
CREATE TABLE instructor_earnings (
    id SERIAL PRIMARY KEY,
    instructor_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    lesson_date DATE NOT NULL,
    amount_earned DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) DEFAULT 0.00,
    net_earnings DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'on_hold')),
    payment_date DATE,
    razorpay_payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New table: User Device Info (for mobile responsiveness)
CREATE TABLE user_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) UNIQUE NOT NULL,
    device_type VARCHAR(20), -- 'mobile', 'tablet', 'desktop'
    platform VARCHAR(20), -- 'android', 'ios', 'web'
    app_version VARCHAR(20),
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    push_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New table: SMS and Email Templates
CREATE TABLE notification_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push'
    subject VARCHAR(255), -- For emails
    content TEXT NOT NULL,
    variables TEXT[], -- Available template variables
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_learner_date ON bookings(learner_user_id, start_date);
CREATE INDEX IF NOT EXISTS idx_bookings_instructor_date ON bookings(instructor_user_id, start_date);
CREATE INDEX IF NOT EXISTS idx_progress_learner ON student_progress(learner_user_id);
CREATE INDEX IF NOT EXISTS idx_progress_instructor ON student_progress(instructor_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_instructor ON instructor_earnings(instructor_user_id, lesson_date);
CREATE INDEX IF NOT EXISTS idx_instructor_profiles_service_area ON instructor_profiles USING GIST(service_area);

-- Insert default notification templates
INSERT INTO notification_templates (template_name, type, subject, content, variables) VALUES
('booking_confirmation_email', 'email', 'Booking Confirmed - Drivigo', 
 'Hi {{student_name}}, your driving lesson with {{instructor_name}} is confirmed for {{lesson_date}} at {{lesson_time}}. Car: {{car_model}}. Contact: {{instructor_phone}}', 
 ARRAY['student_name', 'instructor_name', 'lesson_date', 'lesson_time', 'car_model', 'instructor_phone']),
 
('lesson_reminder_sms', 'sms', NULL, 
 'Reminder: Your driving lesson is tomorrow at {{lesson_time}} with {{instructor_name}}. Car: {{car_model}}. - Drivigo', 
 ARRAY['lesson_time', 'instructor_name', 'car_model']),
 
('payment_received_email', 'email', 'Payment Received - Drivigo', 
 'Hi {{instructor_name}}, payment of ₹{{amount}} for your lesson on {{lesson_date}} has been processed. - Drivigo', 
 ARRAY['instructor_name', 'amount', 'lesson_date']),

('lesson_completion_push', 'push', 'Lesson Completed!', 
 'Great job on completing your lesson! Check your progress in the app.', 
 ARRAY['student_name'])
 
ON CONFLICT (template_name) DO NOTHING;