import React, { useState, useRef } from 'react';
import { TouchableOpacity, StyleSheet, View, Dimensions, StatusBar, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput as PaperInput } from 'react-native-paper';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import AppLogo from '../components/AppLogo';
import { ref, set } from 'firebase/database';
import { db } from '../firebaseConfig';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState({ value: '', error: '' });
  const [password, setPassword] = useState({ value: '', error: '' });
  const [confirmPassword, setConfirmPassword] = useState({ value: '', error: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);

  // Input ref'leri
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const onSignUpPressed = async () => {
    if (!email.value || !password.value || !confirmPassword.value) {
      setError('Please fill in all fields');
      return;
    }

    if (password.value !== confirmPassword.value) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
      
      const userData = {
        email: userCredential.user.email,
        createdAt: Date.now(),
        displayName: email.value.split('@')[0],
        uid: userCredential.user.uid
      };

      await set(ref(db, `users/${userCredential.user.uid}`), userData);
      navigation.replace('Login');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#001F3F', '#002c5c']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#001F3F" />
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
      </TouchableOpacity>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <MotiView
              from={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              style={styles.logoContainer}
            >
              <AppLogo size="small" />
              <Text style={styles.welcomeText}>Welcome</Text>
              <Text style={styles.subtitleText}>Create a new account</Text>
            </MotiView>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="email-outline" size={24} color="#666" style={styles.inputIcon} />
                <PaperInput
                  ref={emailRef}
                  mode="flat"
                  placeholder="Email"
                  value={email.value}
                  onChangeText={(text) => setEmail({ value: text, error: '' })}
                  error={!!email.error}
                  style={styles.input}
                  underlineColor="transparent"
                  activeUnderlineColor="#001F3F"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="lock-outline" size={24} color="#666" style={styles.inputIcon} />
                <PaperInput
                  ref={passwordRef}
                  mode="flat"
                  placeholder="Password"
                  value={password.value}
                  onChangeText={(text) => setPassword({ value: text, error: '' })}
                  error={!!password.error}
                  style={styles.input}
                  secureTextEntry={secureTextEntry}
                  underlineColor="transparent"
                  activeUnderlineColor="#001F3F"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  right={
                    <PaperInput.Icon
                      name={secureTextEntry ? "eye-off" : "eye"}
                      onPress={() => setSecureTextEntry(!secureTextEntry)}
                      color="#666"
                    />
                  }
                />
              </View>

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="lock-check-outline" size={24} color="#666" style={styles.inputIcon} />
                <PaperInput
                  ref={confirmPasswordRef}
                  mode="flat"
                  placeholder="Confirm Password"
                  value={confirmPassword.value}
                  onChangeText={(text) => setConfirmPassword({ value: text, error: '' })}
                  error={!!confirmPassword.error}
                  style={styles.input}
                  secureTextEntry={secureConfirmTextEntry}
                  underlineColor="transparent"
                  activeUnderlineColor="#001F3F"
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={() => {
                    confirmPasswordRef.current?.blur();
                    // İsteğe bağlı: Otomatik kayıt
                    // onSignUpPressed();
                  }}
                  right={
                    <PaperInput.Icon
                      name={secureConfirmTextEntry ? "eye-off" : "eye"}
                      onPress={() => setSecureConfirmTextEntry(!secureConfirmTextEntry)}
                      color="#666"
                    />
                  }
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.registerButton, loading && styles.loadingButton]}
                onPress={onSignUpPressed}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.registerButtonText}>Sign Up</Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.replace('Login')}>
                  <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    minHeight: height,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 100,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    height: 56,
  },
  errorText: {
    color: '#ff3333',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: '#001F3F',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
  },
  loadingButton: {
    opacity: 0.8,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#001F3F',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
