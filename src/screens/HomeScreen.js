import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Animated, Platform } from 'react-native';
import { Card, Title, Text, Surface, IconButton, Avatar, ProgressBar, Badge, Button, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import NavigationButtons from '../components/NavigationButtons';
import { auth } from '../firebaseConfig';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { Shadow } from 'react-native-shadow-2';
import LottieView from 'lottie-react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { SharedElement } from 'react-navigation-shared-element';
import { StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiPressable } from 'moti/interactions';
import { mix, interpolate } from 'react-native-reanimated';
import { useHeaderHeight } from '@react-navigation/elements';
import { hexToRgba } from '../utils/colors';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebaseConfig';
import { saveDailyDeviceData, resetDailyDevices } from '../utils/deviceOperations';
import { useEnergy } from '../context/EnergyContext';

const { width, height } = Dimensions.get('window');

const HEADER_HEIGHT = Platform.OS === 'ios' ? 140 : 120;

const useAnimatedValues = () => {
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.98],
    extrapolate: 'clamp',
  });
  return { scrollY, headerOpacity };
};

const EnhancedStatsCard = ({ title, value, icon, color, trend, trendValue, delay }) => {
  const theme = useTheme();
  
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.5, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{
        type: 'spring',
        delay,
        damping: 15,
        mass: 0.8,
      }}
    >
      <MotiPressable
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        animate={({ pressed }) => ({
          scale: pressed ? 0.98 : 1,
          opacity: pressed ? 0.9 : 1,
        })}
        transition={{ type: 'timing', duration: 150 }}
      >
        <Shadow
          distance={12}
          startColor={hexToRgba(color, 0.12)}
          endColor={hexToRgba(color, 0.01)}
          offset={[0, 6]}
        >
          <Surface style={[styles.statsCard, { borderColor: hexToRgba(color, 0.1), borderWidth: 1 }]}>
            <LottieView
              source={require('../assets/animations/pulse.json')}
              autoPlay
              loop
              style={[styles.backgroundAnimation, { opacity: 0.07 }]}
            />
            <View style={styles.statsHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                <MaterialCommunityIcons name={icon} size={24} color={color} />
              </View>
              {trend && (
                <MotiView
                  from={{ opacity: 0, translateY: -10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: delay + 500 }}
                  style={[styles.trendContainer, { 
                    backgroundColor: trend === 'up' ? '#ffebee' : '#e8f5e9',
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6
                  }]}
                >
                  <MaterialCommunityIcons 
                    name={trend === 'up' ? 'trending-up' : 'trending-down'} 
                    size={16} 
                    color={trend === 'up' ? '#f44336' : '#4caf50'} 
                  />
                  <Text style={[styles.trendText, { 
                    color: trend === 'up' ? '#f44336' : '#4caf50',
                    fontWeight: 'bold'
                  }]}>
                    {trendValue}
                  </Text>
                </MotiView>
              )}
            </View>
            <Text style={[styles.statsValue, { color }]}>{value}</Text>
            <Text style={styles.statsTitle}>{title}</Text>
          </Surface>
        </Shadow>
      </MotiPressable>
    </MotiView>
  );
};

const EnhancedMenuButton = ({ icon, title, notifications, color, onPress, index }) => (
  <MotiView
    from={{ opacity: 0, translateY: 50 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{
      type: 'spring',
      delay: index * 100,
      damping: 15,
    }}
  >
    <MotiPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      animate={({ pressed }) => ({
        scale: pressed ? 0.97 : 1,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Shadow distance={8} startColor={hexToRgba(color, 0.1)}>
        <Surface style={[styles.menuButton, { borderColor: hexToRgba(color, 0.15) }]}>
          <BlurView intensity={80} style={styles.menuButtonBlur}>
            <View style={[styles.menuIconContainer, { backgroundColor: `${color}10` }]}>
              <MaterialCommunityIcons name={icon} size={32} color={color} />
              {notifications > 0 && (
                <Badge 
                  style={[styles.badge, { backgroundColor: color }]}
                  size={20}
                >
                  {notifications}
                </Badge>
              )}
            </View>
            <Text style={[styles.menuTitle, { color: '#333' }]}>{title}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={color} />
          </BlurView>
        </Surface>
      </Shadow>
    </MotiPressable>
  </MotiView>
);

const InsightCard = ({ icon, title, description, color, onPress, delay }) => (
  <MotiView
    from={{ opacity: 0, translateY: 20 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ delay, type: 'timing', duration: 1000 }}
  >
    <Shadow distance={8} startColor={`${color}20`}>
      <TouchableOpacity 
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <LinearGradient
          colors={[color, color.replace('ee', 'aa')]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.insightCardGradient}
        >
          <View style={styles.insightIconContainer}>
            <MaterialCommunityIcons name={icon} size={32} color="#fff" />
          </View>
          <Title style={styles.insightCardTitle}>{title}</Title>
          <Text style={styles.insightCardDescription}>{description}</Text>
          <View style={styles.insightCardFooter}>
            <Text style={styles.insightCardAction}>View Details</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Shadow>
  </MotiView>
);

const getConsumptionTitle = (period) => {
  switch(period) {
          case 'day':
        return 'Daily Consumption';
      case 'week':
        return 'Weekly Consumption';
      case 'month':
        return 'Monthly Consumption';
      case 'year':
        return 'Yearly Consumption';
      default:
        return 'Consumption';
  }
};

const HomeScreen = ({ navigation }) => {
  const theme = useTheme();
  const headerHeight = useHeaderHeight();
  const { scrollY, headerOpacity } = useAnimatedValues();
  const user = auth.currentUser;
  const username = user?.email?.split('@')[0] || 'Kullanıcı';
  const [activeTab, setActiveTab] = useState('day');
  const [insights, setInsights] = useState([
    {
      id: 1,
      icon: 'lightbulb-on',
              title: 'Smart Savings',
      description: 'Reduce stand-by consumption by 70%',
      color: '#001F3F',
    },
    {
      id: 2,
      icon: 'chart-bell-curve',
              title: 'Consumption Analysis',
              description: '15% savings compared to last month',
      color: '#00bcd4',
    },
  ]);
  const [goalCount, setGoalCount] = useState(0);
  const [dailyGoalProgress, setDailyGoalProgress] = useState(0);
  const [dailyGoalTarget, setDailyGoalTarget] = useState(0);
  const { energyData } = useEnergy();
  
  // Period hesaplamaları (basit çarpanlar)
  const getPeriodData = (period) => {
    switch(period) {
      case 'day':
        return {
          consumption: energyData.totalDaily,
          cost: energyData.totalCost
        };
      case 'week':
        return {
          consumption: energyData.totalDaily * 7,
          cost: energyData.totalCost * 7
        };
      case 'month':
        return {
          consumption: energyData.totalDaily * 30,
          cost: energyData.totalCost * 30
        };
      case 'year':
        return {
          consumption: energyData.totalDaily * 365,
          cost: energyData.totalCost * 365
        };
      default:
        return { consumption: 0, cost: 0 };
    }
  };
  
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      return () => {
        StatusBar.setBarStyle('dark-content');
      };
    }, [])
  );

  useEffect(() => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;

    // Sadece hedefler ve cihaz sayısı için dinleyici ekle
    const goalsRef = ref(db, `users/${userId}/goals`);
    const unsubscribeGoals = onValue(goalsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
                    const dailyGoal = Object.values(data).find(goal => goal.period === 'Daily');
        if (dailyGoal) {
          setDailyGoalTarget(dailyGoal.target || 0);
          // Progress'i gerçek veriye göre hesapla
          const progress = energyData.totalDaily / dailyGoal.target;
          setDailyGoalProgress(progress);
        }
        setGoalCount(Object.keys(data).length);
      }
    });

    return () => {
      unsubscribeGoals();
    };
  }, [energyData.totalDaily]); // energyData.totalDaily dependency'si ekleyelim

  useEffect(() => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;

    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        resetDailyDevices(userId);
      }
    };

    // Her dakika kontrol et
    const interval = setInterval(checkMidnight, 60000);

    // Component unmount olduğunda interval'i temizle
    return () => clearInterval(interval);
  }, []);

  const renderGlassHeader = () => (
    <Animated.View style={[styles.glassHeader, { opacity: headerOpacity }]}>
      <LinearGradient
        colors={['#001F3F', '#002c5c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.profileInfo}>
          <TouchableOpacity 
            style={styles.profileLeft}
            onPress={() => navigation.navigate('Profile')}
          >
            <Avatar.Text 
              size={40}
              label={username[0].toUpperCase()} 
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text style={styles.username}>{username}</Text>
            </View>
          </TouchableOpacity>
          <IconButton 
            icon="bell-outline" 
            color="white" 
            size={24}
            style={styles.notificationButton}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderPeriodTabs = () => {
    const periodLabels = {
              day: 'Daily',
        week: 'Weekly',
        month: 'Monthly',
        year: 'Yearly'
    };

    return (
      <View style={styles.periodTabs}>
        {['day', 'week', 'month', 'year'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.periodTab, activeTab === period && styles.activeTab]}
            onPress={() => setActiveTab(period)}
          >
            <Text style={[styles.periodText, activeTab === period && styles.activeText]}>
              {periodLabels[period]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {renderGlassHeader()}

      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.mainContent}>
          {renderPeriodTabs()}

          <View style={styles.statsGrid}>
            <EnhancedStatsCard
              title={getConsumptionTitle(activeTab)}
              value={`${getPeriodData(activeTab).consumption.toFixed(2).replace(/\.?0+$/, '')} kWh`}
              icon="flash"
              color="#001F3F"
              trend={dailyGoalTarget > 0 && activeTab === 'day' ? "up" : undefined}
              trendValue={dailyGoalTarget > 0 && activeTab === 'day' ? 
                `%${Math.round(dailyGoalProgress * 100)}` : undefined}
              delay={0}
            />
            <EnhancedStatsCard
              title="Total Cost"
              value={`${getPeriodData(activeTab).cost.toFixed(2).replace(/\.?0+$/, '')} ₺`}
              icon="currency-try"
              color="#00bcd4"
              trend={activeTab !== 'day' ? "up" : undefined}
              trendValue={activeTab !== 'day' ? 
                `${activeTab === 'week' ? '7' : activeTab === 'month' ? '30' : '365'} gün` : undefined}
              delay={200}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Hızlı Erişim</Title>
      <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={styles.seeAllText}>Tümünü Gör</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#001F3F" />
      </TouchableOpacity>
          </View>

          <View style={styles.menuGrid}>
            {[
              {
                icon: "chart-line",
                title: "Energy Tracking",
                color: "#001F3F",
                notifications: 0,
                route: 'Dashboard'
              },
              {
                icon: "devices",
                title: "My Devices",
                color: "#00bcd4",
                notifications: energyData.deviceCount,
                route: 'CihazListesi'
              },
              {
                icon: "target",
                title: "My Goals",
                color: "#4caf50",
                notifications: goalCount,
                route: 'Goals'
              }
            ].map((item, index) => (
              <EnhancedMenuButton
                key={item.route}
                {...item}
                index={index}
                onPress={() => navigation.navigate(item.route)}
              />
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Suggestions</Title>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.insightsContainer}
          >
            {insights.map((insight, index) => (
              <InsightCard
                key={insight.id}
                {...insight}
                delay={index * 100}
                onPress={() => {
                  // İlgili detay sayfasına git
                }}
              />
            ))}
          </ScrollView>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  glassHeader: {
    height: HEADER_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerGradient: {
    height: HEADER_HEIGHT,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'ios' ? 10 : 5,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  userInfo: {
    marginLeft: 12,
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  username: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    margin: 0,
  },
  consumptionContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 15,
  },
  consumptionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  consumptionLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  consumptionValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  consumptionAmount: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 4,
  },
  consumptionUnit: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 4,
  },
  progressSection: {
    gap: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    textAlign: 'right',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
  },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#001F3F',
    borderRadius: 8,
  },
  periodText: {
    color: '#666',
    fontSize: 14,
  },
  activeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statsCard: {
    width: width * 0.43,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.98)',
    elevation: Platform.OS === 'android' ? 4 : 0,
    overflow: 'hidden',
    backdropFilter: 'blur(20px)',
    borderColor: 'rgba(0, 31, 63, 0.1)',
  },
  statsHeader: {
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
  trendText: {
    fontSize: 12,
    marginLeft: 4,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statsTitle: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  menuButton: {
    width: (width - 56) / 2,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 0,
    borderColor: '#001F3F',
  },
  menuButtonBlur: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  insightCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  insightGradient: {
    padding: 20,
  },
  insightTitle: {
    color: 'white',
    marginVertical: 12,
  },
  insightText: {
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: 16,
  },
  insightButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  insightButtonLabel: {
    color: 'white',
  },
  wavyBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    transform: [{ scaleX: 1.5 }],
  },
  headerContent: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  avatar: {
    backgroundColor: 'white',
    elevation: 8,
  },
  userInfo: {
    marginLeft: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
    marginRight: 6,
  },
  statusText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  energyAnimation: {
    width: 60,
    height: 60,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  backgroundAnimation: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.1,
  },
  waveAnimation: {
    width: '100%',
    height: 100,
    position: 'absolute',
    bottom: 0,
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT + 10,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: '#001F3F',
    fontSize: 14,
    marginRight: 4,
  },
  insightsContainer: {
    paddingRight: 20,
    gap: 16,
  },
  insightCardGradient: {
    width: width * 0.7,
    padding: 20,
    borderRadius: 16,
    marginRight: 16,
  },
  insightIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightCardTitle: {
    color: 'white',
    fontSize: 20,
    marginBottom: 8,
  },
  insightCardDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  insightCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightCardAction: {
    color: 'white',
    fontSize: 14,
    marginRight: 8,
  },
  menuButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
});

export default HomeScreen;
