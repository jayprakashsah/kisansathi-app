import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView,
  Modal,
  Dimensions,
  Vibration,
  PanResponder,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polyline } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function RemoteControl() {
  const [isLocked, setIsLocked] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pathPoints, setPathPoints] = useState([]); // Stores the X,Y coordinates of your drawing

  // 🚀 THE JETSON NANO DATA PIPELINE 🚀
  // This function structures the data perfectly for your backend/Jetson
  const sendCommandToJetson = async (actionType, payloadData = null) => {
    if (isLocked && actionType !== 'LOCK_SYSTEM') {
      Alert.alert("Locked", "Rover is locked. Unlock to send commands.");
      return;
    }

    Vibration.vibrate(50);

    // This is the exact JSON structure the Jetson Nano will receive
    const jetsonPayload = {
      command: actionType,
      data: payloadData,
      timestamp: new Date().toISOString(),
    };

    console.log("📤 SENDING TO JETSON NANO:", JSON.stringify(jetsonPayload, null, 2));

    // LATER: We will replace this with an actual fetch() call to your backend!
    // await fetch('http://YOUR_BACKEND_IP:8000/rover/command', { ... })
  };

  // 🎨 DRAWING LOGIC (Captures finger movement)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setPathPoints([]), // Clear old path on new touch
      onPanResponderMove: (event, gestureState) => {
        const newPoint = { x: gestureState.x0 + gestureState.dx, y: gestureState.y0 + gestureState.dy };
        setPathPoints((prevPoints) => [...prevPoints, newPoint]);
      },
    })
  ).current;

  // Converts the array of {x,y} objects into a string format for SVG to render
  const svgPoints = pathPoints.map(p => `${p.x},${p.y}`).join(' ');

  const handleSendPath = () => {
    if (pathPoints.length === 0) {
      Alert.alert("Empty Path", "Please draw a route first.");
      return;
    }
    sendCommandToJetson('FOLLOW_PATH', { coordinates: pathPoints });
    setIsDrawing(false);
    setPathPoints([]); // Clear after sending
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.background}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Rover Console</Text>
            <Text style={[styles.status, { color: isLocked ? '#F44336' : '#4CAF50' }]}>
              {isLocked ? 'SYSTEM LOCKED' : 'SYSTEM ACTIVE'}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.lockBtn, { backgroundColor: isLocked ? '#F44336' : '#333' }]}
            onPress={() => {
                setIsLocked(!isLocked);
                sendCommandToJetson('LOCK_SYSTEM', { locked: !isLocked });
            }}
          >
            <MaterialCommunityIcons name={isLocked ? "lock" : "lock-open"} size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* CONTROLLER AREA */}
        <View style={styles.controllerWrapper}>
          
          {/* LEFT SIDE: MOVEMENT D-PAD */}
          <View style={styles.dpadContainer}>
            <Text style={styles.zoneLabel}>MOVEMENT</Text>
            <TouchableOpacity style={styles.dpadBtn} onPress={() => sendCommandToJetson('MOVE', { direction: 'FORWARD' })}>
              <MaterialCommunityIcons name="arrow-up-bold" size={40} color={isLocked ? '#555' : '#03A9F4'} />
            </TouchableOpacity>
            
            <View style={styles.dpadMiddleRow}>
              <TouchableOpacity style={styles.dpadBtn} onPress={() => sendCommandToJetson('MOVE', { direction: 'LEFT' })}>
                <MaterialCommunityIcons name="arrow-left-bold" size={40} color={isLocked ? '#555' : '#03A9F4'} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.stopBtn} onPress={() => sendCommandToJetson('MOVE', { direction: 'STOP' })}>
                <Text style={styles.stopText}>STOP</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.dpadBtn} onPress={() => sendCommandToJetson('MOVE', { direction: 'RIGHT' })}>
                <MaterialCommunityIcons name="arrow-right-bold" size={40} color={isLocked ? '#555' : '#03A9F4'} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.dpadBtn} onPress={() => sendCommandToJetson('MOVE', { direction: 'REVERSE' })}>
              <MaterialCommunityIcons name="arrow-down-bold" size={40} color={isLocked ? '#555' : '#03A9F4'} />
            </TouchableOpacity>
          </View>

          {/* RIGHT SIDE: CHASSIS ACTION BUTTONS */}
          <View style={styles.actionContainer}>
            <Text style={styles.zoneLabel}>CHASSIS CONTROL</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => sendCommandToJetson('CHASSIS', { action: 'HEIGHT_UP' })}>
                <MaterialCommunityIcons name="format-vertical-align-top" size={30} color={isLocked ? '#555' : '#FF9800'} />
                <Text style={styles.actionText}>H +</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionBtn} onPress={() => sendCommandToJetson('CHASSIS', { action: 'WIDTH_UP' })}>
                <MaterialCommunityIcons name="format-horizontal-align-right" size={30} color={isLocked ? '#555' : '#9C27B0'} />
                <Text style={styles.actionText}>W +</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => sendCommandToJetson('CHASSIS', { action: 'HEIGHT_DOWN' })}>
                <MaterialCommunityIcons name="format-vertical-align-bottom" size={30} color={isLocked ? '#555' : '#FF9800'} />
                <Text style={styles.actionText}>H -</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => sendCommandToJetson('CHASSIS', { action: 'WIDTH_DOWN' })}>
                <MaterialCommunityIcons name="format-horizontal-align-left" size={30} color={isLocked ? '#555' : '#9C27B0'} />
                <Text style={styles.actionText}>W -</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* BOTTOM: DRAW LINE BUTTON */}
        <TouchableOpacity style={styles.drawBtn} onPress={() => setIsDrawing(true)}>
          <MaterialCommunityIcons name="gesture" size={28} color="#FFF" />
          <Text style={styles.drawBtnText}>DRAW PATH MODE</Text>
        </TouchableOpacity>

      </LinearGradient>

      {/* DRAWING CANVAS MODAL */}
      <Modal visible={isDrawing} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.canvasContainer}>
            <View style={styles.canvasHeader}>
              <Text style={styles.canvasTitle}>Draw Rover Path</Text>
              <TouchableOpacity onPress={() => setIsDrawing(false)}>
                <MaterialCommunityIcons name="close-circle" size={32} color="#F44336" />
              </TouchableOpacity>
            </View>
            
            {/* The Actual Drawing Area */}
            <View style={styles.canvasArea} {...panResponder.panHandlers}>
              {pathPoints.length === 0 && (
                <Text style={styles.canvasPlaceholderText}>Drag finger here to draw...</Text>
              )}
              <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                <Polyline
                  points={svgPoints}
                  fill="none"
                  stroke="#4CAF50"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>

            <TouchableOpacity style={styles.sendPathBtn} onPress={handleSendPath}>
              <Text style={styles.sendPathText}>UPLOAD ROUTE TO JETSON</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f2027' },
  background: { flex: 1, padding: 20, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  status: { fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  lockBtn: { padding: 12, borderRadius: 50, elevation: 5 },
  
  controllerWrapper: { flex: 1, flexDirection: 'column', justifyContent: 'space-around' },
  zoneLabel: { color: '#888', fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, letterSpacing: 2 },
  
  dpadContainer: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: 15, borderRadius: 30 },
  dpadMiddleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 5 },
  dpadBtn: { backgroundColor: '#222', padding: 20, borderRadius: 15, marginHorizontal: 10, borderWidth: 2, borderColor: '#333', elevation: 5 },
  stopBtn: { backgroundColor: '#F44336', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#ff7961', elevation: 10 },
  stopText: { color: '#FFF', fontWeight: '900', fontSize: 18, letterSpacing: 1 },

  actionContainer: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: 15, borderRadius: 30, marginTop: 10 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: 220 },
  actionBtn: { backgroundColor: '#222', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', margin: 10, borderWidth: 2, borderColor: '#333', elevation: 5 },
  actionText: { color: '#FFF', fontWeight: 'bold', marginTop: 5 },

  drawBtn: { flexDirection: 'row', backgroundColor: '#4CAF50', padding: 20, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 20, elevation: 8 },
  drawBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 10, letterSpacing: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  canvasContainer: { width: '95%', height: '80%', backgroundColor: '#1E1E1E', borderRadius: 20, padding: 20 },
  canvasHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  canvasTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  canvasArea: { flex: 1, backgroundColor: '#2A2A2A', borderRadius: 15, borderWidth: 2, borderColor: '#4CAF50', borderStyle: 'dashed', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  canvasPlaceholderText: { color: '#888', position: 'absolute', zIndex: -1 },
  sendPathBtn: { backgroundColor: '#03A9F4', padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 20 },
  sendPathText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }
});