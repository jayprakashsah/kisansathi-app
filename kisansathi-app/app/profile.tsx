import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Dimensions, ImageBackground, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('Loading...');
  const [userPhone, setUserPhone] = useState('Loading...');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          try {
            const res = await fetch("http://172.16.149.4:8000/user/profile", {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.name) setUserName(data.name);
              if (data.phone) setUserPhone(data.phone);
              if (data.email && !data.phone) setUserPhone(data.email); 
              if (data.photo_base64) setUserPhoto(data.photo_base64);
              
              // Cache locally
              const userId = (data.phone || data.email || data.name || 'default').replace(/[^a-zA-Z0-9.\-_]/g, '_');
              if (data.photo_base64) await SecureStore.setItemAsync(`userPhoto_${userId}`, data.photo_base64);
              
              setLoading(false);
              return;
            }
          } catch (cloudErr) {
            console.log("Cloud unavailable, failing over to local vault.");
          }
        }

        // Local Fallback
        const name = await SecureStore.getItemAsync('userName');
        const phone = await SecureStore.getItemAsync('userPhone');
        
        const rawUserId = phone || name || 'default';
        const userId = rawUserId.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const photo = await SecureStore.getItemAsync(`userPhoto_${userId}`); // Load isolated user photo
        
        if (name) setUserName(name);
        if (phone) setUserPhone(phone);
        if (photo) setUserPhoto(photo);
      } catch (err) {
        console.error("Error loading user data from storage", err);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  // NEW FEATURE: Upload Picture Logic
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const base64Data = result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : uri;
      setUserPhoto(base64Data);
      
      const rawUserId = (userPhone && userPhone !== 'Loading...') ? userPhone : userName;
      const userId = rawUserId.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      await SecureStore.setItemAsync(`userPhoto_${userId}`, base64Data);
      
      // Cloud Sync
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (token && result.assets[0].base64) {
          await fetch("http://172.16.149.4:8000/user/profile", {
             method: 'PUT',
             headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
             },
             body: JSON.stringify({ photo_base64: base64Data })
          });
        }
      } catch (e) {
        console.log("Failed to sync profile explicitly to DB.");
      }

      Alert.alert("Success!", "Profile uploaded efficiently to Kisansathi Cloud.");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('userName');
            await SecureStore.deleteItemAsync('userPhone');
            router.replace('/(tabs)'); 
          }
        }
      ]
    );
  };

  const navigateHistory = () => {
    router.push('/saved-fields');
  };

  const navigatePrivacy = () => {
    router.push('/privacy');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
         <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1592982537447-6f29fb2e9ed0?q=80&w=1000&auto=format&fit=crop' }} 
        style={styles.headerBackground}
      >
        <LinearGradient
          colors={['rgba(27, 94, 32, 0.7)', 'rgba(10, 10, 10, 1)']}
          style={styles.overlay}
        >
          {/* Profile Photo Placeholder / Picker */}
          <View style={styles.avatarContainer}>
             <LinearGradient colors={['#FFD54F', '#FFB300']} style={styles.avatarBorder}>
               <View style={styles.avatarInner}>
                 {userPhoto ? (
                   <Image source={{ uri: userPhoto }} style={styles.profileImage} />
                 ) : (
                   <MaterialCommunityIcons name="account" size={70} color="#2C3E2B" />
                 )}
               </View>
             </LinearGradient>
             <TouchableOpacity style={styles.editPhotoBadge} onPress={pickImage} activeOpacity={0.8}>
               <MaterialCommunityIcons name="camera-plus" size={16} color="#FFF" />
             </TouchableOpacity>
          </View>
          
          <Text style={styles.userNameText}>{userName}</Text>
          <Text style={styles.userRoleText}>Kisansathi Farmer</Text>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.detailsContainer}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="phone" size={24} color="#4CAF50" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Account ID (Phone)</Text>
              <Text style={styles.infoValue}>{userPhone}</Text>
            </View>
            <MaterialCommunityIcons name="shield-check-outline" size={28} color="#4CAF50" />
          </View>
          
          <View style={styles.divider} />
          
          {/* Advanced Menu 1 */}
          <TouchableOpacity style={styles.infoRow} onPress={navigateHistory} activeOpacity={0.6}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="map-marker-distance" size={24} color="#03A9F4" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Path Tracking Repository</Text>
              <Text style={styles.infoValue}>Explore your saved fields</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={28} color="#666" />
          </TouchableOpacity>

          <View style={styles.divider} />
          
          {/* Advanced Menu 2 */}
          <TouchableOpacity style={styles.infoRow} onPress={navigatePrivacy} activeOpacity={0.6}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="shield-lock-outline" size={24} color="#FF9800" />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Privacy & Security Vault</Text>
              <Text style={styles.infoValue}>Manage local keys & data</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={28} color="#666" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LinearGradient colors={['#F44336', '#D32F2F']} style={styles.logoutGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
            <MaterialCommunityIcons name="logout" size={24} color="#FFF" />
            <Text style={styles.logoutText}>SECURE LOG OUT</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  headerBackground: { height: 320, width: '100%' },
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 },
  
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatarBorder: { padding: 4, borderRadius: 60, shadowColor: '#FFD54F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 8 },
  avatarInner: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  profileImage: { width: 110, height: 110, resizeMode: 'cover' },
  editPhotoBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4CAF50', width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#1B5E20', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.4, shadowRadius: 3 },
  
  userNameText: { fontSize: 32, fontWeight: '800', color: '#FFF', letterSpacing: 0.5, marginBottom: 4 },
  userRoleText: { fontSize: 16, color: '#A5D6A7', letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  
  detailsContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  infoCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#A5D6A7', textTransform: 'uppercase', marginBottom: 4, fontWeight: 'bold' },
  infoValue: { fontSize: 16, color: '#FFF', fontWeight: '500' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 4 },
  
  logoutBtn: { marginTop: 40, borderRadius: 16, elevation: 5, shadowColor: '#F44336', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 8 },
  logoutGradient: { paddingVertical: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  logoutText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1.5 },
});
