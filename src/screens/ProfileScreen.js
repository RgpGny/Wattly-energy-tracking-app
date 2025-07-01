import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { 
  TextInput, 
  Button, 
  Surface, 
  Title, 
  Text, 
  Avatar,
  IconButton 
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../firebaseConfig';
import { ref, update, onValue } from 'firebase/database';
import { updateProfile, signOut } from 'firebase/auth';

const ProfileScreen = ({ navigation }) => {
  const user = auth.currentUser;
  const [profile, setProfile] = useState({
    displayName: '',
    city: '',
    occupation: '',
    age: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  // Kullanıcı bilgilerini yükle
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const userInfoRef = ref(db, `users/${userId}/userInformation`);
    onValue(userInfoRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProfile({
          displayName: data.displayName || '',
          city: data.city || '',
          occupation: data.occupation || '',
          age: data.age || '',
          phone: data.phone || '',
        });
      }
    });
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser.uid;

      // Firebase Auth profilini güncelle
      await updateProfile(auth.currentUser, {
        displayName: profile.displayName,
      });

      // Realtime Database'de kullanıcı bilgilerini güncelle
      const userInfoRef = ref(db, `users/${userId}/userInformation`);
      await update(userInfoRef, {
        displayName: profile.displayName,
        city: profile.city,
        occupation: profile.occupation,
        age: profile.age,
        phone: profile.phone,
        updatedAt: Date.now(),
      });

      navigation.goBack();
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Kullanıcıyı Welcome ekranına yönlendir
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error('Çıkış yapma hatası:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#001F3F" />
      
      <LinearGradient
        colors={['#001F3F', '#002c5c']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            iconColor="white"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Title style={styles.headerTitle}>Profilim</Title>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Surface style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Avatar.Text 
              size={80}
              label={profile.displayName?.[0]?.toUpperCase() || 'U'} 
              style={styles.avatar}
            />
          </View>

          <TextInput
            label="Ad Soyad"
            value={profile.displayName}
            onChangeText={(text) => setProfile({ ...profile, displayName: text })}
            style={styles.input}
            theme={{
              colors: {
                primary: '#001F3F',
              }
            }}
          />

          <TextInput
            label="Şehir"
            value={profile.city}
            onChangeText={(text) => setProfile({ ...profile, city: text })}
            style={styles.input}
            theme={{
              colors: {
                primary: '#001F3F',
              }
            }}
          />

          <TextInput
            label="Meslek"
            value={profile.occupation}
            onChangeText={(text) => setProfile({ ...profile, occupation: text })}
            style={styles.input}
            theme={{
              colors: {
                primary: '#001F3F',
              }
            }}
          />

          <TextInput
            label="Yaş"
            value={profile.age}
            onChangeText={(text) => setProfile({ ...profile, age: text })}
            keyboardType="numeric"
            style={styles.input}
            theme={{
              colors: {
                primary: '#001F3F',
              }
            }}
          />

          <TextInput
            label="Telefon"
            value={profile.phone}
            onChangeText={(text) => setProfile({ ...profile, phone: text })}
            keyboardType="phone-pad"
            style={styles.input}
            theme={{
              colors: {
                primary: '#001F3F',
              }
            }}
          />

          <Button 
            mode="contained" 
            onPress={handleSave}
            style={styles.saveButton}
            loading={loading}
            buttonColor="#001F3F"
          >
            Kaydet
          </Button>

          <Button 
            mode="outlined"
            onPress={() => navigation.navigate('ChangePasswordScreen')}
            style={styles.changePasswordButton}
            textColor="#001F3F"
            icon="lock-reset"
          >
            Şifre Değiştir
          </Button>

          <Button 
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            textColor="#f44336"
          >
            Çıkış Yap
          </Button>
        </Surface>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 120,
    justifyContent: 'flex-end',
    paddingBottom: 16,
    backgroundColor: '#001F3F',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    elevation: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    backgroundColor: '#001F3F',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  saveButton: {
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    marginTop: 8,
  },
  changePasswordButton: {
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    marginTop: 12,
    borderColor: '#001F3F',
  },
  logoutButton: {
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    marginTop: 12,
    borderColor: '#f44336',
  },
});

export default ProfileScreen; 