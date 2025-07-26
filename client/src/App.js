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
import './App.css';

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

    const isActiveRoute = (path) => {
      return location.pathname === path;
    };

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* --- MODERNIZED NAVIGATION BAR --- */}
        <nav className="bg-white shadow-soft border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
                    </svg>
                  </div>
                  <span className="font-heading font-bold text-xl text-gray-900">Drivigo</span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                <Link 
                  to="/" 
                  className={`nav-link ${isActiveRoute('/') ? 'nav-link-active' : ''}`}
                >
                  Home
                </Link>
                <Link 
                  to="/about" 
                  className={`nav-link ${isActiveRoute('/about') ? 'nav-link-active' : ''}`}
                >
                  About
                </Link>
                <Link 
                  to="/contact" 
                  className={`nav-link ${isActiveRoute('/contact') ? 'nav-link-active' : ''}`}
                >
                  Contact
                </Link>

                {/* Conditional Links */}
                {token ? (
                  <div className="flex items-center space-x-1 ml-4 pl-4 border-l border-gray-200">
                    <Link 
                      to="/dashboard" 
                      className={`nav-link ${isActiveRoute('/dashboard') ? 'nav-link-active' : ''}`}
                    >
                      Dashboard
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      className="btn-danger btn-sm ml-2"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200">
                    <Link 
                      to="/login" 
                      className="btn-outline btn-sm"
                    >
                      Login
                    </Link>
                    <Link 
                      to="/signup" 
                      className="btn-primary btn-sm"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100">
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
          <div className="animate-fade-in">
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