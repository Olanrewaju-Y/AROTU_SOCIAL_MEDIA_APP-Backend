const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const morgan = require('morgan');
const socketIo = require('socket.io');
// const connectDB = require('./config/db');
const chatSocket = require('./sockets/chat.socket');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Load env
dotenv.config();

// Init
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  // cors: {
  //   origin: process.env.PUBLIC_CLIENT_URL,
  //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  // }
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


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');

    // Start server after DB connection
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to AROTU Social Media API' });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/posts', require('./routes/post.routes'));
app.use('/api/messages', require('./routes/chat.routes'));
app.use('/api/rooms', require('./routes/room.routes'));


// Error Handler
app.use(errorHandler);

// Socket
chatSocket(io);

