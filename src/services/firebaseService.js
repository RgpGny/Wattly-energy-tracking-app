import { getDatabase, ref, get, set, push, onValue, update, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { auth, db, usersRef } from '../firebaseConfig';

// Kullanıcı ID'sini almak için yardımcı fonksiyon
export const getCurrentUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Kullanıcı girişi yapılmamış!');
  return user.uid;
};

// Cihazları veritabanından çekme
export const getCihazListesi = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    const cihazlarRef = ref(db, `users/${userId}/cihazlar`);
    const snapshot = await get(cihazlarRef);
    
    if (snapshot.exists()) {
      return Object.entries(snapshot.val()).map(([id, cihaz]) => ({
        id,
        ...cihaz,
      }));
    }
    return [];
  } catch (error) {
    console.error('Cihazları getirme hatası:', error);
    return [];
  }
};

// Yeni cihaz ekleme
export const addCihaz = async (cihaz) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Kullanıcı girişi yapılmamış');

    const cihazlarRef = ref(db, `users/${userId}/cihazlar`);
    const newCihazRef = push(cihazlarRef);
    await set(newCihazRef, {
      ...cihaz,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Cihaz ekleme hatası:', error);
    throw error;
  }
};

// Cihaz silme
export const deleteCihaz = async (cihazId) => {
  try {
    const userId = getCurrentUserId();
    const currentDate = getCurrentDateStr();
    
    // Aktif listeden sil
    await remove(ref(db, `users/${userId}/cihazlar/${cihazId}`));
    
    // Günlük kayıttan da sil
    await remove(ref(db, `users/${userId}/cihazlar_gunluk/${currentDate}/cihazlar/${cihazId}`));
  } catch (error) {
    console.error('Cihaz silme hatası:', error);
    throw error;
  }
};

// Cihazları veritabanından dinleyerek çekme (Anlık güncelleme)
export const listenToCihazListesi = (callback) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error("Kullanıcı girmemiş!");
      return;
    }

    const cihazRef = ref(db, `users/${userId}/cihazlar`);
    onValue(cihazRef, (snapshot) => {
      const cihazlar = [];
      snapshot.forEach((childSnapshot) => {
        const cihaz = childSnapshot.val();
        cihaz.id = childSnapshot.key; // ID'yi veriye ekle
        cihazlar.push(cihaz);
      });
      callback(cihazlar); // Cihazlar listesine her değişiklikte güncelleme yap
    });
  } catch (error) {
    console.error('Cihazlar veritabanından dinlenirken bir hata oluştu: ', error);
  }
};

// Cihaz güncelleme
export const updateCihaz = async (cihazId, cihaz) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error("Kullanıcı girmemiş!");
      return;
    }

    const cihazRef = ref(db, `users/${userId}/cihazlar/${cihazId}`);
    await update(cihazRef, cihaz); // Mevcut cihazı güncelle
  } catch (error) {
    console.error('Cihaz güncellenirken bir hata oluştu: ', error);
  }
};

// Profil bilgilerini çekme
export const getProfileInfo = async () => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error("Kullanıcı girmemiş!");
      return null;
    }

    const profileRef = ref(db, `users/${userId}/profile`);
    const snapshot = await get(profileRef);
    if (snapshot.exists()) {
      return snapshot.val(); // Profil bilgilerini döndür
    } else {
      console.log('Profil bilgileri bulunamadı.');
      return null;
    }
  } catch (error) {
    console.error('Profil bilgileri alınırken bir hata oluştu: ', error);
    return null;
  }
};

// Profil bilgilerini güncelleme
export const updateProfileInfo = async (profileData) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error("Kullanıcı girmemiş!");
      return;
    }

    const profileRef = ref(db, `users/${userId}/profile`);
    await update(profileRef, profileData); // Profil bilgilerini güncelle
  } catch (error) {
    console.error('Profil bilgileri güncellenirken bir hata oluştu: ', error);
  }
};

// Profil bilgilerini kaydetme (ilk kayıt)
export const setProfileInfo = async (profileData) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error("Kullanıcı girmemiş!");
      return;
    }

    const profileRef = ref(db, `users/${userId}/profile`);
    await set(profileRef, profileData); // Profil bilgilerini ilk kez kaydet
  } catch (error) {
    console.error('Profil bilgileri kaydedilirken bir hata oluştu: ', error);
  }
};

// Kullanıcı oluşturma/güncelleme
export const createOrUpdateUser = async (userId, userData) => {
  try {
    await set(ref(db, `users/${userId}`), {
      email: userData.email,
      createdAt: userData.createdAt || Date.now(),
      ...userData
    });
  } catch (error) {
    console.error('Kullanıcı bilgileri kaydedilirken hata:', error);
    throw error;
  }
};

// Mevcut kullanıcıyı veritabanına kaydet
export const syncCurrentUserToDatabase = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Önce mevcut kullanıcı verilerini al
    const userRef = ref(db, `users/${currentUser.uid}`);
    const snapshot = await get(userRef);
    const existingData = snapshot.val() || {};

    const userData = {
      ...existingData, // Mevcut verileri koru
      email: currentUser.email,
      uid: currentUser.uid,
      displayName: currentUser.email.split('@')[0],
      // Eğer createdAt yoksa yeni oluştur
      createdAt: existingData.createdAt || Date.now(),
      // Cihazları koru
      cihazlar: existingData.cihazlar || {}
    };

    await set(userRef, userData);
    console.log('Kullanıcı senkronize edildi:', userData);
  } catch (error) {
    console.error('Kullanıcı senkronizasyon hatası:', error);
  }
};

// Kullanıcı yapısını başlat/güncelle
export const initializeUserStructure = async (userId) => {
  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    const existingData = snapshot.val() || {};

    // Mevcut verileri koruyarak güncelle
    const updates = {
      ...existingData, // Tüm mevcut verileri koru
      email: existingData.email,
      uid: existingData.uid,
      createdAt: existingData.createdAt,
      displayName: existingData.displayName,
      // Cihazları koru
      cihazlar: existingData.cihazlar || {}
    };

    await set(userRef, updates);
    console.log('Kullanıcı yapısı güncellendi:', updates);
  } catch (error) {
    console.error('Kullanıcı yapısı güncellenirken hata:', error);
  }
};

// Günlük cihaz verilerini kaydet
export const saveDailyCihazlar = async () => {
  try {
    const userId = getCurrentUserId();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD formatı
    
    const displayDate = now.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Mevcut cihazları al
    const cihazlarRef = ref(db, `users/${userId}/cihazlar`);
    const snapshot = await get(cihazlarRef);
    
    if (snapshot.exists()) {
      const cihazlar = snapshot.val();
      
      // Günlük kayıt için referans - yeni güne kaydet
      const dailyRef = ref(db, `users/${userId}/cihazlar_gunluk/${dateStr}`);
      
      // Günlük verileri kaydet
      await set(dailyRef, {
        cihazlar: cihazlar,
        displayDate: displayDate,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error('Günlük cihaz kaydı hatası:', error);
  }
};

// Gün değişiminde cihazları sıfırla
export const resetDailyUsage = async () => {
  try {
    const userId = getCurrentUserId();
    const cihazlarRef = ref(db, `users/${userId}/cihazlar`);
    const snapshot = await get(cihazlarRef);
    
    if (snapshot.exists()) {
      const cihazlar = snapshot.val();
      const resetCihazlar = {};
      
      // Tüm cihazların günlük kullanımını sıfırla
      Object.entries(cihazlar).forEach(([id, cihaz]) => {
        resetCihazlar[id] = {
          ...cihaz,
          dailyUsage: 0
        };
      });
      
      await set(cihazlarRef, resetCihazlar);
      console.log('Günlük kullanım süreleri sıfırlandı');
    }
  } catch (error) {
    console.error('Cihaz sıfırlama hatası:', error);
  }
};

// Günlük tarihini YYYYMMDD formatında al
const getCurrentDateStr = () => {
  const now = new Date();
  // Türkiye saatini al
  const trTime = new Date(now.getTime() + (3 * 60 * 60 * 1000)); // UTC+3
  return trTime.toISOString().split('T')[0].replace(/-/g, '');
};

// Cihaz ekleme/güncelleme işlemi
export const saveCihaz = async (cihazData, cihazId = null) => {
  try {
    const userId = getCurrentUserId();
    const currentDate = getCurrentDateStr();
    
    // Aktif cihazlar listesine kaydet
    const cihazlarRef = ref(db, `users/${userId}/cihazlar`);
    const dailyRef = ref(db, `users/${userId}/cihazlar_gunluk/${currentDate}/cihazlar`);
    
    if (cihazId) {
      // Güncelleme
      await set(ref(db, `users/${userId}/cihazlar/${cihazId}`), cihazData);
      await set(ref(db, `users/${userId}/cihazlar_gunluk/${currentDate}/cihazlar/${cihazId}`), cihazData);
    } else {
      // Yeni ekleme
      const newRef = push(cihazlarRef);
      const newCihazId = newRef.key;
      await set(ref(db, `users/${userId}/cihazlar/${newCihazId}`), cihazData);
      await set(ref(db, `users/${userId}/cihazlar_gunluk/${currentDate}/cihazlar/${newCihazId}`), cihazData);
    }
  } catch (error) {
    console.error('Cihaz kaydetme hatası:', error);
    throw error;
  }
};

// Hedeflerin süresini kontrol et ve gerekirse sil
export const checkAndCleanExpiredGoals = async () => {
  try {
    const userId = getCurrentUserId();
    const goalsRef = ref(db, `users/${userId}/goals`);
    const snapshot = await get(goalsRef);

    if (snapshot.exists()) {
      const goals = snapshot.val();
      const now = new Date();
      const updates = {};
      let hasExpired = false;

      // Her hedefi kontrol et
      Object.entries(goals).forEach(([goalId, goal]) => {
        const createdAt = new Date(goal.createdAt);
        let isExpired = false;

        switch (goal.period) {
          case 'Günlük':
            // 24 saat geçti mi?
            isExpired = (now - createdAt) > 24 * 60 * 60 * 1000;
            break;
          case 'Haftalık':
            // 7 gün geçti mi?
            isExpired = (now - createdAt) > 7 * 24 * 60 * 60 * 1000;
            break;
          case 'Aylık':
            // 30 gün geçti mi?
            isExpired = (now - createdAt) > 30 * 24 * 60 * 60 * 1000;
            break;
        }

        if (isExpired) {
          hasExpired = true;
          // Hedefi arşive taşı
          const archiveRef = ref(db, `users/${userId}/goals_archive/${goalId}`);
          set(archiveRef, {
            ...goal,
            expiredAt: Date.now()
          });
          // Aktif hedeflerden sil
          updates[goalId] = null;
        }
      });

      // Toplu güncelleme yap
      if (hasExpired) {
        await update(goalsRef, updates);
        console.log('Süresi dolan hedefler arşive taşındı');
      }
    }
  } catch (error) {
    console.error('Hedef temizleme hatası:', error);
  }
};

// Gün değişiminde çalışacak fonksiyonu güncelle
export const handleDayChange = async () => {
  try {
    const userId = getCurrentUserId();
    const previousDate = getCurrentDateStr();
    
    // Mevcut cihazları al ve kaydet
    const cihazlarRef = ref(db, `users/${userId}/cihazlar`);
    const snapshot = await get(cihazlarRef);
    
    if (snapshot.exists()) {
      // Son durumu günlük kayıtlara ekle
      const dailyRef = ref(db, `users/${userId}/cihazlar_gunluk/${previousDate}`);
      await set(dailyRef, {
        cihazlar: snapshot.val(),
        timestamp: Date.now(),
        displayDate: new Date().toLocaleDateString('tr-TR')
      });
      
      // Aktif cihazlar listesini temizle
      await set(cihazlarRef, null);
    }

    // Hedefleri kontrol et ve gerekirse temizle
    await checkAndCleanExpiredGoals();
    
    console.log('Gün değişimi tamamlandı, veriler güncellendi');
  } catch (error) {
    console.error('Gün değişimi hatası:', error);
  }
};

// Gün değişimi kontrolü ve zamanlayıcı
export const initializeDailyReset = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const timeUntilMidnight = tomorrow.getTime() - now.getTime();

  // Gece yarısı için zamanlayıcı
  setTimeout(() => {
    handleDayChange();
    // Her 24 saatte bir tekrarla
    setInterval(handleDayChange, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);
};

// Uygulama açıldığında kontrol
export const checkDayChange = async () => {
  try {
    const userId = getCurrentUserId();
    const currentDate = getCurrentDateStr();
    
    // Bugünün kaydı var mı kontrol et
    const dailyRef = ref(db, `users/${userId}/cihazlar_gunluk/${currentDate}`);
    const snapshot = await get(dailyRef);
    
    // Eğer bugünün kaydı yoksa ve aktif cihazlar varsa
    if (!snapshot.exists()) {
      const cihazlarRef = ref(db, `users/${userId}/cihazlar`);
      const cihazlarSnapshot = await get(cihazlarRef);
      
      if (cihazlarSnapshot.exists()) {
        // Aktif cihazları temizle (yeni güne geçilmiş demektir)
        await set(cihazlarRef, null);
        console.log('Yeni gün başladı, cihazlar temizlendi');
      }
    }
  } catch (error) {
    console.error('Gün değişimi kontrolü hatası:', error);
  }
};
