import React from 'react';
import { StyleSheet, Text, View, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function RealWorldDataScreen() {
  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?q=80&w=1000&auto=format&fit=crop' }} 
      style={styles.background}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'rgba(27, 94, 32, 0.9)']}
        style={styles.overlay}
      >
        <Text style={styles.title}>Real World Data</Text>
        <Text style={styles.subtitle}>Insights from the Field</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardText}>Coming Soon...</Text>
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
  },
  subtitle: {
    fontSize: 16,
    color: '#E8F5E9',
    marginBottom: 50,
  },
  card: {
    padding: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  }
});
