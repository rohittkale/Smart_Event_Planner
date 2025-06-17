// services/weatherService.js
const axios = require('axios');
const NodeCache = require('node-cache');
const moment = require('moment');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || 'bb90d8f21ca4dc0fcb1077df5af06be3';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    // Cache for 3 hours (10800 seconds)
    this.cache = new NodeCache({ stdTTL: 10800, checkperiod: 600 });
  }

  async getCurrentWeather(location) {
    const cacheKey = `current_${location}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log(`☁️ Using cached weather data for ${location}`);
      return cached;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          q: location,
          appid: this.apiKey,
          units: 'metric'
        }
      });

      const weatherData = this.transformCurrentWeather(response.data);
      this.cache.set(cacheKey, weatherData);
      
      console.log(`🌤️ Fetched current weather for ${location}`);
      return weatherData;
    } catch (error) {
      throw this.handleWeatherError(error);
    }
  }

  async getForecast(location, days = 5) {
    const cacheKey = `forecast_${location}_${days}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log(`☁️ Using cached forecast data for ${location}`);
      return cached;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          q: location,
          appid: this.apiKey,
          units: 'metric',
          cnt: days * 8 // 8 forecasts per day (every 3 hours)
        }
      });

      const forecastData = this.transformForecast(response.data);
      this.cache.set(cacheKey, forecastData);
      
      console.log(`🌤️ Fetched forecast for ${location}`);
      return forecastData;
    } catch (error) {
      throw this.handleWeatherError(error);
    }
  }

  async getWeatherForDate(location, date) {
    const targetDate = moment(date).format('YYYY-MM-DD');
    const today = moment().format('YYYY-MM-DD');
    
    // If date is today, return current weather
    if (targetDate === today) {
      return await this.getCurrentWeather(location);
    }
    
    // If date is in the future (within 5 days), return forecast
    const daysFromNow = moment(date).diff(moment(), 'days');
    if (daysFromNow > 0 && daysFromNow <= 5) {
      const forecast = await this.getForecast(location);
      return this.findForecastForDate(forecast, targetDate);
    }
    
    throw new Error('Weather data only available for current day and next 5 days');
  }

  transformCurrentWeather(data) {
    return {
      location: data.name,
      country: data.sys.country,
      date: moment().format('YYYY-MM-DD'),
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      windDirection: data.wind.deg,
      visibility: data.visibility / 1000, // Convert to km
      cloudiness: data.clouds.all,
      weatherMain: data.weather[0].main,
      weatherDescription: data.weather[0].description,
      precipitation: data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0,
      precipitationProbability: 0, // Not available in current weather
      sunrise: moment.unix(data.sys.sunrise).format('HH:mm'),
      sunset: moment.unix(data.sys.sunset).format('HH:mm'),
      timestamp: new Date().toISOString()
    };
  }

  transformForecast(data) {
    const dailyForecasts = {};
    
    data.list.forEach(item => {
      const date = moment.unix(item.dt).format('YYYY-MM-DD');
      
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          location: data.city.name,
          country: data.city.country,
          date: date,
          temperatures: [],
          conditions: [],
          precipitations: [],
          windSpeeds: [],
          humidity: [],
          cloudiness: []
        };
      }
      
      dailyForecasts[date].temperatures.push(item.main.temp);
      dailyForecasts[date].conditions.push(item.weather[0]);
      dailyForecasts[date].precipitations.push(item.rain ? (item.rain['3h'] || 0) : 0);
      dailyForecasts[date].windSpeeds.push(item.wind.speed * 3.6);
      dailyForecasts[date].humidity.push(item.main.humidity);
      dailyForecasts[date].cloudiness.push(item.clouds.all);
    });

    // Process daily summaries
    const processedForecasts = Object.values(dailyForecasts).map(day => ({
      location: day.location,
      country: day.country,
      date: day.date,
      temperature: Math.round(day.temperatures.reduce((a, b) => a + b) / day.temperatures.length),
      minTemperature: Math.round(Math.min(...day.temperatures)),
      maxTemperature: Math.round(Math.max(...day.temperatures)),
      humidity: Math.round(day.humidity.reduce((a, b) => a + b) / day.humidity.length),
      windSpeed: Math.round(day.windSpeeds.reduce((a, b) => a + b) / day.windSpeeds.length),
      cloudiness: Math.round(day.cloudiness.reduce((a, b) => a + b) / day.cloudiness.length),
      precipitation: day.precipitations.reduce((a, b) => a + b),
      precipitationProbability: this.calculatePrecipitationProbability(day.precipitations),
      weatherMain: this.getMostFrequentCondition(day.conditions).main,
      weatherDescription: this.getMostFrequentCondition(day.conditions).description,
      timestamp: new Date().toISOString()
    }));

    return processedForecasts;
  }

  findForecastForDate(forecasts, targetDate) {
    const forecast = forecasts.find(f => f.date === targetDate);
    if (!forecast) {
      throw new Error(`No forecast available for date: ${targetDate}`);
    }
    return forecast;
  }

  calculatePrecipitationProbability(precipitations) {
    const hasRain = precipitations.filter(p => p > 0).length;
    return Math.round((hasRain / precipitations.length) * 100);
  }

  getMostFrequentCondition(conditions) {
    const frequency = {};
    conditions.forEach(condition => {
      const key = condition.main;
      frequency[key] = (frequency[key] || 0) + 1;
    });
    
    const mostFrequent = Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );
    
    return conditions.find(c => c.main === mostFrequent);
  }

  handleWeatherError(error) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          return new Error('Invalid API key for weather service');
        case 404:
          return new Error('Location not found');
        case 429:
          return new Error('Weather API rate limit exceeded. Please try again later');
        default:
          return new Error(`Weather API error: ${error.response.data.message || 'Unknown error'}`);
      }
    } else if (error.request) {
      return new Error('Weather service is currently unavailable');
    } else {
      return new Error(`Weather service error: ${error.message}`);
    }
  }

  getCacheStats() {
    return {
      keys: this.cache.keys(),
      stats: this.cache.getStats()
    };
  }
}

module.exports = new WeatherService();
