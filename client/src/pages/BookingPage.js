import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import apiUrl from '../apiConfig'; // <-- Import the api URL

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
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <div>Please log in to see your dashboard.</div>;
  }

  const renderLearnerDashboard = () => (
    <div className="learner-dashboard bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">My Dashboard</h2>
      <Link to="/book-lesson" className="inline-block bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded mb-6">
        + Book a New Lesson
      </Link>
      <hr />
      <h3 className="text-xl font-semibold mt-6 mb-4">Your Upcoming Sessions</h3>
      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking.id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between md:items-center">
              <div>
                <p><strong>Date:</strong> {new Date(booking.start_date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {booking.time_slot}</p>
                <p><strong>Instructor:</strong> {booking.instructor_email} ({booking.instructor_car})</p>
              </div>
              {booking.instructor_phone && (
                <a 
                  href={`https://wa.me/${booking.instructor_phone}?text=Hi! Regarding my Drivigo lesson on ${new Date(booking.start_date).toLocaleDateString()}.`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-4 md:mt-0 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded text-center"
                >
                  Chat on WhatsApp
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">You have no upcoming sessions.</p>
      )}
    </div>
  );

  const renderInstructorDashboard = () => (
    <div className="instructor-dashboard bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Instructor Menu</h2>
      <ul className="space-y-2 mb-6">
        <li>
          <Link to="/instructor-profile" className="text-primary hover:underline">
            → My Profile & Availability
          </Link>
        </li>
      </ul>
      <hr className="my-6" />
      <h3 className="text-xl font-semibold mb-4">Your Upcoming Sessions</h3>
      {bookings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200">
              <tr>
                <th className="w-1/3 text-left py-3 px-4 uppercase font-semibold text-sm">Date</th>
                <th className="w-1/3 text-left py-3 px-4 uppercase font-semibold text-sm">Time Slot</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Learner</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {bookings.map((booking, index) => (
                <tr key={booking.id} className={index % 2 === 0 ? 'bg-gray-100' : ''}>
                  <td className="w-1/3 text-left py-3 px-4">{new Date(booking.start_date).toLocaleDateString()}</td>
                  <td className="w-1/3 text-left py-3 px-4">{booking.time_slot}</td>
                  <td className="text-left py-3 px-4">{booking.learner_email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">You have no upcoming sessions.</p>
      )}
    </div>
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          Logout
        </button>
      </div>
      <p className="text-xl mb-8">Welcome, <span className="font-semibold text-primary">{user.role}</span>!</p>
      
      {user.role === 'learner' ? renderLearnerDashboard() : renderInstructorDashboard()}
    </div>
  );
}

export default DashboardPage;
