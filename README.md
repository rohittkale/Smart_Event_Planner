# Smart Event Planner Backend

A backend service that helps users plan outdoor events by integrating weather APIs to provide intelligent recommendations based on weather forecasts, venue requirements, and event types.

## Features

### Core Features ✅
- **Weather API Integration**: OpenWeatherMap integration for current weather and 5-day forecasts
- **Event Management**: Create, read, update, delete events with proper validation
- **Weather Analysis**: Intelligent scoring system based on event type requirements
- **Smart Recommendations**: Alternative date suggestions and weather-based advice
- **Caching System**: 3-hour cache for weather data to optimize API usage

### Event Types Supported
- **Outdoor Sports**: Cricket, football, tennis (Temperature: 15-30°C, Low precipitation)
- **Wedding/Formal**: Outdoor ceremonies (Temperature: 18-28°C, Minimal precipitation)
- **Hiking/Adventure**: Outdoor activities (Temperature: 10-25°C, Moderate wind tolerance)
- **Corporate Outdoor**: Team events (Temperature: 16-26°C, Professional requirements)
- **General**: Default outdoor events

### Weather Scoring Algorithm
Events are scored on a 0-100 scale based on:
- **Temperature Suitability** (30 points max)
- **Precipitation Risk** (30 points max)
- **Wind Conditions** (25 points max)
- **Weather Conditions** (25 points max)

## Prerequisites

1. **Node.js** (v14.0.0 or higher)
2. **npm** (v6.0.0 or higher)
3. **OpenWeatherMap API Key** (free tier available)

## Installation & Setup

### 1. Clone/Create Project Directory
```bash
mkdir smart-event-planner
cd smart-event-planner
```

### 2. Initialize Package.json
Copy the package.json content from the code above and run:
```bash
npm install
```

### 3. Create Environment File
Create a `.env` file in the root directory:
```bash
OPENWEATHER_API_KEY=your_openweather_api_key_here
PORT=3000
NODE_ENV=development
```

### 4. Get OpenWeatherMap API Key
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Replace `your_openweather_api_key_here` in the `.env` file

### 5. Project Structure
Create the following directory structure:
```
smart-event-planner/
├── package.json
├── .env
├── server.js
├── models/
│   └── Event.js
├── services/
│   ├── weatherService.js
│   └── eventAnalysisService.js
├── routes/
│   ├── events.js
│   └── weather.js
├── middleware/
│   ├── validation.js
│   └── errorHandler.js
└── README.md
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Event Management
```
POST   /events                    # Create new event
GET    /events                    # List all events with weather status
GET    /events/:id                # Get specific event
PUT    /events/:id                # Update event
DELETE /events/:id                # Delete event
```

### Weather Integration
```
GET    /weather/:location/:date         # Get weather for location and date
GET    /weather/:location/current       # Get current weather
GET    /weather/:location/forecast      # Get 5-day forecast
GET    /weather/cache/status           # Cache statistics
```

### Event Analysis
```
POST   /events/:id/weather-check       # Analyze weather for event
GET    /events/:id/alternatives        # Get alternative dates
GET    /events/:id/suitability         # Get suitability score
```

### System
```
GET    /health                         # Health check
```

## Sample API Calls

### 1. Create a Cricket Event
```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cricket Tournament",
    "location": "Mumbai",
    "date": "2025-06-20",
    "eventType": "outdoor_sports",
    "description": "Inter-college cricket tournament"
  }'
```

### 2. Check Weather for Location
```bash
curl http://localhost:3000/weather/Mumbai/2025-06-20
```

### 3. Get Event Alternatives
```bash
curl http://localhost:3000/events/{event-id}/alternatives?days=7
```

## Testing with Postman

### Import Collection Structure:
```
📁 Smart Event Planner APIs
├── 📁 Event Management
│   ├── ➤ Create Cricket Tournament
│   ├── ➤ Create Wedding Event
│   ├── ➤ Create Hiking Trip
│   ├── ➤ List All Events
│   └── ➤ Update Event
├── 📁 Weather Integration
│   ├── ➤ Get Weather Mumbai
│   ├── ➤ Check Event Weather
│   ├── ➤ Get Alternatives
│   └── ➤ Cache Status
└── 📁 Error Handling
    ├── ➤ Invalid Location
    └── ➤ Invalid Date Format
```

## Sample Responses

### Event Creation Response
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": "event_123",
    "name": "Cricket Tournament",
    "location": "Mumbai",
    "date": "2025-06-20",
    "eventType": "outdoor_sports",
    "weatherAnalysis": {
      "suitabilityScore": 85,
      "suitabilityRating": "Excellent",
      "recommendations": ["Weather conditions look great for your event!"]
    }
  }
}
```

### Weather Analysis Response
```json
{
  "success": true,
  "data": {
    "suitabilityScore": 75,
    "suitabilityRating": "Good",
    "factors": {
      "temperature": {
        "score": 30,
        "status": "Perfect",
        "message": "Temperature 25°C is ideal for outdoor sports"
      },
      "precipitation": {
        "score": 25,
        "status": "Good",
        "probability": 15
      }
    },
    "recommendations": [
      "Weather conditions look great for your event!",
      "Continue with your planned arrangements"
    ]
  }
}
```

## Troubleshooting

### Common Issues:

1. **API Key Error**: Ensure your OpenWeatherMap API key is valid and active
2. **Location Not Found**: Use proper city names or try "City,Country" format
3. **Date Format**: Use YYYY-MM-DD format only
4. **Port in Use**: Change PORT in .env file if 3000 is occupied

### Debug Mode:
Set `NODE_ENV=development` in .env file for detailed error messages.

## Deployment

### Deploy to Railway/Render:
1. Push code to GitHub repository
2. Connect to deployment platform
3. Set environment variables (OPENWEATHER_API_KEY)
4. Deploy

### Environment Variables:
```
OPENWEATHER_API_KEY=your_production_api_key
PORT=3000
NODE_ENV=development 
```

## Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- User authentication and authorization
- Email/SMS notifications for weather changes
- Historical weather data analysis
- Mobile app integration
- Advanced caching strategies
