const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

class ProgressService {
  // Create or update lesson progress
  async recordLessonProgress(data) {
    try {
      const {
        learner_user_id,
        instructor_user_id,
        booking_id,
        lesson_date,
        lesson_type,
        skills_practiced,
        performance_rating,
        instructor_notes,
        areas_to_improve,
        driving_hours_logged,
        next_lesson_recommendations
      } = data;

      // Calculate total driving hours for this student
      const totalHoursQuery = `
        SELECT COALESCE(SUM(driving_hours_logged), 0) as total_hours
        FROM student_progress
        WHERE learner_user_id = $1 AND lesson_completed = true
      `;
      const totalHoursResult = await pool.query(totalHoursQuery, [learner_user_id]);
      const total_driving_hours = parseFloat(totalHoursResult.rows[0].total_hours) + parseFloat(driving_hours_logged);

      const query = `
        INSERT INTO student_progress (
          learner_user_id, instructor_user_id, booking_id, lesson_date,
          lesson_type, skills_practiced, performance_rating, instructor_notes,
          areas_to_improve, driving_hours_logged, total_driving_hours,
          next_lesson_recommendations, lesson_completed
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
        ON CONFLICT (booking_id) 
        DO UPDATE SET
          lesson_type = EXCLUDED.lesson_type,
          skills_practiced = EXCLUDED.skills_practiced,
          performance_rating = EXCLUDED.performance_rating,
          instructor_notes = EXCLUDED.instructor_notes,
          areas_to_improve = EXCLUDED.areas_to_improve,
          driving_hours_logged = EXCLUDED.driving_hours_logged,
          total_driving_hours = EXCLUDED.total_driving_hours,
          next_lesson_recommendations = EXCLUDED.next_lesson_recommendations,
          lesson_completed = true,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `;

      const result = await pool.query(query, [
        learner_user_id,
        instructor_user_id,
        booking_id,
        lesson_date,
        lesson_type,
        skills_practiced,
        performance_rating,
        instructor_notes,
        areas_to_improve,
        driving_hours_logged,
        total_driving_hours,
        next_lesson_recommendations
      ]);

      // Update booking status to completed
      await pool.query(
        'UPDATE bookings SET status = $1 WHERE id = $2',
        ['completed', booking_id]
      );

      return {
        success: true,
        progressId: result.rows[0].id,
        total_driving_hours
      };
    } catch (error) {
      console.error('Error recording lesson progress:', error);
      return { success: false, error: error.message };
    }
  }

  // Get student progress history
  async getStudentProgress(learner_user_id) {
    try {
      const query = `
        SELECT 
          sp.*,
          u_instructor.name as instructor_name,
          u_instructor.email as instructor_email,
          ip.car_model,
          b.session_plan
        FROM student_progress sp
        JOIN users u_instructor ON sp.instructor_user_id = u_instructor.id
        LEFT JOIN instructor_profiles ip ON sp.instructor_user_id = ip.user_id
        LEFT JOIN bookings b ON sp.booking_id = b.id
        WHERE sp.learner_user_id = $1
        ORDER BY sp.lesson_date DESC
      `;

      const result = await pool.query(query, [learner_user_id]);
      
      // Get summary statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_lessons,
          COALESCE(SUM(driving_hours_logged), 0) as total_hours,
          COALESCE(AVG(performance_rating), 0) as average_rating,
          COALESCE(MAX(total_driving_hours), 0) as cumulative_hours,
          array_agg(DISTINCT unnest(skills_practiced)) as all_skills_practiced
        FROM student_progress
        WHERE learner_user_id = $1 AND lesson_completed = true
      `;

      const statsResult = await pool.query(statsQuery, [learner_user_id]);

      return {
        success: true,
        lessons: result.rows,
        stats: {
          ...statsResult.rows[0],
          average_rating: parseFloat(statsResult.rows[0].average_rating).toFixed(1),
          all_skills_practiced: statsResult.rows[0].all_skills_practiced?.filter(skill => skill !== null) || []
        }
      };
    } catch (error) {
      console.error('Error fetching student progress:', error);
      return { success: false, error: error.message };
    }
  }

  // Get instructor's teaching history
  async getInstructorTeachingHistory(instructor_user_id) {
    try {
      const query = `
        SELECT 
          sp.*,
          u_learner.name as learner_name,
          u_learner.email as learner_email,
          b.session_plan
        FROM student_progress sp
        JOIN users u_learner ON sp.learner_user_id = u_learner.id
        LEFT JOIN bookings b ON sp.booking_id = b.id
        WHERE sp.instructor_user_id = $1
        ORDER BY sp.lesson_date DESC
      `;

      const result = await pool.query(query, [instructor_user_id]);

      // Get instructor teaching statistics
      const statsQuery = `
        SELECT 
          COUNT(*) as total_lessons_taught,
          COUNT(DISTINCT learner_user_id) as unique_students,
          COALESCE(SUM(driving_hours_logged), 0) as total_hours_taught,
          COALESCE(AVG(performance_rating), 0) as average_student_rating
        FROM student_progress
        WHERE instructor_user_id = $1 AND lesson_completed = true
      `;

      const statsResult = await pool.query(statsQuery, [instructor_user_id]);

      return {
        success: true,
        lessons: result.rows,
        stats: {
          ...statsResult.rows[0],
          average_student_rating: parseFloat(statsResult.rows[0].average_student_rating).toFixed(1)
        }
      };
    } catch (error) {
      console.error('Error fetching instructor teaching history:', error);
      return { success: false, error: error.message };
    }
  }

  // Get progress for a specific booking
  async getBookingProgress(booking_id) {
    try {
      const query = `
        SELECT * FROM student_progress
        WHERE booking_id = $1
      `;

      const result = await pool.query(query, [booking_id]);

      return {
        success: true,
        progress: result.rows[0] || null
      };
    } catch (error) {
      console.error('Error fetching booking progress:', error);
      return { success: false, error: error.message };
    }
  }

  // Get skill-based progress analysis
  async getSkillAnalysis(learner_user_id) {
    try {
      const query = `
        SELECT 
          unnest(skills_practiced) as skill,
          COUNT(*) as times_practiced,
          AVG(performance_rating) as average_performance,
          MAX(lesson_date) as last_practiced
        FROM student_progress
        WHERE learner_user_id = $1 AND lesson_completed = true
        GROUP BY skill
        ORDER BY times_practiced DESC
      `;

      const result = await pool.query(query, [learner_user_id]);

      // Get areas that need improvement
      const improvementQuery = `
        SELECT 
          unnest(areas_to_improve) as area,
          COUNT(*) as mentioned_times,
          MAX(lesson_date) as last_mentioned
        FROM student_progress
        WHERE learner_user_id = $1 AND lesson_completed = true
        GROUP BY area
        ORDER BY mentioned_times DESC, last_mentioned DESC
      `;

      const improvementResult = await pool.query(improvementQuery, [learner_user_id]);

      return {
        success: true,
        skillsPracticed: result.rows.map(row => ({
          ...row,
          average_performance: parseFloat(row.average_performance).toFixed(1)
        })),
        areasToImprove: improvementResult.rows
      };
    } catch (error) {
      console.error('Error fetching skill analysis:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate progress report
  async generateProgressReport(learner_user_id) {
    try {
      const [progressResult, skillsResult] = await Promise.all([
        this.getStudentProgress(learner_user_id),
        this.getSkillAnalysis(learner_user_id)
      ]);

      if (!progressResult.success || !skillsResult.success) {
        throw new Error('Failed to fetch progress data');
      }

      const report = {
        studentId: learner_user_id,
        generatedAt: new Date(),
        summary: progressResult.stats,
        recentLessons: progressResult.lessons.slice(0, 5),
        skillsAnalysis: skillsResult.skillsPracticed,
        areasToImprove: skillsResult.areasToImprove,
        recommendations: this.generateRecommendations(progressResult, skillsResult)
      };

      return { success: true, report };
    } catch (error) {
      console.error('Error generating progress report:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate learning recommendations
  generateRecommendations(progressData, skillsData) {
    const recommendations = [];
    const stats = progressData.stats;

    // Hours-based recommendations
    if (stats.total_hours < 10) {
      recommendations.push({
        type: 'practice',
        message: 'Focus on building basic vehicle control and confidence. Practice in quiet areas first.'
      });
    } else if (stats.total_hours < 20) {
      recommendations.push({
        type: 'skill',
        message: 'Start practicing in moderate traffic conditions and work on specific maneuvers.'
      });
    } else {
      recommendations.push({
        type: 'advanced',
        message: 'Practice highway driving and complex traffic situations to prepare for test.'
      });
    }

    // Performance-based recommendations
    if (stats.average_rating < 3) {
      recommendations.push({
        type: 'improvement',
        message: 'Focus on fundamentals. Consider scheduling more frequent shorter sessions.'
      });
    } else if (stats.average_rating >= 4) {
      recommendations.push({
        type: 'confidence',
        message: 'Great progress! You\'re ready for more challenging driving scenarios.'
      });
    }

    // Skill-specific recommendations
    const practiceFrequency = skillsData.skillsPracticed.reduce((acc, skill) => {
      acc[skill.skill] = skill.times_practiced;
      return acc;
    }, {});

    const essentialSkills = ['parallel_parking', 'highway_driving', 'reverse_parking', 'three_point_turn'];
    const underPracticedSkills = essentialSkills.filter(skill => (practiceFrequency[skill] || 0) < 3);

    if (underPracticedSkills.length > 0) {
      recommendations.push({
        type: 'skills',
        message: `Practice these essential skills more: ${underPracticedSkills.join(', ')}`
      });
    }

    return recommendations;
  }
}

module.exports = new ProgressService();