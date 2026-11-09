const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: { message: 'No token provided. Authorization denied.' } });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: { message: 'No token provided. Authorization denied.' } });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_jwt_secret');
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: { message: 'Token is not valid.' } });
  }
};

module.exports = auth;
