import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';

const NavigationButtons = ({ navigation, showBack = true, showClose }) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftButton}>
        {showBack && (
          <IconButton
            icon="arrow-left"
            size={24}
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
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    zIndex: 1000,
  },
  leftButton: {
    alignSelf: 'flex-start',
  },
  rightButton: {
    alignSelf: 'flex-end',
  },
});

export default NavigationButtons; 