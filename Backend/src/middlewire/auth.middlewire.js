const { validationResult } = require('express-validator');
const userModel = require('../models/user.model');
const { sendEmail } = require('../services/mail.service');
const JWT = require('jsonwebtoken');

async function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token.' });
  }
}

module.exports = {authMiddleware};