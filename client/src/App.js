import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

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
    const token = localStorage.getItem('token');

    const handleLogout = () => {
      localStorage.removeItem('token');
      // Navigate to home page to refresh the state and update the navbar
      navigate('/'); 
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
              <div className="flex items-baseline space-x-4">
                <Link to="/" className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                <Link to="/about" className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">About</Link>
                <Link to="/contact" className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Contact</Link>

                {/* --- Conditional Links --- */}
                {token ? (
                  <>
                    <Link to="/dashboard" className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                    <button onClick={handleLogout} className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/signup" className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Signup</Link>
                    <Link to="/login" className="text-black-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Login</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-grow max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 w-full">
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