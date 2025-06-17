// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const eventRoutes = require('./routes/events');
const weatherRoutes = require('./routes/weather');
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.send('🌐 Welcome to the Smart Event Planner API! Use /events or /weather endpoints.');
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Smart Event Planner API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/events', eventRoutes);
app.use('/weather', weatherRoutes);

// Error handler middleware
app.use(errorHandler);

// 404 Handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Smart Event Planner API running on http://localhost:${PORT}`);
  console.log(`🌤️ Weather integration: OpenWeatherMap`);
  console.log(`📍 Available endpoints: /events, /weather, /health`);
});
