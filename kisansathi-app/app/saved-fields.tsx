import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BACKEND_URL = "http://172.16.149.4:8000/field/history";

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface FieldData {
  _id: string;
  field_name: string;
  timestamp: string;
  path_coordinates: Coordinate[];
}

export default function SavedFieldsScreen() {
  const [fields, setFields] = useState<FieldData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const phone = await SecureStore.getItemAsync('userPhone');
      if (!phone) {
        Alert.alert('Error', 'No authenticated profile found.');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/${phone}`);
      if (response.ok) {
        const data = await response.json();
        setFields(data);
      } else {
        Alert.alert('Error', 'Failed to retrieve tracking history.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Connection Error', 'Could not connect to the Kisansathi servers.');
    } finally {
      setLoading(false);
    }
  };

  const generateSvgPoints = (pathCoordinates: Coordinate[]) => {
    if (!pathCoordinates || pathCoordinates.length === 0) return "";
    const lats = pathCoordinates.map(c => c.latitude);
    const lons = pathCoordinates.map(c => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    
    const spanLat = (maxLat - minLat === 0) ? 0.0001 : (maxLat - minLat);
    const spanLon = (maxLon - minLon === 0) ? 0.0001 : (maxLon - minLon);
    
    return pathCoordinates.map(c => {
       const x = ((c.longitude - minLon) / spanLon) * 90 + 5;
       const y = 90 - ((c.latitude - minLat) / spanLat) * 90; // invert Y
       return `${x},${y}`;
    }).join(' ');
  };

  const calculateDistance = (path: Coordinate[]) => {
      if (!path || path.length < 2) return 0;
      let dist = 0;
      const R = 6371e3;
      for (let i = 1; i < path.length; i++) {
        const lat1 = path[i-1].latitude;
        const lon1 = path[i-1].longitude;
        const lat2 = path[i].latitude;
        const lon2 = path[i].longitude;
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        dist += R * c;
      }
      return dist.toFixed(1);
  }

  const renderFieldCard = ({ item }: { item: FieldData }) => {
    const svgPoints = generateSvgPoints(item.path_coordinates);
    const distance = calculateDistance(item.path_coordinates);

    return (
      <View style={styles.card}>
        <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.cardGradient}>
          
          <View style={styles.mapContainer}>
             {svgPoints ? (
               <Svg height="100" width="100">
                  <Polyline points={svgPoints} fill="none" stroke="#4CAF50" strokeWidth="3" />
               </Svg>
             ) : (
                <MaterialCommunityIcons name="map-marker-off" size={40} color="#666" />
             )}
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.fieldName}>{item.field_name}</Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#A5D6A7" />
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
            <View style={styles.statsRow}>
               <View style={styles.statBadge}>
                 <MaterialCommunityIcons name="map-marker-distance" size={14} color="#FFF" />
                 <Text style={styles.statText}>{distance}m tracked</Text>
               </View>
               <View style={styles.statBadgeAlt}>
                 <MaterialCommunityIcons name="navigation" size={14} color="#FFF" />
                 <Text style={styles.statText}>{item.path_coordinates.length} points</Text>
               </View>
            </View>
          </View>

        </LinearGradient>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Fetching your field history from AWS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {fields.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="map-search-outline" size={80} color="#444" />
          <Text style={styles.emptyText}>No tracking history found.</Text>
          <Text style={styles.emptySub}>Head to the Learning Mode to track a field!</Text>
        </View>
      ) : (
        <FlatList
          data={fields}
          keyExtractor={item => item._id}
          renderItem={renderFieldCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#A5D6A7', marginTop: 15, fontSize: 16 },
  listContainer: { padding: 20 },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  emptySub: { color: '#888', fontSize: 14, marginTop: 10, textAlign: 'center' },

  card: { marginBottom: 15, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(76, 175, 80, 0.2)' },
  cardGradient: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  
  mapContainer: { width: 100, height: 100, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  
  cardInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  fieldName: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  timestamp: { color: '#A5D6A7', fontSize: 13, marginLeft: 5 },
  
  statsRow: { flexDirection: 'row', gap: 10 },
  statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2E7D32', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 4 },
  statBadgeAlt: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0288D1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 4 },
  statText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' }
});
