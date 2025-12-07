// Weather API Configuration
export const WEATHER_CONFIG = {
  // i get free API key from: https://openweathermap.org/api
  API_KEY: '669a5c628bacb08e351b9e99a4bcc4f9',
  
  // Default farm location (Delhi, India)
  // Replace with your farm's coordinates
  DEFAULT_LOCATION: {
    lat: 28.6139,
    lon: 77.2090,
    name: 'Delhi, India'
  },
  
  // API endpoints
  ENDPOINTS: {
    CURRENT: 'https://api.openweathermap.org/data/2.5/weather',
    FORECAST: 'https://api.openweathermap.org/data/2.5/forecast',
    ONE_CALL: 'https://api.openweathermap.org/data/2.5/onecall'
  },
  
  // Weather icon mapping
  WEATHER_ICONS: {
    '01d': '☀️', // clear sky day
    '01n': '🌙', // clear sky night
    '02d': '⛅', // few clouds day
    '02n': '☁️', // few clouds night
    '03d': '☁️', // scattered clouds
    '03n': '☁️', // scattered clouds
    '04d': '☁️', // broken clouds
    '04n': '☁️', // broken clouds
    '09d': '🌧️', // shower rain
    '09n': '🌧️', // shower rain
    '10d': '🌦️', // rain day
    '10n': '🌧️', // rain night
    '11d': '⛈️', // thunderstorm
    '11n': '⛈️', // thunderstorm
    '13d': '❄️', // snow
    '13n': '❄️', // snow
    '50d': '🌫️', // mist
    '50n': '🌫️'  // mist
  }
};

// Farming advice based on weather conditions
export const FARMING_ADVICE = {
  temperature: {
    high: { threshold: 30, advice: 'High temperature - provide shade for crops and increase irrigation' },
    low: { threshold: 15, advice: 'Cold weather - protect sensitive plants with covers' },
    optimal: { min: 20, max: 30, advice: 'Temperature is optimal for most crops' }
  },
  
  humidity: {
    high: { threshold: 80, advice: 'High humidity - ensure good ventilation to prevent fungal diseases' },
    low: { threshold: 40, advice: 'Low humidity - increase irrigation and consider mulching' },
    optimal: { min: 50, max: 70, advice: 'Humidity levels are ideal for plant growth' }
  },
  
  wind: {
    high: { threshold: 15, advice: 'Strong winds - secure plant supports and check for damage' },
    moderate: { threshold: 10, advice: 'Moderate winds - good for air circulation' }
  },
  
  rain: {
    heavy: { threshold: 10, advice: 'Heavy rain expected - check drainage and protect crops' },
    light: { threshold: 2, advice: 'Light rain expected - reduce irrigation accordingly' },
    none: { threshold: 0, advice: 'No rain expected - maintain regular irrigation schedule' }
  }
};