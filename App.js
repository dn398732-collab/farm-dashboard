import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LineChart } from 'react-native-chart-kit';

export default function App() {
  const [sensorData, setSensorData] = useState({ temperature: 0, humidity: 0, soilMoisture: 0 });
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

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
        const newHistory = [...prev, { ...data, time: new Date().toLocaleTimeString() }];
        return newHistory.slice(-10); // Keep last 10 readings
      });
    } catch (error) {
      console.log('Connection failed, using demo data');
      // Demo data for testing
      setSensorData({
        temperature: 25 + Math.random() * 5,
        humidity: 60 + Math.random() * 10,
        soilMoisture: 70 + Math.random() * 10
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>🌾 Farm Dashboard</Text>
          <Text style={styles.subtitle}>Real-time crop monitoring</Text>
          {lastUpdate && (
            <Text style={styles.lastUpdate}>
              Last update: {lastUpdate.toLocaleTimeString()}
            </Text>
          )}
        </View>

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
            <Text style={styles.chartTitle}>📊 Sensor Trends</Text>
            <LineChart
              data={chartData}
              width={350}
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
    paddingBottom: 30,
    alignItems: 'center',
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
    marginBottom: 20,
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
    marginBottom: 20,
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
    marginBottom: 30,
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
});