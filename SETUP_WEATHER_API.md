# 🌤️ Setup Real-Time Weather Forecast

## Quick Setup Guide

### Step 1: Get Free API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Click "Sign Up" (top right)
3. Create a free account
4. Verify your email
5. Go to "API keys" section
6. Copy your API key

### Step 2: Add API Key to Config

1. Open `config.js` file
2. Find this line:
   ```javascript
   API_KEY: 'YOUR_OPENWEATHER_API_KEY',
   ```
3. Replace with your actual API key:
   ```javascript
   API_KEY: 'abc123your-actual-api-key-here',
   ```
4. Save the file

### Step 3: Test Weather Forecast

1. Run `npm start`
2. Open the app
3. Go to Settings → Location
4. Tap "📍 Location" to get your current location
5. Go to Forecast tab
6. You should see real-time weather data!

## How It Works

- **Without API Key**: Shows demo weather data
- **With API Key**: Shows real-time weather from OpenWeatherMap
- **After Location Update**: Automatically fetches weather for your exact location

## Features

✅ Real-time current weather
✅ Hourly forecast (next 24 hours)
✅ 5-day daily forecast
✅ Location-based weather
✅ Smart farming advice based on weather

## Troubleshooting

**Problem**: Still showing demo data after adding API key
- **Solution**: Make sure API key is activated (takes 10-15 minutes after signup)
- Check that you saved the config.js file
- Restart the app

**Problem**: "Invalid API key" error
- **Solution**: Double-check you copied the entire API key
- Make sure there are no extra spaces
- Verify your API key is active on OpenWeatherMap dashboard

## Free Tier Limits

OpenWeatherMap free tier includes:
- 1,000 API calls per day
- 60 calls per minute
- Current weather data
- 5-day forecast
- Perfect for personal farm use!
