import React, { useState } from 'react';
import { View, ScrollView, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme, IconButton } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Shadow } from 'react-native-shadow-2';
import { StatusBar } from 'react-native';
import { hexToRgba } from '../utils/colors';

const { width, height } = Dimensions.get('window');

const StatCard = ({ title, value, unit, icon, color, trend, trendValue }) => (
  <MotiView
    from={{ opacity: 0, translateY: 20 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 1000 }}
  >
    <Shadow distance={8} startColor={hexToRgba(color, 0.12)}>
      <Surface style={styles.statCard}>
        <View style={styles.statHeader}>
          <View style={[styles.iconContainer, { backgroundColor: hexToRgba(color, 0.1) }]}>
            <MaterialCommunityIcons name={icon} size={24} color={color} />
          </View>
          {trend && (
            <View style={[styles.trendContainer, { 
              backgroundColor: trend === 'up' ? '#ffebee' : '#e8f5e9' 
            }]}>
              <MaterialCommunityIcons 
                name={trend === 'up' ? 'trending-up' : 'trending-down'} 
                size={16} 
                color={trend === 'up' ? '#f44336' : '#4caf50'} 
              />
              <Text style={[styles.trendValue, { 
                color: trend === 'up' ? '#f44336' : '#4caf50' 
              }]}>
                {trendValue}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.statContent}>
          <View style={styles.valueContainer}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statUnit}>{unit}</Text>
          </View>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </Surface>
    </Shadow>
  </MotiView>
);

const TimeRangeSelector = ({ activeRange, onRangeChange }) => {
  const ranges = ['Gün', 'Hafta', 'Ay', 'Yıl'];
  
  return (
    <View style={styles.timeRangeContainer}>
      {ranges.map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.rangeButton,
            activeRange === range && styles.activeRangeButton
          ]}
          onPress={() => onRangeChange(range)}
        >
          <Text style={[
            styles.rangeText,
            activeRange === range && styles.activeRangeText
          ]}>
            {range}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('Gün');
  
  const chartData = {
    labels: ['00:00', '06:00', '12:00', '18:00', '24:00'],
    datasets: [{
      data: [2.1, 1.8, 3.5, 4.2, 2.8],
      color: () => theme.colors.primary,
    }],
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <LinearGradient
        colors={[theme.colors.primary, hexToRgba(theme.colors.primary, 0.8)]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Enerji Takibi</Text>
          <IconButton 
            icon="tune-vertical" 
            color="white" 
            size={24}
            style={styles.filterButton}
          />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TimeRangeSelector 
          activeRange={timeRange}
          onRangeChange={setTimeRange}
        />

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Tüketim Grafiği</Text>
          <LineChart
            data={chartData}
            width={width - 48}
            height={220}
            chartConfig={{
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 1,
              color: (opacity = 1) => hexToRgba(theme.colors.primary, opacity),
              labelColor: () => '#333',
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: theme.colors.primary,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Anlık Tüketim"
            value="3.2"
            unit="kW"
            icon="flash"
            color={theme.colors.primary}
            trend="down"
            trendValue="12%"
          />
          <StatCard
            title="Günlük Tüketim"
            value="24.5"
            unit="kWh"
            icon="calendar-today"
            color="#00bcd4"
          />
          <StatCard
            title="Tahmini Fatura"
            value="386"
            unit="₺"
            icon="currency-try"
            color="#4caf50"
            trend="up"
            trendValue="8%"
          />
          <StatCard
            title="Karbon Ayak İzi"
            value="12.3"
            unit="kg"
            icon="leaf"
            color="#ff9800"
            trend="down"
            trendValue="5%"
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    margin: 0,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeRangeButton: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
  },
  rangeText: {
    color: '#666',
    fontSize: 14,
  },
  activeRangeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  statCard: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'white',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 6,
  },
  trendValue: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  statContent: {
    gap: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 4,
  },
  statUnit: {
    fontSize: 14,
    color: '#666',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
  },
});

export default Dashboard; 