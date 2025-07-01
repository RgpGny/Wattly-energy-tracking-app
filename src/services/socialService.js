import { friendsRef, friendRequestsRef, messagesRef, usersRef } from '../firebaseConfig';
import { push, set, remove, onValue, get, ref, update } from 'firebase/database';
import { auth } from '../firebaseConfig';
import { db } from '../firebaseConfig';

// Arkadaşlık isteği gönderme
export const sendFriendRequest = async (targetUserId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Kullanıcı girişi yapılmamış!');

    console.log('İstek gönderme başladı:', {
      from: {
        uid: currentUser.uid,
        email: currentUser.email
      },
      to: targetUserId
    });

    // Hedef kullanıcının varlığını kontrol et
    const targetUserRef = ref(db, `users/${targetUserId}`);
    const targetUserSnapshot = await get(targetUserRef);
    
    if (!targetUserSnapshot.exists()) {
      throw new Error('Hedef kullanıcı bulunamadı');
    }

    // İstek referansını oluştur
    const requestRef = ref(db, `users/${targetUserId}/friendRequests`);
    
    // Mevcut istekleri kontrol et
    const requestSnapshot = await get(requestRef);
    const requests = requestSnapshot.val() || {};
    
    console.log('Mevcut istekler:', requests);

    // Zaten istek gönderilmiş mi kontrol et
    const existingRequest = Object.values(requests).find(
      request => request.userId === currentUser.uid
    );

    if (existingRequest) {
      throw new Error('Bu kullanıcıya zaten arkadaşlık isteği gönderilmiş');
    }

    // Yeni isteği oluştur
    const newRequest = {
      userId: currentUser.uid,
      email: currentUser.email,
      timestamp: Date.now(),
      status: 'pending'
    };

    console.log('Yeni istek oluşturuldu:', newRequest);

    // Önce friendRequests yapısını güncelle
    const updates = {};
    
    // initialized değerini koru
    if (requests.initialized) {
      updates['initialized'] = true;
    }
    
    // Yeni isteği ekle
    const newRequestKey = push(requestRef).key;
    updates[newRequestKey] = newRequest;

    // Tüm güncellemeleri tek seferde yap
    await set(requestRef, updates);
    
    console.log('İstek başarıyla kaydedildi, referans:', newRequestKey);
    return true;
  } catch (error) {
    console.error('Arkadaşlık isteği gönderme hatası:', error);
    throw error;
  }
};

// Arkadaşlık isteğini kabul etme
export const acceptFriendRequest = async (requestId, friendData) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Kullanıcı girişi yapılmamış!');

    // requestId ve friendData kontrolü
    if (requestId === 'initialized' || !friendData || !friendData.userId || !friendData.email) {
      throw new Error('Geçersiz istek veya arkadaş bilgileri');
    }

    console.log('İstek kabul ediliyor:', {
      requestId,
      friendData
    });

    // Her iki kullanıcının arkadaş listesine ekleme
    const updates = {};
    
    // Mevcut kullanıcının arkadaş listesine ekleme
    updates[`users/${currentUser.uid}/friends/${friendData.userId}`] = {
      email: friendData.email,
      timestamp: Date.now()
    };
    
    // Diğer kullanıcının arkadaş listesine ekleme
    updates[`users/${friendData.userId}/friends/${currentUser.uid}`] = {
      email: currentUser.email,
      timestamp: Date.now()
    };
    
    // İsteği silme
    updates[`users/${currentUser.uid}/friendRequests/${requestId}`] = null;

    // Tüm güncellemeleri tek seferde yap
    await update(ref(db), updates);
    
    console.log('İstek başarıyla kabul edildi');
  } catch (error) {
    console.error('Arkadaşlık isteği kabul hatası:', error);
    throw error;
  }
};

// Mesaj gönderme
export const sendMessage = async (receiverId, message) => {
  const currentUser = auth.currentUser;
  const chatId = [currentUser.uid, receiverId].sort().join('_');
  
  await push(messagesRef(chatId), {
    senderId: currentUser.uid,
    senderEmail: currentUser.email,
    message,
    timestamp: Date.now(),
  });
};

// Kullanıcı arama
export const searchUsers = async (searchTerm) => {
  try {
    console.log('Aranıyor:', searchTerm); // Debug log
    const snapshot = await get(usersRef());
    const users = [];
    
    snapshot.forEach((child) => {
      const userData = child.val();
      console.log('Bulunan kullanıcı:', userData); // Debug log
      
      // E-posta ile eşleşen kullanıcıları bul
      if (userData && userData.email) {
        console.log('Karşılaştırma:', {
          search: searchTerm.toLowerCase(),
          userEmail: userData.email.toLowerCase(),
        });
        
        if (userData.email.toLowerCase() === searchTerm.toLowerCase()) {
          users.push({
            id: child.key,
            ...userData,
          });
        }
      }
    });
    
    console.log('Bulunan kullanıcılar:', users); // Debug log
    return users;
  } catch (error) {
    console.error('Kullanıcı arama hatası:', error);
    throw error;
  }
};

// Arkadaşlık isteğini reddetme
export const rejectFriendRequest = async (requestId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Kullanıcı girişi yapılmamış!');

    // İsteği sil
    await remove(ref(db, `users/${currentUser.uid}/friendRequests/${requestId}`));
    console.log('İstek başarıyla reddedildi');
  } catch (error) {
    console.error('Arkadaşlık isteği reddetme hatası:', error);
    throw error;
  }
}; 