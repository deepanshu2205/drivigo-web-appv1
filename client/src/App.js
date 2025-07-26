import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
import ProgressPage from './pages/ProgressPage';
import InstructorEarningsPage from './pages/InstructorEarningsPage';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import NotificationCenter, { useNotificationToasts } from './components/NotificationCenter';
import useResponsive from './hooks/useResponsive';
import notificationService from './services/notificationService';
import './App.css';

function App() {
  // We need to wrap the logic in a component to use the useNavigate hook
  const AppContent = () => {
    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { isMobile, isTablet, getDeviceInfo } = useResponsive();
    const { showToast, ToastContainer } = useNotificationToasts();

    useEffect(() => {
      if (token) {
        try {
          const userData = JSON.parse(atob(token.split('.')[1]));
          setUser(userData);
          
          // Initialize notification service
          initializeNotifications();
          
          // Register device info
          registerDeviceInfo();
        } catch (error) {
          console.error('Error parsing token:', error);
          handleLogout();
        }
      }
    }, [token]);

    const initializeNotifications = async () => {
      try {
        await notificationService.init();
        
        // Get initial notification count
        const response = await notificationService.getNotifications(50, 0);
        const unread = response.notifications?.filter(n => !n.is_read).length || 0;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    const registerDeviceInfo = async () => {
      try {
        const deviceInfo = getDeviceInfo();
        await fetch('/api/device/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            device_id: localStorage.getItem('deviceId') || 'web_' + Date.now(),
            device_type: deviceInfo.type,
            platform: deviceInfo.platform,
            app_version: '1.0.0'
          })
        });
      } catch (error) {
        console.error('Failed to register device:', error);
      }
    };

    const handleLogout = () => {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      navigate('/');
    };

    const toggleNotifications = () => {
      setShowNotifications(!showNotifications);
    };

    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* --- UPDATED NAVIGATION BAR --- */}
        <nav className="bg-primary shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex-shrink-0 font-bold text-xl black">
                <Link to="/">Drivigo</Link>
              </div>
              
              <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
                {/* Navigation Links */}
                {!isMobile && (
                  <>
                    <Link to="/" className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                    <Link to="/about" className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">About</Link>
                    <Link to="/contact" className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Contact</Link>
                  </>
                )}

                {/* --- Conditional Links --- */}
                {token ? (
                  <>
                    {/* Notification Bell */}
                    <button
                      onClick={toggleNotifications}
                      className="relative text-black-300 hover:bg-gray-700 hover:text-white p-2 rounded-md"
                    >
                      🔔
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    <Link to="/dashboard" className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      {isMobile ? '📊' : 'Dashboard'}
                    </Link>
                    
                    {user?.role === 'learner' && (
                      <Link to="/progress" className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        {isMobile ? '📈' : 'Progress'}
                      </Link>
                    )}
                    
                    {user?.role === 'instructor' && (
                      <Link to="/earnings" className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        {isMobile ? '💰' : 'Earnings'}
                      </Link>
                    )}

                    <button 
                      onClick={handleLogout} 
                      className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      {isMobile ? '🚪' : 'Logout'}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/signup" className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      {isMobile ? '📝' : 'Signup'}
                    </Link>
                    <Link to="/login" className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      {isMobile ? '🔑' : 'Login'}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Menu - Show navigation links on mobile when logged out */}
          {isMobile && !token && (
            <div className="px-4 pb-3 space-y-1">
              <Link to="/" className="block text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Home</Link>
              <Link to="/about" className="block text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">About</Link>
              <Link to="/contact" className="block text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Contact</Link>
            </div>
          )}
        </nav>

        {/* Page Content */}
        <main className={`flex-grow max-w-7xl mx-auto py-6 ${isMobile ? 'px-4' : 'sm:px-6 lg:px-8'} w-full`}>
          <Routes>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/instructor-profile" element={<ProtectedRoute><InstructorProfilePage /></ProtectedRoute>} />
            <Route path="/book-lesson" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
            <Route path="/booking/:bookingId" element={<ProtectedRoute><BookingDetailsPage /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
            <Route path="/earnings" element={<ProtectedRoute><InstructorEarningsPage /></ProtectedRoute>} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/" element={<HomePage />} />
          </Routes>
        </main>

        <Footer />

        {/* Notification Center */}
        <NotificationCenter 
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />

        {/* Toast Notifications */}
        <ToastContainer />
        <ToastContainer />

        {/* Device-specific styling */}
        <style jsx>{`
          @media (max-width: 640px) {
            .max-w-7xl {
              max-width: 100%;
            }
          }
        `}</style>
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