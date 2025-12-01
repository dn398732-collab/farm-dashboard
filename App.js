import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, Dimensions, TextInput, Alert, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LineChart } from 'react-native-chart-kit';
import { WEATHER_CONFIG, FARMING_ADVICE } from './config';
import { NETWORK_CONFIG } from './network-config';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function App() {
  const [sensorData, setSensorData] = useState({ temperature: 0, humidity: 0, soilMoisture: 0 });
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [weatherData, setWeatherData] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [dailyForecast, setDailyForecast] = useState([]);
  const [forecastType, setForecastType] = useState('daily'); // 'hourly' or 'daily'
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connected', 'disconnected', 'connecting'
  const [settings, setSettings] = useState({
    notifications: true,
    autoRefresh: true,
    refreshInterval: 10,
    temperatureUnit: 'C',
    farmName: 'My Farm',
    location: 'Farm Location',
    selectedCrop: 'Tomato',
    language: 'English'
  });
  const [farmerInputs, setFarmerInputs] = useState([]);
  const [newInputText, setNewInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  
  const crops = [
    { name: 'Tomato', icon: '🍅', tempRange: '20-30°C', humidity: '60-80%' },
    { name: 'Wheat', icon: '🌾', tempRange: '15-25°C', humidity: '50-70%' },
    { name: 'Rice', icon: '🌾', tempRange: '25-35°C', humidity: '70-90%' },
    { name: 'Corn', icon: '🌽', tempRange: '18-28°C', humidity: '55-75%' },
    { name: 'Lettuce', icon: '🥬', tempRange: '15-20°C', humidity: '80-95%' },
    { name: 'Potato', icon: '🥔', tempRange: '15-20°C', humidity: '60-80%' },
    { name: 'Carrot', icon: '🥕', tempRange: '16-24°C', humidity: '65-85%' },
    { name: 'Cucumber', icon: '🥒', tempRange: '20-30°C', humidity: '70-90%' }
  ];
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇮🇳', script: 'A' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳', script: 'अ' },
    { code: 'bn', name: 'বাংলা', flag: '🇮🇳', script: 'অ' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳', script: 'అ' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳', script: 'अ' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳', script: 'அ' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳', script: 'અ' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳', script: 'ಅ' }
  ];

  const fetchData = async () => {
    const { ENDPOINTS, TIMEOUT, RETRY_ATTEMPTS, RETRY_DELAY } = NETWORK_CONFIG;
    setConnectionStatus('connecting');

    for (const endpoint of ENDPOINTS) {
      for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
          
          const response = await fetch(endpoint, {
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
            },
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            setSensorData(data);
            setLastUpdate(new Date());
            setConnectionStatus('connected');
            
            // Update history
            setHistory(prev => {
              const newHistory = [...prev, { ...data, time: new Date().toLocaleTimeString(), timestamp: Date.now() }];
              return newHistory.slice(-50);
            });
            return; // Success, exit function
          }
        } catch (error) {
          console.log(`Attempt ${attempt}/${RETRY_ATTEMPTS} failed for ${endpoint}:`, error.message);
          
          if (attempt < RETRY_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          }
        }
      }
    }
    
    // All endpoints failed, use demo data
    console.log('All connections failed, using demo data');
    setConnectionStatus('disconnected');
    const demoData = {
      temperature: 25 + Math.random() * 5,
      humidity: 60 + Math.random() * 10,
      soilMoisture: 70 + Math.random() * 10
    };
    setSensorData(demoData);
    setLastUpdate(new Date());
    
    setHistory(prev => {
      const newHistory = [...prev, { ...demoData, time: new Date().toLocaleTimeString(), timestamp: Date.now() }];
      return newHistory.slice(-50);
    });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (settings.autoRefresh) {
        fetchData();
      }
    }, settings.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [settings.autoRefresh, settings.refreshInterval]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getStatus = (value, type) => {
    if (type === 'temperature') {
      if (value >= 20 && value <= 30) return { text: 'Optimal', color: '#28a745' };
      if (value >= 15 && value <= 35) return { text: 'Good', color: '#ffc107' };
      return { text: 'Critical', color: '#dc3545' };
    }
    if (type === 'humidity') {
      if (value >= 40 && value <= 70) return { text: 'Optimal', color: '#28a745' };
      if (value >= 30 && value <= 80) return { text: 'Good', color: '#ffc107' };
      return { text: 'Critical', color: '#dc3545' };
    }
    if (type === 'soil') {
      if (value >= 40 && value <= 80) return { text: 'Optimal', color: '#28a745' };
      if (value >= 20 && value <= 90) return { text: 'Good', color: '#ffc107' };
      return { text: 'Critical', color: '#dc3545' };
    }
  };

  const SensorCard = ({ title, value, unit, emoji, type }) => {
    const status = getStatus(value, type);
    return (
      <View style={styles.card}>
        <Text style={styles.cardEmoji}>{emoji}</Text>
        <Text style={styles.cardValue}>{Math.round(value)}{unit}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
          <Text style={styles.statusText}>{status.text}</Text>
        </View>
      </View>
    );
  };

  const chartData = {
    labels: history.slice(-6).map(h => h.time?.split(':').slice(0,2).join(':') || ''),
    datasets: [
      {
        data: history.slice(-6).map(h => h.temperature || 0),
        color: () => '#ff6b6b',
        strokeWidth: 2
      },
      {
        data: history.slice(-6).map(h => h.humidity || 0),
        color: () => '#4ecdc4',
        strokeWidth: 2
      },
      {
        data: history.slice(-6).map(h => h.soilMoisture || 0),
        color: () => '#45b7d1',
        strokeWidth: 2
      }
    ]
  };

  const TabButton = ({ title, isActive, onPress, icon }) => (
    <TouchableOpacity 
      style={[styles.tabButton, isActive && styles.activeTab]} 
      onPress={onPress}
    >
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[styles.tabText, isActive && styles.activeTabText]}>{title}</Text>
    </TouchableOpacity>
  );

  const DashboardView = () => (
    <ScrollView 
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.cardsContainer}>
        <SensorCard 
          title="Temperature" 
          value={sensorData.temperature} 
          unit="°C" 
          emoji="🌡️" 
          type="temperature"
        />
        <SensorCard 
          title="Humidity" 
          value={sensorData.humidity} 
          unit="%" 
          emoji="💧" 
          type="humidity"
        />
        <SensorCard 
          title="Soil Moisture" 
          value={sensorData.soilMoisture} 
          unit="%" 
          emoji="🌱" 
          type="soil"
        />
      </View>

      {history.length > 1 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>📊 Recent Trends</Text>
          <LineChart
            data={chartData}
            width={width - 60}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: '4', strokeWidth: '2' }
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      <View style={styles.alertsContainer}>
        <Text style={styles.alertsTitle}>🚨 Farm Alerts</Text>
        {sensorData.temperature > 35 && (
          <View style={[styles.alert, styles.alertDanger]}>
            <Text style={styles.alertText}>🔥 High temperature! Provide cooling.</Text>
          </View>
        )}
        {sensorData.humidity < 30 && (
          <View style={[styles.alert, styles.alertWarning]}>
            <Text style={styles.alertText}>💨 Low humidity! Consider irrigation.</Text>
          </View>
        )}
        {sensorData.soilMoisture < 20 && (
          <View style={[styles.alert, styles.alertDanger]}>
            <Text style={styles.alertText}>🏜️ Soil too dry! Water immediately.</Text>
          </View>
        )}
        {sensorData.temperature >= 20 && sensorData.temperature <= 30 && 
         sensorData.humidity >= 40 && sensorData.humidity <= 70 && 
         sensorData.soilMoisture >= 40 && (
          <View style={[styles.alert, styles.alertSuccess]}>
            <Text style={styles.alertText}>✅ All conditions optimal!</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const HistoryView = () => {
    const tempData = {
      labels: history.slice(-8).map(h => h.time?.split(':').slice(0,2).join(':') || ''),
      datasets: [{ data: history.slice(-8).map(h => h.temperature || 0), color: () => '#ff6b6b' }]
    };
    
    const humidityData = {
      labels: history.slice(-8).map(h => h.time?.split(':').slice(0,2).join(':') || ''),
      datasets: [{ data: history.slice(-8).map(h => h.humidity || 0), color: () => '#4ecdc4' }]
    };
    
    const soilData = {
      labels: history.slice(-8).map(h => h.time?.split(':').slice(0,2).join(':') || ''),
      datasets: [{ data: history.slice(-8).map(h => h.soilMoisture || 0), color: () => '#45b7d1' }]
    };

    return (
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.historyStats}>
          <Text style={styles.historyTitle}>📈 Historical Analysis</Text>
          <Text style={styles.historySubtitle}>Last {history.length} readings</Text>
        </View>

        {history.length > 1 && (
          <>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>🌡️ Temperature History</Text>
              <LineChart
                data={tempData}
                width={width - 60}
                height={200}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  propsForDots: { r: '5', strokeWidth: '2' }
                }}
                bezier
                style={styles.chart}
              />
              <View style={styles.statsRow}>
                <Text style={styles.statText}>Avg: {(history.reduce((a,b) => a + b.temperature, 0) / history.length).toFixed(1)}°C</Text>
                <Text style={styles.statText}>Max: {Math.max(...history.map(h => h.temperature)).toFixed(1)}°C</Text>
                <Text style={styles.statText}>Min: {Math.min(...history.map(h => h.temperature)).toFixed(1)}°C</Text>
              </View>
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>💧 Humidity History</Text>
              <LineChart
                data={humidityData}
                width={width - 60}
                height={200}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  propsForDots: { r: '5', strokeWidth: '2' }
                }}
                bezier
                style={styles.chart}
              />
              <View style={styles.statsRow}>
                <Text style={styles.statText}>Avg: {(history.reduce((a,b) => a + b.humidity, 0) / history.length).toFixed(1)}%</Text>
                <Text style={styles.statText}>Max: {Math.max(...history.map(h => h.humidity)).toFixed(1)}%</Text>
                <Text style={styles.statText}>Min: {Math.min(...history.map(h => h.humidity)).toFixed(1)}%</Text>
              </View>
            </View>

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>🌱 Soil Moisture History</Text>
              <LineChart
                data={soilData}
                width={width - 60}
                height={200}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(69, 183, 209, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  propsForDots: { r: '5', strokeWidth: '2' }
                }}
                bezier
                style={styles.chart}
              />
              <View style={styles.statsRow}>
                <Text style={styles.statText}>Avg: {(history.reduce((a,b) => a + b.soilMoisture, 0) / history.length).toFixed(1)}%</Text>
                <Text style={styles.statText}>Max: {Math.max(...history.map(h => h.soilMoisture)).toFixed(1)}%</Text>
                <Text style={styles.statText}>Min: {Math.min(...history.map(h => h.soilMoisture)).toFixed(1)}%</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    );
  };

  const getAIInsights = () => {
    if (history.length < 3) return [];
    
    const insights = [];
    const recent = history.slice(-5);
    const tempTrend = recent[recent.length-1].temperature - recent[0].temperature;
    const humidTrend = recent[recent.length-1].humidity - recent[0].humidity;
    const soilTrend = recent[recent.length-1].soilMoisture - recent[0].soilMoisture;
    
    if (tempTrend > 3) {
      insights.push({
        type: 'warning',
        icon: '🌡️',
        title: 'Rising Temperature Trend',
        message: 'Temperature has increased by ' + tempTrend.toFixed(1) + '°C recently. Consider shade or cooling.',
        priority: 'high'
      });
    }
    
    if (humidTrend < -10) {
      insights.push({
        type: 'warning',
        icon: '💨',
        title: 'Humidity Dropping',
        message: 'Humidity decreased by ' + Math.abs(humidTrend).toFixed(1) + '%. Increase irrigation.',
        priority: 'high'
      });
    }
    
    if (soilTrend < -15) {
      insights.push({
        type: 'danger',
        icon: '🏜️',
        title: 'Rapid Soil Drying',
        message: 'Soil moisture dropped ' + Math.abs(soilTrend).toFixed(1) + '%. Immediate watering needed.',
        priority: 'critical'
      });
    }
    
    const currentTemp = sensorData.temperature;
    const currentHumid = sensorData.humidity;
    const currentSoil = sensorData.soilMoisture;
    
    if (currentTemp >= 22 && currentTemp <= 28 && currentHumid >= 50 && currentHumid <= 65 && currentSoil >= 60) {
      insights.push({
        type: 'success',
        icon: '🌟',
        title: 'Perfect Growing Conditions',
        message: 'All parameters are in optimal range. Excellent time for plant growth!',
        priority: 'info'
      });
    }
    
    return insights;
  };

  const AIInsightsView = () => {
    const insights = getAIInsights();
    const avgTemp = history.length > 0 ? (history.reduce((a,b) => a + b.temperature, 0) / history.length) : 0;
    const avgHumid = history.length > 0 ? (history.reduce((a,b) => a + b.humidity, 0) / history.length) : 0;
    const avgSoil = history.length > 0 ? (history.reduce((a,b) => a + b.soilMoisture, 0) / history.length) : 0;
    
    const getHealthScore = () => {
      let score = 100;
      if (sensorData.temperature < 15 || sensorData.temperature > 35) score -= 20;
      if (sensorData.humidity < 30 || sensorData.humidity > 80) score -= 20;
      if (sensorData.soilMoisture < 20) score -= 30;
      return Math.max(0, score);
    };
    
    const healthScore = getHealthScore();
    const getScoreColor = (score) => {
      if (score >= 80) return '#28a745';
      if (score >= 60) return '#ffc107';
      return '#dc3545';
    };

    return (
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.aiHeader}>
          <Text style={styles.aiTitle}>🤖 AI Farm Assistant</Text>
          <Text style={styles.aiSubtitle}>Intelligent crop analysis & recommendations</Text>
        </View>

        <View style={styles.healthScoreCard}>
          <Text style={styles.healthTitle}>🌱 Farm Health Score</Text>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreText, { color: getScoreColor(healthScore) }]}>
              {healthScore}
            </Text>
            <Text style={styles.scoreLabel}>/ 100</Text>
          </View>
          <Text style={styles.scoreDescription}>
            {healthScore >= 80 ? 'Excellent conditions!' : 
             healthScore >= 60 ? 'Good, minor improvements needed' : 
             'Attention required - multiple issues detected'}
          </Text>
        </View>

        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>💡 Smart Insights</Text>
          {insights.length > 0 ? insights.map((insight, index) => (
            <View key={index} style={[
              styles.insightCard,
              insight.type === 'success' && styles.insightSuccess,
              insight.type === 'warning' && styles.insightWarning,
              insight.type === 'danger' && styles.insightDanger
            ]}>
              <View style={styles.insightHeader}>
                <Text style={styles.insightIcon}>{insight.icon}</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightMessage}>{insight.message}</Text>
                </View>
              </View>
            </View>
          )) : (
            <View style={styles.noInsights}>
              <Text style={styles.noInsightsIcon}>📊</Text>
              <Text style={styles.noInsightsText}>Collecting data for AI analysis...</Text>
              <Text style={styles.noInsightsSubtext}>Insights will appear after a few readings</Text>
            </View>
          )}
        </View>

        <View style={styles.recommendationsCard}>
          <Text style={styles.recTitle}>🎯 AI Recommendations</Text>
          <View style={styles.recItem}>
            <Text style={styles.recIcon}>🌡️</Text>
            <View style={styles.recContent}>
              <Text style={styles.recLabel}>Temperature</Text>
              <Text style={styles.recText}>
                {avgTemp < 20 ? 'Consider greenhouse heating or row covers' :
                 avgTemp > 30 ? 'Install shade cloth or misting system' :
                 'Temperature range is optimal for most crops'}
              </Text>
            </View>
          </View>
          
          <View style={styles.recItem}>
            <Text style={styles.recIcon}>💧</Text>
            <View style={styles.recContent}>
              <Text style={styles.recLabel}>Humidity</Text>
              <Text style={styles.recText}>
                {avgHumid < 40 ? 'Increase irrigation frequency or add mulch' :
                 avgHumid > 70 ? 'Improve ventilation to prevent fungal issues' :
                 'Humidity levels support healthy plant growth'}
              </Text>
            </View>
          </View>
          
          <View style={styles.recItem}>
            <Text style={styles.recIcon}>🌱</Text>
            <View style={styles.recContent}>
              <Text style={styles.recLabel}>Soil Moisture</Text>
              <Text style={styles.recText}>
                {avgSoil < 30 ? 'Install drip irrigation for consistent watering' :
                 avgSoil > 80 ? 'Check drainage to prevent root rot' :
                 'Soil moisture is well-maintained'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const fetchWeatherData = async () => {
    try {
      const { API_KEY, DEFAULT_LOCATION, ENDPOINTS, WEATHER_ICONS } = WEATHER_CONFIG;
      const { lat, lon } = DEFAULT_LOCATION;
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Fetch current weather
      const currentResponse = await fetch(
        `${ENDPOINTS.CURRENT}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
        { signal: controller.signal }
      );
      const currentData = await currentResponse.json();
      
      // Fetch 5-day forecast
      const forecastResponse = await fetch(
        `${ENDPOINTS.FORECAST}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`,
        { signal: controller.signal }
      );
      const forecastData = await forecastResponse.json();
      
      clearTimeout(timeoutId);
      
      const current = {
        temp: currentData.main.temp,
        humidity: currentData.main.humidity,
        windSpeed: currentData.wind.speed * 3.6, // Convert m/s to km/h
        condition: currentData.weather[0].description,
        icon: WEATHER_ICONS[currentData.weather[0].icon] || '☀️',
        pressure: currentData.main.pressure,
        visibility: currentData.visibility / 1000, // Convert to km
        uvIndex: 5 // OpenWeather UV requires separate API call
      };
      
      // Process hourly forecast (next 24 hours)
      const hourly = forecastData.list.slice(0, 8).map(item => ({
        time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric' }),
        temp: Math.round(item.main.temp),
        condition: item.weather[0].description,
        icon: WEATHER_ICONS[item.weather[0].icon] || '☀️',
        humidity: item.main.humidity,
        windSpeed: Math.round(item.wind.speed * 3.6),
        rain: item.rain ? item.rain['3h'] || 0 : 0
      }));
      
      // Process daily forecast (group by day)
      const dailyMap = new Map();
      forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();
        
        if (!dailyMap.has(dayKey)) {
          dailyMap.set(dayKey, {
            date: dayKey,
            temps: [],
            conditions: [],
            icons: [],
            humidity: [],
            rain: 0
          });
        }
        
        const day = dailyMap.get(dayKey);
        day.temps.push(item.main.temp);
        day.conditions.push(item.weather[0].description);
        day.icons.push(WEATHER_ICONS[item.weather[0].icon] || '☀️');
        day.humidity.push(item.main.humidity);
        if (item.rain) day.rain += item.rain['3h'] || 0;
      });
      
      const daily = Array.from(dailyMap.values()).slice(0, 5).map((day, index) => {
        const date = new Date(day.date);
        const dayName = index === 0 ? 'Today' : 
                       index === 1 ? 'Tomorrow' : 
                       date.toLocaleDateString('en-US', { weekday: 'short' });
        
        return {
          day: dayName,
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          high: Math.round(Math.max(...day.temps)),
          low: Math.round(Math.min(...day.temps)),
          condition: day.conditions[0],
          icon: day.icons[0],
          humidity: Math.round(day.humidity.reduce((a, b) => a + b) / day.humidity.length),
          rain: Math.round(day.rain)
        };
      });
      
      setWeatherData({ current });
      setHourlyForecast(hourly);
      setDailyForecast(daily);
      
    } catch (error) {
      console.log('Weather API failed, using demo data');
      // Fallback demo data
      const demoWeather = {
        current: {
          temp: 26 + Math.random() * 4,
          humidity: 65 + Math.random() * 10,
          windSpeed: 8 + Math.random() * 5,
          condition: 'partly cloudy',
          icon: '⛅',
          pressure: 1013,
          visibility: 10,
          uvIndex: 5
        }
      };
      
      const demoHourly = Array.from({ length: 8 }, (_, i) => ({
        time: new Date(Date.now() + i * 3 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: 'numeric' }),
        temp: Math.round(25 + Math.random() * 6),
        condition: ['sunny', 'partly cloudy', 'cloudy'][Math.floor(Math.random() * 3)],
        icon: ['☀️', '⛅', '☁️'][Math.floor(Math.random() * 3)],
        humidity: Math.round(60 + Math.random() * 20),
        windSpeed: Math.round(5 + Math.random() * 10),
        rain: Math.random() > 0.7 ? Math.round(Math.random() * 5) : 0
      }));
      
      const today = new Date();
      const demoDaily = Array.from({ length: 5 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayName = i === 0 ? 'Today' : 
                       i === 1 ? 'Tomorrow' : 
                       date.toLocaleDateString('en-US', { weekday: 'short' });
        
        return {
          day: dayName,
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          high: Math.round(25 + Math.random() * 8),
          low: Math.round(15 + Math.random() * 5),
          condition: ['sunny', 'partly cloudy', 'cloudy', 'rainy'][Math.floor(Math.random() * 4)],
          icon: ['☀️', '⛅', '☁️', '🌧️'][Math.floor(Math.random() * 4)],
          humidity: Math.round(60 + Math.random() * 20),
          rain: Math.random() > 0.6 ? Math.round(Math.random() * 10) : 0
        };
      });
      
      setWeatherData(demoWeather);
      setHourlyForecast(demoHourly);
      setDailyForecast(demoDaily);
    }
  };

  const ForecastView = () => {
    useEffect(() => {
      if (!weatherData) {
        fetchWeatherData();
      }
    }, [weatherData]);

    if (!weatherData) {
      return (
        <ScrollView>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingIcon}>🌤️</Text>
            <Text style={styles.loadingText}>Loading weather data...</Text>
          </View>
        </ScrollView>
      );
    }

    const getFarmingAdvice = (weather, hourly, daily) => {
      const advice = [];
      const { temperature, humidity, wind, rain } = FARMING_ADVICE;
      
      // Temperature advice
      if (weather.current.temp > temperature.high.threshold) {
        advice.push({ icon: '🌡️', text: temperature.high.advice });
      } else if (weather.current.temp < temperature.low.threshold) {
        advice.push({ icon: '🥶', text: temperature.low.advice });
      }
      
      // Humidity advice
      if (weather.current.humidity > humidity.high.threshold) {
        advice.push({ icon: '💨', text: humidity.high.advice });
      } else if (weather.current.humidity < humidity.low.threshold) {
        advice.push({ icon: '💧', text: humidity.low.advice });
      }
      
      // Wind advice
      if (weather.current.windSpeed > wind.high.threshold) {
        advice.push({ icon: '💨', text: wind.high.advice });
      }
      
      // Rain advice
      const tomorrowRain = daily[1]?.rain || 0;
      if (tomorrowRain > rain.heavy.threshold) {
        advice.push({ icon: '🌧️', text: rain.heavy.advice });
      } else if (tomorrowRain > rain.light.threshold) {
        advice.push({ icon: '🌦️', text: rain.light.advice });
      } else if (tomorrowRain === 0 && weather.current.humidity < 50) {
        advice.push({ icon: '☀️', text: rain.none.advice });
      }
      
      return advice;
    };

    const farmingAdvice = getFarmingAdvice(weatherData, hourlyForecast, dailyForecast);

    const ForecastToggle = () => (
      <View style={styles.forecastToggle}>
        <TouchableOpacity 
          style={[styles.toggleButton, forecastType === 'hourly' && styles.toggleButtonActive]}
          onPress={() => setForecastType('hourly')}
        >
          <Text style={[styles.toggleText, forecastType === 'hourly' && styles.toggleTextActive]}>⏰ Hourly</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, forecastType === 'daily' && styles.toggleButtonActive]}
          onPress={() => setForecastType('daily')}
        >
          <Text style={[styles.toggleText, forecastType === 'daily' && styles.toggleTextActive]}>📅 Daily</Text>
        </TouchableOpacity>
      </View>
    );

    const HourlyForecast = () => (
      <View style={styles.forecastContainer}>
        <Text style={styles.forecastTitle}>⏰ 24-Hour Forecast</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll}>
          {hourlyForecast.map((hour, index) => (
            <View key={index} style={styles.hourlyItem}>
              <Text style={styles.hourlyTime}>{hour.time}</Text>
              <Text style={styles.hourlyIcon}>{hour.icon}</Text>
              <Text style={styles.hourlyTemp}>{hour.temp}°</Text>
              <Text style={styles.hourlyDetail}>💧 {hour.humidity}%</Text>
              <Text style={styles.hourlyDetail}>💨 {hour.windSpeed}</Text>
              {hour.rain > 0 && <Text style={styles.hourlyRain}>🌧️ {hour.rain}mm</Text>}
            </View>
          ))}
        </ScrollView>
      </View>
    );

    const DailyForecast = () => (
      <View style={styles.forecastContainer}>
        <Text style={styles.forecastTitle}>📅 5-Day Forecast</Text>
        {dailyForecast.map((day, index) => (
          <View key={index} style={styles.forecastDay}>
            <View style={styles.dayInfo}>
              <Text style={styles.dayName}>{day.day}</Text>
              <Text style={styles.dayDate}>{day.date}</Text>
            </View>
            <Text style={styles.dayIcon}>{day.icon}</Text>
            <View style={styles.dayDetails}>
              <Text style={styles.dayCondition}>{day.condition}</Text>
              <View style={styles.dayStats}>
                <Text style={styles.dayTemp}>{day.high}° / {day.low}°</Text>
                <Text style={styles.dayHumidity}>💧 {day.humidity}%</Text>
                {day.rain > 0 && <Text style={styles.dayRain}>🌧️ {day.rain}mm</Text>}
              </View>
            </View>
          </View>
        ))}
      </View>
    );

    return (
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
          setRefreshing(true);
          fetchWeatherData();
          setRefreshing(false);
        }} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.weatherHeader}>
          <Text style={styles.weatherTitle}>🌤️ Weather Forecast</Text>
          <Text style={styles.weatherSubtitle}>📍 {WEATHER_CONFIG.DEFAULT_LOCATION.name}</Text>
        </View>

        <View style={styles.currentWeatherCard}>
          <Text style={styles.currentTitle}>Current Weather</Text>
          <View style={styles.currentWeatherContent}>
            <Text style={styles.weatherIcon}>{weatherData.current.icon}</Text>
            <View style={styles.currentDetails}>
              <Text style={styles.currentTemp}>{Math.round(weatherData.current.temp)}°C</Text>
              <Text style={styles.currentCondition}>{weatherData.current.condition}</Text>
              <View style={styles.weatherStats}>
                <Text style={styles.weatherStat}>💧 {Math.round(weatherData.current.humidity)}%</Text>
                <Text style={styles.weatherStat}>💨 {Math.round(weatherData.current.windSpeed)} km/h</Text>
              </View>
            </View>
          </View>
          <View style={styles.additionalStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Pressure</Text>
              <Text style={styles.statValue}>{weatherData.current.pressure} hPa</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Visibility</Text>
              <Text style={styles.statValue}>{weatherData.current.visibility} km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>UV Index</Text>
              <Text style={styles.statValue}>{weatherData.current.uvIndex}</Text>
            </View>
          </View>
        </View>

        <ForecastToggle />
        
        {forecastType === 'hourly' ? <HourlyForecast /> : <DailyForecast />}

        <View style={styles.farmingAdviceCard}>
          <Text style={styles.adviceTitle}>🌾 Smart Farming Advice</Text>
          {farmingAdvice.length > 0 ? farmingAdvice.map((advice, index) => (
            <View key={index} style={styles.adviceItem}>
              <Text style={styles.adviceIcon}>{advice.icon}</Text>
              <Text style={styles.adviceText}>{advice.text}</Text>
            </View>
          )) : (
            <View style={styles.adviceItem}>
              <Text style={styles.adviceIcon}>✅</Text>
              <Text style={styles.adviceText}>Weather conditions are favorable for farming</Text>
            </View>
          )}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

  const SettingsView = () => {
    const toggleSetting = (key) => {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const updateSetting = (key, value) => {
      setSettings(prev => ({ ...prev, [key]: value }));
    };

    const SettingItem = ({ icon, title, subtitle, value, onPress, type = 'toggle' }) => (
      <TouchableOpacity style={styles.settingItem} onPress={onPress}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
        {type === 'toggle' && (
          <View style={[styles.toggle, value && styles.toggleActive]}>
            <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
          </View>
        )}
        {type === 'arrow' && <Text style={styles.settingArrow}>›</Text>}
        {type === 'value' && <Text style={styles.settingValue}>{value}</Text>}
      </TouchableOpacity>
    );

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsTitle}>⚙️ Settings</Text>
          <Text style={styles.settingsSubtitle}>Configure your farm dashboard</Text>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>🔔 Notifications</Text>
          <SettingItem 
            icon="🔔"
            title="Push Notifications"
            subtitle="Get alerts for critical conditions"
            value={settings.notifications}
            onPress={() => toggleSetting('notifications')}
          />
          <SettingItem 
            icon="🔄"
            title="Auto Refresh"
            subtitle="Automatically update sensor data"
            value={settings.autoRefresh}
            onPress={() => toggleSetting('autoRefresh')}
          />
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>📊 Data Settings</Text>
          <SettingItem 
            icon="⏱️"
            title="Refresh Interval"
            subtitle="How often to update data"
            value={`${settings.refreshInterval}s`}
            type="value"
            onPress={() => {}}
          />
          <SettingItem 
            icon="🌡️"
            title="Temperature Unit"
            subtitle="Celsius or Fahrenheit"
            value={`°${settings.temperatureUnit}`}
            type="value"
            onPress={() => updateSetting('temperatureUnit', settings.temperatureUnit === 'C' ? 'F' : 'C')}
          />
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>🌱 Crop Settings</Text>
          <SettingItem 
            icon={crops.find(c => c.name === settings.selectedCrop)?.icon || '🌾'}
            title="Selected Crop"
            subtitle={`${settings.selectedCrop} - Optimal: ${crops.find(c => c.name === settings.selectedCrop)?.tempRange}`}
            type="arrow"
            onPress={() => {}}
          />
          <View style={styles.cropGrid}>
            {crops.map((crop, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.cropItem,
                  settings.selectedCrop === crop.name && styles.cropItemSelected
                ]}
                onPress={() => updateSetting('selectedCrop', crop.name)}
              >
                <Text style={styles.cropIcon}>{crop.icon}</Text>
                <Text style={styles.cropName}>{crop.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>🇮🇳 Indian Languages</Text>
          <SettingItem 
            icon={languages.find(l => l.name === settings.language)?.flag || '🇺🇸'}
            title="Language"
            subtitle={settings.language}
            type="arrow"
            onPress={() => {}}
          />
          <View style={styles.languageGrid}>
            {languages.map((lang, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.languageItem,
                  settings.language === lang.name && styles.languageItemSelected
                ]}
                onPress={() => updateSetting('language', lang.name)}
              >
                <Text style={styles.languageFlag}>{lang.script}</Text>
                <Text style={styles.languageName}>{lang.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>🏡 Farm Information</Text>
          <SettingItem 
            icon="🌾"
            title="Farm Name"
            subtitle={settings.farmName}
            type="arrow"
            onPress={() => {}}
          />
          <SettingItem 
            icon="📍"
            title="Location"
            subtitle={settings.location}
            type="arrow"
            onPress={() => {}}
          />
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>🔧 Device Settings</Text>
          <SettingItem 
            icon="📡"
            title="ESP32 Connection"
            subtitle="192.168.4.1 - Connected"
            type="arrow"
            onPress={() => {}}
          />
          <SettingItem 
            icon="🔄"
            title="Sync Data"
            subtitle="Backup sensor readings"
            type="arrow"
            onPress={() => {}}
          />
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>
          <SettingItem 
            icon="📱"
            title="App Version"
            subtitle="Farm Dashboard v1.0.0"
            type="value"
            value="1.0.0"
            onPress={() => {}}
          />
          <SettingItem 
            icon="💡"
            title="Help & Support"
            subtitle="Get help with the app"
            type="arrow"
            onPress={() => {}}
          />
          <SettingItem 
            icon="⭐"
            title="Rate App"
            subtitle="Share your feedback"
            type="arrow"
            onPress={() => {}}
          />
        </View>

        <View style={styles.settingsFooter}>
          <Text style={styles.footerText}>🌾 Farm Dashboard</Text>
          <Text style={styles.footerSubtext}>Smart farming made simple</Text>
        </View>
      </ScrollView>
    );
  };

  const FarmerInputView = () => {
    const pickImage = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera roll permissions are required to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    };

    const takePhoto = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permissions are required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    };

    const submitInput = () => {
      if (!newInputText.trim() && !selectedImage) {
        Alert.alert('Input Required', 'Please add a message or select an image.');
        return;
      }

      const newInput = {
        id: Date.now(),
        text: newInputText.trim(),
        image: selectedImage,
        timestamp: new Date(),
        sensorData: { ...sensorData },
        weather: weatherData?.current || null
      };

      setFarmerInputs(prev => [newInput, ...prev]);
      setNewInputText('');
      setSelectedImage(null);
      Alert.alert('Success', 'Your input has been recorded!');
    };

    const deleteInput = (id) => {
      Alert.alert(
        'Delete Input',
        'Are you sure you want to delete this input?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => {
            setFarmerInputs(prev => prev.filter(input => input.id !== id));
          }}
        ]
      );
    };

    return (
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputHeader}>
          <Text style={styles.inputTitle}>📝 Farmer Input</Text>
          <Text style={styles.inputSubtitle}>Share crop photos and farming issues</Text>
        </View>

        <View style={styles.inputForm}>
          <Text style={styles.formTitle}>🌾 Add New Input</Text>
          
          <View style={styles.textInputContainer}>
            <Text style={styles.inputLabel}>💬 Message</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Describe any issues with your crops, observations, or questions..."
              multiline
              numberOfLines={4}
              value={newInputText}
              onChangeText={setNewInputText}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.imageSection}>
            <Text style={styles.inputLabel}>📷 Photo (Optional)</Text>
            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                <Text style={styles.imageButtonIcon}>📸</Text>
                <Text style={styles.imageButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Text style={styles.imageButtonIcon}>🖼️</Text>
                <Text style={styles.imageButtonText}>Choose Image</Text>
              </TouchableOpacity>
            </View>
            
            {selectedImage && (
              <View style={styles.selectedImageContainer}>
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={submitInput}>
            <Text style={styles.submitButtonText}>📤 Submit Input</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputHistory}>
          <Text style={styles.historyTitle}>📋 Previous Inputs ({farmerInputs.length})</Text>
          
          {farmerInputs.length === 0 ? (
            <View style={styles.noInputs}>
              <Text style={styles.noInputsIcon}>📝</Text>
              <Text style={styles.noInputsText}>No inputs yet</Text>
              <Text style={styles.noInputsSubtext}>Start by adding your first crop observation or issue</Text>
            </View>
          ) : (
            farmerInputs.map((input) => (
              <View key={input.id} style={styles.inputCard}>
                <View style={styles.inputCardHeader}>
                  <Text style={styles.inputDate}>
                    📅 {input.timestamp.toLocaleDateString()} at {input.timestamp.toLocaleTimeString()}
                  </Text>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => deleteInput(input.id)}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
                
                {input.text && (
                  <Text style={styles.inputText}>{input.text}</Text>
                )}
                
                {input.image && (
                  <Image source={{ uri: input.image }} style={styles.inputImage} />
                )}
                
                <View style={styles.inputContext}>
                  <Text style={styles.contextTitle}>📊 Conditions at time of input:</Text>
                  <View style={styles.contextData}>
                    <Text style={styles.contextItem}>🌡️ {Math.round(input.sensorData.temperature)}°C</Text>
                    <Text style={styles.contextItem}>💧 {Math.round(input.sensorData.humidity)}%</Text>
                    <Text style={styles.contextItem}>🌱 {Math.round(input.sensorData.soilMoisture)}%</Text>
                  </View>
                  {input.weather && (
                    <Text style={styles.contextWeather}>
                      🌤️ {input.weather.condition}, {Math.round(input.weather.temp)}°C
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>🌾 Farm Dashboard</Text>
        <Text style={styles.subtitle}>Real-time crop monitoring</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, 
            connectionStatus === 'connected' && styles.statusConnected,
            connectionStatus === 'connecting' && styles.statusConnecting,
            connectionStatus === 'disconnected' && styles.statusDisconnected
          ]} />
          <Text style={styles.statusText}>
            {connectionStatus === 'connected' ? '🟢 Connected' :
             connectionStatus === 'connecting' ? '🟡 Connecting...' :
             '🔴 Demo Mode'}
          </Text>
        </View>
        {lastUpdate && (
          <Text style={styles.lastUpdate}>
            Last update: {lastUpdate.toLocaleTimeString()}
          </Text>
        )}
      </View>

      <View style={styles.content}>
        {activeTab === 'dashboard' ? <DashboardView /> : 
         activeTab === 'history' ? <HistoryView /> : 
         activeTab === 'insights' ? <AIInsightsView /> : 
         activeTab === 'forecast' ? <ForecastView /> : 
         activeTab === 'input' ? <FarmerInputView /> : <SettingsView />}
      </View>

      <View style={styles.bottomTabContainer}>
        <TabButton 
          title="Home" 
          icon="🏠" 
          isActive={activeTab === 'dashboard'} 
          onPress={() => setActiveTab('dashboard')} 
        />
        <TabButton 
          title="History" 
          icon="📈" 
          isActive={activeTab === 'history'} 
          onPress={() => setActiveTab('history')} 
        />
        <TabButton 
          title="AI Insights" 
          icon="🤖" 
          isActive={activeTab === 'insights'} 
          onPress={() => setActiveTab('insights')} 
        />
        <TabButton 
          title="Forecast" 
          icon="🌤️" 
          isActive={activeTab === 'forecast'} 
          onPress={() => setActiveTab('forecast')} 
        />
        <TabButton 
          title="Input" 
          icon="📝" 
          isActive={activeTab === 'input'} 
          onPress={() => setActiveTab('input')} 
        />
        <TabButton 
          title="Settings" 
          icon="⚙️" 
          isActive={activeTab === 'settings'} 
          onPress={() => setActiveTab('settings')} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  lastUpdate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusConnected: {
    backgroundColor: '#28a745',
  },
  statusConnecting: {
    backgroundColor: '#ffc107',
  },
  statusDisconnected: {
    backgroundColor: '#dc3545',
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  cardsContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  chartContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chart: {
    borderRadius: 16,
  },
  alertsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  bottomTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: '#667eea',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  tabText: {
    color: '#999',
    fontSize: 10,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  historyStats: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  historySubtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  alert: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  alertSuccess: {
    backgroundColor: '#d4edda',
    borderLeftColor: '#28a745',
  },
  alertWarning: {
    backgroundColor: '#fff3cd',
    borderLeftColor: '#ffc107',
  },
  alertDanger: {
    backgroundColor: '#f8d7da',
    borderLeftColor: '#dc3545',
  },
  alertText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  aiHeader: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  aiTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  aiSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  healthScoreCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  healthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: -5,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  insightsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  insightCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  insightSuccess: {
    backgroundColor: '#d4edda',
    borderLeftColor: '#28a745',
  },
  insightWarning: {
    backgroundColor: '#fff3cd',
    borderLeftColor: '#ffc107',
  },
  insightDanger: {
    backgroundColor: '#f8d7da',
    borderLeftColor: '#dc3545',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  insightMessage: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  noInsights: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noInsightsIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  noInsightsText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginBottom: 5,
  },
  noInsightsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  recommendationsCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  recTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  recItem: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recIcon: {
    fontSize: 24,
    marginRight: 15,
    marginTop: 2,
  },
  recContent: {
    flex: 1,
  },
  recLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  recText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    marginTop: 20,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  weatherHeader: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  weatherTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  weatherSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  currentWeatherCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  currentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  currentWeatherContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 60,
    marginRight: 20,
  },
  currentDetails: {
    flex: 1,
  },
  currentTemp: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  currentCondition: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  weatherStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherStat: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  forecastContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  forecastDay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 70,
  },
  dayIcon: {
    fontSize: 24,
    marginHorizontal: 15,
  },
  dayDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCondition: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  dayTemp: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 60,
    textAlign: 'center',
  },
  dayRain: {
    fontSize: 12,
    color: '#007bff',
    width: 50,
    textAlign: 'right',
  },
  farmingAdviceCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  adviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 10,
  },
  adviceIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  adviceText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },
  settingsHeader: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  forecastToggle: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 5,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#667eea',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: 'white',
  },
  hourlyScroll: {
    paddingVertical: 10,
  },
  hourlyItem: {
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    minWidth: 80,
  },
  hourlyTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  hourlyIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  hourlyTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  hourlyDetail: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  hourlyRain: {
    fontSize: 10,
    color: '#007bff',
    fontWeight: '600',
  },
  dayInfo: {
    width: 80,
  },
  dayDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  dayStats: {
    alignItems: 'flex-end',
  },
  dayHumidity: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  bottomSpacer: {
    height: 100,
  },
  settingsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  settingsSection: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 25,
    textAlign: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#667eea',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  settingArrow: {
    fontSize: 20,
    color: '#ccc',
    fontWeight: 'bold',
  },
  settingValue: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  settingsFooter: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  footerSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginHorizontal: -5,
  },
  cropItem: {
    width: '23%',
    margin: '1%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cropItemSelected: {
    backgroundColor: '#e7f3ff',
    borderColor: '#667eea',
  },
  cropIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  cropName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginHorizontal: -5,
  },
  languageItem: {
    width: '48%',
    margin: '1%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageItemSelected: {
    backgroundColor: '#e7f3ff',
    borderColor: '#667eea',
  },
  languageFlag: {
    fontSize: 20,
    marginRight: 10,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  inputHeader: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  inputSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  inputForm: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  textInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
    minHeight: 100,
  },
  imageSection: {
    marginBottom: 20,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imageButtonIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedImageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputHistory: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  noInputs: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noInputsIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  noInputsText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    marginBottom: 5,
  },
  noInputsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  inputCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  inputCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputDate: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 5,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  inputText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 10,
  },
  inputImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 10,
  },
  inputContext: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
  },
  contextTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  contextData: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
  },
  contextItem: {
    fontSize: 11,
    color: '#555',
    fontWeight: '500',
  },
  contextWeather: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});