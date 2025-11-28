// Network configuration for Farm Dashboard
export const NETWORK_CONFIG = {
  // ESP32 endpoints to try in order
  ENDPOINTS: [
    'http://192.168.4.1/api/sensor-data',      // ESP32 AP mode
    'http://192.168.1.100/api/sensor-data',    // ESP32 on local network
    'http://localhost:3000/api/current-data',   // Local development server
  ],
  
  // Connection settings
  TIMEOUT: 2000,           // 2 seconds timeout
  RETRY_ATTEMPTS: 3,       // Number of retry attempts
  RETRY_DELAY: 1000,       // Delay between retries (ms)
  
  // Auto-refresh settings
  DEFAULT_REFRESH_INTERVAL: 10, // seconds
  MIN_REFRESH_INTERVAL: 5,      // minimum seconds
  MAX_REFRESH_INTERVAL: 60,     // maximum seconds
};