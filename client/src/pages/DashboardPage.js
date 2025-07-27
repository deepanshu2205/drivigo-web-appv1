import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import apiUrl from '../apiConfig';
import LoadingSpinner from '../components/LoadingSpinner';

function DashboardPage() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      setUser(decodedToken);
      
      const fetchBookings = async () => {
        setLoading(true);
        try {
          const endpoint = decodedToken.role === 'instructor' 
            ? `${apiUrl}/api/instructor/bookings` 
            : `${apiUrl}/api/learner/bookings`;
            
          const response = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error('Failed to fetch bookings.');
          const data = await response.json();
          setBookings(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchBookings();
    } else {
        setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading your dashboard..." />;
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="card text-center">
          <h2 className="text-2xl font-display font-bold text-secondary-900 mb-4">
            Access Denied
          </h2>
          <p className="text-secondary-600 mb-6">
            Please log in to see your dashboard.
          </p>
          <Link to="/login" className="btn-primary">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const renderLearnerDashboard = () => (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-2xl font-display font-bold text-secondary-900 mb-6">
          Quick Actions
        </h2>
        <Link 
          to="/book-lesson" 
          className="btn-primary inline-flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Book a New Lesson
        </Link>
      </div>

      {/* Upcoming Sessions */}
      <div className="card">
        <h3 className="text-xl font-display font-semibold text-secondary-900 mb-6">
          Your Upcoming Sessions
        </h3>
        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking.id} className="border border-secondary-200 rounded-lg p-6 hover:shadow-soft transition-shadow">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                  <div>
                    <div className="text-sm text-secondary-500 mb-1">Date</div>
                    <div className="font-semibold text-secondary-900">
                      {new Date(booking.start_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-secondary-500 mb-1">Time</div>
                    <div className="font-semibold text-secondary-900">
                      {booking.time_slot}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-secondary-500 mb-1">Instructor</div>
                    <div className="font-semibold text-secondary-900">
                      {booking.instructor_email}
                    </div>
                    <div className="text-sm text-secondary-600">
                      {booking.instructor_car}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    {booking.instructor_phone && (
                      <a 
                        href={`https://wa.me/${booking.instructor_phone}?text=Hi! Regarding my Drivigo lesson on ${new Date(booking.start_date).toLocaleDateString()}.`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-success"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                        Chat on WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-secondary-600 text-lg mb-4">No upcoming sessions</p>
            <Link to="/book-lesson" className="btn-primary">
              Book Your First Lesson
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  const renderInstructorDashboard = () => (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-2xl font-display font-bold text-secondary-900 mb-6">
          Instructor Menu
        </h2>
        <Link 
          to="/instructor-profile" 
          className="btn-primary inline-flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          My Profile & Availability
        </Link>
      </div>

      {/* Upcoming Sessions */}
      <div className="card">
        <h3 className="text-xl font-display font-semibold text-secondary-900 mb-6">
          Your Upcoming Sessions
        </h3>
        {bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-4 font-semibold text-secondary-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary-700">Time Slot</th>
                  <th className="text-left py-3 px-4 font-semibold text-secondary-700">Learner</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, index) => (
                  <tr key={booking.id} className={`border-b border-secondary-100 ${index % 2 === 0 ? 'bg-secondary-50' : 'bg-white'}`}>
                    <td className="py-4 px-4 text-secondary-900">
                      {new Date(booking.start_date).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-secondary-900">
                      {booking.time_slot}
                    </td>
                    <td className="py-4 px-4 text-secondary-900">
                      {booking.learner_email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-secondary-600 text-lg">No upcoming sessions</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-secondary-900">
                Dashboard
              </h1>
              <p className="text-secondary-600 mt-1">
                Welcome back, <span className="font-semibold text-primary-600">{user.role}</span>!
              </p>
            </div>
            <button 
              onClick={handleLogout} 
              className="btn-danger mt-4 sm:mt-0"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {user.role === 'learner' ? renderLearnerDashboard() : renderInstructorDashboard()}
      </div>
    </div>
  );
}

export default DashboardPage;
