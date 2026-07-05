const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/auth.routes');
const morgan = require('morgan')
const cors = require("cors")
const chatRouter = require('./routes/chat.routes');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"))

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET","POST","PUT","DELETE"]
}))

// Routes
app.use("/api/auth" , authRouter);
app.use("/api/chat" , chatRouter);

module.exports = app;
