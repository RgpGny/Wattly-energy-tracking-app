import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { updatePassword, getAuth } from 'firebase/auth';

const NewPasswordScreen = ({ route }) => {
  const { email } = route.params; // Doğrulama sonrası e-posta
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor!');
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        Alert.alert('Başarılı', 'Şifreniz güncellendi.');
      } else {
        Alert.alert('Hata', 'Kullanıcı bilgilerine ulaşılamadı.');
      }
    } catch (error) {
      Alert.alert('Hata', 'Şifre güncellenirken bir sorun oluştu.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Yeni Şifre"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        placeholder="Yeni Şifre Tekrar"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Şifreyi Güncelle" onPress={handlePasswordUpdate} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginVertical: 8,
    padding: 8,
  },
});

export default NewPasswordScreen;
