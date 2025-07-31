import React, { useState } from 'react';

const LearnerProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    gender: '',
    age: '',
    address: '',
  });

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Profile Data:', profile);
    alert('Profile saved!');
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow-md rounded-lg dark:bg-gray-900">
      <h2 className="text-3xl font-display font-bold text-center text-gray-900 dark:text-white mb-6">
        Learner Profile
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
            className="w-full p-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white dark:border-gray-700 focus:ring focus:ring-blue-500"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            className="w-full p-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white dark:border-gray-700 focus:ring focus:ring-blue-500"
            required
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Gender
          </label>
          <select
            name="gender"
            value={profile.gender}
            onChange={handleChange}
            className="w-full p-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white dark:border-gray-700"
            required
          >
            <option value="">--Select--</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Age
          </label>
          <input
            type="number"
            name="age"
            value={profile.age}
            onChange={handleChange}
            className="w-full p-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white dark:border-gray-700"
            required
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Address
          </label>
          <textarea
            name="address"
            value={profile.address}
            onChange={handleChange}
            rows="3"
            className="w-full p-2 border rounded-md shadow-sm dark:bg-gray-800 dark:text-white dark:border-gray-700"
            required
          />
        </div>

        {/* Submit Button */}
        <div className="text-center pt-2">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all"
          >
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default LearnerProfile;
