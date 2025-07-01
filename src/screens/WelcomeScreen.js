import React from 'react';
import { View, StyleSheet, Dimensions, StatusBar, Platform, Image } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiImage } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { hexToRgba } from '../utils/colors';
import AppLogo from '../components/AppLogo';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const theme = useTheme();

  const features = [
    {
      icon: 'lightning-bolt',
      title: 'Smart Tracking',
      description: 'Monitor your energy consumption in real-time',
      color: '#00BCD4'
    },
    {
      icon: 'chart-areaspline',
      title: 'Detailed Analysis',
      description: 'Analyze your consumption data with charts',
      color: '#4CAF50'
    },
    {
      icon: 'wallet-outline',
      title: 'Save Money',
      description: 'Reduce your bills with smart recommendations',
      color: '#FF9800'
    }
  ];

  const FeatureCard = ({ feature, index }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 200, type: 'spring', damping: 18 }}
    >
      <View style={styles.featureCard}>
        <View style={[styles.iconContainer, { backgroundColor: hexToRgba(feature.color, 0.1) }]}>
          <MaterialCommunityIcons name={feature.icon} size={28} color={feature.color} />
        </View>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>{feature.title}</Text>
          <Text style={styles.featureDescription}>{feature.description}</Text>
        </View>
      </View>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#001F3F" />
      
      <LinearGradient
        colors={['#001F3F', '#003366']}
        style={styles.gradientContainer}
      >
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 1000 }}
          style={styles.headerContainer}
        >
          <MotiView
            from={{ opacity: 0, scale: 0.5, rotate: '-45deg' }}
            animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <AppLogo size="normal" />
          </MotiView>
          <Text style={styles.title}>Wattly</Text>
          <Text style={styles.subtitle}>
            Manage your energy consumption smartly
          </Text>
        </MotiView>

        <View style={styles.contentContainer}>
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Login')}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Login
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Register')}
              style={styles.registerButton}
              contentStyle={styles.buttonContent}
              labelStyle={[styles.buttonLabel, styles.registerLabel]}
            >
              Sign Up
            </Button>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001F3F',
  },
  gradientContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  logoContainer: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: width * 0.175,
    marginBottom: 24,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.175,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  logoInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  mainIcon: {
    transform: [{ scale: 1.2 }],
    zIndex: 2,
  },
  glowEffect: {
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  orbitRing: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: width * 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  orbitRing1: {
    width: width * 0.28,
    height: width * 0.28,
    transform: [{ rotate: '45deg' }],
  },
  orbitRing2: {
    width: width * 0.32,
    height: width * 0.32,
    transform: [{ rotate: '-30deg' }],
    borderColor: 'rgba(255,255,255,0.1)',
  },
  energyDot: {
    position: 'absolute',
    zIndex: 1,
  },
  dot1: {
    top: '20%',
    right: '25%',
  },
  dot2: {
    bottom: '25%',
    left: '25%',
  },
  dot3: {
    top: '40%',
    left: '20%',
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: width * 0.175,
    opacity: 0.6,
    zIndex: 0,
  },
  logo: {
    width: '80%',
    height: '80%',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 32,
    paddingHorizontal: 24,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#001F3F',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    paddingBottom: Platform.OS === 'ios' ? 48 : 24,
  },
  loginButton: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#001F3F',
  },
  registerButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#001F3F',
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  registerLabel: {
    color: '#001F3F',
  },
});

export default WelcomeScreen;