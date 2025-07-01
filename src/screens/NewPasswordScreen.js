import React, { useState, useRef } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { updatePassword, getAuth } from 'firebase/auth';

const NewPasswordScreen = ({ route }) => {
  const { email } = route.params; // Doğrulama sonrası e-posta
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Input ref'leri
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        Alert.alert('Success', 'Your password has been updated.');
      } else {
        Alert.alert('Hata', 'Kullanıcı bilgilerine ulaşılamadı.');
      }
    } catch (error) {
              Alert.alert('Error', 'An error occurred while updating the password.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        ref={newPasswordRef}
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        style={styles.input}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
      />
      <TextInput
        ref={confirmPasswordRef}
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
        returnKeyType="done"
        blurOnSubmit={true}
        onSubmitEditing={() => confirmPasswordRef.current?.blur()}
      />
      <Button title="Update Password" onPress={handlePasswordUpdate} />
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
