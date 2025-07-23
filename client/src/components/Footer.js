import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-gray-200 mt-20">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-black">
        <p>&copy; 2025 Drivigo. All Rights Reserved.</p>
        <div className="flex justify-center space-x-4 mt-2">
          <Link to="/about" className="hover:text-primary hover:underline">About Us</Link>
          <span>|</span>
          <Link to="/contact" className="hover:text-primary hover:underline">Contact Us</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;