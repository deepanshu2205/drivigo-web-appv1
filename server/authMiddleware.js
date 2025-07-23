const jwt = require('jsonwebtoken');
const KEY_SECRET = 'your-super-secret-key-that-should-be-long-and-random'; // Use the same secret as in login

module.exports = function (req, res, next) {
  // Get token from the Authorization header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, KEY_SECRET);
    // Add the user payload from the token to the request object
    req.user = decoded;
    next(); // Move on to the next function (the main endpoint logic)
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};