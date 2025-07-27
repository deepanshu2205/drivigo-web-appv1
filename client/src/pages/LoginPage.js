import apiUrl from '../apiConfig';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/login`,{
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
      setTimeout(() => navigate('/dashboard'), 1500);

    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">D</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-secondary-900">
            Welcome back
          </h2>
          <p className="mt-2 text-secondary-600">
            Sign in to your account to continue
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="btn-primary w-full flex justify-center items-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          {/* Message */}
          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes('successful') 
                ? 'bg-success-50 text-success-700 border border-success-200' 
                : 'bg-error-50 text-error-700 border border-error-200'
            }`}>
              {message}
            </div>
          )}

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-secondary-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;