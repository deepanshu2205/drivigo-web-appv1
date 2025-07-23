import React, { useState, useEffect } from 'react';
import apiUrl from '../apiConfig'; // <-- Import the api URL

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = ['07:00-08:00', '08:00-09:00', '09:00-10:00', '16:00-17:00', '17:00-18:00'];

function InstructorProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ car_model: '', photo_url: '' });
  const [availability, setAvailability] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const [profileRes, availabilityRes] = await Promise.all([
          fetch(`${apiUrl}/api/instructor/profile`, { headers }),
          fetch(`${apiUrl}/api/instructor/availability`, { headers })
        ]);

        if (!profileRes.ok || !availabilityRes.ok) throw new Error('Failed to fetch data.');

        const profileData = await profileRes.json();
        const availabilityData = await availabilityRes.json();
        
        setProfile(profileData);
        setFormData({ car_model: profileData.car_model || '', photo_url: profileData.photo_url || '' });
        
        const availabilityObj = {};
        availabilityData.forEach(item => {
          if (!availabilityObj[item.day_of_week]) {
            availabilityObj[item.day_of_week] = new Set();
          }
          availabilityObj[item.day_of_week].add(item.time_slot);
        });
        setAvailability(availabilityObj);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/instructor/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to update profile.');
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Error updating profile.');
    }
  };

  const handleAvailabilityChange = (day, slot) => {
    setAvailability(prev => {
      const newAvailability = { ...prev };
      const daySlots = new Set(newAvailability[day]);
      if (daySlots.has(slot)) {
        daySlots.delete(slot);
      } else {
        daySlots.add(slot);
      }
      newAvailability[day] = daySlots;
      return newAvailability;
    });
  };

  const handleAvailabilitySubmit = async () => {
    const availabilityArray = [];
    for (const day in availability) {
      for (const slot of availability[day]) {
        availabilityArray.push({ day, slot });
      }
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/instructor/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ availability: availabilityArray })
      });
      if (!response.ok) throw new Error('Failed to save availability.');
      alert('Availability saved successfully!');
    } catch (error) {
      alert('Error saving availability.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>Could not load profile.</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">My Instructor Profile</h2>
        <p className="text-lg text-gray-600"><strong>Email:</strong> {profile.email}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <h3 className="text-2xl font-semibold">Edit Your Details</h3>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Car Model:</label>
            <input type="text" name="car_model" value={formData.car_model} onChange={handleProfileChange} placeholder="e.g., Maruti Swift" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Photo URL:</label>
            <input type="text" name="photo_url" value={formData.photo_url} onChange={handleProfileChange} placeholder="http://example.com/photo.jpg" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
          </div>
          <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Save Profile</button>
        </form>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-2xl font-semibold">My Weekly Availability</h3>
        <p className="text-gray-600 mb-4">Check the boxes for the times you are available to teach.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {daysOfWeek.map(day => (
            <div key={day} className="day-column">
              <h4 className="font-bold border-b pb-2 mb-2">{day}</h4>
              <div className="space-y-2">
                {timeSlots.map(slot => (
                  <div key={slot}>
                    <label className="flex items-center">
                      <input type="checkbox" checked={availability[day]?.has(slot) || false} onChange={() => handleAvailabilityChange(day, slot)} className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                      {slot}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleAvailabilitySubmit} className="mt-6 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
          Save Availability
        </button>
      </div>
    </div>
  );
}

export default InstructorProfilePage;
