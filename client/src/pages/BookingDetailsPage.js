import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiUrl from '../apiConfig';

function BookingDetailsPage() {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const { bookingId } = useParams(); // Gets the ID from the URL

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/api/booking/${bookingId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error('Could not fetch booking details.');
        }
        const data = await response.json();
        setBooking(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookingDetails();
  }, [bookingId]);

  if (loading) {
    return (
        <div className="text-center p-12">
            <h2 className="text-2xl font-semibold">Loading booking details...</h2>
        </div>
    );
  }

  if (!booking) {
    return (
        <div className="text-center p-12">
            <h2 className="text-2xl font-semibold text-red-500">Booking not found.</h2>
            <Link to="/dashboard" className="mt-4 inline-block text-primary hover:underline">
                Return to Dashboard
            </Link>
        </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded-lg shadow-md text-center">
      <h2 className="text-3xl font-bold text-green-600 mb-4">Booking Confirmed!</h2>
      <p className="text-gray-600 mb-6">Here are the details for your upcoming driving course.</p>
      <div className="text-left space-y-3 text-lg border-t border-b py-6">
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
