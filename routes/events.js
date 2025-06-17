// routes/events.js
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const weatherService = require('../services/weatherService');
const eventAnalysisService = require('../services/eventAnalysisService');
const { validateEvent, validateEventUpdate } = require('../middleware/validation');

// In-memory storage (replace with database in production)
const events = new Map();

// GET /events - List all events
router.get('/', async (req, res) => {
  try {
    const allEvents = Array.from(events.values());
    
    // Optionally include weather status for each event
    const eventsWithStatus = await Promise.all(
      allEvents.map(async (event) => {
        try {
          const weatherData = await weatherService.getWeatherForDate(event.location, event.date);
          const analysis = eventAnalysisService.analyzeEventWeather(event, weatherData);
          
          return {
            ...event,
            weatherStatus: {
              suitabilityRating: analysis.suitabilityRating,
              suitabilityScore: analysis.suitabilityScore,
              temperature: weatherData.temperature,
              conditions: weatherData.weatherDescription
            }
          };
        } catch (error) {
          return {
            ...event,
            weatherStatus: {
              suitabilityRating: 'Unknown',
              error: 'Weather data unavailable'
            }
          };
        }
      })
    );

    res.json({
      success: true,
      count: eventsWithStatus.length,
      data: eventsWithStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
      message: error.message
    });
  }
});

// POST /events - Create new event
router.post('/', validateEvent, async (req, res) => {
  try {
    const event = new Event(req.body);
    events.set(event.id, event);

    // Try to get weather data for the event
    try {
      const weatherData = await weatherService.getWeatherForDate(event.location, event.date);
      const analysis = eventAnalysisService.analyzeEventWeather(event, weatherData);
      event.weatherAnalysis = analysis;
      events.set(event.id, event);
    } catch (weatherError) {
      console.log(`Weather analysis failed for event ${event.id}: ${weatherError.message}`);
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to create event',
      message: error.message
    });
  }
});

// GET /events/:id - Get specific event
router.get('/:id', (req, res) => {
  try {
    const event = events.get(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event',
      message: error.message
    });
  }
});

// PUT /events/:id - Update event
router.put('/:id', validateEventUpdate, async (req, res) => {
  try {
    const event = events.get(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    event.update(req.body);
    
    // If location or date changed, update weather analysis
    if (req.body.location || req.body.date) {
      try {
        const weatherData = await weatherService.getWeatherForDate(event.location, event.date);
        const analysis = eventAnalysisService.analyzeEventWeather(event, weatherData);
        event.weatherAnalysis = analysis;
      } catch (weatherError) {
        console.log(`Weather analysis update failed for event ${event.id}: ${weatherError.message}`);
      }
    }

    events.set(event.id, event);

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to update event',
      message: error.message
    });
  }
});

// DELETE /events/:id - Delete event
router.delete('/:id', (req, res) => {
  try {
    const deleted = events.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete event',
      message: error.message
    });
  }
});

// POST /events/:id/weather-check - Analyze weather for existing event
router.post('/:id/weather-check', async (req, res) => {
  try {
    const event = events.get(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const weatherData = await weatherService.getWeatherForDate(event.location, event.date);
    const analysis = eventAnalysisService.analyzeEventWeather(event, weatherData);
    
    // Update event with fresh analysis
    event.weatherAnalysis = analysis;
    events.set(event.id, event);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze weather for event',
      message: error.message
    });
  }
});

// GET /events/:id/alternatives - Get alternative dates for better weather
router.get('/:id/alternatives', async (req, res) => {
  try {
    const event = events.get(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const dateRange = parseInt(req.query.days) || 7;
    const alternatives = await eventAnalysisService.findAlternativeDates(event, weatherService, dateRange);

    res.json({
      success: true,
      originalDate: event.date,
      searchRange: `${dateRange} days`,
      alternatives: alternatives
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to find alternative dates',
      message: error.message
    });
  }
});

// GET /events/:id/suitability - Get weather suitability score
router.get('/:id/suitability', async (req, res) => {
  try {
    const event = events.get(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    let analysis = event.weatherAnalysis;
    
    // If no cached analysis, generate fresh one
    if (!analysis) {
      const weatherData = await weatherService.getWeatherForDate(event.location, event.date);
      analysis = eventAnalysisService.analyzeEventWeather(event, weatherData);
      event.weatherAnalysis = analysis;
      events.set(event.id, event);
    }

    res.json({
      success: true,
      data: {
        eventId: event.id,
        eventName: event.name,
        suitabilityScore: analysis.suitabilityScore,
        suitabilityRating: analysis.suitabilityRating,
        factors: analysis.factors,
        recommendations: analysis.recommendations,
        weather: analysis.weather
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get suitability analysis',
      message: error.message
    });
  }
});

module.exports = router;