const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let sensorData = [];
let currentData = { temperature: 0, humidity: 0, soilMoisture: 0 };

// Receive sensor data from ESP32
app.post('/api/sensor-data', (req, res) => {
  const { temperature, humidity, soilMoisture } = req.body;
  
  currentData = {
    temperature: parseFloat(temperature),
    humidity: parseFloat(humidity),
    soilMoisture: parseInt(soilMoisture),
    timestamp: new Date().toISOString()
  };
  
  sensorData.push(currentData);
  if (sensorData.length > 50) sensorData.shift(); // Keep last 50 readings
  
  console.log('Received:', currentData);
  res.json({ status: 'success' });
});

// Get current data for dashboard
app.get('/api/current-data', (req, res) => {
  res.json(currentData);
});

// Get historical data
app.get('/api/history', (req, res) => {
  res.json(sensorData);
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Farm Dashboard running on http://localhost:3000');
});