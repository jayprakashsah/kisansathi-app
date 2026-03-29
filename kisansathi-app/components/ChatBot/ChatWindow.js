import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, 
  KeyboardAvoidingView, Platform, Animated, Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ChatMessage from './ChatMessage';

const { height, width } = Dimensions.get('window');

const SUGGESTIONS = [
  "What's wrong with my crop?",
  "Best fertilizer for wheat?",
  "Organic farming tips",
  "Pest control methods",
  "Soil testing methods",
  "Weather impact on crops"
];

export default function ChatWindow({ messages, isTyping, onClose, onSend, onClear }) {
  const [inputText, setInputText] = useState('');
  const slideAnim = useRef(new Animated.Value(height)).current;
  const flatListRef = useRef(null);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleSend = (text) => {
    const val = text || inputText;
    if (val.trim()) {
      onSend(val);
      setInputText('');
    }
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <LinearGradient colors={['rgba(20, 50, 20, 0.95)', 'rgba(5, 15, 5, 0.98)']} style={StyleSheet.absoluteFill}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClear}>
            <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <MaterialCommunityIcons name="robot-outline" size={24} color="#4CAF50" />
            <Text style={styles.headerTitle}>KisanSaathi AI</Text>
          </View>
          <TouchableOpacity onPress={handleClose}>
            <MaterialCommunityIcons name="chevron-down" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Chat Area */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ChatMessage message={item} />}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isTyping && (
           <View style={styles.typingIndicator}>
             <Text style={styles.typingText}>KisanSaathi is typing...</Text>
           </View>
        )}

        {/* Suggestions */}
        <View style={styles.suggestionsContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={SUGGESTIONS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestionChip} onPress={() => handleSend(item)}>
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Input Bar */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your farming question..."
            placeholderTextColor="#888"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()}>
            <MaterialCommunityIcons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </KeyboardAvoidingView>

      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 99999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(27, 94, 32, 0.4)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  chatList: {
    paddingVertical: 20,
  },
  typingIndicator: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  typingText: {
    color: '#4CAF50',
    fontSize: 12,
    fontStyle: 'italic'
  },
  suggestionsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  suggestionChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  suggestionText: {
    color: '#E8F5E9',
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  }
});
