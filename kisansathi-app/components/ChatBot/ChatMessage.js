import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      <LinearGradient
        colors={isUser ? ['#2E7D32', '#1B5E20'] : ['#E65100', '#F57F17']}
        style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}
      >
        <Text style={styles.text}>{message.text}</Text>
        <Text style={styles.time}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    paddingHorizontal: 15,
    width: '100%',
    flexDirection: 'row',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    padding: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  userBubble: {
    borderBottomRightRadius: 5,
  },
  aiBubble: {
    borderBottomLeftRadius: 5,
  },
  text: {
    color: '#FFF',
    fontSize: 15,
    lineHeight: 22,
  },
  time: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 5,
  }
});
