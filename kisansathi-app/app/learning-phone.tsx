import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { useRouter as useExpoRouter } from 'expo-router';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polyline, Circle } from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';

const BACKEND_URL = "http://172.16.149.4:8000/field/save";

export default function LearningPhoneScreen() {
  const router = useExpoRouter();
  const [step, setStep] = useState(0); // 0: popup, 1: ask name, 2: tracking, 3: review map
  const [fieldName, setFieldName] = useState('');
  const [locationError, setLocationError] = useState<any>(null);
  
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [pathCoordinates, setPathCoordinates] = useState<any[]>([]);
  const [distanceWalked, setDistanceWalked] = useState(0); // in meters
  // NEW: State for showing ignored points due to bad accuracy
  const [ignoredPoints, setIgnoredPoints] = useState(0);
  
  const locationSubscription = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const handleStartTracking = () => {
    setStep(1);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleNextName = async () => {
    if (!fieldName.trim()) {
      Alert.alert('Required', 'Please enter a name for the field');
      return;
    }

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
    }
    
    setStep(2);

    try {
      // BestForNavigation forces maximum usage of internal GPS chip (very power heavy but best accuracy)
      const initialLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation || Location.Accuracy.Highest });
      setCurrentLocation(initialLoc.coords);
      
      // Initialize if accuracy is somewhat decent, else just log it
      if (initialLoc.coords.accuracy && initialLoc.coords.accuracy <= 15) {
        setPathCoordinates([{ latitude: initialLoc.coords.latitude, longitude: initialLoc.coords.longitude }]);
      }
      
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation || Location.Accuracy.Highest,
          timeInterval: 1000, // Query exactly every 1 second
          distanceInterval: 1, 
        },
        (loc) => {
          const { latitude, longitude, accuracy } = loc.coords;
          setCurrentLocation(loc.coords);

          // STRICT JITTER FILTER: Requested by user to be +/- 1m. 
          // We filter out any point conceptually worse than 2 meters.
          if (accuracy && accuracy > 2) {
            setIgnoredPoints(ignore => ignore + 1);
            return; 
          }

          setPathCoordinates((prev) => {
             const lastLoc = prev[prev.length - 1];
             if (lastLoc) {
               const dist = calculateDistance(lastLoc.latitude, lastLoc.longitude, latitude, longitude);
               // Ignore ridiculous drifts (> 30 meters in a single second is likely impossible on foot)
               if (dist > 30) return prev;
               setDistanceWalked(d => d + dist);
             }
             return [...prev, { latitude, longitude }];
          });
        }
      );
    } catch (err) {
      setLocationError("Could not retrieve GPS signal.");
    }
  };

  const handleFinished = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
    setStep(3);
  };

  const saveToDatabase = async () => {
    try {
      Alert.alert('Saving', 'Communicating with server...');
      const phone = await SecureStore.getItemAsync('userPhone');
      
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          field_name: fieldName,
          path_coordinates: pathCoordinates,
          user_phone: phone || "unknown" 
        })
      });
      
      if (response.ok) {
         Alert.alert('Success', 'Field data securely saved to your unified profile tracking database!');
         router.back();
      } else {
         Alert.alert('Error', 'Failed to save field data');
      }
    } catch(err) {
      Alert.alert('Connection Error', `Could not reach server at ${BACKEND_URL}. Verify backend is running.`);
    }
  };

  const generateSvgPoints = () => {
    if (pathCoordinates.length === 0) return "";
    const lats = pathCoordinates.map(c => c.latitude);
    const lons = pathCoordinates.map(c => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    
    const spanLat = (maxLat - minLat === 0) ? 0.0001 : (maxLat - minLat);
    const spanLon = (maxLon - minLon === 0) ? 0.0001 : (maxLon - minLon);
    
    return pathCoordinates.map(c => {
       const x = ((c.longitude - minLon) / spanLon) * 260 + 20;
       const y = 280 - ((c.latitude - minLat) / spanLat) * 260; // invert Y
       return `${x},${y}`;
    }).join(' ');
  };

  if (step === 0) {
    return (
      <View style={styles.centerContainer}>
        <LinearGradient colors={['#E8F5E9', '#A5D6A7']} style={styles.modalContent}>
           <Text style={styles.modalTitle}>Ready?</Text>
           <Text style={styles.modalText}>Please go to your field and then start.</Text>
           <TouchableOpacity style={styles.btnPrimary} onPress={handleStartTracking}>
             <Text style={styles.btnText}>OK, I'm at the field</Text>
           </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  if (step === 1) {
    return (
      <View style={styles.centerContainer}>
         <LinearGradient colors={['#ffffff', '#E8F5E9']} style={styles.modalContent}>
           <Text style={styles.modalTitle}>Field Details</Text>
           <Text style={styles.modalText}>Enter a name for this field to save later.</Text>
           <TextInput 
             style={styles.input}
             placeholder="e.g. North Corn Field"
             placeholderTextColor="#666"
             value={fieldName}
             onChangeText={setFieldName}
             autoFocus
           />
           <TouchableOpacity style={styles.btnPrimary} onPress={handleNextName}>
             <Text style={styles.btnText}>Next</Text>
           </TouchableOpacity>
         </LinearGradient>
      </View>
    );
  }

  if (step === 2) {
    return (
      <LinearGradient colors={['#1a1a1a', '#0a0a0a']} style={styles.trackingContainer}>
        <Text style={styles.dashHeader}>Field Tracking: {fieldName}</Text>
        
        {locationError && <Text style={{color: 'red', textAlign: 'center'}}>{locationError}</Text>}
        
        {!currentLocation ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Acquiring High-Accuracy GPS...</Text>
          </View>
        ) : (
          <View style={styles.dashContent}>
           
           {/* Signal Quality Indicator */}
           <View style={[styles.metricCard, { borderColor: currentLocation.accuracy > 2 ? '#F44336' : '#4CAF50' }]}>
             <Text style={styles.metricLabel}>Signal Quality (Target: ±1m)</Text>
             <Text style={[styles.metricValue, { color: currentLocation.accuracy > 2 ? '#F44336' : '#4CAF50', fontSize: 22 }]}>
               {currentLocation.accuracy > 2 ? 'POOR (GO OUTSIDE)' : 'EXCELLENT'}
             </Text>
             <Text style={styles.coordText}>Current Accuracy: ±{currentLocation.accuracy?.toFixed(1)}m</Text>
           </View>

           <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
             <View style={[styles.metricCard, {flex: 1, marginRight: 5}]}>
               <Text style={styles.metricLabel}>Distance</Text>
               <Text style={[styles.metricValue, {fontSize: 24}]}>{distanceWalked.toFixed(1)}m</Text>
             </View>
             
             <View style={[styles.metricCard, {flex: 1, marginLeft: 5}]}>
               <Text style={styles.metricLabel}>Points</Text>
               <Text style={[styles.metricValue, {fontSize: 24}]}>{pathCoordinates.length}</Text>
             </View>
           </View>
           
           {(ignoredPoints > 0) && (
             <Text style={{color: '#F44336', textAlign: 'center', marginBottom: 10}}>
               ⚠️ Ignored {ignoredPoints} inaccurate (drifted) points
             </Text>
           )}

           <ScrollView style={styles.logContainer}>
             {pathCoordinates.slice(-10).reverse().map((pt, i) => (
               <Text key={i} style={styles.logText}>
                 + Node {pathCoordinates.length - i}: {pt.latitude.toFixed(4)}, {pt.longitude.toFixed(4)}
               </Text>
             ))}
           </ScrollView>
        </View>
      )}
  
        {currentLocation && (
           <View style={styles.bottomBar}>
             <TouchableOpacity style={styles.finishBtnFull} onPress={handleFinished}>
               <Text style={styles.finishBtnText}>FINISH TRACKING</Text>
             </TouchableOpacity>
           </View>
        )}
      </LinearGradient>
    );
  }

  // Step 3: Review Drawn Path
  const svgPoints = generateSvgPoints();
  const rawPoints = svgPoints.split(' ');
  const lastPoint = rawPoints.length > 0 && rawPoints[rawPoints.length - 1] ? rawPoints[rawPoints.length - 1].split(',') : ['0', '0'];

  return (
    <View style={styles.centerContainer}>
      <LinearGradient colors={['#ffffff', '#E8F5E9']} style={styles.modalContent}>
        <Text style={styles.modalTitle}>Path Recorded!</Text>
        <Text style={styles.modalText}>Your movement has been successfully captured.</Text>
        
        <View style={styles.svgContainer}>
           <Svg height="300" width="300">
              <Polyline
                 points={svgPoints}
                 fill="none"
                 stroke="#4CAF50"
                 strokeWidth="4"
              />
              {rawPoints.length > 0 && (
                <Circle cx={lastPoint[0]} cy={lastPoint[1]} r="6" fill="#F44336" />
              )}
           </Svg>
        </View>

        <Text style={styles.modalText}>Distance: {distanceWalked.toFixed(2)}m</Text>
        <Text style={styles.modalText}>Save this data?</Text>
        
        <View style={styles.rowBtns}>
          <TouchableOpacity style={[styles.btnPrimary, {backgroundColor: '#757575', flex: 1, marginRight: 10}]} onPress={() => router.back()}>
            <Text style={styles.btnText}>NO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnPrimary, {flex: 1}]} onPress={saveToDatabase}>
            <Text style={styles.btnText}>YES</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  modalContent: { width: '90%', padding: 30, borderRadius: 24, alignItems: 'center', elevation: 8 },
  modalTitle: { fontSize: 26, fontWeight: 'bold', marginBottom: 10, color: '#2E7D32', textAlign: 'center' },
  modalText: { fontSize: 16, textAlign: 'center', color: '#444', marginBottom: 15 },
  btnPrimary: { backgroundColor: '#4CAF50', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  input: { width: '100%', backgroundColor: '#fff', borderColor: '#CCC', borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, marginBottom: 20 },
  rowBtns: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginTop: 10 },
  
  trackingContainer: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  dashHeader: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50', marginBottom: 20, textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#4CAF50', marginTop: 15, fontSize: 16 },
  
  dashContent: { flex: 1 },
  metricCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(76, 175, 80, 0.3)'},
  metricLabel: { color: '#A5D6A7', fontSize: 14, marginBottom: 5, textTransform: 'uppercase' },
  metricValue: { color: '#fff', fontSize: 32, fontWeight: '800' },
  coordText: { color: '#fff', fontSize: 16, fontFamily: 'monospace', marginTop: 4 },
  
  logContainer: { marginTop: 10, flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 15 },
  logText: { color: '#81C784', fontFamily: 'monospace', fontSize: 12, marginBottom: 4 },
  
  bottomBar: { paddingVertical: 20 },
  finishBtnFull: { backgroundColor: '#F44336', paddingVertical: 18, borderRadius: 16, alignItems: 'center', elevation: 6 },
  finishBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  
  svgContainer: { backgroundColor: '#f5f5f5', borderRadius: 16, padding: 10, borderColor: '#eee', borderWidth: 2, marginBottom: 20 }
});
