import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import apiUrl from '../apiConfig';
import useResponsive from '../hooks/useResponsive';

function ProgressPage() {
  const [user, setUser] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [skillsData, setSkillsData] = useState(null);
  const [progressReport, setProgressReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { isMobile, getSpacing, getTextSize } = useResponsive();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      setUser(decodedToken);
      fetchProgressData(token);
    }
  }, []);

  const fetchProgressData = async (token) => {
    try {
      setLoading(true);
      
      // Fetch multiple data sources in parallel
      const [progressResponse, skillsResponse, reportResponse] = await Promise.all([
        fetch(`${apiUrl}/api/progress/student`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/progress/skills`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/progress/report`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [progressData, skillsData, reportData] = await Promise.all([
        progressResponse.json(),
        skillsResponse.json(),
        reportResponse.json()
      ]);

      setProgressData(progressData);
      setSkillsData(skillsData);
      setProgressReport(reportData);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSkillColor = (performance) => {
    if (performance >= 4) return 'bg-green-500';
    if (performance >= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ⭐
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!progressData || !progressData.success) {
    return (
      <div className={`${getSpacing()} text-center`}>
        <h1 className={`${getTextSize('text-xl', 'text-2xl', 'text-3xl')} font-bold mb-4`}>
          Progress Tracking
        </h1>
        <div className="bg-gray-100 rounded-lg p-8">
          <p className="text-gray-600 mb-4">No progress data available yet.</p>
          <Link 
            to="/book-lesson" 
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Book Your First Lesson
          </Link>
        </div>
      </div>
    );
  }

  const { stats, lessons } = progressData;

  return (
    <div className={getSpacing()}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={`${getTextSize('text-xl', 'text-2xl', 'text-3xl')} font-bold mb-2`}>
          Learning Progress
        </h1>
        <p className="text-gray-600">Track your driving skills development</p>
      </div>

      {/* Stats Overview */}
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4 mb-6`}>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{stats.total_lessons}</div>
          <div className="text-sm text-gray-600">Total Lessons</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats.total_hours}h</div>
          <div className="text-sm text-gray-600">Driving Hours</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{stats.average_rating}/5</div>
          <div className="text-sm text-gray-600">Avg Rating</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">{stats.all_skills_practiced?.length || 0}</div>
          <div className="text-sm text-gray-600">Skills Learned</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} border-b`}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'lessons', label: 'Lesson History' },
            { id: 'skills', label: 'Skills Analysis' },
            { id: 'recommendations', label: 'Recommendations' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${isMobile ? 'w-full' : ''} px-4 py-2 font-medium ${
                activeTab === tab.id 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Progress Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Learning Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Progress</span>
                  <span>{Math.min(100, (stats.total_hours / 20) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (stats.total_hours / 20) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Target: 20 hours for test readiness
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Recent Lessons</h3>
            {lessons.slice(0, 3).map((lesson, index) => (
              <div key={lesson.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div>
                  <div className="font-medium">{new Date(lesson.lesson_date).toLocaleDateString()}</div>
                  <div className="text-sm text-gray-600">
                    with {lesson.instructor_name} • {lesson.driving_hours_logged}h
                  </div>
                </div>
                <div className="flex items-center">
                  {getRatingStars(lesson.performance_rating)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'lessons' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Complete Lesson History</h3>
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-lg">
                        {new Date(lesson.lesson_date).toLocaleDateString()}
                      </div>
                      <div className="text-gray-600">
                        Instructor: {lesson.instructor_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">
                        {lesson.driving_hours_logged}h
                      </div>
                      <div className="flex items-center">
                        {getRatingStars(lesson.performance_rating)}
                      </div>
                    </div>
                  </div>
                  
                  {lesson.skills_practiced && lesson.skills_practiced.length > 0 && (
                    <div className="mb-2">
                      <div className="text-sm font-medium mb-1">Skills Practiced:</div>
                      <div className="flex flex-wrap gap-2">
                        {lesson.skills_practiced.map((skill, idx) => (
                          <span 
                            key={idx}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {skill.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {lesson.instructor_notes && (
                    <div className="mt-2 p-3 bg-gray-50 rounded">
                      <div className="text-sm font-medium mb-1">Instructor Notes:</div>
                      <div className="text-sm text-gray-700">{lesson.instructor_notes}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'skills' && skillsData && (
        <div className="space-y-6">
          {/* Skills Progress */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Skills Mastery</h3>
            <div className="space-y-4">
              {skillsData.skillsPracticed.map((skill, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium capitalize">
                      {skill.skill.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-600">
                      Practiced {skill.times_practiced} times
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getSkillColor(skill.average_performance)}`}></div>
                    <span className="font-medium">{skill.average_performance}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Areas to Improve */}
          {skillsData.areasToImprove.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Areas to Focus On</h3>
              <div className="space-y-2">
                {skillsData.areasToImprove.map((area, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <span className="capitalize">{area.area.replace('_', ' ')}</span>
                    <span className="text-sm text-gray-600">
                      Mentioned {area.mentioned_times} times
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recommendations' && progressReport && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Personalized Recommendations</h3>
          <div className="space-y-4">
            {progressReport.report?.recommendations?.map((rec, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="font-medium capitalize mb-1">
                  {rec.type} Recommendation
                </div>
                <div className="text-gray-700">{rec.message}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <Link 
              to="/book-lesson"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 inline-block"
            >
              Book Your Next Lesson
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgressPage;