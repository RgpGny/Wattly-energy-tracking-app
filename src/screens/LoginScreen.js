import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, View, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import { Text, TextInput as PaperInput } from 'react-native-paper';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import AppLogo from '../components/AppLogo';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState({ value: '', error: '' });
  const [password, setPassword] = useState({ value: '', error: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const handleLogin = () => {
    if (!email.value || !password.value) {
      setError('Please fill in both fields');
      return;
    }
    setLoading(true);
    signInWithEmailAndPassword(auth, email.value, password.value)
      .then(() => {
        // Giriş başarılı, HomeScreen sayfasına yönlendir
        navigation.replace('Home');
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
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

      <View style={styles.content}>
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          style={styles.logoContainer}
        >
          <AppLogo size="small" />
          <Text style={styles.welcomeText}>Tekrar Hoşgeldiniz</Text>
          <Text style={styles.subtitleText}>Hesabınıza giriş yapın</Text>
        </MotiView>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email-outline" size={24} color="#666" style={styles.inputIcon} />
            <PaperInput
              mode="flat"
              placeholder="E-posta"
              value={email.value}
              onChangeText={(text) => setEmail({ value: text, error: '' })}
              error={!!email.error}
              style={styles.input}
              underlineColor="transparent"
              activeUnderlineColor="#001F3F"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock-outline" size={24} color="#666" style={styles.inputIcon} />
            <PaperInput
              mode="flat"
              placeholder="Şifre"
              value={password.value}
              onChangeText={(text) => setPassword({ value: text, error: '' })}
              error={!!password.error}
              style={styles.input}
              secureTextEntry={secureTextEntry}
              underlineColor="transparent"
              activeUnderlineColor="#001F3F"
              right={
                <PaperInput.Icon
                  name={secureTextEntry ? "eye-off" : "eye"}
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                  color="#666"
                />
              }
            />
          </View>

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ResetPassword')}
          >
            <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loadingButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Hesabınız yok mu? </Text>
            <TouchableOpacity onPress={() => navigation.replace('Register')}>
              <Text style={styles.registerLink}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
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
    paddingBottom: 24,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#001F3F',
    fontSize: 14,
  },
  loginButton: {
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
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    color: '#001F3F',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
