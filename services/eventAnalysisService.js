// services/eventAnalysisService.js
const moment = require('moment');

class EventAnalysisService {
  constructor() {
    this.eventTypeRequirements = {
      'outdoor_sports': {
        name: 'Outdoor Sports',
        idealTemp: { min: 15, max: 30 },
        maxPrecipitation: 20,
        maxWindSpeed: 20,
        preferredConditions: ['Clear', 'Clouds']
      },
      'wedding': {
        name: 'Wedding/Formal Event',
        idealTemp: { min: 18, max: 28 },
        maxPrecipitation: 10,
        maxWindSpeed: 15,
        preferredConditions: ['Clear', 'Clouds']
      },
      'hiking': {
        name: 'Hiking/Outdoor Adventure',
        idealTemp: { min: 10, max: 25 },
        maxPrecipitation: 30,
        maxWindSpeed: 25,
        preferredConditions: ['Clear', 'Clouds', 'Mist']
      },
      'corporate_outdoor': {
        name: 'Corporate Outdoor Event',
        idealTemp: { min: 16, max: 26 },
        maxPrecipitation: 15,
        maxWindSpeed: 18,
        preferredConditions: ['Clear', 'Clouds']
      },
      'general': {
        name: 'General Outdoor Event',
        idealTemp: { min: 15, max: 28 },
        maxPrecipitation: 25,
        maxWindSpeed: 20,
        preferredConditions: ['Clear', 'Clouds']
      }
    };
  }

  analyzeEventWeather(event, weatherData) {
    const requirements = this.eventTypeRequirements[event.eventType] || 
                        this.eventTypeRequirements.general;
    
    const analysis = {
      eventId: event.id,
      eventName: event.name,
      eventType: event.eventType,
      location: event.location,
      date: event.date,
      weather: weatherData,
      suitabilityScore: 0,
      suitabilityRating: 'Poor',
      factors: {
        temperature: this.analyzeTemperature(weatherData.temperature, requirements),
        precipitation: this.analyzePrecipitation(weatherData.precipitation, weatherData.precipitationProbability, requirements),
        wind: this.analyzeWind(weatherData.windSpeed, requirements),
        conditions: this.analyzeConditions(weatherData.weatherMain, requirements)
      },
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Calculate total score
    analysis.suitabilityScore = Object.values(analysis.factors)
      .reduce((total, factor) => total + factor.score, 0);

    // Determine rating
    if (analysis.suitabilityScore >= 80) {
      analysis.suitabilityRating = 'Excellent';
    } else if (analysis.suitabilityScore >= 60) {
      analysis.suitabilityRating = 'Good';
    } else if (analysis.suitabilityScore >= 40) {
      analysis.suitabilityRating = 'Okay';
    } else {
      analysis.suitabilityRating = 'Poor';
    }

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis.factors, requirements);

    return analysis;
  }

  analyzeTemperature(temp, requirements) {
    const { min, max } = requirements.idealTemp;
    let score = 0;
    let status = 'Poor';
    let message = '';

    if (temp >= min && temp <= max) {
      score = 30;
      status = 'Perfect';
      message = `Temperature ${temp}°C is ideal for ${requirements.name.toLowerCase()}`;
    } else if (temp >= min - 5 && temp <= max + 5) {
      score = 20;
      status = 'Good';
      message = `Temperature ${temp}°C is acceptable for ${requirements.name.toLowerCase()}`;
    } else if (temp >= min - 10 && temp <= max + 10) {
      score = 10;
      status = 'Fair';
      message = `Temperature ${temp}°C is manageable but not ideal`;
    } else {
      score = 0;
      status = 'Poor';
      message = `Temperature ${temp}°C is ${temp < min ? 'too cold' : 'too hot'} for outdoor events`;
    }

    return { score, status, message, value: temp, unit: '°C' };
  }

  analyzePrecipitation(precipitation, probability, requirements) {
    const maxPrecip = requirements.maxPrecipitation;
    let score = 0;
    let status = 'Poor';
    let message = '';

    if (probability <= maxPrecip) {
      if (probability <= 10) {
        score = 30;
        status = 'Perfect';
        message = 'Minimal chance of rain - perfect for outdoor events';
      } else {
        score = 25;
        status = 'Good';
        message = `Low chance of rain (${probability}%) - good for outdoor events`;
      }
    } else if (probability <= maxPrecip + 20) {
      score = 15;
      status = 'Fair';
      message = `Moderate chance of rain (${probability}%) - have backup plans ready`;
    } else {
      score = 0;
      status = 'Poor';
      message = `High chance of rain (${probability}%) - consider rescheduling or indoor alternatives`;
    }

    return { 
      score, 
      status, 
      message, 
      probability: probability,
      precipitation: precipitation,
      unit: '%/mm'
    };
  }

  analyzeWind(windSpeed, requirements) {
    const maxWind = requirements.maxWindSpeed;
    let score = 0;
    let status = 'Poor';
    let message = '';

    if (windSpeed <= maxWind) {
      if (windSpeed <= 10) {
        score = 25;
        status = 'Perfect';
        message = 'Light winds - ideal conditions';
      } else {
        score = 20;
        status = 'Good';
        message = `Moderate winds (${windSpeed} km/h) - acceptable for most activities`;
      }
    } else if (windSpeed <= maxWind + 10) {
      score = 10;
      status = 'Fair';
      message = `Strong winds (${windSpeed} km/h) - may affect some activities`;
    } else {
      score = 0;
      status = 'Poor';
      message = `Very strong winds (${windSpeed} km/h) - not recommended for outdoor events`;
    }

    return { score, status, message, value: windSpeed, unit: 'km/h' };
  }

  analyzeConditions(weatherMain, requirements) {
    const preferred = requirements.preferredConditions;
    let score = 0;
    let status = 'Poor';
    let message = '';

    if (preferred.includes(weatherMain)) {
      if (weatherMain === 'Clear') {
        score = 25;
        status = 'Perfect';
        message = 'Clear skies - perfect weather conditions';
      } else {
        score = 20;
        status = 'Good';
        message = `${weatherMain} conditions - good for outdoor events`;
      }
    } else if (['Mist', 'Fog'].includes(weatherMain)) {
      score = 10;
      status = 'Fair';
      message = `${weatherMain} conditions - reduced visibility but manageable`;
    } else {
      score = 0;
      status = 'Poor';
      message = `${weatherMain} conditions - not ideal for outdoor events`;
    }

    return { score, status, message, condition: weatherMain };
  }

  generateRecommendations(factors, requirements) {
    const recommendations = [];

    if (factors.temperature.status === 'Poor') {
      if (factors.temperature.value < requirements.idealTemp.min) {
        recommendations.push('Consider warmer clothing or heating arrangements');
        recommendations.push('Schedule the event during warmer parts of the day (noon-afternoon)');
      } else {
        recommendations.push('Provide shade and cooling arrangements');
        recommendations.push('Consider morning or evening timing to avoid peak heat');
      }
    }

    if (factors.precipitation.status === 'Poor' || factors.precipitation.status === 'Fair') {
      recommendations.push('Have covered areas or tents ready');
      recommendations.push('Consider indoor backup venue');
      recommendations.push('Inform attendees to bring rain gear');
    }

    if (factors.wind.status === 'Poor' || factors.wind.status === 'Fair') {
      recommendations.push('Secure all decorations and equipment');
      recommendations.push('Consider windbreaks or sheltered areas');
      recommendations.push('Inform attendees about windy conditions');
    }

    if (factors.conditions.status === 'Poor') {
      recommendations.push('Monitor weather updates closely');
      recommendations.push('Have contingency plans ready');
      recommendations.push('Consider postponing if conditions worsen');
    }

    if (recommendations.length === 0) {
      recommendations.push('Weather conditions look great for your event!');
      recommendations.push('Continue with your planned arrangements');
    }

    return recommendations;
  }

  async findAlternativeDates(event, weatherService, dateRange = 7) {
    const startDate = moment(event.date);
    const alternatives = [];

    for (let i = 1; i <= dateRange; i++) {
      const altDate = startDate.clone().add(i, 'days');
      const altDateStr = altDate.format('YYYY-MM-DD');

      try {
        const weatherData = await weatherService.getWeatherForDate(event.location, altDateStr);
        const analysis = this.analyzeEventWeather({...event, date: altDateStr}, weatherData);
        
        alternatives.push({
          date: altDateStr,
          dayOfWeek: altDate.format('dddd'),
          suitabilityScore: analysis.suitabilityScore,
          suitabilityRating: analysis.suitabilityRating,
          weather: {
            temperature: weatherData.temperature,
            precipitation: weatherData.precipitationProbability,
            windSpeed: weatherData.windSpeed,
            conditions: weatherData.weatherDescription
          }
        });
      } catch (error) {
        console.log(`Could not get weather for ${altDateStr}: ${error.message}`);
      }
    }

    // Sort by suitability score (descending)
    alternatives.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    return alternatives;
  }
}

module.exports = new EventAnalysisService();