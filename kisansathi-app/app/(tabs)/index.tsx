import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ImageBackground, 
  KeyboardAvoidingView, 
  Platform,
  Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router'; 
import * as SecureStore from 'expo-secure-store';

export default function App() {
  const router = useRouter(); 
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const BACKEND_URL = 'http://172.16.149.247:8000';

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert("Missing Fields", "Please enter your phone number and password.");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save user session securely
        await SecureStore.setItemAsync('userToken', data.access_token);
        await SecureStore.setItemAsync('userName', data.name);
        await SecureStore.setItemAsync('userPhone', phone);
        
        Alert.alert("Login Successful!", `Welcome to Kisansathi, ${data.name}!`);
        router.replace('/(tabs)/explore'); 
      } else {
        Alert.alert("Login Failed", data.detail || "Invalid credentials.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Network Error", "Cannot connect to the backend. Make sure your server is running and the IP is correct.");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000&auto=format&fit=crop' }} 
        style={styles.background}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(27, 94, 32, 0.9)']}
          style={styles.overlay}
        >
          <View style={styles.formContainer}>
            <Text style={styles.title}>Kisansathi</Text>
            <Text style={styles.subtitle}>Smart Farming, Better Yields</Text>

            <View style={styles.inputView}>
              <TextInput
                style={styles.inputText}
                placeholder="Phone Number"
                placeholderTextColor="#A5D6A7"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputView}>
              <TextInput
                secureTextEntry
                style={styles.inputText}
                placeholder="Password"
                placeholderTextColor="#A5D6A7"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
              <Text style={styles.loginText}>LOGIN</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, resizeMode: 'cover', justifyContent: 'center', backgroundColor: '#1B5E20' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  formContainer: { width: '85%', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  title: { fontWeight: 'bold', fontSize: 40, color: '#ffffff', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#E8F5E9', marginBottom: 40 },
  inputView: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 10, height: 55, marginBottom: 20, justifyContent: 'center', padding: 20 },
  inputText: { height: 50, color: 'white', fontSize: 16 },
  loginBtn: { width: '100%', backgroundColor: '#4CAF50', borderRadius: 10, height: 55, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  loginText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  forgotText: { color: '#E8F5E9', fontSize: 14 },
});