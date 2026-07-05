const body = require('express-validator').body;
const { validationResult } = require('express-validator');

const validate = function(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
} 

const validateRegister = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

    validate
];

const validateLogin = [
  body('emailorusername')
    .trim()
    .notEmpty()
    .withMessage('Email or username is required'),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required'),

    validate
];

module.exports = { 
  validateRegister, 
  validateLogin 
};