import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import apiUrl from '../apiConfig';

// This line now correctly uses the environment variable from Vercel
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

function BookingPage() {
  const [bookingDetails, setBookingDetails] = useState({
    startDate: '',
    timeSlot: '',
    location: { longitude: 77.2167, latitude: 28.6333 }, // Default to Delhi
    sessionPlan: '7-day',
  });

  const [instructors, setInstructors] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails(prevState => ({ ...prevState, [name]: value }));
  };

  const handleLocationChange = (newCoords) => {
    setBookingDetails(prevState => ({
      ...prevState,
      location: { longitude: newCoords.lng, latitude: newCoords.lat }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/instructors/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingDetails),
      });
      if (!response.ok) throw new Error('Failed to find instructors.');
      const availableInstructors = await response.json();
      setInstructors(availableInstructors);
    } catch (error) {
      console.error('Booking submission error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleSelectInstructor = async (instructor) => {
    try {
      const orderResponse = await fetch(`${apiUrl}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 50000 })
      });
      const order = await orderResponse.json();

      const token = localStorage.getItem('token');
      const { jwtDecode } = await import('jwt-decode');
      const learner = jwtDecode(token);

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID, // Also using an env variable here is best practice
        amount: order.amount,
        currency: order.currency,
        name: 'Drivigo',
        description: 'Driving Lesson Booking',
        order_id: order.id,
        handler: async function (response) {
          if (isVerifying) return;
          setIsVerifying(true);
          try {
            const verificationResponse = await fetch(`${apiUrl}/api/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                bookingDetails, instructor, learner
              })
            });
            const result = await verificationResponse.json();
            if (result.status === 'success') {
              navigate(`/booking/${result.bookingId}`);
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            alert('An error occurred during payment verification.');
          } finally {
            setIsVerifying(false);
          }
        },
        prefill: { name: 'Test User', email: 'test.user@example.com' },
        theme: { color: '#ffbd40' }
      };
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Payment initiation error:', error);
      alert('An error occurred while initiating payment.');
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-3xl font-bold">Book Your Driving Session</h2>
        <p className="text-gray-600">Fill out the details below to find an available instructor.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Start Date:</label>
            <input type="date" name="startDate" value={bookingDetails.startDate} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Preferred Time Slot:</label>
            <select name="timeSlot" value={bookingDetails.timeSlot} onChange={handleChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
              <option value="">Select a time</option>
              <option value="07:00-08:00">7:00 AM - 8:00 AM</option>
              <option value="08:00-09:00">8:00 AM - 9:00 AM</option>
              <option value="09:00-10:00">9:00 AM - 10:00 AM</option>
              <option value="16:00-17:00">4:00 PM - 5:00 PM</option>
              <option value="17:00-18:00">5:00 PM - 6:00 PM</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Pickup/Drop Location:</label>
          <p className="text-xs text-gray-500 mb-2">Drag the pin to set your exact location.</p>
          <div style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
            <Map
              initialViewState={{
                longitude: bookingDetails.location.longitude,
                latitude: bookingDetails.location.latitude,
                zoom: 11
              }}
              mapboxAccessToken={MAPBOX_TOKEN}
              mapStyle="mapbox://styles/mapbox/streets-v11"
            >
              <Marker 
                longitude={bookingDetails.location.longitude} 
                latitude={bookingDetails.location.latitude} 
                anchor="bottom"
                draggable={true}
                onDragEnd={(e) => handleLocationChange(e.lngLat)}
              />
            </Map>
          </div>
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Session Plan:</label>
          <div className="flex space-x-4">
            <label className="flex items-center"><input type="radio" name="sessionPlan" value="7-day" checked={bookingDetails.sessionPlan === '7-day'} onChange={handleChange} className="mr-2"/> 7 days (1 hour/day)</label>
            <label className="flex items-center"><input type="radio" name="sessionPlan" value="14-day" checked={bookingDetails.sessionPlan === '14-day'} onChange={handleChange} className="mr-2"/> 14 days (30 mins/day)</label>
          </div>
        </div>
        <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
          Find Instructors
        </button>
      </form>
      <hr className="my-8" />
      <div className="instructor-results">
        <h3 className="text-2xl font-bold mb-4">Available Instructors</h3>
        {instructors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instructors.map(instructor => (
              <div key={instructor.id} className="p-4 border rounded-lg shadow-lg bg-gray-50 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-lg">{instructor.instructor_name}</h4>
                  <p className="font-bold text-lg">{instructor.instructor_email}</p>
                  <p className="text-gray-600">Car: {instructor.car_model}</p>
                </div>
                <button onClick={() => handleSelectInstructor(instructor)} className="mt-4 w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                  Choose & Proceed to Pay
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No instructors found for the selected criteria. Please try different options.</p>
        )}
      </div>
    </div>
  );
}

export default BookingPage;
