import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const AppLogo = ({ size = 'normal' }) => {
  const sizeFactor = size === 'small' ? 0.25 : 0.35;
  
  return (
    <View style={[styles.logoContainer, { width: width * sizeFactor, height: width * sizeFactor, borderRadius: width * sizeFactor / 2 }]}>
      <LinearGradient
        colors={['#001F3F', '#002c5c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.logoGradient, { borderRadius: width * sizeFactor / 2 }]}
      >
        <View style={styles.logoInner}>
          <MaterialCommunityIcons 
            name="lightning-bolt" 
            size={width * 0.18} 
            color="#FFD700"
            style={[styles.mainIcon, styles.glowEffect]}
          />
          
          <View style={[styles.orbitRing, styles.orbitRing1]} />
          <View style={[styles.orbitRing, styles.orbitRing2]} />
          
          <View style={[styles.energyDot, styles.dot1]}>
            <MaterialCommunityIcons name="circle-small" size={width * 0.04} color="#4CAF50" />
          </View>
          <View style={[styles.energyDot, styles.dot2]}>
            <MaterialCommunityIcons name="circle-small" size={width * 0.04} color="#2196F3" />
          </View>
          <View style={[styles.energyDot, styles.dot3]}>
            <MaterialCommunityIcons name="circle-small" size={width * 0.04} color="#FFC107" />
          </View>

          <LinearGradient
            colors={['rgba(255,215,0,0.2)', 'rgba(255,215,0,0)']}
            style={styles.glowOverlay}
          />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
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
    opacity: 0.6,
    zIndex: 0,
  },
});

export default AppLogo; 