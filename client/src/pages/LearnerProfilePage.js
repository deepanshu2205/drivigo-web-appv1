import React, { useState, useEffect } from 'react';
import apiUrl from '../apiConfig';

function LearnerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    gender: '',
    age: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiUrl}/api/learner/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setProfile(data);
        setFormData({
          name: data.name || '',
          phone_number: data.phone_number || '',
          gender: data.gender || '',
          age: data.age || '',
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/learner/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      alert('Profile updated!');
    } catch (e) {
      alert('Error updating profile');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>Could not load profile.</div>;

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">My Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Name</label>
          <input name="name" value={formData.name} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="block font-medium">Phone Number</label>
          <input name="phone_number" value={formData.phone_number} onChange={handleChange} className="input-field" />
        </div>
        <div>
          <label className="block font-medium">Gender</label>
          <select name="gender" value={formData.gender} onChange={handleChange} className="input-field">
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block font-medium">Age</label>
          <input name="age" type="number" value={formData.age} onChange={handleChange} className="input-field" />
        </div>
        <button type="submit" className="btn-primary w-full">Save Profile</button>
      </form>
    </div>
  );
}

export default LearnerProfilePage;