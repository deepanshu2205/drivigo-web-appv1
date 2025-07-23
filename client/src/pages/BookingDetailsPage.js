import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function BookingDetailsPage() {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const { bookingId } = useParams(); // Gets the ID from the URL

  useEffect(() => {
    const fetchBookingDetails = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/booking/${bookingId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setBooking(data);
      setLoading(false);
    };
    fetchBookingDetails();
  }, [bookingId]);

  if (loading) return <div>Loading booking details...</div>;
  if (!booking) return <div>Booking not found.</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded-lg shadow-md text-center">
      <h2 className="text-3xl font-bold text-green-600 mb-4">Booking Confirmed!</h2>
      <div className="text-left space-y-3 text-lg">
        <p><strong>Booking ID:</strong> #{booking.id}</p>
        <p><strong>Course Start Date:</strong> {new Date(booking.start_date).toLocaleDateString()}</p>
        <p><strong>Time Slot:</strong> {booking.time_slot}</p>
        <p><strong>Session Plan:</strong> {booking.session_plan}</p>
        <p><strong>Your Instructor:</strong> {booking.instructor_email}</p>
      </div>
      <Link to="/dashboard" className="mt-8 inline-block bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded">
        Go to My Dashboard
      </Link>
    </div>
  );
}

export default BookingDetailsPage;