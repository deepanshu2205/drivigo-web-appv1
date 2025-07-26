import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import apiUrl from '../apiConfig';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';

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
  const [isSearching, setIsSearching] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails(prevState => ({ ...prevState, [name]: value }));
    // Clear alert when user makes changes
    if (alert.message) setAlert({ type: '', message: '' });
  };

  const handleLocationChange = (newCoords) => {
    setBookingDetails(prevState => ({
      ...prevState,
      location: { longitude: newCoords.lng, latitude: newCoords.lat }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setAlert({ type: '', message: '' });
    setInstructors([]);

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
      
      if (availableInstructors.length === 0) {
        setAlert({ 
          type: 'warning', 
          message: 'No instructors available for your selected criteria. Please try different options.' 
        });
      } else {
        setAlert({ 
          type: 'success', 
          message: `Found ${availableInstructors.length} available instructor(s)!` 
        });
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      setAlert({ type: 'error', message: 'An error occurred while searching. Please try again.' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectInstructor = async (instructor) => {
    if (isVerifying) return;

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
          setIsVerifying(true);
          setAlert({ type: 'info', message: 'Verifying payment...' });

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
              setAlert({ type: 'success', message: 'Payment successful! Redirecting to booking details...' });
              setTimeout(() => {
                navigate(`/booking/${result.bookingId}`);
              }, 2000);
            } else {
              setAlert({ type: 'error', message: 'Payment verification failed. Please contact support.' });
            }
          } catch (error) {
            setAlert({ type: 'error', message: 'An error occurred during payment verification.' });
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
      setAlert({ type: 'error', message: 'An error occurred while initiating payment.' });
    }
  };

  const timeSlots = [
    { value: '07:00-08:00', label: '7:00 AM - 8:00 AM', icon: '🌅' },
    { value: '08:00-09:00', label: '8:00 AM - 9:00 AM', icon: '☀️' },
    { value: '09:00-10:00', label: '9:00 AM - 10:00 AM', icon: '☀️' },
    { value: '16:00-17:00', label: '4:00 PM - 5:00 PM', icon: '🌤️' },
    { value: '17:00-18:00', label: '5:00 PM - 6:00 PM', icon: '🌅' },
  ];

  const sessionPlans = [
    {
      id: '7-day',
      title: '7-Day Intensive',
      description: '1 hour per day for 7 days',
      price: '₹500',
      popular: true
    },
    {
      id: '14-day',
      title: '14-Day Standard',
      description: '30 minutes per day for 14 days',
      price: '₹500',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold text-gray-900 mb-4">
            Book Your Driving Session
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your preferred schedule and location. We'll find the perfect instructor for you!
          </p>
        </div>

        {/* Alert */}
        {alert.message && (
          <Alert 
            type={alert.type} 
            message={alert.message} 
            onClose={() => setAlert({ type: '', message: '' })}
            className="mb-8"
          />
        )}

        {/* Booking Form */}
        <div className="card mb-12 animate-fade-in">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Lesson Details</h2>
            <p className="text-gray-600 mt-1">Fill out your preferences to get started</p>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Date and Time */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <label className="form-label">
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Start Date
                  </label>
                  <input 
                    type="date" 
                    name="startDate" 
                    value={bookingDetails.startDate} 
                    onChange={handleChange} 
                    required 
                    min={new Date().toISOString().split('T')[0]}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Preferred Time Slot
                  </label>
                  <select 
                    name="timeSlot" 
                    value={bookingDetails.timeSlot} 
                    onChange={handleChange} 
                    required 
                    className="form-input"
                  >
                    <option value="">Select a time slot</option>
                    {timeSlots.map(slot => (
                      <option key={slot.value} value={slot.value}>
                        {slot.icon} {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Session Plan */}
              <div>
                <label className="form-label">
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Choose Your Learning Plan
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {sessionPlans.map(plan => (
                    <div 
                      key={plan.id}
                      className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                        bookingDetails.sessionPlan === plan.id 
                          ? 'border-primary bg-primary-light' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setBookingDetails(prev => ({ ...prev, sessionPlan: plan.id }))}
                    >
                      {plan.popular && (
                        <div className="absolute -top-2 left-4 bg-primary text-white text-xs px-2 py-1 rounded-full">
                          Popular
                        </div>
                      )}
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="sessionPlan"
                          value={plan.id}
                          checked={bookingDetails.sessionPlan === plan.id}
                          onChange={handleChange}
                          className="mr-3 text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                          <p className="text-sm text-gray-600">{plan.description}</p>
                          <p className="text-primary font-bold mt-1">{plan.price}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="form-label">
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Pickup/Drop Location
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  📍 Drag the pin to set your exact pickup location
                </p>
                <div className="border border-gray-300 rounded-xl overflow-hidden shadow-soft">
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
                      >
                        <div className="w-8 h-8 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </Marker>
                    </Map>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSearching}
                className="w-full btn-primary btn-lg"
              >
                {isSearching ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Searching for Instructors...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Find Available Instructors
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Available Instructors */}
        {instructors.length > 0 && (
          <div className="card animate-slide-up">
            <div className="card-header">
              <h3 className="text-xl font-semibold text-gray-900">
                Available Instructors ({instructors.length})
              </h3>
              <p className="text-gray-600 mt-1">Choose your preferred instructor to proceed</p>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instructors.map(instructor => (
                  <div key={instructor.id} className="card-hover border border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mr-4">
                          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{instructor.instructor_name}</h4>
                          <p className="text-sm text-gray-600">{instructor.instructor_email}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
                          </svg>
                          Car: {instructor.car_model}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          4.8/5 Rating
                        </div>
                      </div>

                      <button 
                        onClick={() => handleSelectInstructor(instructor)} 
                        disabled={isVerifying}
                        className="w-full btn-success group"
                      >
                        {isVerifying ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Choose & Pay ₹500
                            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingPage;
