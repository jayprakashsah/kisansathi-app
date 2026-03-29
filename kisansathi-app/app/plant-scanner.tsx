import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { CROP_KNOWLEDGE } from './crop-details';

export default function PlantScannerScreen() {
  const router = useRouter();
  const { cropName } = useLocalSearchParams();
  const cName = (cropName as string) || 'Tomato';
  
  const [images, setImages] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [loadingText, setLoadingText] = useState("Initializing neural network connection...");

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...uris]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const analyzePlant = async () => {
    if (images.length === 0) return;
    
    setAnalyzing(true);
    setLoadingText("Uploading to Deep Learning Server...");
    
    try {
      const cropDb = CROP_KNOWLEDGE[cName] || CROP_KNOWLEDGE['Tomato'];
      const diseasesData = JSON.stringify(cropDb.diseases);
        
      const formData = new FormData();
      formData.append('crop_name', cName);
      formData.append('disease_data', diseasesData);
      
      const filename = images[0].split('/').pop() || 'plant_leaf.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      
      formData.append('image', {
        uri: images[0],
        name: filename,
        type: type,
      } as any);

      setTimeout(() => setLoadingText("Initializing MobileNetV2 CNN Engine..."), 1500);
      setTimeout(() => setLoadingText("Extracting Pathology Vectors..."), 3000);

      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch("http://172.16.149.4:8000/analyze/disease", {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("Analysis failed on server.");
      }

      const result = await response.json();
      setReport(result);
      
    } catch (err) {
      console.error(err);
      Alert.alert("Server Error", "Could not connect to the ML Backend.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Diagnostics</Text>
        <View style={{width: 40}} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* TOP INTRO */}
        {!report && !analyzing && (
           <>
              <View style={styles.scanBox}>
                 <MaterialCommunityIcons name="leaf" size={60} color="#4CAF50" />
                 <Text style={styles.scanTitle}>Scan {cName} Leaves</Text>
                 <Text style={styles.scanSub}>Upload multiple close-up photos of the affected areas. Our Agronomy AI will detect the exact viral or bacterial issue.</Text>
                 
                 <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                   <MaterialCommunityIcons name="camera-plus" size={22} color="#FFF" />
                   <Text style={styles.uploadBtnText}>Select Photos</Text>
                 </TouchableOpacity>
              </View>
              
              {/* IMAGE GRID */}
              {images.length > 0 && (
                <View style={styles.imageGrid}>
                  {images.map((uri, idx) => (
                     <View key={idx} style={styles.imageWrapper}>
                       <Image source={{ uri }} style={styles.thumbnail} />
                       <TouchableOpacity style={styles.deleteThumbnail} onPress={() => removeImage(idx)}>
                          <MaterialCommunityIcons name="close" size={16} color="#FFF" />
                       </TouchableOpacity>
                     </View>
                  ))}
                </View>
              )}
           </>
        )}

        {/* ANALYZING STATE */}
        {analyzing && (
           <View style={styles.loadingContainer}>
              <MaterialCommunityIcons name="robot-outline" size={80} color="#03A9F4" style={styles.pulsingIcon} />
              <ActivityIndicator size="large" color="#03A9F4" style={{marginTop: 20, marginBottom: 15}} />
              <Text style={styles.loadingText}>{loadingText}</Text>
           </View>
        )}

        {/* AI REPORT CARD */}
        {report && (
           <View style={styles.reportContainer}>
              <View style={styles.reportHeader}>
                 <MaterialCommunityIcons name="check-decagram" size={30} color="#4CAF50" />
                 <Text style={styles.reportTitle}>Analysis Complete</Text>
              </View>
              
              <View style={styles.confidenceRow}>
                 <Text style={styles.confLabel}>AI Confidence Match:</Text>
                 <Text style={styles.confValue}>{report.confidence}%</Text>
              </View>
              
              <View style={styles.diagnosisCard}>
                 <Text style={styles.diagLabel}>IDENTIFIED PATHOLOGY</Text>
                 <Text style={styles.diseaseName}>{report.disease}</Text>
                 
                 <View style={styles.divider} />
                 
                 <View style={styles.diagRow}>
                   <MaterialCommunityIcons name="eye-check" size={20} color="#FFB300" />
                   <Text style={styles.diagText}>Detected: {report.symptomsDetected}</Text>
                 </View>
              </View>
              
              <View style={styles.actionCard}>
                 <Text style={styles.actionLabel}>RECOMMENDED MEDICINE</Text>
                 <View style={styles.actionContent}>
                    <MaterialCommunityIcons name="pill" size={24} color="#03A9F4" />
                    <Text style={styles.actionMainText}>{report.medicine}</Text>
                 </View>
              </View>

              <View style={styles.actionCardAlt}>
                 <Text style={styles.actionLabel}>ACTION PLAN</Text>
                 <View style={styles.actionContent}>
                    <MaterialCommunityIcons name="shield-half-full" size={24} color="#4CAF50" />
                    <Text style={styles.actionMainText}>{report.prevention}</Text>
                 </View>
              </View>

              <TouchableOpacity style={styles.resetBtn} onPress={() => { setReport(null); setImages([]); }}>
                 <Text style={styles.resetText}>Analyze Another Sample</Text>
              </TouchableOpacity>
           </View>
        )}

      </ScrollView>

      {/* BOTTOM ANALYZE BUTTON */}
      {!analyzing && !report && images.length > 0 && (
         <TouchableOpacity style={styles.analyzeBtnFab} onPress={analyzePlant}>
            <LinearGradient colors={['#0288D1', '#01579B']} style={styles.analyzeGradient}>
              <MaterialCommunityIcons name="magic-staff" size={24} color="#FFF" />
              <Text style={styles.analyzeText}>Analyze {images.length} Image{images.length > 1 ? 's' : ''}</Text>
            </LinearGradient>
         </TouchableOpacity>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, backgroundColor: '#111' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  
  scrollContent: { padding: 20, paddingBottom: 120 },
  
  scanBox: { backgroundColor: 'rgba(76, 175, 80, 0.1)', padding: 30, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(76, 175, 80, 0.3)', marginBottom: 20 },
  scanTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginTop: 15 },
  scanSub: { color: '#A5D6A7', textAlign: 'center', fontSize: 13, marginTop: 10, lineHeight: 20, paddingHorizontal: 10 },
  uploadBtn: { flexDirection: 'row', backgroundColor: '#4CAF50', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 30, marginTop: 25, alignItems: 'center' },
  uploadBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },

  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  imageWrapper: { width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  thumbnail: { width: '100%', height: '100%' },
  deleteThumbnail: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 12 },

  analyzeBtnFab: { position: 'absolute', bottom: 30, alignSelf: 'center', width: '85%', shadowColor: '#03A9F4', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  analyzeGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 30 },
  analyzeText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 10, letterSpacing: 0.5 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  pulsingIcon: { opacity: 0.8 },
  loadingText: { color: '#03A9F4', fontSize: 16, fontWeight: '500' },

  reportContainer: { marginTop: 10 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'center' },
  reportTitle: { color: '#4CAF50', fontSize: 26, fontWeight: '900', marginLeft: 10 },
  
  confidenceRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', marginBottom: 25 },
  confLabel: { color: '#FFF', fontSize: 16, marginRight: 10 },
  confValue: { color: '#03A9F4', fontSize: 28, fontWeight: 'bold' },

  diagnosisCard: { backgroundColor: '#111', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#333', marginBottom: 15 },
  diagLabel: { color: '#888', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  diseaseName: { color: '#F44336', fontSize: 24, fontWeight: 'bold', marginTop: 5 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 15 },
  diagRow: { flexDirection: 'row', alignItems: 'flex-start' },
  diagText: { color: '#CCC', flex: 1, marginLeft: 10, fontSize: 14, lineHeight: 20 },

  actionCard: { backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(3, 169, 244, 0.3)', marginBottom: 15 },
  actionCardAlt: { backgroundColor: 'rgba(76, 175, 80, 0.1)', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(76, 175, 80, 0.3)', marginBottom: 30 },
  actionLabel: { color: '#FFF', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
  actionContent: { flexDirection: 'row', alignItems: 'center' },
  actionMainText: { color: '#FFF', fontSize: 16, flex: 1, marginLeft: 15, fontWeight: '500', lineHeight: 22 },

  resetBtn: { padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#4CAF50', borderRadius: 30 },
  resetText: { color: '#4CAF50', fontSize: 16, fontWeight: 'bold' }
});
