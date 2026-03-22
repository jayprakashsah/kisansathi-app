import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function LearningModeScreen() {
  const router = useRouter();

  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1592982537447-6f296d9e03f5?q=80&w=1000&auto=format&fit=crop' }} 
      style={styles.background}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(27, 94, 32, 0.9)']}
        style={styles.overlay}
      >
        <Text style={styles.title}>Learning Mode</Text>
        <Text style={styles.subtitle}>Select your preferred approach</Text>

        <View style={styles.cardContainer}>
          <TouchableOpacity 
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/learning-phone')}
          >
            <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.cardGradient}>
              <IconSymbol name="house.fill" size={40} color="#fff" />
              <Text style={styles.cardTitle}>Using Phone</Text>
              <Text style={styles.cardDesc}>Track field boundaries walking with your device</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => {
              // Future implementation maybe
            }}
          >
            <LinearGradient colors={['#1976D2', '#0D47A1']} style={styles.cardGradient}>
              <IconSymbol name="gamecontroller.fill" size={40} color="#fff" />
              <Text style={styles.cardTitle}>Using Rover</Text>
              <Text style={styles.cardDesc}>Connect to your smart farm rover and track</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#E8F5E9',
    marginBottom: 50,
  },
  cardContainer: {
    width: '100%',
    gap: 24,
  },
  card: {
    width: '100%',
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  cardDesc: {
    color: '#E8F5E9',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
  }
});
