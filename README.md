# 🌾 Farm Dashboard

Beautiful, farmer-friendly dashboard for DHT11 and Soil Moisture sensors connected to ESP-WROOM-32.

## Hardware Setup
- **DHT11**: Connect to GPIO 4
- **Soil Moisture Sensor**: Connect to GPIO 34 (analog pin)
- **ESP32**: Connect to WiFi

## Quick Start

1. **Install Node.js dependencies:**
   ```
   npm install
   ```

2. **Update ESP32 code:**
   - Open `esp32_sensors.ino` in Arduino IDE
   - Change WiFi credentials
   - Change server IP to your computer's IP
   - Upload to ESP32

3. **Start dashboard:**
   ```
   npm start
   ```

4. **Setup Weather Forecast (Optional):**
   - Get free API key from [OpenWeatherMap](https://openweathermap.org/api)
   - Update `config.js` with your API key and farm coordinates
   - See `WEATHER_SETUP.md` for detailed instructions

5. **Open dashboard:**
   - Go to http://localhost:3000
   - View real-time sensor data and weather forecast

## Features
- 📊 Real-time sensor monitoring
- 🎨 Beautiful, responsive design
- 🚨 Smart farming alerts
- 📈 Historical data charts
- 🌤️ **Weather forecast with OpenWeatherMap API**
- ⏰ **Hourly and daily weather predictions**
- 🌾 **Smart farming advice based on weather**
- 📱 Mobile-friendly interface

## Sensor Readings
- **Temperature**: Optimal 20-30°C
- **Humidity**: Optimal 40-70%
- **Soil Moisture**: Optimal 40-80%