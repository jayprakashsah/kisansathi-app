import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';

export default function DiseaseScanner() {
  const [scans, setScans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // YOUR MAC'S IP ADDRESS
  const BACKEND_URL = 'http://172.16.149.4:8000/rover/scans';

  // 🚀 FETCH REAL DATA FROM YOUR MONGODB BACKEND 🚀
  const fetchScans = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(BACKEND_URL, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setScans(data); // Save the real database data to our app!
      } else {
        console.error("Failed to fetch:", data);
      }
    } catch (error) {
      console.error("Network Error:", error);
      Alert.alert("Connection Error", "Could not connect to Kisansathi Server.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Run this automatically when the page opens
  useEffect(() => {
    fetchScans();
  }, []);

  // Run this when the user pulls down to refresh
  const onRefresh = () => {
    setIsRefreshing(true);
    fetchScans();
  };

  const handleSprayDispatch = (scan) => {
    Alert.alert(
      "Dispatch Rover?",
      `Send rover to ${scan.location} to spray ${scan.medicine} for ${scan.disease}? Make sure the tank is filled!`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Fill & Dispatch", onPress: () => console.log(`Rover dispatched to ${scan.location}`) }
      ]
    );
  };

  const getSeverityColor = (severity) => {
    if (severity === 'Critical') return '#F44336';
    if (severity === 'Moderate') return '#FF9800';
    return '#4CAF50'; 
  };

  const renderScanCard = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image_url }} style={styles.scanImage} />
      
      <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
        <Text style={styles.badgeText}>{item.severity}</Text>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.plantTitle}>{item.plant_name} - {item.disease}</Text>
          <Text style={styles.confidenceText}>AI Match: {item.confidence}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color="#A5D6A7" />
          <Text style={styles.infoText}>{item.location} • {item.timestamp}</Text>
        </View>

        {item.disease !== 'Healthy' && (
          <View style={styles.medicineBox}>
            <MaterialCommunityIcons name="medical-bag" size={20} color="#FFD54F" />
            <Text style={styles.medicineText}>Rx: {item.medicine}</Text>
          </View>
        )}

        {item.disease !== 'Healthy' ? (
          <TouchableOpacity style={styles.dispatchBtn} onPress={() => handleSprayDispatch(item)}>
            <MaterialCommunityIcons name="spray" size={20} color="#FFF" />
            <Text style={styles.dispatchBtnText}>AUTO-SPRAY LOCATION</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.healthyBtn}>
            <MaterialCommunityIcons name="check-circle-outline" size={20} color="#4CAF50" />
            <Text style={styles.healthyBtnText}>PLANT IS HEALTHY</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.background}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Field Scans</Text>
          <Text style={styles.headerSubtitle}>Live Data from Jetson Nano</Text>
        </View>

        {/* Show a loading spinner if data is still fetching */}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loaderText}>Fetching Rover Data...</Text>
          </View>
        ) : (
          <FlatList
            data={scans}
            renderItem={renderScanCard}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            // Add Pull-to-Refresh capability!
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#4CAF50" />
            }
            // Show this if the database is empty
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="leaf-off" size={60} color="#888" />
                <Text style={styles.emptyText}>No scans received yet.</Text>
                <Text style={styles.emptySubText}>Send the rover into the field to begin scanning.</Text>
              </View>
            }
          />
        )}

      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f2027' },
  background: { flex: 1 },
  header: { padding: 20, paddingTop: 40, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: '#A5D6A7', marginTop: 4 },
  
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { color: '#A5D6A7', marginTop: 10, fontSize: 16 },
  
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 15 },
  emptySubText: { color: '#888', fontSize: 14, marginTop: 5, textAlign: 'center', paddingHorizontal: 40 },

  listContainer: { paddingHorizontal: 15, paddingBottom: 30 },
  card: { backgroundColor: '#1E2A32', borderRadius: 20, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  scanImage: { width: '100%', height: 200, resizeMode: 'cover' },
  severityBadge: { position: 'absolute', top: 15, right: 15, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, elevation: 5 },
  badgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
  
  cardContent: { padding: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  plantTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  confidenceText: { fontSize: 12, color: '#03A9F4', fontWeight: 'bold' },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  infoText: { color: '#A5D6A7', fontSize: 13, marginLeft: 5 },
  
  medicineBox: { flexDirection: 'row', backgroundColor: 'rgba(255, 193, 7, 0.1)', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255, 193, 7, 0.3)' },
  medicineText: { color: '#FFD54F', fontSize: 14, fontWeight: 'bold', marginLeft: 10 },
  
  dispatchBtn: { flexDirection: 'row', backgroundColor: '#F44336', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dispatchBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15, marginLeft: 8, letterSpacing: 1 },
  
  healthyBtn: { flexDirection: 'row', backgroundColor: 'rgba(76, 175, 80, 0.1)', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#4CAF50' },
  healthyBtnText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 15, marginLeft: 8, letterSpacing: 1 }
});