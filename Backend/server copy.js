require('dotenv').config();
const app = require('./src/app');
const connectToDB = require('./src/config/database');

// Connect to the database
connectToDB();

// Start the server
app.listen(3000, () => {
  console.log(`Server is running on port 3000`);
});