import React from 'react';
import { Navigate } from 'react-router-dom';

// This component will wrap our private pages
function ProtectedRoute({ children }) {
  // Check for the token in local storage
  const token = localStorage.getItem('token');

  if (!token) {
    // If there's no token, redirect to the login page
    return <Navigate to="/login" />;
  }

  // If the token exists, show the page the user wanted to see
  return children;
}

export default ProtectedRoute;