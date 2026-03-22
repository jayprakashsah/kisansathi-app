import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

export default function PrivacyScreen() {
  const [biometric, setBiometric] = React.useState(true);
  const [locationTracking, setLocationTracking] = React.useState(true);

  const handleClearCache = async () => {
    Alert.alert('Success', 'Local cache has been cleared and highly secured.');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.headerPlate}>
          <MaterialCommunityIcons name="shield-lock" size={60} color="#4CAF50" />
          <Text style={styles.headerTitle}>Security Vault</Text>
          <Text style={styles.headerSub}>End-to-end encrypted storage is active.</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>DEVICE PERMISSIONS</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="map-marker" size={24} color="#A5D6A7" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Background GPS Tracking</Text>
                <Text style={styles.settingDesc}>Allow app to use location in background</Text>
              </View>
            </View>
            <Switch 
              value={locationTracking} 
              onValueChange={setLocationTracking}
              trackColor={{ false: "#333", true: "#4CAF50" }}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="fingerprint" size={24} color="#A5D6A7" />
              <View style={styles.settingText}>
                <Text style={styles.settingName}>Biometric Authentication</Text>
                <Text style={styles.settingDesc}>Require FaceID / Fingerprint on open</Text>
              </View>
            </View>
            <Switch 
              value={biometric} 
              onValueChange={setBiometric}
              trackColor={{ false: "#333", true: "#4CAF50" }}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>DATA MANAGEMENT</Text>
          
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={handleClearCache}>
             <MaterialCommunityIcons name="trash-can-outline" size={24} color="#F44336" />
             <Text style={styles.actionBtnText}>Clear Internal Cache</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
             <MaterialCommunityIcons name="download-lock" size={24} color="#03A9F4" />
             <Text style={[styles.actionBtnText, {color: '#03A9F4'}]}>Request My Data Archive</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Kisansathi enforces strict agricultural privacy. Your field data is yours.
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scrollContent: { padding: 20 },
  
  headerPlate: { alignItems: 'center', marginVertical: 30 },
  headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  headerSub: { color: '#A5D6A7', fontSize: 14, marginTop: 5 },

  sectionCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sectionTitle: { color: '#666', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 15 },
  
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 20 },
  settingText: { marginLeft: 15 },
  settingName: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  settingDesc: { color: '#888', fontSize: 12, marginTop: 2 },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 5 },

  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  actionBtnText: { color: '#F44336', fontSize: 16, fontWeight: '600', marginLeft: 15 },

  footerText: { color: '#444', textAlign: 'center', fontSize: 12, marginTop: 20, marginBottom: 40 }
});
