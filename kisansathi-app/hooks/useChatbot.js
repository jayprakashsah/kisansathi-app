import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGeminiResponse } from '../services/geminiService';

const STORAGE_KEY = '@kisansaathi_chat_history';

export const useChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        // Initial greeting defined by PRD
        const greeting = {
          id: Date.now().toString(),
          text: "Namaste Kisan! 🌾 Main hoon aapka KisanSaathi AI. Poochiye koi bhi sawaal kheti-baari ke baare mein!",
          role: 'ai',
          timestamp: new Date().toISOString(),
        };
        setMessages([greeting]);
        saveHistory([greeting]);
        setUnreadCount(1);
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
  };

  const saveHistory = async (newMessages) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
    } catch (e) {
      console.error("Failed to save chat history", e);
    }
  };

  const sendMessage = async (text, context = null) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      text,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveHistory(newMessages);
    setIsTyping(true);

    // Communicate with Gemini Engine
    const aiResponseText = await getGeminiResponse(text, context);
    
    const aiMsg = {
      id: (Date.now() + 1).toString(),
      text: aiResponseText,
      role: 'ai',
      timestamp: new Date().toISOString(),
    };

    const finalMessages = [...newMessages, aiMsg];
    setMessages(finalMessages);
    saveHistory(finalMessages);
    setIsTyping(false);
    
    if (!isOpen) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const clearHistory = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setMessages([]);
    loadHistory();
  };

  const toggleChat = () => {
    if (!isOpen) setUnreadCount(0);
    setIsOpen(!isOpen);
  };

  return {
    messages,
    isTyping,
    unreadCount,
    isOpen,
    sendMessage,
    clearHistory,
    toggleChat,
  };
};
