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
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
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
    <div className="animate-fade-in">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-primary-50 to-secondary-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-secondary-900 mb-4">
            Book Your <span className="text-gradient">Driving Session</span>
          </h1>
          <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
            Fill out the details below to find an available instructor in your area.
          </p>
        </div>
      </div>

      {/* Booking Form Section */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Date and Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Start Date
                  </label>
                  <input 
                    type="date" 
                    name="startDate" 
                    value={bookingDetails.startDate} 
                    onChange={handleChange} 
                    required 
                    className="input-field"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Preferred Time Slot
                  </label>
                  <select 
                    name="timeSlot" 
                    value={bookingDetails.timeSlot} 
                    onChange={handleChange} 
                    required 
                    className="input-field"
                  >
                    <option value="">Select a time</option>
                    <option value="07:00-08:00">7:00 AM - 8:00 AM</option>
                    <option value="08:00-09:00">8:00 AM - 9:00 AM</option>
                    <option value="09:00-10:00">9:00 AM - 10:00 AM</option>
                    <option value="16:00-17:00">4:00 PM - 5:00 PM</option>
                    <option value="17:00-18:00">5:00 PM - 6:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Location Selection */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Pickup/Drop Location
                </label>
                <p className="text-sm text-secondary-500 mb-4">
                  Drag the pin to set your exact location for pickup and drop.
                </p>
                <div className="border border-secondary-200 rounded-lg overflow-hidden">
                  <div style={{ height: '400px', width: '100%' }}>
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
              </div>

              {/* Session Plan Selection */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-4">
                  Session Plan
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="relative">
                    <input 
                      type="radio" 
                      name="sessionPlan" 
                      value="7-day" 
                      checked={bookingDetails.sessionPlan === '7-day'} 
                      onChange={handleChange} 
                      className="sr-only"
                    />
                    <div className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      bookingDetails.sessionPlan === '7-day' 
                        ? 'border-primary-500 bg-primary-50 text-primary-700' 
                        : 'border-secondary-200 bg-white text-secondary-700 hover:border-secondary-300'
                    }`}>
                      <div className="text-center">
                        <div className="text-2xl font-display font-bold mb-2">7 Days</div>
                        <div className="text-sm">1 hour per day</div>
                        <div className="text-lg font-semibold mt-2">₹5,000</div>
                      </div>
                    </div>
                  </label>
                  
                  <label className="relative">
                    <input 
                      type="radio" 
                      name="sessionPlan" 
                      value="14-day" 
                      checked={bookingDetails.sessionPlan === '14-day'} 
                      onChange={handleChange} 
                      className="sr-only"
                    />
                    <div className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      bookingDetails.sessionPlan === '14-day' 
                        ? 'border-primary-500 bg-primary-50 text-primary-700' 
                        : 'border-secondary-200 bg-white text-secondary-700 hover:border-secondary-300'
                    }`}>
                      <div className="text-center">
                        <div className="text-2xl font-display font-bold mb-2">14 Days</div>
                        <div className="text-sm">30 minutes per day</div>
                        <div className="text-lg font-semibold mt-2">₹7,000</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Find Instructors Button */}
              <div className="text-center">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn-primary text-lg px-12 py-4 flex items-center justify-center mx-auto"
                >
                  {isLoading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Finding Instructors...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Find Instructors
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Available Instructors Section */}
      {instructors.length > 0 && (
        <section className="py-12 bg-secondary-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold text-secondary-900 mb-4">
                Available Instructors
              </h2>
              <p className="text-xl text-secondary-600">
                Choose from our verified instructors in your area
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {instructors.map(instructor => (
                <div key={instructor.id} className="card-hover">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-xl">
                        {instructor.instructor_name?.charAt(0) || 'I'}
                      </span>
                    </div>
                    <h3 className="text-xl font-display font-semibold text-secondary-900 mb-2">
                      {instructor.instructor_name || 'Instructor'}
                    </h3>
                    <p className="text-secondary-600 mb-2">
                      {instructor.instructor_email}
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-secondary-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>{instructor.car_model || 'Car Model'}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleSelectInstructor(instructor)} 
                    disabled={isVerifying}
                    className="btn-success w-full flex items-center justify-center"
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        Choose & Proceed to Pay
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* No Results Message */}
      {instructors.length === 0 && (
        <section className="py-12 bg-secondary-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="card">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-display font-bold text-secondary-900 mb-4">
                No Instructors Found
              </h3>
              <p className="text-secondary-600 mb-6">
                No instructors are available for the selected criteria. Please try different options or contact us for assistance.
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="btn-secondary"
              >
                Try Different Options
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default BookingPage;
