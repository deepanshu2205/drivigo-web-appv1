import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';

// Import all pages and components
import HomePage from './pages/HomePage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InstructorProfilePage from './pages/InstructorProfilePage';
import BookingPage from './pages/BookingPage';
import BookingDetailsPage from './pages/BookingDetailsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';

function App() {
  // We need to wrap the logic in a component to use the useNavigate hook
  const AppContent = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');

    const handleLogout = () => {
      localStorage.removeItem('token');
      // Navigate to home page to refresh the state and update the navbar
      navigate('/'); 
    };

    const isActive = (path) => {
      return location.pathname === path;
    };

    return (
      <div className="min-h-screen bg-secondary-50 flex flex-col">
        {/* --- MODERN NAVIGATION BAR --- */}
        <nav className="bg-white shadow-medium border-b border-secondary-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">D</span>
                  </div>
                  <span className="font-display font-bold text-xl text-gradient">Drivigo</span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                <Link 
                  to="/" 
                  className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}
                >
                  Home
                </Link>
                <Link 
                  to="/about" 
                  className={`nav-link ${isActive('/about') ? 'nav-link-active' : ''}`}
                >
                  About
                </Link>
                <Link 
                  to="/contact" 
                  className={`nav-link ${isActive('/contact') ? 'nav-link-active' : ''}`}
                >
                  Contact
                </Link>

                {/* Conditional Links */}
                {token ? (
                  <>
                    <Link 
                      to="/dashboard" 
                      className={`nav-link ${isActive('/dashboard') ? 'nav-link-active' : ''}`}
                    >
                      Dashboard
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      className="btn-danger text-sm"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/signup" className="btn-secondary text-sm">
                      Sign Up
                    </Link>
                    <Link to="/login" className="btn-primary text-sm">
                      Login
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button className="text-secondary-700 hover:text-primary-600 p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-grow">
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 w-full">
            <Routes>
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/instructor-profile" element={<ProtectedRoute><InstructorProfilePage /></ProtectedRoute>} />
              <Route path="/book-lesson" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
              <Route path="/booking/:bookingId" element={<ProtectedRoute><BookingDetailsPage /></ProtectedRoute>} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/" element={<HomePage />} />
            </Routes>
          </div>
        </main>

        <Footer />
      </div>
    );
  };

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;