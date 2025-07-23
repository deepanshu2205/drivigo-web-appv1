import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to log in.');
      }
      
      // --- IMPORTANT ---
      // 1. Save the token to the browser's local storage
      localStorage.setItem('token', data.token);

      // 2. Redirect the user to the dashboard
      setMessage('Login successful! Redirecting...');
      navigate('/dashboard');

    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
  <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="p-8 max-w-md w-full bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Login to Your Account</h2>
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
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="flex items-center justify-between">
          <button type="submit" className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full">
            Log In
          </button>
        </div>
      </form>
      {message && <p className="text-center text-red-500 text-xs mt-4">{message}</p>}
    </div>
  </div>
);

}

export default LoginPage;