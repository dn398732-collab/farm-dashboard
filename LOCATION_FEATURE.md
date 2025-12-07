# 📍 Location-Based Weather Feature

## Overview
The Farm Dashboard now automatically detects your current location and shows weather forecasts specific to your farm's location.

## How to Use

1. **Open Settings Tab**
   - Tap on the ⚙️ Settings icon at the bottom

2. **Enable Location**
   - Scroll to "🏡 Farm Information" section
   - Tap on "📍 Location"
   - The app will ask for location permission if not already granted
   - Grant location permission when prompted

3. **Automatic Location Detection**
   - The app will automatically detect your current GPS coordinates
   - It will reverse geocode to show your city/region name
   - Location will be saved in settings

4. **View Weather Forecast**
   - Go to the 🌤️ Forecast tab
   - Weather data will now show for your current location
   - Both hourly and daily forecasts are location-specific

## Features

✅ **Automatic Location Detection** - Uses GPS to find your exact location
✅ **Permission Handling** - Prompts user to enable location if disabled
✅ **Reverse Geocoding** - Converts coordinates to readable location name
✅ **Weather Updates** - Automatically fetches weather for your location
✅ **Persistent Storage** - Saves your location for future use

## Installation

Run the following command to install the required package:

```bash
npm install
```

This will install `expo-location` package needed for location services.

## Permissions

The app requires the following permission:
- **Location (Foreground)** - To detect your current farm location

## Technical Details

- Uses `expo-location` for GPS access
- Requests `FOREGROUND` location permission
- Uses `Accuracy.Balanced` for optimal battery/accuracy trade-off
- Reverse geocodes coordinates to city/region names
- Updates weather API calls with new coordinates
