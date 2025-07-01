import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity, StatusBar } from 'react-native';
import { 
  Card, 
  Title, 
  Text, 
  FAB, 
  Surface, 
  IconButton, 
  Searchbar,
  Menu,
  Divider,
  Portal,
  Dialog,
  Button
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import NavigationButtons from '../components/NavigationButtons';
import { getCihazListesi } from '../services/firebaseService';
import { auth, db } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const DeviceCard = ({ device, onPress, onLongPress }) => {
  // Cihaz tipine göre ikon seçimi
  const getDeviceIcon = (type) => {
    switch (type) {
      case 'Beyaz Eşya':
        return 'washing-machine';
      case 'Elektronik':
        return 'television';
      case 'Aydınlatma':
        return 'lightbulb';
      case 'Isıtma/Soğutma':
        return 'thermometer';
      default:
        return 'power-plug'; // Varsayılan ikon
    }
  };

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
      <Surface style={styles.deviceCard}>
        <View style={styles.deviceIconContainer}>
          <IconButton 
            icon={getDeviceIcon(device.type)}
            size={32} 
            color="#001F3F" 
          />
        </View>
        <View style={styles.deviceInfo}>
          <Title style={styles.deviceName}>{device.name}</Title>
          <Text style={styles.deviceDetails}>
            {device.guc} Watt • Günlük {device.dailyUsage} saat
          </Text>
          <Text style={styles.consumptionText}>
            Günlük Tüketim: {((device.guc * device.dailyUsage) / 1000).toFixed(2)} kWh
          </Text>
        </View>
        <View style={styles.deviceStatus}>
          <IconButton 
            icon={device.active ? "power" : "power-off"} 
            color={device.active ? "#4CAF50" : "#f44336"}
            size={24}
          />
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const CihazListesiScreen = ({ navigation }) => {
  const [devices, setDevices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Realtime dinleme başlat
    const cihazlarRef = ref(db, `users/${userId}/cihazlar`);
    
    const unsubscribe = onValue(cihazlarRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const cihazList = Object.entries(data).map(([id, cihaz]) => ({
          id,
          ...cihaz,
        }));
        setDevices(cihazList);
      } else {
        setDevices([]);
      }
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalConsumption = devices.reduce((total, device) => {
    return total + (device.guc * device.dailyUsage) / 1000;
  }, 0);

  const handleDevicePress = (device) => {
    // Cihaz detaylarına git
    navigation.navigate('CihazEkle', { device });
  };

  const handleDeviceLongPress = (device) => {
    setSelectedDevice(device);
    setMenuVisible(true);
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
          <Title style={styles.headerTitle}>Cihazlarım</Title>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Surface style={styles.searchSurface}>
          <Searchbar
            placeholder="Cihazlarınızda arama yapın..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            iconColor="#001F3F"
            placeholderTextColor="rgba(0, 31, 63, 0.5)"
            theme={{
              colors: {
                primary: '#001F3F',
                text: '#001F3F',
              }
            }}
            icon={() => (
              <MaterialCommunityIcons 
                name="magnify" 
                size={24} 
                color="#001F3F" 
                style={styles.searchIcon}
              />
            )}
            clearIcon={() => (
              searchQuery ? 
              <MaterialCommunityIcons 
                name="close" 
                size={20} 
                color="rgba(0, 31, 63, 0.5)"
                style={styles.clearIcon}
              /> : null
            )}
          />
        </Surface>
      </View>

      <ScrollView style={styles.content}>
        <Surface style={styles.statsCard}>
          <View style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{devices.length}</Text>
              <Text style={styles.statLabel}>Toplam Cihaz</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalConsumption.toFixed(2)} kWh</Text>
              <Text style={styles.statLabel}>Günlük Tüketim</Text>
            </View>
          </View>
        </Surface>

        <View style={styles.deviceList}>
          {filteredDevices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onPress={() => handleDevicePress(device)}
              onLongPress={() => handleDeviceLongPress(device)}
            />
          ))}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        color="white"
        backgroundColor="#001F3F"
        onPress={() => navigation.navigate('CihazEkle')}
        label="Cihaz Ekle"
      />

      <Portal>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={{ x: width / 2, y: width / 2 }}
        >
          <Menu.Item 
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('CihazEkle', { device: selectedDevice });
            }} 
            title="Düzenle" 
            icon="pencil"
          />
          <Menu.Item 
            onPress={() => {
              setMenuVisible(false);
              setDeleteDialogVisible(true);
            }} 
            title="Sil" 
            icon="delete"
          />
        </Menu>

        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Cihazı Sil</Dialog.Title>
          <Dialog.Content>
            <Text>Bu cihazı silmek istediğinizden emin misiniz?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>İptal</Button>
            <Button 
              onPress={() => {
                // Silme işlemi
                setDeleteDialogVisible(false);
              }}
              color="#f44336"
            >
              Sil
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 0,
  },
  searchSurface: {
    borderRadius: 15,
    elevation: 4,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  searchbar: {
    elevation: 0,
    backgroundColor: 'white',
    height: 56,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 31, 63, 0.08)',
  },
  searchInput: {
    fontSize: 16,
    color: '#001F3F',
    marginLeft: 8,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
  searchIcon: {
    marginLeft: 6,
    opacity: 0.9,
  },
  clearIcon: {
    marginRight: 6,
  },
  content: {
    flex: 1,
    padding: 16,
    marginTop: -20,
  },
  statsCard: {
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: 'white',
    elevation: 4,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#001F3F',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  deviceList: {
    gap: 12,
  },
  deviceCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    elevation: 2,
  },
  deviceIconContainer: {
    justifyContent: 'center',
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    marginBottom: 4,
  },
  deviceDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  consumptionText: {
    fontSize: 12,
    color: '#001F3F',
  },
  deviceStatus: {
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#001F3F',
  },
  deviceIcon: {
    backgroundColor: '#001F3F',
  },
});

export default CihazListesiScreen;
