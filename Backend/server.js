require('dotenv').config();

// Safety net — koi bhi unexpected async error (jaise Gemini stream crash) poore server ko na gira de
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection (server crash rok diya):', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception (server crash rok diya):', err);
});

const app = require('./src/app');
const http = require("http")
const connectToDB = require('./src/config/database');

const { initSocket } = require('./src/sockets/server.socket') 

// Connect to the database
connectToDB();

const httpServer = http.createServer(app);
initSocket(httpServer)



// Start the server
httpServer.listen(3000, () => {
  console.log(`Server is running on port 3000`);
});