const { validationResult } = require('express-validator');
const userModel = require('../models/user.model');
const { sendEmail } = require('../services/mail.service');
const JWT = require('jsonwebtoken');

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { username, email, password } = req.body;
  try {
    // Check if the user already exists
    const existingUser = await userModel.findOne({
      $or: [{ email }, { username }]
     });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists' ,
        success: false,
        err: "User already exists"
      });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }

  const newUser = new userModel({
    username,
    email,
    password
  });

  await newUser.save();

  const emailvarificationToken = JWT.sign(
    { email: newUser.email },
    process.env.JWT_SECRET
  );

  await sendEmail({
    to: email,
    subject: 'Welcome to Perplexity!',
    html: `<h1>Welcome, ${username}!</h1><p>Thank you for registering at Perplexity. We're excited to have you on board!</p>
    <p>Please verify your email by clicking the link below:</p>
    <a href="http://localhost:3000/api/auth/verify-email?token=${emailvarificationToken}">Verify Email</a>
    <p>If you did not create an account, please ignore this email.</p>
    <Br/><p>Best regards,<br/>The Perplexity Team</p>
     `
  });

  res.status(201).json({ 
    message: 'User created successfully',
    success: true,
    user: {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email
    }
  });

}

async function verifyEmail(req, res) {
  const { token } = req.query;

  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.verified = true;
    await user.save();

    const HTML = `<h1>Email Verified</h1><p>Your email has been verified successfully.</p>
    <a href="http://localhost:3000/login">Go to Login</a>`;

    res.send(HTML);
    res.status(200).json({ message: 'Email verified successfully' });
    
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
}

async function login(req, res) {
  try{
    const { emailorusername, password } = req.body;
    const user = await userModel.findOne({ 
      $or: [
        { email: emailorusername }, 
        { username: emailorusername }
      ] 
    });
    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid email/username or password' ,
        success: false,
        err: "Invalid email/username or password"
      });
    }
    if (!user.verified) {
      return res.status(400).json(
        { message: 'Please verify your email address' ,
          success: false,
          err: "Please verify your email address"
        }
      );
    }
    const token = JWT.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict' });

    res.status(200).json({ 
      message: 'Login successful',
      success: true,
      user
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function getme(req, res) {
  
  try {
    const user = await userModel.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      message: 'User retrieved successfully',
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  } 
}

module.exports = {
  register,
  verifyEmail,
  login,
  getme
};
