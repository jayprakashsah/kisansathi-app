import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname } from 'expo-router';
import { useChatbot } from '../../hooks/useChatbot';
import ChatWindow from './ChatWindow';

const { width, height } = Dimensions.get('window');
const BUTTON_SIZE = 65;
const POSITION_KEY = '@kisansaathi_chat_pos';

export default function FloatingChatButton() {
  const { messages, isTyping, unreadCount, isOpen, sendMessage, toggleChat, clearHistory } = useChatbot();
  const pathname = usePathname();

  const pan = useRef(new Animated.ValueXY({ x: width - BUTTON_SIZE - 20, y: height - 200 })).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isOpen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOpen]);

  useEffect(() => {
    loadPosition();
  }, []);

  const loadPosition = async () => {
    try {
      const saved = await AsyncStorage.getItem(POSITION_KEY);
      if (saved) {
        const pos = JSON.parse(saved);
        const safeX = Math.min(Math.max(0, pos.x), width - BUTTON_SIZE);
        const safeY = Math.min(Math.max(0, pos.y), height - BUTTON_SIZE);
        pan.setValue({ x: safeX, y: safeY });
      }
    } catch(e) {}
  };

  const savePosition = async (x, y) => {
    try {
      await AsyncStorage.setItem(POSITION_KEY, JSON.stringify({ x, y }));
    } catch(e) {}
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gesture) => {
        pan.flattenOffset();
        
        // Tap detector 
        if (Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5) {
          toggleChat();
          return;
        }

        // Screen boundary preservation logic
        let newX = pan.x._value;
        let newY = pan.y._value;

        if (newX < 0) newX = 0;
        if (newX > width - BUTTON_SIZE) newX = width - BUTTON_SIZE;
        if (newY < 50) newY = 50;
        if (newY > height - BUTTON_SIZE - 100) newY = height - BUTTON_SIZE - 100;

        Animated.spring(pan, {
          toValue: { x: newX, y: newY },
          useNativeDriver: false,
          friction: 6
        }).start(() => savePosition(newX, newY));
      }
    })
  ).current;

  // Mount Safety Check: Don't show on the login page
  if (pathname === '/' || pathname === '/index') {
    return null;
  }

  return (
    <>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.container,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y }
            ],
            opacity: isOpen ? 0 : 1
          }
        ]}
      >
        <Animated.View style={{ transform: [{ scale: isOpen ? 0.01 : pulseAnim }] }}>
          <View style={styles.button}>
            <MaterialCommunityIcons name="robot-outline" size={32} color="#FFF" />
            {unreadCount > 0 && !isOpen && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>

      {isOpen && (
        <ChatWindow 
          messages={messages}
          isTyping={isTyping}
          onClose={toggleChat}
          onSend={sendMessage}
          onClear={clearHistory}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 999999, // Ensure it overflows everything
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#004D40',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
    borderWidth: 2,
    borderColor: '#69F0AE'
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3D00',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF'
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  }
});
