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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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

const FARM_BG = 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=2000&auto=format&fit=crop';

const DISEASE_COLORS: Record<string, [string, string]> = {
  rover:           ['#00C853', '#1B5E20'],
  manual:          ['#FF6F00', '#E65100'],
  manual_fallback: ['#0288D1', '#01579B'],
};

function getBadgeColors(type: string): [string, string] {
  return DISEASE_COLORS[type] ?? ['#37474F', '#263238'];
}

function SeverityDot({ severity }: { severity?: string }) {
  const color =
    severity?.toLowerCase() === 'high'   ? '#FF5252' :
    severity?.toLowerCase() === 'medium' ? '#FFD740' :
    severity?.toLowerCase() === 'low'    ? '#69F0AE' : 'transparent';
  if (!severity) return null;
  return (
    <View style={[styles.severityDot, { backgroundColor: color }]} />
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory]         = useState<HistoryItem[]>([]);
  const [filtered, setFiltered]       = useState<HistoryItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [search, setSearch]           = useState('');
  const [tab, setTab]                 = useState<'all' | 'rover' | 'manual'>('all');
  const [stats, setStats]             = useState({ total: 0, rover: 0, manual: 0 });

  // Entrance animations
  const headerY   = useRef(new Animated.Value(-40)).current;
  const headerOp  = useRef(new Animated.Value(0)).current;
  const bodyOp    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchHistory();
    Animated.stagger(80, [
      Animated.parallel([
        Animated.spring(headerY,  { toValue: 0, useNativeDriver: true, friction: 7 }),
        Animated.timing(headerOp, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(bodyOp, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('userToken');
      const res  = await fetch('http://172.16.149.4:8000/history/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json() as HistoryItem[];
      const roverCnt  = data.filter(i => i.type === 'rover').length;
      const manualCnt = data.filter(i => i.type !== 'rover').length;
      setHistory(data);
      setFiltered(data);
      setStats({ total: data.length, rover: roverCnt, manual: manualCnt });
    } catch (e) {
      console.error('History fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-filter when search or tab changes
  useEffect(() => {
    let result = history;
    if (tab !== 'all') {
      result = result.filter(i =>
        tab === 'rover' ? i.type === 'rover' : i.type !== 'rover'
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.disease.toLowerCase().includes(q) ||
        (i.crop_name ?? '').toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, tab, history]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  // ─── Stat Card ─────────────────────────────────────────────────────────────
  const StatCard = ({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) => (
    <LinearGradient
      colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
      style={styles.statCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  );

  // ─── History Card ──────────────────────────────────────────────────────────
  const renderCard = ({ item, index }: { item: HistoryItem; index: number }) => {
    const gradColors = getBadgeColors(item.type);
    const isRover    = item.type === 'rover';
    const icon       = isRover ? 'robot-industrial' : 'camera-iris';
    const label      = isRover ? 'ROVER' : 'MOBILE SCAN';
    const conf       = parseFloat(item.confidence);

    return (
      <View style={styles.cardOuter}>
        {/* Left color accent bar */}
        <LinearGradient
          colors={gradColors}
          style={styles.accentBar}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <View style={styles.cardInner}>
          {/* Top row */}
          <View style={styles.cardTopRow}>
            {/* Scan type badge */}
            <LinearGradient
              colors={gradColors}
              style={styles.typeBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons name={icon as any} size={13} color="#FFF" />
              <Text style={styles.typeLabel}>{label}</Text>
            </LinearGradient>

            {/* Timestamp + severity */}
            <View style={styles.metaRight}>
              <SeverityDot severity={item.severity} />
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
          </View>

          {/* Middle info */}
          <View style={styles.cardMid}>
            <View style={styles.nameCol}>
              {item.crop_name && (
                <Text style={styles.cropTag}>{item.crop_name.toUpperCase()}</Text>
              )}
              <Text style={styles.diseaseText} numberOfLines={2}>{item.disease}</Text>
            </View>

            {/* Accuracy ring */}
            <View style={styles.ringWrap}>
              <View style={styles.ring}>
                <Text style={styles.ringVal}>{Math.round(conf)}</Text>
                <Text style={styles.ringUnit}>%</Text>
              </View>
              <Text style={styles.ringLabel}>CONF.</Text>
            </View>
          </View>

          {/* Bottom row */}
          {(item.location || item.medicine) && (
            <View style={styles.cardBottom}>
              {item.location && (
                <View style={styles.bottomItem}>
                  <MaterialCommunityIcons name="map-marker" size={12} color="#69F0AE" />
                  <Text style={styles.bottomText}>{item.location}</Text>
                </View>
              )}
              {item.medicine && (
                <View style={styles.bottomItem}>
                  <MaterialCommunityIcons name="pill" size={12} color="#80D8FF" />
                  <Text style={styles.bottomText} numberOfLines={1}>{item.medicine}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground source={{ uri: FARM_BG }} style={styles.bg} resizeMode="cover">
        <LinearGradient
          colors={['rgba(10, 40, 20, 0.88)', 'rgba(5, 25, 12, 0.96)']}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={styles.safe}>

          {/* ── HEADER ─────────────────────────────────────────────────────── */}
          <Animated.View style={[styles.header, { opacity: headerOp, transform: [{ translateY: headerY }] }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={26} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerSub}>Kisansathi Intelligence</Text>
              <Text style={styles.headerTitle}>Discovery Log</Text>
            </View>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="leaf" size={24} color="#69F0AE" />
            </View>
          </Animated.View>

          {/* ── STATS ──────────────────────────────────────────────────────── */}
          <Animated.View style={[styles.statsRow, { opacity: bodyOp }]}>
            <StatCard icon="database-search" value={stats.total}  label="Total"  color="#FFD740" />
            <StatCard icon="robot"           value={stats.rover}  label="Rover"  color="#69F0AE" />
            <StatCard icon="cellphone-check" value={stats.manual} label="Manual" color="#80D8FF" />
          </Animated.View>

          {/* ── SEARCH + FILTER ─────────────────────────────────────────────── */}
          <Animated.View style={[styles.controlsBlock, { opacity: bodyOp }]}>
            {/* Search bar */}
            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={22} color="#A5D6A7" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search disease or crop…"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#A5D6A7" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter pills */}
            <View style={styles.filterRow}>
              {(['all', 'rover', 'manual'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTab(t)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={tab === t ? ['#00C853', '#1B5E20'] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                    style={styles.pill}
                    start={{x:0,y:0}} end={{x:1,y:0}}
                  >
                    <Text style={[styles.pillText, tab === t && styles.pillTextActive]}>
                      {t === 'all' ? '🌿 All' : t === 'rover' ? '🤖 Rover' : '📸 Manual'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* ── LIST ───────────────────────────────────────────────────────── */}
          {loading && !refreshing ? (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color="#69F0AE" />
              <Text style={styles.loaderText}>Connecting to Farm Intelligence…</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={i => i.id}
              renderItem={renderCard}
              contentContainerStyle={styles.listPad}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#69F0AE"
                  colors={['#69F0AE']}
                />
              }
              ListHeaderComponent={
                filtered.length > 0 ? (
                  <Text style={styles.listCount}>{filtered.length} record{filtered.length !== 1 ? 's' : ''} found</Text>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <MaterialCommunityIcons name="sprout-outline" size={72} color="rgba(105,240,174,0.15)" />
                  <Text style={styles.emptyTitle}>No Data Yet</Text>
                  <Text style={styles.emptySub}>
                    {search || tab !== 'all'
                      ? 'Try adjusting your search or filter.'
                      : 'Scan a plant or deploy the rover to build your history.'}
                  </Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </ImageBackground>
    </>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  bg:   { flex: 1 },
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 6,
    marginBottom: 18,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)',
    marginRight: 12,
  },
  headerCenter: { flex: 1 },
  headerSub:    { fontSize: 13, color: '#A5D6A7', fontWeight: '500', letterSpacing: 0.5 },
  headerTitle:  { fontSize: 28, fontWeight: '800', color: '#FFF', letterSpacing: 0.5, marginTop: 2 },
  headerIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(105,240,174,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(105,240,174,0.3)',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: { fontSize: 16, fontWeight: '800', color: '#FFF', marginTop: 6 },
  statLabel: { fontSize: 9, color: '#C8E6C9', marginTop: 2, textAlign: 'center' },

  // Controls
  controlsBlock: { paddingHorizontal: 18, marginBottom: 14, gap: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 0.5,
    borderColor: 'rgba(105,240,174,0.25)',
    gap: 10,
  },
  searchInput: { flex: 1, color: '#FFF', fontSize: 15 },
  filterRow: { flexDirection: 'row', gap: 10 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 50,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  pillText:       { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '700' },
  pillTextActive: { color: '#FFF' },

  // List
  listPad:   { paddingHorizontal: 18, paddingBottom: 40, paddingTop: 4 },
  listCount: { fontSize: 12, color: '#A5D6A7', fontWeight: '600', marginBottom: 12, letterSpacing: 0.5 },

  // Card
  cardOuter: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  accentBar: { width: 6 },
  cardInner: { flex: 1, padding: 18 },

  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  typeLabel: { fontSize: 10, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  metaRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timestamp: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  severityDot: { width: 8, height: 8, borderRadius: 4 },

  cardMid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  nameCol: { flex: 1, paddingRight: 12 },
  cropTag: { fontSize: 10, fontWeight: '800', color: '#69F0AE', letterSpacing: 1, marginBottom: 4 },
  diseaseText: { fontSize: 19, fontWeight: '800', color: '#FFF', lineHeight: 24 },

  ringWrap: { alignItems: 'center' },
  ring: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, borderColor: '#00C853',
    backgroundColor: 'rgba(0,200,83,0.1)',
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row',
  },
  ringVal:   { fontSize: 15, fontWeight: '900', color: '#FFF' },
  ringUnit:  { fontSize: 9,  fontWeight: '700', color: '#A5D6A7', marginTop: 4 },
  ringLabel: { fontSize: 8,  fontWeight: '800', color: 'rgba(165,214,167,0.5)', marginTop: 4, letterSpacing: 0.5 },

  cardBottom: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.07)',
    paddingTop: 10,
    gap: 6,
  },
  bottomItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bottomText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', flex: 1 },

  // Loader / Empty
  loaderBox:  { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  loaderText: { color: '#69F0AE', marginTop: 16, fontWeight: '600', letterSpacing: 0.5 },
  emptyBox:   { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', marginTop: 18 },
  emptySub:   { color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingHorizontal: 50, marginTop: 8, lineHeight: 20 },
});
