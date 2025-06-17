// routes/weather.js
const express = require('express');
const router = express.Router();
const weatherService = require('../services/weatherService');

// GET /weather/:location/:date - Get weather for specific location and date
router.get('/:location/:date', async (req, res) => {
  try {
    const { location, date } = req.params;
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const weatherData = await weatherService.getWeatherForDate(location, date);
    
    res.json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather data',
      message: error.message
    });
  }
});

// GET /weather/:location/current - Get current weather
router.get('/:location/current', async (req, res) => {
  try {
    const { location } = req.params;
    const weatherData = await weatherService.getCurrentWeather(location);
    
    res.json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current weather',
      message: error.message
    });
  }
});

// GET /weather/:location/forecast - Get weather forecast
router.get('/:location/forecast', async (req, res) => {
  try {
    const { location } = req.params;
    const days = parseInt(req.query.days) || 5;
    
    if (days < 1 || days > 5) {
      return res.status(400).json({
        success: false,
        error: 'Days parameter must be between 1 and 5'
      });
    }

    const forecastData = await weatherService.getForecast(location, days);
    
    res.json({
      success: true,
      data: forecastData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather forecast',
      message: error.message
    });
  }
});

// GET /weather/cache/status - Get cache statistics
router.get('/cache/status', (req, res) => {
  try {
    const cacheStats = weatherService.getCacheStats();
    
    res.json({
      success: true,
      data: cacheStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cache status',
      message: error.message
    });
  }
});

module.exports = router;