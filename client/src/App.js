import React, { useState, useEffect } from 'react';
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
import { NotificationProvider } from './components/NotificationContext';

function App() {
  // We need to wrap the logic in a component to use the useNavigate hook
  const AppContent = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [theme, setTheme] = useState(() => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') || 'light';
      }
      return 'light';
    });

    useEffect(() => {
      if (theme === 'dark') {
        document.body.classList.add('dark');
      } else {
        document.body.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
      setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const handleLogout = () => {
      localStorage.removeItem('token');
      // Navigate to home page to refresh the state and update the navbar
      navigate('/'); 
    };

    const isActive = (path) => {
      return location.pathname === path;
    };

    const toggleMobileMenu = () => {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
      setIsMobileMenuOpen(false);
    };

    return (
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex flex-col">
        {/* --- MODERN NAVIGATION BAR --- */}
        <nav className="bg-white dark:bg-secondary-800 shadow-medium border-b border-secondary-100 dark:border-secondary-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
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
                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className="ml-4 p-2 rounded-full border border-secondary-200 dark:border-secondary-600 bg-secondary-50 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-600 transition-colors"
                  aria-label="Toggle dark mode"
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.93l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button 
                  onClick={toggleMobileMenu}
                  className="text-secondary-700 hover:text-primary-600 p-2 transition-colors"
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden">
                <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-secondary-100">
                  <Link 
                    to="/" 
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive('/') 
                        ? 'text-primary-600 bg-primary-50' 
                        : 'text-secondary-700 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    Home
                  </Link>
                  <Link 
                    to="/about" 
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive('/about') 
                        ? 'text-primary-600 bg-primary-50' 
                        : 'text-secondary-700 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    About
                  </Link>
                  <Link 
                    to="/contact" 
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive('/contact') 
                        ? 'text-primary-600 bg-primary-50' 
                        : 'text-secondary-700 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    Contact
                  </Link>

                  {/* Conditional Mobile Links */}
                  {token ? (
                    <>
                      <Link 
                        to="/dashboard" 
                        className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                          isActive('/dashboard') 
                            ? 'text-primary-600 bg-primary-50' 
                            : 'text-secondary-700 hover:text-primary-600 hover:bg-primary-50'
                        }`}
                        onClick={closeMobileMenu}
                      >
                        Dashboard
                      </Link>
                      <button 
                        onClick={() => {
                          handleLogout();
                          closeMobileMenu();
                        }} 
                        className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-error-600 hover:text-error-700 hover:bg-error-50 transition-colors"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/signup" 
                        className="block px-3 py-2 rounded-md text-base font-medium bg-secondary-100 text-secondary-700 hover:bg-secondary-200 transition-colors"
                        onClick={closeMobileMenu}
                      >
                        Sign Up
                      </Link>
                      <Link 
                        to="/login" 
                        className="block px-3 py-2 rounded-md text-base font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                        onClick={closeMobileMenu}
                      >
                        Login
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
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
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </Router>
  );
}

export default App;