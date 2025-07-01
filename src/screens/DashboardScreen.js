import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Surface, useTheme, IconButton, Title } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Shadow } from 'react-native-shadow-2';
import { StatusBar } from 'react-native';
import { hexToRgba } from '../utils/colors';
import { auth, db } from '../firebaseConfig';
import { ref, get, onValue } from 'firebase/database';
import { getWeekDayFromDate, sortDataByDayOfWeek, getLastWeekDates, getCurrentWeekDates } from '../utils/dateUtils';
import { useEnergy } from '../context/EnergyContext';

const { width } = Dimensions.get('window');

// TimeRangeSelector komponenti
const TimeRangeSelector = ({ activeRange, onRangeChange }) => {
  const ranges = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
  
  return (
    <View style={styles.periodButtons}>
      {ranges.map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.periodButton,
            activeRange === range && styles.activePeriodButton
          ]}
          onPress={() => onRangeChange(range)}
        >
          <Text style={[
            styles.periodButtonText,
            activeRange === range && styles.activePeriodButtonText
          ]}>
            {range}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// StatCard komponenti
const StatCard = ({ title, value, unit, icon, color, trend, trendValue }) => (
  <MotiView
    from={{ opacity: 0, translateY: 20 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 1000 }}
  >
    <Surface style={[styles.statCard, { borderColor: color }]}>
      <View style={[styles.iconBox, { backgroundColor: hexToRgba(color, 0.1) }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <View style={styles.valueContainer}>
          <Text style={[styles.statValue, { color: color }]}>
            {typeof value === 'number' ? value.toFixed(2).replace(/\.?0+$/, '') : value}
          </Text>
          <Text style={styles.statUnit}> {unit}</Text>
        </View>
        <Text style={styles.statTitle}>{title}</Text>
        {trend && (
          <View style={styles.trendBox}>
            <Text style={[styles.trendValue, { color: '#4caf50' }]}>{trendValue}</Text>
          </View>
        )}
      </View>
    </Surface>
  </MotiView>
);

// LineChart komponentinden hemen önce IconLabel komponentini ekleyelim
const IconLabel = ({ name }) => (
  <MaterialCommunityIcons name={name} size={24} color="#666666" />
);

const DashboardScreen = ({ navigation }) => {
  const theme = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('Daily');
  const [consumptionData, setConsumptionData] = useState({
    labels: [],
    datasets: [{ data: [] }]
  });
  const [stats, setStats] = useState({
    totalConsumption: 0,
    totalCost: 0,
    savings: 0,
    co2: 0
  });
  const { energyData } = useEnergy();

  // Cihaz tiplerinin ikonlarını MaterialCommunityIcons ile güncelle
  const deviceIcons = {
    'Isıtma/Soğutma': 'thermometer',
    'Elektronik': 'television',
    'Aydınlatma': 'lightbulb',
    'Beyaz Eşya': 'washing-machine'
  };

  // Period'a göre basit hesaplamalar
    const getPeriodMultiplier = (period) => {
      switch(period) {
      case 'Daily': return 1;
      case 'Weekly': return 7;
      case 'Monthly': return 30;
      case 'Yearly': return 365;
      default: return 1;
    }
  };

  // Stats'ları güncelle
  const updateStats = () => {
    const multiplier = getPeriodMultiplier(selectedPeriod);
    const consumption = energyData.totalDaily * multiplier;
    const cost = energyData.totalCost * multiplier;

      setStats({
      totalConsumption: consumption,
      totalCost: cost,
      co2: energyData.co2Emission * multiplier,
      savings: energyData.savings
    });

    console.log('📊 Dashboard stats güncellendi:', {
      period: selectedPeriod,
      consumption: consumption.toFixed(2) + ' kWh',
      cost: cost.toFixed(2) + ' TL',
      co2: (energyData.co2Emission * multiplier).toFixed(2) + ' kg',
      savings: energyData.savings.toFixed(1) + '%'
    });
  };

  // Grafik için gerçek cihaz verilerini al
  const updateChartData = () => {
    const deviceTypes = {
      'Elektronik': { emoji: '📺', value: 0 },
      'Beyaz Eşya': { emoji: '❄️', value: 0 },
      'Aydınlatma': { emoji: '💡', value: 0 },
      'Isıtma/Soğutma': { emoji: '🔥', value: 0 }
    };

    // Firebase'den gerçek cihaz verilerini al (context'ten)
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const cihazlarRef = ref(db, `users/${userId}/cihazlar`);
      
      // Gerçek zamanlı veri dinleme
      onValue(cihazlarRef, (snapshot) => {
        const devices = snapshot.val();
        
        // Önce tüm değerleri sıfırla
        Object.keys(deviceTypes).forEach(type => {
          deviceTypes[type].value = 0;
        });
        
        if (devices) {
          Object.values(devices).forEach(device => {
            if (device.guc && device.dailyUsage && device.type && deviceTypes[device.type]) {
              const powerInKW = parseFloat(device.guc) / 1000;
              const hoursPerDay = parseFloat(device.dailyUsage);
              const dailyKWh = powerInKW * hoursPerDay;
              deviceTypes[device.type].value += dailyKWh;
            }
          });
        }

        // Tüm cihaz tiplerini göster (0 olanlar da dahil)
        const allTypes = Object.entries(deviceTypes);
        
        const labels = allTypes.map(([type, data]) => data.emoji);
        const data = allTypes.map(([type, data]) => Number(data.value.toFixed(2)));

      setConsumptionData({
          labels: labels,
          datasets: [{ data: data }]
        });

        console.log('📊 Grafik verileri güncellendi:', {
          allTypes: allTypes.length,
          types: allTypes.map(([type, data]) => `${type}: ${data.value.toFixed(2)} kWh`)
        });
      });
    }
  };

  // Period değiştiğinde güncelle
  useEffect(() => {
    updateStats();
    updateChartData();
  }, [selectedPeriod, energyData]);

  // Grafik render kısmını güncelle
  const renderChart = () => (
    <LineChart
      data={consumptionData}
      width={width - 80}
      height={170}
      chartConfig={{
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 1,
        color: () => '#001F3F',
        labelColor: () => '#666666',
        style: { borderRadius: 16 },
        propsForDots: {
          r: '4',
          strokeWidth: '2',
          stroke: '#001F3F'
        },
        formatYLabel: (value) => Number(value).toFixed(1)
      }}
      style={{
        marginVertical: 4,
        borderRadius: 16,
        marginLeft: -25,
      }}
      withInnerLines={true}
      withOuterLines={true}
      withVerticalLines={true}
      withHorizontalLines={true}
      withDots={true}
      withShadow={false}
      segments={4}
      bezier
      fromZero
    />
  );

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
          <Title style={styles.headerTitle}>Energy Tracking</Title>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TimeRangeSelector 
          activeRange={selectedPeriod}
          onRangeChange={setSelectedPeriod}
        />

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Device Type Consumption</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={consumptionData}
              width={width - 80}
              height={170}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 1,
                  color: () => '#001F3F',
                labelColor: () => '#666666',
                style: { borderRadius: 16 },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                    stroke: '#001F3F'
                },
                formatYLabel: (value) => Number(value).toFixed(1)
              }}
              style={{
                marginVertical: 4,
                borderRadius: 16,
                marginLeft: -25,
              }}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              withDots={true}
              withShadow={false}
              segments={4}
              bezier
              fromZero
            />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Total Consumption"
            value={stats.totalConsumption}
            unit="kWh"
            icon="flash"
            color="#001F3F"
          />
          <StatCard
            title="Total Cost"
            value={stats.totalCost}
            unit="₺"
            icon="currency-try"
            color="#03dac6"
          />
          <StatCard
            title="Savings"
            value={stats.savings}
            unit="%"
            icon="trending-down"
            color="#4caf50"
            trend={stats.savings > 0 ? 'down' : 'up'}
            trendValue={`${Math.abs(stats.savings)}%`}
          />
          <StatCard
            title="CO2 Emissions"
            value={stats.co2}
            unit="kg"
            icon="molecule-co2"
            color="#f44336"
          />
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
    paddingVertical: 16,
  },
  periodButtons: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderColor: '#001F3F',
  },
  activePeriodButton: {
    backgroundColor: '#001F3F',
    borderRadius: 8,
  },
  periodButtonText: {
    color: '#001F3F',
    fontSize: 14,
  },
  activePeriodButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  chartTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCardWrapper: {
    width: '48%',
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    width: '100%',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statUnit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 2,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  trendBox: {
    position: 'absolute',
    top: -24,
    right: -8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  iconWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    paddingBottom: 15,
    paddingHorizontal: 8,
  },
  iconContainer: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    width: '100%',
    paddingLeft: 52,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '78%',
  },
  iconBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DashboardScreen; 