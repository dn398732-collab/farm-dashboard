# ⚡ Quick Start: Real-Time Weather

## 🎯 Goal
Get real-time weather forecast for your farm location in 5 minutes!

## 📋 Prerequisites
- Farm Dashboard app installed
- Internet connection
- Smartphone with GPS

## 🚀 Step-by-Step Guide

### Step 1: Get API Key (2 minutes)
```
1. Visit: https://openweathermap.org/api
2. Click "Sign Up" button
3. Fill in: Email, Username, Password
4. Check your email and verify
5. Login → Go to "API keys" tab
6. Copy the API key shown
```

### Step 2: Add API Key (1 minute)
```
1. Open: config.js file
2. Find line: API_KEY: 'YOUR_OPENWEATHER_API_KEY',
3. Replace with: API_KEY: 'paste-your-key-here',
4. Save file
5. Run: npm install (if first time)
6. Run: npm start
```

### Step 3: Enable Location (1 minute)
```
1. Open app on your phone
2. Tap: ⚙️ Settings (bottom tab)
3. Scroll to: 🏡 Farm Information
4. Tap: 📍 Location
5. When prompted: Allow location access
6. Wait: App detects your location
7. See: "Location updated to: [Your City]"
```

### Step 4: View Weather (30 seconds)
```
1. Tap: 🌤️ Forecast (bottom tab)
2. See: Real-time weather for your location!
3. Toggle: Hourly ↔️ Daily forecast
4. Read: Smart farming advice
```

## ✅ Success Checklist

- [ ] OpenWeatherMap account created
- [ ] API key copied
- [ ] config.js updated with API key
- [ ] App restarted
- [ ] Location permission granted
- [ ] Location detected successfully
- [ ] Weather forecast showing real data
- [ ] Farming advice displayed

## 🔍 How to Verify It's Working

### Demo Mode (No API Key):
- Weather shows generic data
- Location shows "Delhi, India" or "Farm Location"
- Data doesn't change based on your location

### Real-Time Mode (With API Key):
- Weather shows actual current conditions
- Location shows your city/region
- Temperature matches local weather
- Forecast updates when you change location

## 🆘 Troubleshooting

**Problem**: Still showing demo data
```
Solution:
1. Check API key is correct in config.js
2. Wait 10-15 minutes (API key activation time)
3. Restart the app completely
4. Check internet connection
```

**Problem**: Location not updating
```
Solution:
1. Check location permission is granted
2. Enable GPS on your device
3. Try outdoors for better GPS signal
4. Restart the app
```

**Problem**: "Invalid API key" error
```
Solution:
1. Verify API key has no extra spaces
2. Check you copied the entire key
3. Confirm key is active on OpenWeatherMap
4. Try generating a new API key
```

## 💡 Pro Tips

1. **API Key Activation**: Takes 10-15 minutes after signup
2. **GPS Accuracy**: Works best outdoors
3. **Battery Usage**: Location only used when you tap the button
4. **Free Tier**: 1,000 calls/day is plenty for farm use
5. **Update Location**: Tap location button anytime to refresh

## 📱 User Experience

**Before Setup:**
- Generic weather data
- Fixed location (Delhi)
- Works offline

**After Setup:**
- Real weather for your farm
- Auto-updates with location
- Accurate forecasts
- Smart farming advice

## 🎉 You're Done!

Your Farm Dashboard now shows:
- ✅ Real-time weather for your exact location
- ✅ Hourly forecast (next 24 hours)
- ✅ 5-day daily forecast
- ✅ Smart farming recommendations
- ✅ Location-based insights

Happy Farming! 🌾🚜
