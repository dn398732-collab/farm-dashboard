#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <DHT.h>

// Access Point credentials
const char* ap_ssid = "ESP32-Farm-Dashboard";
const char* ap_password = "farm123456";

// WiFi credentials for connecting to existing network
const char* wifi_ssid = "Krishimitra";
const char* wifi_password = "SIH25168";
const char* serverURL = "http://10.56.190.55:3000/api/sensor-data";

// Create web server on port 80
WebServer server(80);

// Sensor pins
#define DHT_PIN 32
#define SOIL_PIN 35
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);

// Global sensor variables
float temperature = 0;
float humidity = 0;
int soilMoisture = 0;

// Handle root page request
void handleRoot() {
  String html = "<!DOCTYPE html><html><head>";
  html += "<title>Farm Dashboard</title>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<style>body{font-family:Arial;margin:20px;background:#f0f8ff;}";
  html += ".card{background:white;padding:20px;margin:10px 0;border-radius:10px;box-shadow:0 2px 5px rgba(0,0,0,0.1);}";
  html += ".temp{color:#ff6b35;} .humid{color:#4a90e2;} .soil{color:#8bc34a;}";
  html += "h1{color:#2c3e50;text-align:center;} .value{font-size:2em;font-weight:bold;}";
  html += "</style></head><body>";
  html += "<h1>🌾 Farm Dashboard</h1>";
  html += "<div class='card'><h2 class='temp'>🌡️ Temperature</h2><div class='value temp'>" + String(temperature) + "°C</div></div>";
  html += "<div class='card'><h2 class='humid'>💧 Humidity</h2><div class='value humid'>" + String(humidity) + "%</div></div>";
  html += "<div class='card'><h2 class='soil'>🌱 Soil Moisture</h2><div class='value soil'>" + String(soilMoisture) + "%</div></div>";
  html += "<script>setTimeout(function(){location.reload();}, 5000);</script>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

// Handle API endpoint for sensor data
void handleAPI() {
  String json = "{\"temperature\":" + String(temperature) + ",\"humidity\":" + String(humidity) + ",\"soilMoisture\":" + String(soilMoisture) + "}";
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println("Starting ESP32 Farm Dashboard...");
  dht.begin();

  // Set up both AP and Station mode
  WiFi.mode(WIFI_AP_STA);
  
  // Start Access Point
  WiFi.softAP(ap_ssid, ap_password);
  Serial.println("Access Point started!");
  Serial.print("AP SSID: ");
  Serial.println(ap_ssid);
  Serial.print("AP IP: ");
  Serial.println(WiFi.softAPIP());
  
  // Connect to existing WiFi
  WiFi.begin(wifi_ssid, wifi_password);
  Serial.print("Connecting to WiFi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi connected!");
    Serial.print("Station IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("WiFi connection failed - AP mode only");
  }
  
  // Set up web server routes
  server.on("/", handleRoot);
  server.on("/api/sensor-data", handleAPI);
  server.begin();
  Serial.println("Web server started!");
  Serial.println("Phone: Connect to ESP32-Farm-Dashboard -> http://192.168.4.1");
  Serial.println("Dashboard: http://localhost:3000");
}

void loop() {
  // Handle web server requests
  server.handleClient();
  
  // Read sensors every 10 seconds
  static unsigned long lastReading = 0;
  if (millis() - lastReading > 10000) {
    lastReading = millis();
    
    // Read DHT sensor
    temperature = dht.readTemperature();
    humidity = dht.readHumidity();
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("DHT read failed — using previous values");
    }

    // Read soil sensor
    const int SAMPLES = 5;
    long total = 0;
    for (int i = 0; i < SAMPLES; ++i) {
      total += analogRead(SOIL_PIN);
      delay(20);
    }
    int soilValue = total / SAMPLES;
    soilMoisture = map(soilValue, 0, 4095, 100, 0);
    
    // Display readings
    Serial.println("=== Sensor Readings ===");
    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.println("°C");
    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.println("%");
    Serial.print("Soil Moisture: ");
    Serial.print(soilMoisture);
    Serial.println("%");
    
    // Send to Node.js dashboard if WiFi connected
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverURL);
      http.addHeader("Content-Type", "application/json");
      
      String jsonData = "{\"temperature\":" + String(temperature) + 
                       ",\"humidity\":" + String(humidity) + 
                       ",\"soilMoisture\":" + String(soilMoisture) + "}";
      
      int httpCode = http.POST(jsonData);
      if (httpCode > 0) {
        Serial.print("Dashboard updated: ");
        Serial.println(httpCode == 200 ? "✓" : String(httpCode));
      } else {
        Serial.print("Dashboard failed: ");
        Serial.println(httpCode);
      }
      http.end();
    }
    
    Serial.print("AP clients: ");
    Serial.println(WiFi.softAPgetStationNum());
    Serial.println();
  }
}