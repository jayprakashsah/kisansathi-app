import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ImageBackground, Dimensions, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

export const CROPS_DATA = [
  { id: '1', name: 'Tomato', image: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&q=80', description: 'Susceptible to Blights & Mosaics' },
  { id: '2', name: 'Potato', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80', description: 'Prone to Late Blight & Scab' },
  { id: '3', name: 'Wheat', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80', description: 'Monitor for Rusts & Smut' },
  { id: '4', name: 'Corn', image: 'https://images.unsplash.com/photo-1518978586071-7001db10df9e?auto=format&fit=crop&q=80', description: 'Common Smut & Blight threats' },
  { id: '5', name: 'Rice', image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb29?auto=format&fit=crop&q=80', description: 'High risk for Blast & Sheath Blight' },
  { id: '6', name: 'Soybean', image: 'https://images.unsplash.com/photo-1629864227748-0382d56d78a1?auto=format&fit=crop&q=80', description: 'Watch for Rust & Nematodes' },
  { id: '7', name: 'Sugarcane', image: 'https://images.unsplash.com/photo-1519409893994-6b58fcad7bdf?auto=format&fit=crop&q=80', description: 'Smut & Red Rot vulnerability' },
  { id: '8', name: 'Cotton', image: 'https://images.unsplash.com/photo-1628108503816-72aa4c7fa3b7?auto=format&fit=crop&q=80', description: 'Wilt & Leaf Curl threats' },
  { id: '9', name: 'Onion', image: 'https://images.unsplash.com/photo-1618512496248-a0bfe8faa8f4?auto=format&fit=crop&q=80', description: 'Purple Blotch & Downy Mildew' },
  { id: '10', name: 'Apple', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6caa6?auto=format&fit=crop&q=80', description: 'Apple Scab & Powdery Mildew' },
  { id: '11', name: 'Cabbage', image: 'https://images.unsplash.com/photo-1593922629633-5c798ce0eac9?auto=format&fit=crop&q=80', description: 'Black Rot & Clubroot' },
  { id: '12', name: 'Chilli', image: 'https://images.unsplash.com/photo-1526015403247-41abfbcc8882?auto=format&fit=crop&q=80', description: 'Leaf Curl & Anthracnose' },
  { id: '13', name: 'Banana', image: 'https://images.unsplash.com/photo-1571508601891-ca5e7a713859?auto=format&fit=crop&q=80', description: 'Panama Disease & Sigatoka' },
  { id: '14', name: 'Brinjal', image: 'https://images.unsplash.com/photo-1601362772580-0a256a6a9be5?auto=format&fit=crop&q=80', description: 'Phomopsis Blight & Fruit Rot' }
];

export default function RealWorldDataScreen() {
  const router = useRouter();

  const handleCropPress = (id: string, name: string) => {
    router.push({ pathname: '/crop-details', params: { id, name } });
  };

  const renderCropCard = ({ item }: { item: typeof CROPS_DATA[0] }) => (
    <TouchableOpacity 
      style={styles.cardContainer} 
      activeOpacity={0.8}
      onPress={() => handleCropPress(item.id, item.name)}
    >
      <ImageBackground source={{ uri: item.image }} style={styles.cardImage} imageStyle={{ borderRadius: 16 }}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.cardGradient}
        >
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardDesc}>{item.description}</Text>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Real-World Intelligence</Text>
        <Text style={styles.headerSub}>Live tracking of agricultural diseases & global farming reports.</Text>
      </View>
      
      <FlatList
        data={CROPS_DATA}
        keyExtractor={item => item.id}
        renderItem={renderCropCard}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 20, paddingTop: 60, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  headerSub: { fontSize: 14, color: '#A5D6A7', marginTop: 8, lineHeight: 20 },
  
  gridContainer: { padding: 20, paddingBottom: 100 },
  row: { justifyContent: 'space-between', marginBottom: 20 },
  
  cardContainer: { width: CARD_WIDTH, height: 200, borderRadius: 16, backgroundColor: '#1a1a1a', elevation: 5, shadowColor: '#4CAF50', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8 },
  cardImage: { width: '100%', height: '100%', borderRadius: 16 },
  cardGradient: { flex: 1, justifyContent: 'flex-end', padding: 15, borderRadius: 16 },
  cardTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  cardDesc: { color: '#CCC', fontSize: 11, lineHeight: 16 }
});
