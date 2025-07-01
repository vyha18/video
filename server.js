const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/drawingApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define drawing schema
const DrawingSchema = new mongoose.Schema({
  data: String,
  createdAt: { type: Date, default: Date.now }
});

const Drawing = mongoose.model('Drawing', DrawingSchema);

// Serve static files
app.use(express.static('public'));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');

  // Load existing drawing
  Drawing.findOne().sort({ createdAt: -1 }).exec()
    .then(drawing => {
      if (drawing) {
        socket.emit('init', drawing.data);
      }
    });

  // Handle drawing updates
  socket.on('drawing', (data) => {
    // Save to database
    const newDrawing = new Drawing({ data });
    newDrawing.save();
    
    // Broadcast to all clients
    socket.broadcast.emit('drawing', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});