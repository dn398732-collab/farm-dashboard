# 🌤️ Weather Forecast Setup Guide

This guide will help you set up the weather forecast functionality using OpenWeatherMap API.

## 📋 Prerequisites

1. **OpenWeatherMap Account**: Sign up at [openweathermap.org](https://openweathermap.org/)
2. **API Key**: Get your free API key from the dashboard
3. **Farm Location**: Know your farm's latitude and longitude coordinates

## 🔧 Setup Steps

### Step 1: Get OpenWeatherMap API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Go to your dashboard and generate an API key
4. Copy the API key (it may take a few hours to activate)

### Step 2: Configure Your Farm Location

1. Find your farm's coordinates using:
   - Google Maps (right-click → "What's here?")
   - GPS coordinates from your phone
   - Online coordinate finder tools

2. Open `config.js` file
3. Replace the default coordinates:

```javascript
DEFAULT_LOCATION: {
  lat: YOUR_FARM_LATITUDE,    // Replace with your farm's latitude
  lon: YOUR_FARM_LONGITUDE,   // Replace with your farm's longitude
  name: 'Your Farm Name'      // Replace with your farm's name
}
```

### Step 3: Add Your API Key

1. Open `config.js` file
2. Replace `YOUR_OPENWEATHER_API_KEY` with your actual API key:

```javascript
API_KEY: 'your_actual_api_key_here'
```

## 🌍 Example Locations (India)

Here are coordinates for major Indian cities you can use as reference:

| City | Latitude | Longitude |
|------|----------|-----------|
| Delhi | 28.6139 | 77.2090 |
| Mumbai | 19.0760 | 72.8777 |
| Bangalore | 12.9716 | 77.5946 |
| Chennai | 13.0827 | 80.2707 |
| Kolkata | 22.5726 | 88.3639 |
| Hyderabad | 17.3850 | 78.4867 |
| Pune | 18.5204 | 73.8567 |
| Ahmedabad | 23.0225 | 72.5714 |

## 📱 Features Available

### Current Weather
- Real-time temperature, humidity, wind speed
- Weather conditions and icons
- Atmospheric pressure and visibility
- UV index information

### Hourly Forecast
- Next 24 hours weather prediction
- Temperature, humidity, wind for each hour
- Precipitation probability and amount
- Weather condition icons

### Daily Forecast
- 5-day weather outlook
- High/low temperatures
- Daily weather conditions
- Rainfall predictions
- Humidity levels

### Smart Farming Advice
- Temperature-based crop protection advice
- Irrigation recommendations based on humidity and rain
- Wind protection suggestions
- Weather-specific farming tips

## 🔄 API Limits

**Free Plan Limits:**
- 1,000 API calls per day
- 60 calls per minute
- Current weather and 5-day forecast included

**Recommendations:**
- The app fetches weather data when you refresh the forecast tab
- Data is cached to minimize API calls
- Consider upgrading if you need more frequent updates

## 🛠️ Troubleshooting

### Common Issues:

1. **"Weather API failed" message**
   - Check if your API key is correct
   - Ensure API key is activated (can take 2-10 hours)
   - Verify internet connection

2. **Wrong location weather**
   - Double-check latitude/longitude coordinates
   - Ensure coordinates are in decimal format (not degrees/minutes)

3. **Demo data showing**
   - This is normal when API fails
   - Check API key and internet connection
   - Demo data helps test the interface

### Testing Your Setup:

1. Open the app and go to "Forecast" tab
2. Pull down to refresh
3. Check if real weather data loads
4. Verify the location matches your farm

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify your API key at OpenWeatherMap dashboard
3. Test API key with a simple web request
4. Ensure coordinates are correct

## 🔐 Security Note

- Never commit your API key to public repositories
- Consider using environment variables for production
- Keep your API key secure and don't share it

---

**Happy Farming! 🌾**

Your weather-powered farm dashboard is ready to help you make informed agricultural decisions.