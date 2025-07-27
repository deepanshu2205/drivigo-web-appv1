import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiUrl from '../apiConfig';

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('learner');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
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
            Create your account
          </h2>
          <p className="mt-2 text-secondary-600">
            Join Drivigo and start your driving journey
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
                placeholder="Create a strong password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-3">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative">
                  <input 
                    type="radio" 
                    value="learner" 
                    name="role" 
                    checked={role === 'learner'} 
                    onChange={(e) => setRole(e.target.value)} 
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    role === 'learner' 
                      ? 'border-primary-500 bg-primary-50 text-primary-700' 
                      : 'border-secondary-200 bg-white text-secondary-700 hover:border-secondary-300'
                  }`}>
                    <div className="text-center">
                      <div className="text-2xl mb-2">👨‍🎓</div>
                      <div className="font-medium">Learner</div>
                    </div>
                  </div>
                </label>
                
                <label className="relative">
                  <input 
                    type="radio" 
                    value="instructor" 
                    name="role" 
                    checked={role === 'instructor'} 
                    onChange={(e) => setRole(e.target.value)} 
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    role === 'instructor' 
                      ? 'border-primary-500 bg-primary-50 text-primary-700' 
                      : 'border-secondary-200 bg-white text-secondary-700 hover:border-secondary-300'
                  }`}>
                    <div className="text-center">
                      <div className="text-2xl mb-2">👨‍🏫</div>
                      <div className="font-medium">Instructor</div>
                    </div>
                  </div>
                </label>
              </div>
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
                    Creating account...
                  </>
                ) : (
                  'Create account'
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

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-secondary-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
