import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CROPS_DATA } from './(tabs)/real-world-data';

// Highly Advanced Data Structure
export const CROP_KNOWLEDGE: Record<string, any> = {
  'Tomato': {
    env: { climate: 'Warm & Sunny', temp: '21°C - 29°C', soil: 'Well-drained, acidic (pH 6.2 - 6.8)', season: 'Late Spring/Summer' },
    diseases: [
      { name: 'Tomato Mosaic Virus (ToMV)', symptoms: 'Mottling, yellowing, stunted growth, reduced fruit yield', conditions: 'Spreads rapidly in hot, dry weather; transmitted via contaminated hands/tools', prevention: 'Plant resistant varieties, strictly wash tools', medicine: 'No chemical cure. Use Tri-sodium Phosphate for tool washing.' },
      { name: 'Early Blight', symptoms: 'Brown spots with concentric target rings on lower leaves', conditions: 'High humidity (>90%) with warm temperatures (24°C - 29°C)', prevention: 'Avoid overhead watering, 3-year crop rotation', medicine: 'Mancozeb 75% WP or Copper Oxychloride 50% WP (2.5g/L)' }
    ]
  },
  'Potato': {
    env: { climate: 'Cool & Humid', temp: '15°C - 20°C', soil: 'Loose, loamy, highly fertile (pH 5.0 - 5.5)', season: 'Early Spring' },
    diseases: [
      { name: 'Late Blight', symptoms: 'Water-soaked spots on leaves turning brown/black, white fungal growth under leaves', conditions: 'Prolonged cool, wet weather; 100% relative humidity', prevention: 'Plant certified disease-free seed, destroy cull piles', medicine: 'Metalaxyl 8% + Mancozeb 64% WP (2.5g/L)' },
      { name: 'Potato Virus Y', symptoms: 'Leaf dropping, crinkling, distinct yellow mottling', conditions: 'Rapid spread by aphid vectors in mild, moderate temperatures', prevention: 'Strict aphid control, remove volunteer potatoes', medicine: 'Apply Imidacloprid 17.8 SL (0.5ml/L) to control vectors' }
    ]
  },
  'Wheat': {
    env: { climate: 'Temperate', temp: '21°C - 24°C', soil: 'Clay loam (pH 6.0 - 7.0)', season: 'Autumn/Winter' },
    diseases: [
      { name: 'Wheat Rust (Stem & Stripe)', symptoms: 'Orange/reddish pustules erupting from leaf surfaces', conditions: 'Warm days (20°C - 30°C) with heavy morning dew', prevention: 'Cultivate rust-resistant seeds', medicine: 'Propiconazole 25% EC (1ml/L) at booting stage' }
    ]
  },
  'Corn': {
    env: { climate: 'Warm', temp: '20°C - 30°C', soil: 'Deep, fertile, rich in organic matter (pH 5.8 - 7.0)', season: 'Spring/Summer' },
    diseases: [
      { name: 'Northern Corn Leaf Blight', symptoms: 'Long, narrow, cigar-shaped gray/green lesions', conditions: 'Moderate temperatures (18°C - 27°C) with persistent heavy dew or rain', prevention: 'Tillage to bury residue, select resistant hybrids', medicine: 'Azoxystrobin + Cyproconazole formulations' }
    ]
  },
  'Rice': {
    env: { climate: 'Tropical/Subtropical', temp: '21°C - 37°C', soil: 'Heavy clay/loam with high water retention', season: 'Monsoon/Rainy Summer' },
    diseases: [
      { name: 'Rice Blast', symptoms: 'Diamond-shaped white/gray lesions with dark borders on leaves and panicles', conditions: 'High humdity (>90%), frequent rain, overcast skies, temp 25°C-28°C', prevention: 'Avoid excessive nitrogen, maintain precise water depth', medicine: 'Tricyclazole 75% WP (0.6g/L)' }
    ]
  },
  'Soybean': {
    env: { climate: 'Warm & Moist', temp: '20°C - 30°C', soil: 'Well-drained loam', season: 'Late Spring' },
    diseases: [
      { name: 'Asian Soybean Rust', symptoms: 'Tiny brown/tan spots appearing on the lower canopy moving upward', conditions: 'Prolonged periods of leaf wetness (>6 hrs) at moderate temperatures', prevention: 'Based on early scouting networks', medicine: 'Tebuconazole 25.9% EC (1.5ml/L)' }
    ]
  },
  'Sugarcane': {
    env: { climate: 'Hot & Tropical', temp: '32°C - 38°C', soil: 'Deep, well-draining, rich loam', season: 'All-year tropical' },
    diseases: [
      { name: 'Red Rot', symptoms: 'Yellowing of top leaves, core of cane turns red with white horizontal bands', conditions: 'Water-logged soil combined with high temperatures', prevention: 'Hot water treatment of seed canes, crop rotation', medicine: 'Carbendazim 50% WP (1g/L) for set treatment' }
    ]
  },
  'Cotton': {
    env: { climate: 'Hot & Dry', temp: '32°C - 36°C', soil: 'Sandy loam or clay loam (pH 5.5 - 8.5)', season: 'Spring' },
    diseases: [
      { name: 'Cotton Leaf Curl Virus', symptoms: 'Upward/downward curling of leaves, thickening of veins, leaf-like enations', conditions: 'High populations of whitefly vectors in peak summer heat', prevention: 'Destroy cotton residue deeply post-harvest', medicine: 'Thiamethoxam 25% WG (0.2g/L) strictly against vectors' }
    ]
  },
  'Onion': {
    env: { climate: 'Cool/Mild', temp: '13°C - 24°C', soil: 'Fertile, well-drained loams (pH 6.0 - 6.8)', season: 'Autumn/Winter' },
    diseases: [
      { name: 'Purple Blotch', symptoms: 'Small water-soaked lesions turning purplish-brown with yellow halos', conditions: 'High humidity (>90%) and rain; temps 21°C - 30°C', prevention: '2-3 year rotation, lower planting density', medicine: 'Chlorothalonil 75% WP (2g/L)' }
    ]
  },
  'Apple': {
    env: { climate: 'Cool Temperate', temp: '21°C - 24°C', soil: 'Deep, well-drained loamy soil', season: 'Early Spring' },
    diseases: [
      { name: 'Apple Scab', symptoms: 'Olive green to black crusty spots on leaves and fruit deformities', conditions: 'Prolonged wet, rainy springs causing ascospore release', prevention: 'Rake and destroy fallen leaves', medicine: 'Captan 50% WP (3g/L) or Kresoxim-methyl' }
    ]
  },
  'Cabbage': {
    env: { climate: 'Cool', temp: '15°C - 20°C', soil: 'Rich in organic matter (pH 6.0 - 6.5)', season: 'Late Summer/Autumn' },
    diseases: [
      { name: 'Black Rot', symptoms: 'V-shaped yellow lesions at leaf margins turning brown with blackened veins', conditions: 'Warm weather and splashed water/rain transmitting bacteria', prevention: 'Strictly avoid overhead irrigation', medicine: 'Copper Hydroxide 77% WP (2g/L)' }
    ]
  },
  'Chilli': {
    env: { climate: 'Warm Tropical', temp: '20°C - 30°C', soil: 'Well-draining silty loam', season: 'Spring/Summer' },
    diseases: [
      { name: 'Leaf Curl Virus', symptoms: 'Severe curling, smaller leaves, extreme stunting of plant growth', conditions: 'Dry, extremely hot weather promoting heavy whitefly/thrip breeding', prevention: 'Install yellow sticky traps, remove weed hosts', medicine: 'Spray Fipronil 5% SC (2ml/L) against thrips' }
    ]
  },
  'Banana': {
    env: { climate: 'Humid Tropical', temp: '26°C - 30°C', soil: 'Deep, rich, exceptionally well-drained', season: 'Perennial' },
    diseases: [
      { name: 'Panama Disease (TR4)', symptoms: 'Yellowing of older leaves, splitting of pseudostem, internal vascular browning', conditions: 'Spreads quickly through contaminated, water-logged soil or dirty farming boots', prevention: 'Use only certified resistant tissue-culture plantlets', medicine: 'No curative medicine. Soil drenching with Carbendazim merely slows it.' }
    ]
  },
  'Brinjal': {
    env: { climate: 'Warm & Humid', temp: '25°C - 32°C', soil: 'Fertile sandy loam (pH 5.5 - 6.0)', season: 'Warm Seasons' },
    diseases: [
      { name: 'Phomopsis Blight', symptoms: 'Circular brown spots on leaves, fruit rotting with pale dark depressions', conditions: 'Rainy season, high humidity coupled with temperatures near 28°C', prevention: 'Seed treatment before sowing', medicine: 'Mancozeb 75% WP (2.5g/L) foliar spray' }
    ]
  }
};

export default function CropDetailsScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  
  const crop = CROPS_DATA.find(c => c.id === id) || CROPS_DATA[0];
  const knowledge = CROP_KNOWLEDGE[crop.name as string] || CROP_KNOWLEDGE['Tomato'];
  
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveReports();
  }, []);

  const fetchLiveReports = async () => {
    try {
      setLoading(true);
      const query = encodeURIComponent(`${crop.name} disease farming`);
      const response = await fetch(`https://www.reddit.com/search.json?q=${query}&sort=new&limit=8`);
      const data = await response.json();
      
      if (data && data.data && data.data.children) {
        setNews(data.data.children.map((child: any) => child.data));
      }
    } catch (error) {
      console.error("Failed to fetch live reports", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <ImageBackground source={{ uri: crop.image }} style={styles.headerImage}>
          <LinearGradient colors={['rgba(0,0,0,0.1)', '#0a0a0a']} style={styles.headerGradient}>
             <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
               <MaterialCommunityIcons name="arrow-left" size={28} color="#FFF" />
             </TouchableOpacity>
             <View style={styles.headerTextContainer}>
                <Text style={styles.title}>{crop.name} Analysis</Text>
                <Text style={styles.subtitle}>Advanced Agronomic Profiling</Text>
             </View>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.content}>

           {/* ENVIRONMENTAL METRICS */}
           <View style={styles.sectionHeader}>
             <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color="#FF9800" />
             <Text style={styles.sectionTitle}>Environmental Triggers</Text>
           </View>
           
           <View style={styles.envGrid}>
             <View style={styles.envCard}>
               <MaterialCommunityIcons name="thermometer" size={20} color="#F44336" />
               <Text style={styles.envLabel}>Opt Temp</Text>
               <Text style={styles.envValue}>{knowledge.env.temp}</Text>
             </View>
             <View style={styles.envCard}>
               <MaterialCommunityIcons name="water" size={20} color="#03A9F4" />
               <Text style={styles.envLabel}>Climate</Text>
               <Text style={styles.envValue}>{knowledge.env.climate}</Text>
             </View>
             <View style={styles.envCard}>
               <MaterialCommunityIcons name="sprout" size={20} color="#4CAF50" />
               <Text style={styles.envLabel}>Soil Health</Text>
               <Text style={styles.envValue}>{knowledge.env.soil}</Text>
             </View>
             <View style={styles.envCard}>
               <MaterialCommunityIcons name="calendar-month" size={20} color="#9C27B0" />
               <Text style={styles.envLabel}>Season</Text>
               <Text style={styles.envValue}>{knowledge.env.season}</Text>
             </View>
           </View>

           {/* DISEASE DATABASE */}
           <View style={styles.sectionHeader}>
             <MaterialCommunityIcons name="virus-outline" size={24} color="#F44336" />
             <Text style={styles.sectionTitle}>Pathology & Symptoms</Text>
           </View>
           
           {knowledge.diseases.map((d: any, idx: number) => (
             <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']} style={styles.diseaseCard} key={idx}>
               <Text style={styles.diseaseTitle}>{d.name}</Text>
               
               <View style={styles.diseaseRow}>
                 <MaterialCommunityIcons name="eye-outline" size={16} color="#FFB300" style={{marginTop: 3}} />
                 <Text style={styles.diseaseText}><Text style={styles.boldText}>Symptoms:</Text> {d.symptoms}</Text>
               </View>
               
               <View style={styles.diseaseRow}>
                 <MaterialCommunityIcons name="map-marker-alert-outline" size={16} color="#03A9F4" style={{marginTop: 3}} />
                 <Text style={styles.diseaseText}><Text style={styles.boldText}>Trigger Env:</Text> {d.conditions}</Text>
               </View>
               
               <View style={styles.diseaseRow}>
                 <MaterialCommunityIcons name="shield-check" size={16} color="#4CAF50" style={{marginTop: 3}} />
                 <Text style={styles.diseaseText}><Text style={styles.boldText}>Prevention:</Text> {d.prevention}</Text>
               </View>
             </LinearGradient>
           ))}

           {/* LIVE API INTELLIGENCE */}
           <View style={styles.sectionHeader}>
             <MaterialCommunityIcons name="web" size={24} color="#03A9F4" />
             <Text style={styles.sectionTitle}>Live World Reports & Alerts</Text>
           </View>
           <Text style={styles.apiDescText}>Updating daily aggregating real-time conditions from modern farming communities.</Text>
           
           {loading ? (
              <ActivityIndicator size="large" color="#03A9F4" style={{marginTop: 30}} />
           ) : news.length > 0 ? (
              news.map((post, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.newsCard} 
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL(`https://reddit.com${post.permalink}`)}
                >
                  <Text style={styles.newsTitle} numberOfLines={2}>{post.title}</Text>
                  <View style={styles.newsFooter}>
                    <Text style={styles.newsAuthor}>Reported by: {post.author}</Text>
                    <Text style={styles.newsSub}>{post.subreddit_name_prefixed}</Text>
                  </View>
                </TouchableOpacity>
              ))
           ) : (
              <Text style={{color: '#888', textAlign: 'center', marginTop: 20}}>No live reports currently detected.</Text>
           )}

           <View style={{height: 100}} />
        </View>
      </ScrollView>

      {/* FLOATING ACTION BUTTON FOR SCANNER */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => {
          Alert.alert(
            "Check Plant Health",
            "Select your preferred diagnostic tool:",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Use Rover", onPress: () => Alert.alert("Rover AI", "Connecting to nearest automated rover...") },
              { text: "Use Phone", onPress: () => router.push({ pathname: '/plant-scanner', params: { cropName: crop.name } }) }
            ]
          );
        }}
      >
        <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.fabGradient}>
          <MaterialCommunityIcons name="line-scan" size={24} color="#FFF" />
          <Text style={styles.fabText}>Check Your Plant</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  headerImage: { width: '100%', height: 350 },
  headerGradient: { flex: 1, justifyContent: 'space-between', padding: 20 },
  backBtn: { marginTop: 40, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  headerTextContainer: { marginBottom: 10 },
  title: { fontSize: 36, fontWeight: '900', color: '#FFF', textTransform: 'uppercase', letterSpacing: 1 },
  subtitle: { fontSize: 16, color: '#A5D6A7', fontWeight: '500' },
  
  content: { padding: 20, paddingTop: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginLeft: 10 },
  
  envGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  envCard: { width: '48%', backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  envLabel: { color: '#888', fontSize: 12, marginTop: 10, textTransform: 'uppercase', fontWeight: 'bold' },
  envValue: { color: '#FFF', fontSize: 14, marginTop: 4, fontWeight: '600' },

  diseaseCard: { borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(244, 67, 54, 0.2)' },
  diseaseTitle: { fontSize: 22, fontWeight: 'bold', color: '#F44336', marginBottom: 15 },
  diseaseRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  diseaseText: { color: '#CCC', fontSize: 14, marginLeft: 10, flex: 1, lineHeight: 22 },
  boldText: { color: '#FFF', fontWeight: 'bold' },
  
  apiDescText: { color: '#888', fontSize: 13, marginBottom: 20, lineHeight: 18 },
  newsCard: { backgroundColor: '#111', padding: 18, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#03A9F4' },
  newsTitle: { color: '#FFF', fontSize: 15, fontWeight: '600', lineHeight: 22, marginBottom: 10 },
  newsFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newsAuthor: { color: '#666', fontSize: 12 },
  newsSub: { color: '#03A9F4', fontSize: 12, fontWeight: 'bold' },
  
  fab: { position: 'absolute', bottom: 30, alignSelf: 'center', width: '85%', shadowColor: '#4CAF50', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 30 },
  fabText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 10, letterSpacing: 0.5 }
});
