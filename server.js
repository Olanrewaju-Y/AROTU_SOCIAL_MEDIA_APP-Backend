const express = require('express');
const mongoose = require('mongoose'); 
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const morgan = require('morgan');
const socketIo = require('socket.io');
const connectDB = require('./config/db'); 
const chatSocket = require('./sockets/chat.socket');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Load env
dotenv.config();

// Connect to MongoDB
connectDB(); 

// Init
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
 cors: {
 origin: '*'
 }
});

app.set('io', io); // This makes io accessible via req.app.get('io')

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimiter);

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to AROTU Social Media API' });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/posts', require('./routes/post.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/rooms', require('./routes/room.routes'));
app.use('/api/businesses', require('./routes/business.routes'));


// Error Handler
app.use(errorHandler);

// Socket
chatSocket(io);

// Start server (moved outside of the connect.then() block if connectDB handles starting)
// If connectDB connects but doesn't start the server, keep this part:
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});