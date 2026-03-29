import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

// Dashboard items without checkable property
const dashboardItems = [
  {
    id: '1',
    title: 'Analysis',
    icon: 'chart-bar',
    gradient: ['#FF9800', '#F57C00'],
    route: '/analysis',
    iconBg: '#FFB74D',
  },
  {
    id: '2',
    title: 'Medicine &\nSuggestion',
    icon: 'pill',
    gradient: ['#4CAF50', '#2E7D32'],
    route: '/medicine',
    iconBg: '#81C784',
  },
  {
    id: '3',
    title: 'Image of Disease\n& GPS',
    icon: 'map-marker-radius',
    gradient: ['#F44336', '#D32F2F'],
    route: '/disease',
    iconBg: '#EF9A9A',
  },
  {
    id: '4',
    title: 'Other Info\nPrediction',
    icon: 'robot',
    gradient: ['#03A9F4', '#0288D1'],
    route: '/prediction',
    iconBg: '#81D4FA',
  },
  {
    id: '5',
    title: 'Discovery\nHistory',
    icon: 'history',
    gradient: ['#00C853', '#1B5E20'],
    route: '/history',
    iconBg: '#69F0AE',
  },
  {
    id: '6',
    title: 'Disease\nLibrary',
    icon: 'book-open-variant',
    gradient: ['#FB8C00', '#E65100'],
    route: '/learning-mode',
    iconBg: '#FFB74D',
  },
];

const bottomNavItems = [
  { id: 1, icon: 'home', label: 'Home', active: true, route: '/(tabs)' },
  { id: 2, icon: 'book-open-page-variant', label: 'Learning Mode', route: '/learning-mode' },
  { id: 3, icon: 'chart-bar', label: 'Real World Data & Info', route: '/real-world-data' },
  { id: 4, icon: 'history', label: 'History', route: '/history' },
  { id: 5, icon: 'bell', label: 'Alerts', route: null },
  { id: 6, icon: 'cog', label: 'Settings', route: null },
];

// Free weather API using Open-Meteo (no API key required)
const fetchRealWeatherData = async (latitude, longitude) => {
  try {
    // Using Open-Meteo API - completely free, no API key needed
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=precipitation_probability&timezone=auto`
    );
    const data = await response.json();
    
    // Get precipitation probability for next 24 hours
    let rainChance = 0;
    if (data.hourly && data.hourly.precipitation_probability) {
      const next24Hours = data.hourly.precipitation_probability.slice(0, 24);
      const validProbabilities = next24Hours.filter(p => p !== undefined && p !== null);
      if (validProbabilities.length > 0) {
        rainChance = Math.round(validProbabilities.reduce((a, b) => a + b, 0) / validProbabilities.length);
      }
    }
    
    // Map weather code to condition
    const weatherCode = data.current?.weather_code || 0;
    let condition = 'Clear';
    if (weatherCode >= 51 && weatherCode <= 67) condition = 'Rain';
    else if (weatherCode >= 71 && weatherCode <= 77) condition = 'Snow';
    else if (weatherCode >= 80 && weatherCode <= 99) condition = 'Rain';
    else if (weatherCode >= 1 && weatherCode <= 3) condition = 'Clouds';
    
    return {
      temperature: Math.round(data.current?.temperature_2m || 28),
      feelsLike: Math.round(data.current?.temperature_2m || 28),
      humidity: data.current?.relative_humidity_2m || 65,
      rainChance: rainChance,
      windSpeed: Math.round(data.current?.wind_speed_10m || 12),
      condition: condition,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
};

export default function Dashboard() {
  const router = useRouter();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationName, setLocationName] = useState('Farm Location');
  const [userName, setUserName] = useState('Farmer Kishan');
  const [userPhoto, setUserPhoto] = useState(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const startButtonScale = useRef(new Animated.Value(1)).current;
  const cardAnimations = useRef(dashboardItems.map(() => new Animated.Value(0))).current;

  // Fetch real weather data based on location
  const fetchWeatherData = async () => {
    try {
      setLoading(true);

      // Load user details
      const storedName = await SecureStore.getItemAsync('userName');
      const storedPhone = await SecureStore.getItemAsync('userPhone');
      if (storedName) {
        setUserName(storedName);
      }
      
      const rawUserId = storedPhone || storedName || 'default';
      const userId = rawUserId.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const storedPhoto = await SecureStore.getItemAsync(`userPhoto_${userId}`);
      if (storedPhoto) {
        setUserPhoto(storedPhoto);
      }

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName('Location Denied');
        setWeatherData({
          temperature: 28,
          humidity: 65,
          rainChance: 30,
          windSpeed: 12,
          condition: 'Clear',
          feelsLike: 27,
        });
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Get reverse geocoding for location name
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const name = reverseGeocode[0]?.city || 
                   reverseGeocode[0]?.district || 
                   reverseGeocode[0]?.region || 
                   'Farm Location';
      setLocationName(name);

      // Fetch weather data from free API
      const weather = await fetchRealWeatherData(latitude, longitude);
      
      if (weather) {
        setWeatherData(weather);
      } else {
        // Fallback data
        setWeatherData({
          temperature: 28,
          humidity: 65,
          rainChance: 30,
          windSpeed: 12,
          condition: 'Clear',
          feelsLike: 27,
        });
      }
    } catch (err) {
      console.error('Error fetching weather data:', err);
      // Set fallback data
      setWeatherData({
        temperature: 28,
        humidity: 65,
        rainChance: 30,
        windSpeed: 12,
        condition: 'Clear',
        feelsLike: 27,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeatherData();
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card animations
    cardAnimations.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        delay: 100 + index * 100,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // Start button pulse animation
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.spring(startButtonScale, {
          toValue: 1.05,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(startButtonScale, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      { iterations: -1 }
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, []);

  const handleCardPress = (item) => {
    // Navigate to the route without any popup or checkmark
    router.push(item.route);
  };

  const handleNavPress = (item) => {
    if (item.route) {
      router.push(item.route);
    } else if (item.label === 'Home') {
      // Already on home
    } else {
      console.log(`Navigate to ${item.label}`);
    }
  };

  const renderItem = ({ item, index }) => {
    const cardTranslateY = cardAnimations[index].interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });

    const cardOpacity = cardAnimations[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: cardOpacity,
            transform: [{ translateY: cardTranslateY }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleCardPress(item)}
          style={styles.cardTouchable}
        >
          <LinearGradient
            colors={item.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card3D}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
              <MaterialCommunityIcons name={item.icon} size={44} color="#FFF" />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.cardGlow} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getWeatherIcon = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'clear': return 'weather-sunny';
      case 'clouds': return 'weather-cloudy';
      case 'rain': return 'weather-rainy';
      case 'thunderstorm': return 'weather-lightning';
      case 'snow': return 'weather-snowy';
      case 'mist':
      case 'fog': return 'weather-fog';
      default: return 'weather-partly-cloudy';
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=2000&auto=format&fit=crop',
        }}
        style={styles.background}
      >
        <LinearGradient
          colors={['rgba(10, 40, 20, 0.88)', 'rgba(5, 25, 12, 0.96)']}
          style={styles.overlay}
        >
          <SafeAreaView style={styles.safeArea}>
            <Animated.View
              style={[
                styles.container,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Header Section */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.greeting}>Good Morning,</Text>
                  <Text style={styles.welcomeText}>{userName}</Text>
                  <TouchableOpacity 
                    style={styles.locationBadge}
                    onPress={fetchWeatherData}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="map-marker" size={14} color="#81C784" />
                    <Text style={styles.locationText}>
                      {locationName}
                    </Text>
                    <MaterialCommunityIcons name="refresh" size={12} color="#81C784" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity 
                  style={styles.profileWrapper} 
                  activeOpacity={0.8}
                  onPress={() => router.push('/profile')}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#2E7D32']}
                    style={styles.profileCircle}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {userPhoto ? (
                      <Image source={{ uri: userPhoto }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                    ) : (
                      <MaterialCommunityIcons name="account" size={32} color="#FFF" />
                    )}
                  </LinearGradient>
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationText}>3</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Weather Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statTouchable}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                    style={styles.statCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons 
                      name={weatherData ? getWeatherIcon(weatherData.condition) : 'weather-partly-cloudy'} 
                      size={24} 
                      color="#FFD54F" 
                    />
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.statValue}>{weatherData?.temperature || '--'}°C</Text>
                    )}
                    <Text style={styles.statLabel}>
                      {weatherData?.condition || 'Loading...'}
                    </Text>
                  </LinearGradient>
                </View>

                <View style={styles.statTouchable}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                    style={styles.statCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons name="water-percent" size={24} color="#81C784" />
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.statValue}>{weatherData?.humidity || '--'}%</Text>
                    )}
                    <Text style={styles.statLabel}>Humidity</Text>
                  </LinearGradient>
                </View>

                <View style={styles.statTouchable}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                    style={styles.statCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons name="weather-rainy" size={24} color="#4FC3F7" />
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.statValue}>{weatherData?.rainChance || '--'}%</Text>
                    )}
                    <Text style={styles.statLabel}>Rain Chance</Text>
                  </LinearGradient>
                </View>

                <View style={styles.statTouchable}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                    style={styles.statCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons name="weather-windy" size={24} color="#FFB74D" />
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.statValue}>{weatherData?.windSpeed || '--'}km/h</Text>
                    )}
                    <Text style={styles.statLabel}>Wind Speed</Text>
                  </LinearGradient>
                </View>
              </View>

              {/* Start Button */}
              <Animated.View
                style={[
                  styles.startButtonWrapper,
                  { transform: [{ scale: startButtonScale }] },
                ]}
              >
                <LinearGradient
                  colors={['#FFD54F', '#FFB300']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.start3DButton}
                >
                  <TouchableOpacity
                    style={styles.startButtonInner}
                    activeOpacity={0.9}
                    onPress={() => router.push('/main')}
                  >
                    <MaterialCommunityIcons name="power" size={26} color="#2C3E2B" />
                    <Text style={styles.startButtonText}>START SYSTEM</Text>
                    <MaterialCommunityIcons name="arrow-right" size={24} color="#2C3E2B" />
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>

              {/* Section Title */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Smart Services</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>

              {/* Grid Section */}
              <FlatList
                data={dashboardItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.gridContainer}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#FFD54F"
                    colors={['#FFD54F']}
                  />
                }
              />

              {/* Bottom Navigation */}
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
                style={styles.bottomNavGradientBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                <View style={styles.bottomNavContainer}>
                  {bottomNavItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.bottomNavBox3D,
                        item.active && styles.bottomNavBoxActive,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleNavPress(item)}
                    >
                      <LinearGradient
                        colors={
                          item.active
                            ? ['#FFD54F', '#FFB300']
                            : ['#2E7D32', '#1B5E20']
                        }
                        style={styles.bottomNavGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={26}
                          color={item.active ? '#2C3E2B' : '#FFF'}
                        />
                      </LinearGradient>
                      {item.active && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </LinearGradient>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#A5D6A7',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#C8E6C9',
    fontWeight: '500',
  },
  profileWrapper: {
    position: 'relative',
  },
  profileCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF5252',
    borderRadius: 12,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  notificationText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  statTouchable: {
    flex: 1,
  },
  statCard: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 9,
    color: '#C8E6C9',
    marginTop: 2,
    textAlign: 'center',
  },
  startButtonWrapper: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  start3DButton: {
    borderRadius: 20,
    shadowColor: '#FFB300',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  startButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C3E2B',
    letterSpacing: 1.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 13,
    color: '#FFD54F',
    fontWeight: '600',
  },
  gridContainer: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  cardWrapper: {
    width: (width / 2) - 24,
    margin: 8,
  },
  cardTouchable: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  card3D: {
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardGlow: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    right: -20,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 50,
    transform: [{ scaleX: 1.2 }],
  },
  bottomNavGradientBg: {
    marginTop: 'auto',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  bottomNavBox3D: {
    width: 52,
    height: 52,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  bottomNavBoxActive: {
    transform: [{ translateY: -4 }],
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  bottomNavGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 30,
    height: 3,
    backgroundColor: '#FFD54F',
    borderRadius: 2,
    alignSelf: 'center',
  },
});