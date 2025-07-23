import React from 'react';

function ContactPage() {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
      <p className="text-lg text-gray-700 mb-2">Have questions? We'd love to hear from you.</p>
      <ul className="list-disc list-inside text-lg text-gray-700">
        <li><strong>Email:</strong> support@drivigo.com</li>
        <li><strong>Phone:</strong> +91 123-456-7890</li>
        <li><strong>Address:</strong> 123 Driving Lane, New Delhi, India</li>
      </ul>
    </div>
  );
}

export default ContactPage;