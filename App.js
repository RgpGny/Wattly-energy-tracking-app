import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/firebaseConfig';
import { Provider as PaperProvider } from 'react-native-paper';
import { syncCurrentUserToDatabase, initializeUserStructure, initializeDailyBackup, checkAndResetDailyUsage, checkDayChange, initializeDailyReset } from './src/services/firebaseService';
import * as Notifications from 'expo-notifications';
import { EnergyProvider } from './src/context/EnergyContext';

// Ekran bileşenlerini import ediyoruz
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import CihazListesiScreen from './src/screens/CihazListesiScreen';
import CihazEkleScreen from './src/screens/CihazEkleScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import NewPasswordScreen from './src/screens/NewPasswordScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import ChatScreen from './src/screens/ChatScreen';
import HedefEkleScreen from './src/screens/HedefEkleScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createStackNavigator();

// Bildirim yapılandırması
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Push notification izinleri için fonksiyon
async function registerForPushNotificationsAsync() {
  let token;
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Push notification izni verilmedi!');
    return;
  }
  
  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Push token:', token);
  
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  
  return token;
}

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await syncCurrentUserToDatabase();
        await checkDayChange();
        initializeDailyReset();
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Bildirim izinlerini kontrol et
    const checkNotifications = async () => {
      await registerForPushNotificationsAsync();
    };
    
    checkNotifications();
  }, []);

  return (
    <EnergyProvider>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={user ? 'Home' : 'Welcome'}
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
            <Stack.Screen name="NewPasswordScreen" component={NewPasswordScreen} />
            <Stack.Screen name="CihazListesi" component={CihazListesiScreen} />
            <Stack.Screen name="CihazEkle" component={CihazEkleScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Community" component={CommunityScreen} />
            <Stack.Screen name="Goals" component={GoalsScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="HedefEkle" component={HedefEkleScreen} />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </EnergyProvider>
  );
};

export default App;
