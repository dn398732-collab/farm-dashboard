import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function App() {
  const [sensorData, setSensorData] = useState({ temperature: 0, humidity: 0, soilMoisture: 0 });
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [weatherData, setWeatherData] = useState(null);
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
    try {
      // Try ESP32 direct connection first
      let response = await fetch('http://192.168.4.1/api/sensor-data', { timeout: 3000 });
      if (!response.ok) {
        // Fallback to Node.js server
        response = await fetch('http://10.56.190.55:3000/api/current-data', { timeout: 3000 });
      }
      const data = await response.json();
      setSensorData(data);
      setLastUpdate(new Date());
      
      // Update history
      setHistory(prev => {
        const newHistory = [...prev, { ...data, time: new Date().toLocaleTimeString(), timestamp: Date.now() }];
        return newHistory.slice(-50); // Keep last 50 readings
      });
    } catch (error) {
      console.log('Connection failed, using demo data');
      // Demo data for testing
      const demoData = {
        temperature: 25 + Math.random() * 5,
        humidity: 60 + Math.random() * 10,
        soilMoisture: 70 + Math.random() * 10
      };
      setSensorData(demoData);
      setLastUpdate(new Date());
      
      // Add to history for demo
      setHistory(prev => {
        const newHistory = [...prev, { ...demoData, time: new Date().toLocaleTimeString(), timestamp: Date.now() }];
        return newHistory.slice(-50);
      });
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

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
      const demoWeather = {
        current: {
          temp: 26 + Math.random() * 4,
          humidity: 65 + Math.random() * 10,
          windSpeed: 8 + Math.random() * 5,
          condition: ['Sunny', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)],
          icon: ['☀️', '⛅', '☁️'][Math.floor(Math.random() * 3)]
        },
        forecast: [
          { day: 'Today', high: 28, low: 18, condition: 'Sunny', icon: '☀️', rain: 0 },
          { day: 'Tomorrow', high: 26, low: 16, condition: 'Partly Cloudy', icon: '⛅', rain: 20 },
          { day: 'Wed', high: 24, low: 15, condition: 'Rainy', icon: '🌧️', rain: 80 },
          { day: 'Thu', high: 27, low: 17, condition: 'Sunny', icon: '☀️', rain: 10 },
          { day: 'Fri', high: 29, low: 19, condition: 'Hot', icon: '🌡️', rain: 5 }
        ]
      };
      setWeatherData(demoWeather);
    } catch (error) {
      console.log('Weather fetch failed');
    }
  };

  const ForecastView = () => {
    useEffect(() => {
      fetchWeatherData();
    }, []);

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

    const getFarmingAdvice = (weather) => {
      const advice = [];
      if (weather.current.temp > 30) {
        advice.push({ icon: '🌡️', text: 'High temperature - provide shade for crops' });
      }
      if (weather.forecast[1].rain > 70) {
        advice.push({ icon: '🌧️', text: 'Heavy rain expected - check drainage systems' });
      }
      if (weather.current.windSpeed > 15) {
        advice.push({ icon: '💨', text: 'Strong winds - secure plant supports' });
      }
      if (weather.forecast[0].rain < 10 && weather.current.humidity < 50) {
        advice.push({ icon: '💧', text: 'Dry conditions - increase irrigation' });
      }
      return advice;
    };

    const farmingAdvice = getFarmingAdvice(weatherData);

    return (
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchWeatherData} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.weatherHeader}>
          <Text style={styles.weatherTitle}>🌤️ Weather Forecast</Text>
          <Text style={styles.weatherSubtitle}>Farm weather conditions</Text>
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
        </View>

        <View style={styles.forecastContainer}>
          <Text style={styles.forecastTitle}>📅 5-Day Forecast</Text>
          {weatherData.forecast.map((day, index) => (
            <View key={index} style={styles.forecastDay}>
              <Text style={styles.dayName}>{day.day}</Text>
              <Text style={styles.dayIcon}>{day.icon}</Text>
              <View style={styles.dayDetails}>
                <Text style={styles.dayCondition}>{day.condition}</Text>
                <Text style={styles.dayTemp}>{day.high}° / {day.low}°</Text>
                <Text style={styles.dayRain}>🌧️ {day.rain}%</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.farmingAdviceCard}>
          <Text style={styles.adviceTitle}>🌾 Farming Advice</Text>
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>🌾 Farm Dashboard</Text>
        <Text style={styles.subtitle}>Real-time crop monitoring</Text>
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
         activeTab === 'forecast' ? <ForecastView /> : <SettingsView />}
      </View>

      <View style={styles.bottomTabContainer}>
        <TabButton 
          title="Dashboard" 
          icon="📊" 
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
});