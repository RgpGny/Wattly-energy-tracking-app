import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Bildirimleri yapılandır
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Bildirim izinlerini al
export const registerForPushNotificationsAsync = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Bildirim izni alınamadı:', error);
    return false;
  }
};

// Hedef uyarı bildirimi gönder
export const sendGoalWarningNotification = async (goalTitle) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Hedef Uyarısı! 🎯",
        body: `"${goalTitle}" hedefinize az kaldı! Kullanımınıza dikkat ediniz.`,
        data: { type: 'goal-warning' },
      },
      trigger: null, // Hemen gönder
    });
  } catch (error) {
    console.error('Bildirim gönderilemedi:', error);
  }
};

export const checkConsumptionAlert = async (currentConsumption) => {
  const threshold = await AsyncStorage.getItem('consumptionThreshold') || 10; // kWh
  
  if (currentConsumption > threshold) {
    return {
      title: 'Yüksek Tüketim Uyarısı',
      message: `Günlük tüketiminiz ${threshold} kWh limitini aştı!`,
    };
  }
  return null;
};

export const generateSavingTips = () => {
  const tips = [
    'Buzdolabınızın sıcaklığını kontrol edin',
    'Çamaşır makinesini tam doluyken çalıştırın',
    'Pencerelerinizi yalıtın',
    'Güneş ışığından faydalanın',
  ];
  
  return tips[Math.floor(Math.random() * tips.length)];
}; 