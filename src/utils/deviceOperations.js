import { ref, set, get, serverTimestamp, remove, push } from 'firebase/database';
import { db } from '../firebaseConfig';

// Günlük cihaz verilerini kaydetme fonksiyonu
export const saveDailyDeviceData = async (userId) => {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    // Aktif cihazları al
    const cihazlarRef = ref(db, `users/${userId}/cihazlar`);
    const snapshot = await get(cihazlarRef);
    const cihazlar = snapshot.val() || {};

    // Günlük kayıt için toplam verileri hesapla
    const dailyData = Object.entries(cihazlar).reduce((acc, [deviceId, device]) => {
      const dailyUsageHours = device.dailyUsage || 0;
      const powerInKW = device.guc / 1000;
      const dailyKWh = powerInKW * dailyUsageHours;
      
      acc[deviceId] = {
        ...device,
        timestamp: serverTimestamp(),
        dailyKWh: dailyKWh,
        date: dateStr
      };
      return acc;
    }, {});

    // Günlük verileri kaydet
    if (Object.keys(dailyData).length > 0) {
      const dailyRef = ref(db, `users/${userId}/cihazlar_gunluk/${dateStr}/cihazlar`);
      await set(dailyRef, dailyData);
    }

    return true;
  } catch (error) {
    console.error('Günlük veri kaydı hatası:', error);
    return false;
  }
};

// Gece yarısı çalışacak temizleme fonksiyonu
export const resetDailyDevices = async (userId) => {
  try {
    // Önce günlük verileri kaydet
    await saveDailyDeviceData(userId);
    
    // Cihazlar listesini tamamen temizle
    const cihazlarRef = ref(db, `users/${userId}/cihazlar`);
    await remove(cihazlarRef);

    return true;
  } catch (error) {
    console.error('Cihaz sıfırlama hatası:', error);
    return false;
  }
};

// Yeni cihaz ekleme fonksiyonu
export const addNewDevice = async (userId, deviceData) => {
  try {
    const deviceId = push(ref(db, `users/${userId}/cihazlar`)).key;
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    const newDevice = {
      ...deviceData,
      id: deviceId,
      createdAt: serverTimestamp(),
      dailyUsage: 0,
      addedDate: today // Hangi güne eklendiğini takip etmek için
    };

    await set(ref(db, `users/${userId}/cihazlar/${deviceId}`), newDevice);
    return true;
  } catch (error) {
    console.error('Cihaz ekleme hatası:', error);
    return false;
  }
}; 