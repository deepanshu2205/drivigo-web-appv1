const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

class EarningsService {
  // Record earnings for a completed lesson
  async recordEarnings(data) {
    try {
      const {
        instructor_user_id,
        booking_id,
        lesson_date,
        amount_earned,
        razorpay_payment_id
      } = data;

      // Calculate platform fee (10% of total amount)
      const platform_fee = amount_earned * 0.10;
      const net_earnings = amount_earned - platform_fee;

      const query = `
        INSERT INTO instructor_earnings (
          instructor_user_id, booking_id, lesson_date, amount_earned,
          platform_fee, net_earnings, razorpay_payment_id, payment_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'paid')
        ON CONFLICT (booking_id)
        DO UPDATE SET
          amount_earned = EXCLUDED.amount_earned,
          platform_fee = EXCLUDED.platform_fee,
          net_earnings = EXCLUDED.net_earnings,
          payment_status = 'paid',
          payment_date = CURRENT_DATE
        RETURNING id
      `;

      const result = await pool.query(query, [
        instructor_user_id,
        booking_id,
        lesson_date,
        amount_earned,
        platform_fee,
        net_earnings,
        razorpay_payment_id
      ]);

      // Update instructor profile total earnings
      await this.updateInstructorTotalEarnings(instructor_user_id);

      return {
        success: true,
        earningsId: result.rows[0].id,
        net_earnings,
        platform_fee
      };
    } catch (error) {
      console.error('Error recording earnings:', error);
      return { success: false, error: error.message };
    }
  }

  // Update instructor's total earnings in their profile
  async updateInstructorTotalEarnings(instructor_user_id) {
    try {
      const query = `
        UPDATE instructor_profiles 
        SET 
          total_earnings = (
            SELECT COALESCE(SUM(net_earnings), 0) 
            FROM instructor_earnings 
            WHERE instructor_user_id = $1 AND payment_status = 'paid'
          ),
          total_lessons_taught = (
            SELECT COUNT(*) 
            FROM instructor_earnings 
            WHERE instructor_user_id = $1 AND payment_status = 'paid'
          )
        WHERE user_id = $1
      `;

      await pool.query(query, [instructor_user_id]);
      return { success: true };
    } catch (error) {
      console.error('Error updating instructor total earnings:', error);
      return { success: false, error: error.message };
    }
  }

  // Get instructor earnings dashboard data
  async getEarningsDashboard(instructor_user_id, period = 'month') {
    try {
      let dateCondition = '';
      switch (period) {
        case 'week':
          dateCondition = 'AND lesson_date >= CURRENT_DATE - INTERVAL \'7 days\'';
          break;
        case 'month':
          dateCondition = 'AND lesson_date >= CURRENT_DATE - INTERVAL \'30 days\'';
          break;
        case 'year':
          dateCondition = 'AND lesson_date >= CURRENT_DATE - INTERVAL \'365 days\'';
          break;
        default:
          dateCondition = '';
      }

      // Get earnings summary
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_lessons,
          COALESCE(SUM(amount_earned), 0) as total_revenue,
          COALESCE(SUM(net_earnings), 0) as total_net_earnings,
          COALESCE(SUM(platform_fee), 0) as total_fees,
          COALESCE(AVG(net_earnings), 0) as avg_earning_per_lesson
        FROM instructor_earnings
        WHERE instructor_user_id = $1 
        AND payment_status = 'paid'
        ${dateCondition}
      `;

      const summaryResult = await pool.query(summaryQuery, [instructor_user_id]);

      // Get daily earnings for chart
      const dailyQuery = `
        SELECT 
          lesson_date,
          COUNT(*) as lessons_count,
          SUM(net_earnings) as daily_earnings
        FROM instructor_earnings
        WHERE instructor_user_id = $1 
        AND payment_status = 'paid'
        ${dateCondition}
        GROUP BY lesson_date
        ORDER BY lesson_date DESC
        LIMIT 30
      `;

      const dailyResult = await pool.query(dailyQuery, [instructor_user_id]);

      // Get recent transactions
      const transactionsQuery = `
        SELECT 
          ie.*,
          u_learner.name as student_name,
          u_learner.email as student_email
        FROM instructor_earnings ie
        JOIN bookings b ON ie.booking_id = b.id
        JOIN users u_learner ON b.learner_user_id = u_learner.id
        WHERE ie.instructor_user_id = $1
        ORDER BY ie.lesson_date DESC
        LIMIT 10
      `;

      const transactionsResult = await pool.query(transactionsQuery, [instructor_user_id]);

      // Get monthly comparison
      const monthlyQuery = `
        SELECT 
          DATE_TRUNC('month', lesson_date) as month,
          COUNT(*) as lessons,
          SUM(net_earnings) as earnings
        FROM instructor_earnings
        WHERE instructor_user_id = $1 
        AND payment_status = 'paid'
        AND lesson_date >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', lesson_date)
        ORDER BY month DESC
      `;

      const monthlyResult = await pool.query(monthlyQuery, [instructor_user_id]);

      return {
        success: true,
        summary: {
          ...summaryResult.rows[0],
          avg_earning_per_lesson: parseFloat(summaryResult.rows[0].avg_earning_per_lesson).toFixed(2)
        },
        dailyEarnings: dailyResult.rows,
        recentTransactions: transactionsResult.rows,
        monthlyComparison: monthlyResult.rows
      };
    } catch (error) {
      console.error('Error fetching earnings dashboard:', error);
      return { success: false, error: error.message };
    }
  }

  // Get detailed earnings report
  async getEarningsReport(instructor_user_id, startDate, endDate) {
    try {
      const query = `
        SELECT 
          ie.*,
          u_learner.name as student_name,
          u_learner.email as student_email,
          b.session_plan,
          b.time_slot,
          sp.performance_rating,
          sp.driving_hours_logged
        FROM instructor_earnings ie
        JOIN bookings b ON ie.booking_id = b.id
        JOIN users u_learner ON b.learner_user_id = u_learner.id
        LEFT JOIN student_progress sp ON ie.booking_id = sp.booking_id
        WHERE ie.instructor_user_id = $1
        AND ie.lesson_date BETWEEN $2 AND $3
        ORDER BY ie.lesson_date DESC
      `;

      const result = await pool.query(query, [instructor_user_id, startDate, endDate]);

      // Calculate report statistics
      const stats = result.rows.reduce((acc, row) => {
        acc.totalLessons += 1;
        acc.totalRevenue += parseFloat(row.amount_earned);
        acc.totalNetEarnings += parseFloat(row.net_earnings);
        acc.totalFees += parseFloat(row.platform_fee);
        acc.totalHours += parseFloat(row.driving_hours_logged || 0);
        return acc;
      }, {
        totalLessons: 0,
        totalRevenue: 0,
        totalNetEarnings: 0,
        totalFees: 0,
        totalHours: 0
      });

      return {
        success: true,
        report: {
          period: { startDate, endDate },
          statistics: stats,
          transactions: result.rows
        }
      };
    } catch (error) {
      console.error('Error generating earnings report:', error);
      return { success: false, error: error.message };
    }
  }

  // Get payment analytics
  async getPaymentAnalytics(instructor_user_id) {
    try {
      // Payment method breakdown
      const paymentMethodQuery = `
        SELECT 
          CASE 
            WHEN razorpay_payment_id IS NOT NULL THEN 'Razorpay'
            ELSE 'Other'
          END as payment_method,
          COUNT(*) as transaction_count,
          SUM(net_earnings) as total_earnings
        FROM instructor_earnings
        WHERE instructor_user_id = $1 AND payment_status = 'paid'
        GROUP BY payment_method
      `;

      const paymentMethodResult = await pool.query(paymentMethodQuery, [instructor_user_id]);

      // Peak hours analysis
      const peakHoursQuery = `
        SELECT 
          b.time_slot,
          COUNT(*) as lesson_count,
          AVG(ie.net_earnings) as avg_earnings
        FROM instructor_earnings ie
        JOIN bookings b ON ie.booking_id = b.id
        WHERE ie.instructor_user_id = $1 AND ie.payment_status = 'paid'
        GROUP BY b.time_slot
        ORDER BY lesson_count DESC
      `;

      const peakHoursResult = await pool.query(peakHoursQuery, [instructor_user_id]);

      // Student retention analysis
      const retentionQuery = `
        SELECT 
          u_learner.name as student_name,
          COUNT(*) as lessons_taken,
          SUM(ie.net_earnings) as total_paid,
          MIN(ie.lesson_date) as first_lesson,
          MAX(ie.lesson_date) as last_lesson
        FROM instructor_earnings ie
        JOIN bookings b ON ie.booking_id = b.id
        JOIN users u_learner ON b.learner_user_id = u_learner.id
        WHERE ie.instructor_user_id = $1 AND ie.payment_status = 'paid'
        GROUP BY u_learner.id, u_learner.name
        ORDER BY lessons_taken DESC
        LIMIT 10
      `;

      const retentionResult = await pool.query(retentionQuery, [instructor_user_id]);

      return {
        success: true,
        analytics: {
          paymentMethods: paymentMethodResult.rows,
          peakHours: peakHoursResult.rows.map(row => ({
            ...row,
            avg_earnings: parseFloat(row.avg_earnings).toFixed(2)
          })),
          topStudents: retentionResult.rows
        }
      };
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      return { success: false, error: error.message };
    }
  }

  // Get pending payments
  async getPendingPayments(instructor_user_id) {
    try {
      const query = `
        SELECT 
          ie.*,
          u_learner.name as student_name,
          b.session_plan
        FROM instructor_earnings ie
        JOIN bookings b ON ie.booking_id = b.id
        JOIN users u_learner ON b.learner_user_id = u_learner.id
        WHERE ie.instructor_user_id = $1 
        AND ie.payment_status = 'pending'
        ORDER BY ie.lesson_date DESC
      `;

      const result = await pool.query(query, [instructor_user_id]);

      const totalPending = result.rows.reduce((sum, row) => 
        sum + parseFloat(row.net_earnings), 0
      );

      return {
        success: true,
        pendingPayments: result.rows,
        totalPending: totalPending.toFixed(2)
      };
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark payment as processed
  async markPaymentProcessed(earningsId, paymentDate = null) {
    try {
      const query = `
        UPDATE instructor_earnings 
        SET payment_status = 'paid', payment_date = $2
        WHERE id = $1
        RETURNING instructor_user_id
      `;

      const result = await pool.query(query, [earningsId, paymentDate || new Date()]);
      
      if (result.rows.length > 0) {
        await this.updateInstructorTotalEarnings(result.rows[0].instructor_user_id);
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking payment as processed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EarningsService();