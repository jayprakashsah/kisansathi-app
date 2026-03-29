import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Animated, 
  TextInput,
  RefreshControl,
  Dimensions,
  ImageBackground,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

interface HistoryItem {
  id: string;
  type: string;
  timestamp: string;
  crop_name?: string;
  disease: string;
  confidence: string;
  medicine?: string;
  location?: string;
  severity?: string;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch("http://172.16.149.4:8000/history/all", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setHistory(data);
      setFilteredHistory(data);
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  useEffect(() => {
    let filtered = history;
    
    if (activeFilter !== 'All') {
      filtered = filtered.filter(item => 
        (activeFilter === 'Rover' && item.type === 'rover') ||
        (activeFilter === 'Manual' && (item.type === 'manual' || item.type === 'manual_fallback'))
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.disease.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.crop_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredHistory(filtered);
  }, [searchQuery, activeFilter, history]);

  const renderItem = ({ item, index }: { item: HistoryItem, index: number }) => {
    const scale = scrollY.interpolate({
      inputRange: [-1, 0, 150 * index, 150 * (index + 2)],
      outputRange: [1, 1, 1, 0],
    });
    const opacity = scrollY.interpolate({
      inputRange: [-1, 0, 150 * index, 150 * (index + 0.5)],
      outputRange: [1, 1, 1, 0],
    });

    const isRover = item.type === 'rover';

    return (
      <Animated.View style={[styles.cardContainer, { transform: [{ scale }], opacity }]}>
        <LinearGradient
          colors={isRover ? ['rgba(255, 213, 79, 0.8)', 'rgba(255, 179, 0, 0.95)'] : ['rgba(255, 224, 130, 0.8)', 'rgba(255, 160, 0, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.glassEffect} />
          <View style={styles.cardHeader}>
            <View style={styles.typeBadge}>
              <MaterialCommunityIcons 
                name={isRover ? "robot-industrial" : "hand-pointing-up"} 
                size={16} 
                color="#1B5E20" 
              />
              <Text style={styles.typeText}>{isRover ? 'ROVER' : 'SCAN'}</Text>
            </View>
            <Text style={styles.dateText}>{item.timestamp}</Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.mainInfo}>
              <Text style={styles.cropTitle}>{item.crop_name || 'Automated Scan'}</Text>
              <Text style={styles.diseaseTitle}>{item.disease}</Text>
            </View>
            <View style={styles.confidenceCircle}>
              <Text style={styles.confValue}>{item.confidence}%</Text>
              <Text style={styles.confLabel}>CONF</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <MaterialCommunityIcons name="map-marker" size={14} color="rgba(0,0,0,0.6)" />
              <Text style={styles.footerText}>{item.location || 'Main Field'}</Text>
            </View>
            {item.severity && (
              <View style={[styles.footerItem, styles.severityBadge]}>
                <Text style={styles.footerText}>Severity: {item.severity}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const FilterButton = ({ title }: { title: string }) => (
    <TouchableOpacity 
      onPress={() => setActiveFilter(title)}
      style={[styles.filterBtn, activeFilter === title && styles.filterBtnActive]}
    >
      <Text style={[styles.filterBtnText, activeFilter === title && styles.filterBtnTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=2000&auto=format&fit=crop' }} 
        style={StyleSheet.absoluteFill}
      >
        <LinearGradient 
          colors={['rgba(10, 40, 20, 0.88)', 'rgba(5, 25, 12, 0.96)']} 
          style={StyleSheet.absoluteFill} 
        />
      
      <View style={styles.header}>
        <Text style={styles.title}>Agronomic Discovery</Text>
        <Text style={styles.subtitle}>Historical Pathology Intelligence</Text>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBlur}>
          <MaterialCommunityIcons name="magnify" size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search crop or disease..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <FilterButton title="All" />
        <FilterButton title="Rover" />
        <FilterButton title="Manual" />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#03A9F4" />
          <Text style={styles.loaderText}>Accessing Database...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredHistory}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#03A9F4" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="database-off" size={60} color="#444" />
              <Text style={styles.emptyText}>No historical records found for this query.</Text>
            </View>
          }
        />
      )}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 25, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFF', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: '#03A9F4', marginTop: 5, letterSpacing: 1, textTransform: 'uppercase' },
  
  searchBarContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBlur: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 25, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchInput: { flex: 1, marginLeft: 10, color: '#FFF', fontSize: 16 },
  
  filtersContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20 },
  filterBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filterBtnActive: { backgroundColor: '#03A9F4', borderColor: '#03A9F4' },
  filterBtnText: { color: '#888', fontSize: 14, fontWeight: '600' },
  filterBtnTextActive: { color: '#FFF' },

  listContent: { padding: 20, paddingBottom: 100 },
  cardContainer: { marginBottom: 20 },
  card: { borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  glassEffect: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.03)' },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeText: { color: '#1B5E20', fontSize: 10, fontWeight: '900', marginLeft: 5 },
  dateText: { color: 'rgba(0,0,0,0.6)', fontSize: 11, fontWeight: '700' },
  
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  mainInfo: { flex: 1 },
  cropTitle: { color: 'rgba(0,0,0,0.6)', fontSize: 12, textTransform: 'uppercase', fontWeight: '900' },
  diseaseTitle: { color: '#111', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  
  confidenceCircle: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center' },
  confValue: { color: '#111', fontSize: 14, fontWeight: '900' },
  confLabel: { color: 'rgba(0,0,0,0.6)', fontSize: 8, fontWeight: 'bold' },
  
  footer: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.15)', paddingTop: 12 },
  footerItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  footerText: { color: '#333', fontSize: 12, marginLeft: 5, fontWeight: '600' },
  severityBadge: { backgroundColor: 'rgba(255, 68, 68, 0.3)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  loaderText: { color: '#888', marginTop: 15, fontSize: 14, letterSpacing: 1 },
  
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#444', marginTop: 20, fontSize: 16, textAlign: 'center', paddingHorizontal: 40 }
});
