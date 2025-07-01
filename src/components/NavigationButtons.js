import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { IconButton } from 'react-native-paper';

const NavigationButtons = ({ navigation, showBack = true, showClose }) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftButton}>
        {showBack && (
          <IconButton
            icon="arrow-left"
            size={28}
            iconColor="#001F3F"
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          />
        )}
      </View>
      <View style={styles.rightButton}>
        {showClose && (
          <IconButton
            icon="close"
            size={24}
            onPress={showClose}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 35,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 1000,
  },
  leftButton: {
    alignSelf: 'flex-start',
  },
  rightButton: {
    alignSelf: 'flex-end',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default NavigationButtons; 