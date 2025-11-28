# 🔧 Troubleshooting Guide

## Network Timeout Issues

### Problem: "Network response timeout" after first scan

**Common Causes:**
1. **WiFi Network Change**: Your phone switched to a different WiFi network
2. **ESP32 IP Change**: The ESP32 got a new IP address from your router
3. **Expo Go Cache**: Old connection data cached in Expo Go
4. **Network Interference**: Weak WiFi signal or network congestion

### Solutions:

#### 1. **Clear Expo Go Cache**
- Close Expo Go completely
- Reopen and scan QR code again
- Or shake device → "Reload" in Expo Go

#### 2. **Check Network Connection**
- Ensure phone and computer are on same WiFi network
- Check if ESP32 is still connected to WiFi
- Try restarting your WiFi router

#### 3. **Update ESP32 IP Address**
- Open Arduino Serial Monitor
- Check ESP32's current IP address
- Update `network-config.js` with new IP:
```javascript
ENDPOINTS: [
  'http://YOUR_NEW_ESP32_IP/api/sensor-data',  // Update this
  'http://192.168.4.1/api/sensor-data',
  'http://localhost:3000/api/current-data',
]
```

#### 4. **Restart Development Server**
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm start
```

#### 5. **Reset Network Settings**
- Turn WiFi off/on on your phone
- Forget and reconnect to WiFi network
- Restart Expo Go app

### Prevention Tips:
- Keep phone and computer on same stable WiFi
- Use static IP for ESP32 if possible
- Enable "Auto Refresh" in app settings
- Check connection status indicator in app header

### Demo Mode:
If connection fails, the app automatically switches to **Demo Mode** with simulated data so you can still test all features.

## ESP32 Connection Issues

### Check ESP32 Status:
1. **Power LED**: Should be solid on
2. **WiFi LED**: Should blink then stay solid
3. **Serial Monitor**: Shows IP address and "Server started"

### Reset ESP32:
1. Press RESET button on ESP32
2. Wait for WiFi connection (check Serial Monitor)
3. Note new IP address if changed

## Still Having Issues?

1. **Check app logs**: Look for error messages in Expo Go
2. **Try different device**: Test on another phone/tablet
3. **Use USB connection**: Connect ESP32 via USB for debugging
4. **Contact support**: Share error logs and network setup details