import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { 
  TextInput, 
  Button, 
  Surface, 
  Title, 
  Text, 
  IconButton,
  HelperText 
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../firebaseConfig';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

const ChangePasswordScreen = ({ navigation }) => {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!passwords.currentPassword) newErrors.currentPassword = 'Mevcut şifrenizi girin';
    if (!passwords.newPassword) newErrors.newPassword = 'Yeni şifrenizi girin';
    if (passwords.newPassword.length < 6) newErrors.newPassword = 'Şifre en az 6 karakter olmalı';
    if (passwords.newPassword !== passwords.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        user.email,
        passwords.currentPassword
      );

      // Kullanıcıyı yeniden doğrula
      await reauthenticateWithCredential(user, credential);
      
      // Şifreyi güncelle
      await updatePassword(user, passwords.newPassword);
      
      navigation.goBack();
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      if (error.code === 'auth/wrong-password') {
        setErrors({ currentPassword: 'Mevcut şifre yanlış' });
      }
    } finally {
      setLoading(false);
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
          <Title style={styles.headerTitle}>Şifre Değiştir</Title>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Surface style={styles.formCard}>
          <View style={styles.iconContainer}>
            <IconButton
              icon="lock-reset"
              size={40}
              iconColor="#001F3F"
              style={styles.lockIcon}
            />
            <Text style={styles.subtitle}>
              Güvenliğiniz için güçlü bir şifre seçin
            </Text>
          </View>

          <TextInput
            label="Mevcut Şifre"
            value={passwords.currentPassword}
            onChangeText={(text) => setPasswords({ ...passwords, currentPassword: text })}
            secureTextEntry
            style={styles.input}
            error={!!errors.currentPassword}
            theme={{
              colors: {
                primary: '#001F3F',
              }
            }}
          />
          <HelperText type="error" visible={!!errors.currentPassword}>
            {errors.currentPassword}
          </HelperText>

          <TextInput
            label="Yeni Şifre"
            value={passwords.newPassword}
            onChangeText={(text) => setPasswords({ ...passwords, newPassword: text })}
            secureTextEntry
            style={styles.input}
            error={!!errors.newPassword}
            theme={{
              colors: {
                primary: '#001F3F',
              }
            }}
          />
          <HelperText type="error" visible={!!errors.newPassword}>
            {errors.newPassword}
          </HelperText>

          <TextInput
            label="Yeni Şifre (Tekrar)"
            value={passwords.confirmPassword}
            onChangeText={(text) => setPasswords({ ...passwords, confirmPassword: text })}
            secureTextEntry
            style={styles.input}
            error={!!errors.confirmPassword}
            theme={{
              colors: {
                primary: '#001F3F',
              }
            }}
          />
          <HelperText type="error" visible={!!errors.confirmPassword}>
            {errors.confirmPassword}
          </HelperText>

          <Button 
            mode="contained" 
            onPress={handleChangePassword}
            style={styles.changeButton}
            loading={loading}
            buttonColor="#001F3F"
          >
            Şifreyi Değiştir
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
  formCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    elevation: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  lockIcon: {
    backgroundColor: 'rgba(0, 31, 63, 0.1)',
    borderRadius: 40,
    marginBottom: 12,
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  changeButton: {
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    marginTop: 16,
  },
});

export default ChangePasswordScreen;
