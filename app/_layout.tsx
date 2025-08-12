// app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LanguageProvider } from '../contexts/LanguageContext';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="booking/[busId]" options={{ headerShown: false }} />
        <Stack.Screen name="travel-history" options={{ headerShown: false }} />
      </Stack>
      </GestureHandlerRootView>
    </AuthProvider>
    </LanguageProvider>
  );
}
