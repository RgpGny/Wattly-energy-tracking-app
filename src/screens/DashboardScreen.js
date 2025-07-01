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
import { ref, get } from 'firebase/database';
import { getWeekDayFromDate, sortDataByDayOfWeek, getLastWeekDates, getCurrentWeekDates } from '../utils/dateUtils';
import { useEnergy } from '../context/EnergyContext';

const { width } = Dimensions.get('window');

// TimeRangeSelector komponenti
const TimeRangeSelector = ({ activeRange, onRangeChange }) => {
  const ranges = ['Günlük', 'Haftalık', 'Aylık', 'Yıllık'];
  
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
          <Text style={[styles.statValue, { color: color }]}>{value}</Text>
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
  const [selectedPeriod, setSelectedPeriod] = useState('Hafta');
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
  const [weeklyData, setWeeklyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { updateEnergyStats } = useEnergy();

  // Cihaz tiplerinin ikonlarını MaterialCommunityIcons ile güncelle
  const deviceIcons = {
    'Isıtma/Soğutma': 'thermometer',
    'Elektronik': 'television',
    'Aydınlatma': 'lightbulb',
    'Beyaz Eşya': 'washing-machine'
  };

  // Günlük verileri getir
  const fetchDailyData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const dailyRef = ref(db, `users/${userId}/cihazlar_gunluk`);
      const snapshot = await get(dailyRef);
      
      if (snapshot.exists()) {
        const dailyData = snapshot.val();
        processData(dailyData, selectedPeriod);
      }
    } catch (error) {
      console.error('Veri getirme hatası:', error);
    }
  };

  // Verileri işle ve grafik/istatistikleri güncelle
  const processData = async (dailyData, period) => {
    try {
      let chartData;
      switch(period) {
        case 'Günlük':
          chartData = processDeviceTypeData(dailyData);
          await updateStats(dailyData, period);
          break;
        case 'Haftalık':
          chartData = processWeeklyData(dailyData);
          await updateStats(dailyData, period);
          break;
        case 'Aylık':
          chartData = processMonthlyData(dailyData);
          await updateStats(dailyData, period);
          break;
        case 'Yıllık':
          chartData = processYearlyData(dailyData);
          await updateStats(dailyData, period);
          break;
        default:
          chartData = { labels: [], datasets: [{ data: [0] }] };
          await updateStats({}, period);
      }

      // Verileri kontrol et ve geçersiz değerleri temizle
      chartData.datasets[0].data = chartData.datasets[0].data.map(value => {
        if (!isFinite(value) || isNaN(value)) return 0;
        return Number(value.toFixed(2));
      });

      setConsumptionData(chartData);
    } catch (error) {
      console.error('Veri işleme hatası:', error);
      setConsumptionData({ labels: [], datasets: [{ data: [0] }] });
      await updateStats({}, period);
    }
  };

  // Cihaz tiplerine göre günlük veri
  const processDeviceTypeData = (allData) => {
    try {
    const today = formatDateToString(new Date());
      const todayData = allData[today]?.cihazlar || {};
    
    const deviceTypes = {
      'Isıtma/Soğutma': { value: 0, icon: 'thermometer' },
      'Elektronik': { value: 0, icon: 'television' },
      'Aydınlatma': { value: 0, icon: 'lightbulb' },
      'Beyaz Eşya': { value: 0, icon: 'washing-machine' }
    };

      let totalConsumption = 0;
    Object.values(todayData).forEach(device => {
      if (device && device.guc && device.dailyUsage) {
          const powerInKW = parseFloat(device.guc) / 1000;
          const hours = parseFloat(device.dailyUsage);
          const consumption = powerInKW * hours;
          
        if (isFinite(consumption)) {
          deviceTypes[device.type].value += consumption;
            totalConsumption += consumption;
        }
      }
    });

    return {
        labels: Object.keys(deviceTypes),
      datasets: [{ 
        data: Object.values(deviceTypes).map(type => Number(type.value.toFixed(2)))
        }],
        totalConsumption // Toplam tüketimi de döndür
      };
    } catch (error) {
      console.error('Günlük veri işleme hatası:', error);
      return {
        labels: Object.keys(deviceTypes),
        datasets: [{ data: [0, 0, 0, 0] }],
        totalConsumption: 0
      };
    }
  };

  // Haftalık veri
  const processWeeklyData = (data) => {
    try {
      const weekDays = getCurrentWeekDates();
      const weekDayMap = weekDays.reduce((acc, day) => {
        acc[day.dateStr] = day;
        return acc;
      }, {});

      // Her gün için varsayılan 0 değerli bir dizi oluştur
      const defaultWeekData = new Array(7).fill(0);
      
      // Veritabanından gelen verileri doğru günlere yerleştir
      Object.entries(data).forEach(([dateStr, dayData]) => {
        if (weekDayMap[dateStr]) {
          const dayIndex = weekDayMap[dateStr].dayIndex;
          // Pazar günü için 0 yerine 6 kullan (Pazartesi: 0, Salı: 1, ..., Pazar: 6)
          const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
          
          const consumption = Object.values(dayData.cihazlar || {}).reduce((sum, device) => {
            if (!device || !device.guc || !device.dailyUsage) return sum;
            const dailyKWh = (parseFloat(device.guc) * parseFloat(device.dailyUsage)) / 1000;
            return sum + (isFinite(dailyKWh) ? dailyKWh : 0);
          }, 0);

          defaultWeekData[adjustedIndex] = Number(consumption.toFixed(2));
        }
      });

    return {
        labels: ['P', 'S', 'Ç', 'PRŞ', 'C', 'CMT', 'PZ'],
        datasets: [{
          data: defaultWeekData
        }]
      };
    } catch (error) {
      console.error('Haftalık veri işleme hatası:', error);
      return {
        labels: ['P', 'S', 'Ç', 'PRŞ', 'C', 'CMT', 'PZ'],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }]
      };
    }
  };

  // Aylık veri işleme fonksiyonunu güncelle
  const processMonthlyData = (dailyData) => {
    try {
    const today = new Date();
      const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

      // Ayın ilk gününü bul
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      
      // Ayın son gününü bul
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      const totalDaysInMonth = lastDayOfMonth.getDate();
      
      // Haftalık veriler için dizi (4 veya 5 hafta)
      const weeklyData = new Array(Math.ceil(totalDaysInMonth / 7)).fill(0);
      
      // Her günün hangi haftaya ait olduğunu belirle ve verileri topla
      Object.entries(dailyData).forEach(([dateStr, dayData]) => {
        const year = parseInt(dateStr.slice(0, 4));
        const month = parseInt(dateStr.slice(4, 6)) - 1;
        const day = parseInt(dateStr.slice(6, 8));
        const date = new Date(year, month, day);
        
        // Sadece mevcut ayın verilerini işle
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          // Ayın kaçıncı haftası olduğunu hesapla (0'dan başlar)
          const weekNumber = Math.floor((day - 1) / 7);
          
          // Günlük tüketimi hesapla
          const consumption = Object.values(dayData.cihazlar || {}).reduce((sum, device) => {
            if (!device || !device.guc || !device.dailyUsage) return sum;
            const dailyKWh = (parseFloat(device.guc) * parseFloat(device.dailyUsage)) / 1000;
            return sum + (isFinite(dailyKWh) ? dailyKWh : 0);
        }, 0);
          
          // İlgili haftanın toplam tüketimine ekle
          if (weekNumber >= 0 && weekNumber < weeklyData.length) {
            weeklyData[weekNumber] += Number(consumption.toFixed(2));
          }
        }
      });

      // Hafta etiketlerini oluştur
      const weekLabels = weeklyData.map((_, index) => `${index + 1}.Hafta`);
      
      // Sıfır olan son haftaları kaldır
      const lastNonZeroIndex = weeklyData.reduce((lastIndex, value, index) => 
        value !== 0 || index === weeklyData.length - 1 ? index : lastIndex, 0);

    return {
        labels: weekLabels.slice(0, lastNonZeroIndex + 1),
        datasets: [{
          data: weeklyData.slice(0, lastNonZeroIndex + 1)
        }]
      };
    } catch (error) {
      console.error('Aylık veri işleme hatası:', error);
      return {
        labels: ['1.Hafta', '2.Hafta', '3.Hafta', '4.Hafta', '5.Hafta'],
        datasets: [{ data: [0, 0, 0, 0, 0] }]
      };
    }
  };

  // Yıllık veri
  const processYearlyData = (dailyData) => {
    try {
      const currentYear = new Date().getFullYear();
      const monthlyData = new Array(12).fill(0);

      Object.entries(dailyData).forEach(([dateStr, dayData]) => {
        const year = parseInt(dateStr.slice(0, 4));
        const month = parseInt(dateStr.slice(4, 6)) - 1;

        // Sadece mevcut yılın verilerini işle
        if (year === currentYear) {
          const consumption = Object.values(dayData.cihazlar || {}).reduce((sum, device) => {
            if (!device || !device.guc || !device.dailyUsage) return sum;
            const dailyKWh = (parseFloat(device.guc) * parseFloat(device.dailyUsage)) / 1000;
            return sum + (isFinite(dailyKWh) ? dailyKWh : 0);
      }, 0);

          monthlyData[month] += Number(consumption.toFixed(2));
        }
    });

    return {
        labels: ['O', 'Ş', 'M', 'N', 'M', 'H', 'T', 'A', 'E', 'E', 'K', 'A'],
        datasets: [{ data: monthlyData }]
      };
    } catch (error) {
      console.error('Yıllık veri işleme hatası:', error);
      return {
        labels: ['O', 'Ş', 'M', 'N', 'M', 'H', 'T', 'A', 'E', 'E', 'K', 'A'],
        datasets: [{ data: new Array(12).fill(0) }]
      };
    }
  };

  // Tarihi YYYYMMDD formatına çevir
  const formatDateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };

  // İstatistikleri güncelle
  const updateStats = async (allData, period) => {
    try {
      let totalConsumption = 0;
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      // Periyoda göre tarih aralığını belirle
      let startDate = new Date();
      switch(period) {
        case 'Günlük':
          startDate = today;
          break;
        case 'Haftalık':
          startDate.setDate(today.getDate() - 7);
          break;
        case 'Aylık':
          startDate.setMonth(today.getMonth() - 1);
          break;
        case 'Yıllık':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
      }

      // Seçilen periyottaki verileri topla
      Object.entries(allData).forEach(([dateStr, dayData]) => {
        const date = new Date(
          parseInt(dateStr.slice(0, 4)),
          parseInt(dateStr.slice(4, 6)) - 1,
          parseInt(dateStr.slice(6, 8))
        );

        if (date >= startDate && date <= today) {
          const dailyConsumption = calculateDailyConsumption(dayData);
          totalConsumption += dailyConsumption;
        }
      });

      // Toplam maliyeti hesapla
      const BIRIM_FIYAT = 2.5; // kWh başına TL
      const totalCost = totalConsumption * BIRIM_FIYAT;

      // CO2 salınımını hesapla
      const CO2_KATSAYI = 0.472; // kWh başına kg CO2
      const co2 = totalConsumption * CO2_KATSAYI;

      // Tasarruf oranını hesapla
      let savings = 0;
      const previousPeriodConsumption = calculatePreviousPeriodConsumption(allData, period);
      if (previousPeriodConsumption > 0) {
        savings = ((previousPeriodConsumption - totalConsumption) / previousPeriodConsumption) * 100;
      }

      setStats({
        totalConsumption: Number(totalConsumption.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        savings: Number(savings.toFixed(1)),
        co2: Number(co2.toFixed(2))
      });
    } catch (error) {
      console.error('İstatistik güncelleme hatası:', error);
      setStats({
        totalConsumption: 0,
        totalCost: 0,
        savings: 0,
        co2: 0
      });
    }
  };

  // Önceki periyodun tüketimini hesapla
  const calculatePreviousPeriodConsumption = (allData, period) => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch(period) {
      case 'Günlük':
        startDate.setDate(today.getDate() - 2);
        endDate.setDate(today.getDate() - 1);
        break;
      case 'Haftalık':
        startDate.setDate(today.getDate() - 14);
        endDate.setDate(today.getDate() - 7);
        break;
      case 'Aylık':
        startDate.setMonth(today.getMonth() - 2);
        endDate.setMonth(today.getMonth() - 1);
        break;
      case 'Yıllık':
        startDate.setFullYear(today.getFullYear() - 2);
        endDate.setFullYear(today.getFullYear() - 1);
        break;
    }

    let consumption = 0;
    Object.entries(allData).forEach(([dateStr, dayData]) => {
      const date = new Date(
        parseInt(dateStr.slice(0, 4)),
        parseInt(dateStr.slice(4, 6)) - 1,
        parseInt(dateStr.slice(6, 8))
      );

      if (date >= startDate && date <= endDate) {
        consumption += calculateDailyConsumption(dayData);
      }
    });

    return consumption;
  };

  // Tarihleri görüntüleme formatına çevir
  const formatDatesForDisplay = (dates, period) => {
    return dates.map(date => {
      const year = date.slice(0, 4);
      const month = date.slice(4, 6);
      const day = date.slice(6, 8);
      
      switch(period) {
        case 'Hafta':
          return `${day}.${month}`;
        case 'Ay':
          return `${day}`;
        case 'Yıl':
          const monthLetters = ['O', 'Ş', 'M', 'N', 'M', 'H', 'T', 'A', 'E', 'E', 'K', 'A'];
          return monthLetters[parseInt(month) - 1];
        default:
          return `${day}.${month}`;
      }
    });
  };

  // Tarih filtreleme
  const filterDatesByPeriod = (dates, period) => {
    const today = new Date();
    const periodDays = {
      'Hafta': 7,
      'Ay': 30,
      'Yıl': 365
    };
    
    return dates.filter(date => {
      const dateObj = new Date(
        date.slice(0, 4),
        parseInt(date.slice(4, 6)) - 1,
        date.slice(6, 8)
      );
      const diffTime = Math.abs(today - dateObj);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= periodDays[period];
    }).slice(-periodDays[period]);
  };

  // Günlük tüketim hesaplama
  const calculateDailyConsumption = (dayData) => {
    try {
      if (!dayData || !dayData.cihazlar) return 0;
      
      return Object.values(dayData.cihazlar).reduce((total, device) => {
        if (!device || !device.guc || !device.dailyUsage) return total;
        
        // Watt'ı kW'a çevir ve günlük kullanım saatiyle çarp
        const powerInKW = parseFloat(device.guc) / 1000;
        const hours = parseFloat(device.dailyUsage);
        const dailyKWh = powerInKW * hours;
        
        return total + (isFinite(dailyKWh) ? dailyKWh : 0);
    }, 0);
    } catch (error) {
      console.error('Günlük tüketim hesaplama hatası:', error);
      return 0;
    }
  };

  // fetchMonthlyData fonksiyonunu ekle
  const fetchMonthlyData = async () => {
    try {
      if (!auth.currentUser) return;
      const userId = auth.currentUser.uid;

      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
      
      // Ayın tüm günlerinin verilerini al
      const monthRef = ref(db, `users/${userId}/cihazlar_gunluk`);
      const snapshot = await get(monthRef);
      
      if (snapshot.exists()) {
        const allData = snapshot.val();
        // Sadece bu aya ait verileri filtrele
        const monthlyData = Object.entries(allData)
          .filter(([date]) => date.startsWith(`${currentYear}${currentMonth}`))
          .reduce((acc, [date, data]) => {
            acc[date] = data;
            return acc;
          }, {});

        const processedData = processMonthlyData(monthlyData);
        setConsumptionData(processedData);
      }
    } catch (error) {
      console.error('Aylık veri getirme hatası:', error);
      setConsumptionData({
        labels: ['1.Hafta', '2.Hafta', '3.Hafta', '4.Hafta'],
        datasets: [{ data: [0, 0, 0, 0] }]
      });
    }
  };

  // fetchWeeklyData fonksiyonunu component içinde ama useEffect'lerin dışında tanımla
  const fetchWeeklyData = async () => {
    try {
      if (!auth.currentUser) return;
      const userId = auth.currentUser.uid;

      const weekDates = getCurrentWeekDates();
      const weeklyData = {};

      // Mevcut haftanın verilerini al
      for (const dayInfo of weekDates) {
        const dayRef = ref(db, `users/${userId}/cihazlar_gunluk/${dayInfo.dateStr}`);
        const snapshot = await get(dayRef);
        if (snapshot.exists()) {
          weeklyData[dayInfo.dateStr] = snapshot.val();
        }
      }

      const processedData = processWeeklyData(weeklyData);
      setConsumptionData(processedData);
    } catch (error) {
      console.error('Haftalık veri getirme hatası:', error);
      setConsumptionData({
        labels: ['P', 'S', 'Ç', 'PRŞ', 'C', 'CMT', 'PZ'],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }]
      });
    }
  };

  // Yıllık veri getirme fonksiyonunu ekle
  const fetchYearlyData = async () => {
    try {
      if (!auth.currentUser) return;
      const userId = auth.currentUser.uid;
      const currentYear = new Date().getFullYear();

      const yearRef = ref(db, `users/${userId}/cihazlar_gunluk`);
      const snapshot = await get(yearRef);

      if (snapshot.exists()) {
        const allData = snapshot.val();
        // Sadece bu yıla ait verileri filtrele
        const yearlyData = Object.entries(allData)
          .filter(([date]) => date.startsWith(currentYear.toString()))
          .reduce((acc, [date, data]) => {
            acc[date] = data;
            return acc;
          }, {});

        const processedData = processYearlyData(yearlyData);
        setConsumptionData(processedData);
      }
    } catch (error) {
      console.error('Yıllık veri getirme hatası:', error);
      setConsumptionData({
        labels: ['O', 'Ş', 'M', 'N', 'M', 'H', 'T', 'A', 'E', 'E', 'K', 'A'],
        datasets: [{ data: new Array(12).fill(0) }]
      });
    }
  };

  // useEffect'i güncelle ve loading state ekle
  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      const userId = auth.currentUser.uid;
      setIsLoading(true);

      try {
        const dailyRef = ref(db, `users/${userId}/cihazlar_gunluk`);
        const snapshot = await get(dailyRef);
        const allData = snapshot.val() || {};

        switch(selectedPeriod) {
          case 'Günlük': {
            const dailyChartData = processDeviceTypeData(allData);
            setConsumptionData({
              labels: dailyChartData.labels,
              datasets: dailyChartData.datasets
            });

            const todayConsumption = dailyChartData.totalConsumption;
            // Günlük tüketimi context'e gönder
            updateEnergyStats('daily', todayConsumption);
            
            // Günlük istatistikleri hesapla
            const today = formatDateToString(new Date());
            const yesterday = formatDateToString(new Date(Date.now() - 86400000));
            
            const yesterdayConsumption = calculateDailyConsumption(allData[yesterday]);
            
            // Tasarruf oranını hesapla
            let savings = 0;
            if (yesterdayConsumption > 0) {
              savings = ((yesterdayConsumption - todayConsumption) / yesterdayConsumption) * 100;
            }

            // Günlük istatistikleri güncelle
            setStats({
              totalConsumption: Number(todayConsumption.toFixed(2)),
              totalCost: Number((todayConsumption * 2.5).toFixed(2)),
              savings: Number(savings.toFixed(1)),
              co2: Number((todayConsumption * 0.472).toFixed(2))
            });
            break;
          }
          case 'Haftalık':
            const weeklyChartData = processWeeklyData(allData);
            setConsumptionData(weeklyChartData);
            const weeklyTotal = weeklyChartData.datasets[0].data.reduce((a, b) => a + b, 0);
            updateEnergyStats('weekly', weeklyTotal);
            await updateStats(allData, 'Haftalık');
            break;
          
          case 'Aylık':
            const monthlyChartData = processMonthlyData(allData);
            setConsumptionData(monthlyChartData);
            const monthlyTotal = monthlyChartData.datasets[0].data.reduce((a, b) => a + b, 0);
            updateEnergyStats('monthly', monthlyTotal);
            await updateStats(allData, 'Aylık');
            break;
          
          case 'Yıllık':
            const yearlyChartData = processYearlyData(allData);
            setConsumptionData(yearlyChartData);
            const yearlyTotal = yearlyChartData.datasets[0].data.reduce((a, b) => a + b, 0);
            updateEnergyStats('yearly', yearlyTotal);
            await updateStats(allData, 'Yıllık');
            break;
        }
      } catch (error) {
        console.error('Veri getirme hatası:', error);
        setConsumptionData({
          labels: [],
          datasets: [{ data: [0] }]
        });
        setStats({
          totalConsumption: 0,
          totalCost: 0,
          savings: 0,
          co2: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod]);

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
          <Title style={styles.headerTitle}>Enerji Takibi</Title>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TimeRangeSelector 
          activeRange={selectedPeriod}
          onRangeChange={setSelectedPeriod}
        />

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Tüketim Grafiği</Text>
          <View style={styles.chartContainer}>
            {selectedPeriod === 'Haftalık' ? (
              renderChart()
            ) : (
            <LineChart
              data={{
                labels: selectedPeriod === 'Günlük' 
                  ? ['', '', '', '']
                  : consumptionData.labels,
                datasets: [{
                  data: consumptionData.datasets[0].data || [0],
                    color: () => '#001F3F',
                  strokeWidth: 2
                }]
              }}
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
              horizontalLabelRotation={0}
              verticalLabelRotation={0}
              bezier
              fromZero
            />
            )}
            
            {selectedPeriod === 'Günlük' && (
              <View style={styles.iconContainer}>
                <View style={styles.iconRow}>
                  {Object.entries(deviceIcons).map(([type, icon]) => (
                    <View key={type} style={styles.iconBox}>
                      <MaterialCommunityIcons 
                        name={icon}
                        size={20}
                        color="#666666"
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Toplam Tüketim"
            value={stats.totalConsumption}
            unit="kWh"
            icon="flash"
            color="#001F3F"
          />
          <StatCard
            title="Toplam Maliyet"
            value={stats.totalCost}
            unit="₺"
            icon="currency-try"
            color="#03dac6"
          />
          <StatCard
            title="Tasarruf"
            value={stats.savings}
            unit="%"
            icon="trending-down"
            color="#4caf50"
            trend={stats.savings > 0 ? 'down' : 'up'}
            trendValue={`${Math.abs(stats.savings)}%`}
          />
          <StatCard
            title="CO2 Salınımı"
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