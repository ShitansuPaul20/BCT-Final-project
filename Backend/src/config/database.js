const mongoose = require('mongoose');

const connectToDB = () => {
  mongoose.connect(process.env.DB_URI)
    .then(() => console.log('Connected to the database'))
    .catch((err) => console.error('Database connection error:', err));
};

module.exports = connectToDB