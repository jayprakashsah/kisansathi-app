import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="learning-phone" options={{ title: 'Field Tracking', headerBackTitle: 'Back', headerTintColor: '#4CAF50' }} />
        <Stack.Screen name="profile" options={{ title: 'My Profile', headerBackTitle: 'Back', headerTintColor: '#4CAF50' }} />
        <Stack.Screen name="saved-fields" options={{ title: 'Path Tracking Repository', headerBackTitle: 'Profile', headerTintColor: '#4CAF50' }} />
        <Stack.Screen name="privacy" options={{ title: 'Privacy Vault', headerBackTitle: 'Profile', headerTintColor: '#4CAF50' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
