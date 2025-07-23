// client/src/apiConfig.js

// This file determines which API URL to use.
// When you run `npm start` (development), it uses your local server.
// When Vercel builds your app for deployment (production), it uses the live URL from your environment variables.

const apiUrl = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_API_URL
  : 'http://localhost:5000';

export default apiUrl;
