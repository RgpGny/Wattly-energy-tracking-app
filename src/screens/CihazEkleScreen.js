import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { 
  TextInput, 
  Button, 
  Surface, 
  Title, 
  Text,
  SegmentedButtons,
  IconButton,
  HelperText,
  Card
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../firebaseConfig';
import { ref, set, push, get, update } from 'firebase/database';
import { saveCihaz, updateCihaz } from '../services/firebaseService';

const { width } = Dimensions.get('window');

const deviceTypes = [
  { value: 'Home Appliances', icon: 'washing-machine' },
  { value: 'Electronics', icon: 'television' },
  { value: 'Lighting', icon: 'lightbulb' },
  { value: 'Heating/Cooling', icon: 'thermometer' },
];

const CihazEkleScreen = ({ navigation, route }) => {
  const editingDevice = route.params?.device;
  const [device, setDevice] = useState({
    name: '',
    type: 'Home Appliances',
    guc: '',
    dailyUsage: '',
    active: true,
    ...editingDevice
  });

  const [errors, setErrors] = useState({});
  
  // Input ref'leri
  const nameRef = useRef(null);
  const powerRef = useRef(null);
  const usageRef = useRef(null);

  const validateForm = () => {
    const newErrors = {};
    if (!device.name.trim()) newErrors.name = 'Device name is required';
    if (!device.guc) newErrors.guc = 'Power consumption is required';
    if (!device.dailyUsage) newErrors.dailyUsage = 'Daily usage duration is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const cihazData = {
        ...device,
        updatedAt: Date.now()
      };

      console.log('Kayıt tarihi:', new Date().toLocaleString('tr-TR')); // Debug için
      
      if (editingDevice?.id) {
        await updateCihaz(editingDevice.id, cihazData);
      } else {
        await saveCihaz(cihazData);
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Cihaz kaydetme hatası:', error);
    }
  };

  const calculateDailyConsumption = () => {
    const power = parseFloat(device.guc) || 0;
    const hours = parseFloat(device.dailyUsage) || 0;
    return (power * hours / 1000).toFixed(2);
  };

  const calculateMonthlyCost = () => {
    const dailyKwh = parseFloat(calculateDailyConsumption());
    const monthlyKwh = dailyKwh * 30;
    const pricePerKwh = 1.5; // Örnek kWh fiyatı
    return (monthlyKwh * pricePerKwh).toFixed(2);
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
          <Title style={styles.headerTitle}>
            {editingDevice ? 'Edit Device' : 'Add New Device'}
          </Title>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Surface style={styles.formCard}>
          <Title style={styles.formTitle}>Device Information</Title>
          
          <TextInput
            ref={nameRef}
            label="Device Name"
            value={device.name}
            onChangeText={(text) => setDevice({ ...device, name: text })}
            style={styles.input}
            error={!!errors.name}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => powerRef.current?.focus()}
            theme={{
              colors: {
                primary: '#001F3F',
              }
            }}
          />
          <HelperText type="error" visible={!!errors.name}>
            {errors.name}
          </HelperText>

          <Title style={styles.sectionTitle}>Device Type</Title>
          <SegmentedButtons
            value={device.type}
            onValueChange={(value) => setDevice({ ...device, type: value })}
            buttons={deviceTypes.map(type => ({
              value: type.value,
              label: type.value,
              icon: type.icon,
            }))}
            style={styles.segmentedButtons}
          />

          <TextInput
            ref={powerRef}
            label="Power Consumption (Watts)"
            value={device.guc?.toString()}
            onChangeText={(text) => setDevice({ ...device, guc: text })}
            keyboardType="numeric"
            style={styles.input}
            error={!!errors.guc}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => usageRef.current?.focus()}
            theme={{
              colors: {
                primary: '#001F3F',
              }
            }}
          />
          <HelperText type="error" visible={!!errors.guc}>
            {errors.guc}
          </HelperText>

          <TextInput
            ref={usageRef}
            label="Daily Usage (Hours)"
            value={device.dailyUsage?.toString()}
            onChangeText={(text) => setDevice({ ...device, dailyUsage: text })}
            keyboardType="numeric"
            style={styles.input}
            error={!!errors.dailyUsage}
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={() => {
              usageRef.current?.blur();
              // İsteğe bağlı: Otomatik kaydet
              // handleSave();
            }}
            theme={{
              colors: {
                primary: '#001F3F',
              }
            }}
          />
          <HelperText type="error" visible={!!errors.dailyUsage}>
            {errors.dailyUsage}
          </HelperText>
        </Surface>

        <Card style={styles.consumptionCard}>
          <Card.Content>
            <Title style={styles.consumptionTitle}>Consumption Summary</Title>
            
            <View style={styles.consumptionItem}>
              <IconButton icon="flash" size={24} color="#6200ee" />
              <View style={styles.consumptionInfo}>
                <Text style={styles.consumptionLabel}>Daily Consumption</Text>
                <Text style={styles.consumptionValue}>
                  {calculateDailyConsumption()} kWh
                </Text>
              </View>
            </View>

            <View style={styles.consumptionItem}>
              <IconButton icon="currency-try" size={24} color="#03dac6" />
              <View style={styles.consumptionInfo}>
                <Text style={styles.consumptionLabel}>Estimated Monthly Cost</Text>
                <Text style={styles.consumptionValue}>
                  {calculateMonthlyCost()} ₺
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            onPress={handleSave}
            style={styles.saveButton}
            buttonColor="#001F3F"
          >
                          {editingDevice ? 'Update' : 'Save'}
          </Button>
        </View>
      </ScrollView>
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
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 20,
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  consumptionCard: {
    borderRadius: 12,
    marginBottom: 16,
    elevation: 4,
  },
  consumptionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  consumptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  consumptionInfo: {
    flex: 1,
    marginLeft: 8,
  },
  consumptionLabel: {
    fontSize: 14,
    color: '#666',
  },
  consumptionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 32,
  },
  saveButton: {
    backgroundColor: '#001F3F',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
  },
});

export default CihazEkleScreen;
