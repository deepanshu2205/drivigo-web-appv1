import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiUrl from '../apiConfig'; // <-- Import the api URL

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('learner');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      // Use the apiUrl variable in the fetch call
      const response = await fetch(`${apiUrl}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to register.');
      }

      setMessage('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);

    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 -mt-20">
      <div className="p-8 max-w-md w-full bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Create Your Account</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">I am a:</label>
            <div className="flex items-center justify-around">
              <label className="flex items-center">
                <input type="radio" value="learner" name="role" checked={role === 'learner'} onChange={(e) => setRole(e.target.value)} className="mr-2"/>
                Learner
              </label>
              <label className="flex items-center">
                <input type="radio" value="instructor" name="role" checked={role === 'instructor'} onChange={(e) => setRole(e.target.value)} className="mr-2"/>
                Instructor
              </label>
            </div>
          </div>
          <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full">
            Sign Up
          </button>
        </form>
        {message && <p className="text-center text-red-500 text-xs mt-4">{message}</p>}
      </div>
    </div>
  );
}

export default SignupPage;
