import React, { useState, useEffect } from 'react';
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
import NavigationButtons from '../components/NavigationButtons';
import { auth, db } from '../firebaseConfig';
import { ref, set, push, get, update } from 'firebase/database';
import { saveCihaz, updateCihaz } from '../services/firebaseService';

const { width } = Dimensions.get('window');

const deviceTypes = [
  { value: 'Beyaz Eşya', icon: 'washing-machine' },
  { value: 'Elektronik', icon: 'television' },
  { value: 'Aydınlatma', icon: 'lightbulb' },
  { value: 'Isıtma/Soğutma', icon: 'thermometer' },
];

const CihazEkleScreen = ({ navigation, route }) => {
  const editingDevice = route.params?.device;
  const [device, setDevice] = useState({
    name: '',
    type: 'Beyaz Eşya',
    guc: '',
    dailyUsage: '',
    active: true,
    ...editingDevice
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!device.name.trim()) newErrors.name = 'Cihaz adı gerekli';
    if (!device.guc) newErrors.guc = 'Güç tüketimi gerekli';
    if (!device.dailyUsage) newErrors.dailyUsage = 'Günlük kullanım süresi gerekli';
    
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
      <NavigationButtons navigation={navigation} />
      
      <LinearGradient
        colors={['#001F3F', '#002c5c']}
        style={styles.header}
      >
        <Title style={styles.headerTitle}>
          {editingDevice ? 'Cihazı Düzenle' : 'Yeni Cihaz Ekle'}
        </Title>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Surface style={styles.formCard}>
          <Title style={styles.formTitle}>Cihaz Bilgileri</Title>
          
          <TextInput
            label="Cihaz Adı"
            value={device.name}
            onChangeText={(text) => setDevice({ ...device, name: text })}
            style={styles.input}
            error={!!errors.name}
            theme={{
              colors: {
                primary: '#001F3F',
              }
            }}
          />
          <HelperText type="error" visible={!!errors.name}>
            {errors.name}
          </HelperText>

          <Title style={styles.sectionTitle}>Cihaz Tipi</Title>
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
            label="Güç Tüketimi (Watt)"
            value={device.guc?.toString()}
            onChangeText={(text) => setDevice({ ...device, guc: text })}
            keyboardType="numeric"
            style={styles.input}
            error={!!errors.guc}
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
            label="Günlük Kullanım (Saat)"
            value={device.dailyUsage?.toString()}
            onChangeText={(text) => setDevice({ ...device, dailyUsage: text })}
            keyboardType="numeric"
            style={styles.input}
            error={!!errors.dailyUsage}
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
            <Title style={styles.consumptionTitle}>Tüketim Özeti</Title>
            
            <View style={styles.consumptionItem}>
              <IconButton icon="flash" size={24} color="#6200ee" />
              <View style={styles.consumptionInfo}>
                <Text style={styles.consumptionLabel}>Günlük Tüketim</Text>
                <Text style={styles.consumptionValue}>
                  {calculateDailyConsumption()} kWh
                </Text>
              </View>
            </View>

            <View style={styles.consumptionItem}>
              <IconButton icon="currency-try" size={24} color="#03dac6" />
              <View style={styles.consumptionInfo}>
                <Text style={styles.consumptionLabel}>Tahmini Aylık Maliyet</Text>
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
            {editingDevice ? 'Güncelle' : 'Kaydet'}
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
    paddingHorizontal: 16,
    backgroundColor: '#001F3F',
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
