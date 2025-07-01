import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity, StatusBar } from 'react-native';
import { 
  Card, 
  Title, 
  Text, 
  FAB, 
  Surface, 
  IconButton, 
  ProgressBar,
  Portal,
  Dialog,
  Button,
  TextInput,
  Menu
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import NavigationButtons from '../components/NavigationButtons';
import { auth, db } from '../firebaseConfig';
import { ref, onValue, set, update } from 'firebase/database';
import { sendGoalWarningNotification, registerForPushNotificationsAsync } from '../services/notificationService';
import { checkAndCleanExpiredGoals } from '../services/firebaseService';

const { width } = Dimensions.get('window');

const GoalCard = ({ goal, onPress }) => {
  const current = Number(goal.current || 0);
  const target = Number(goal.target || 0);
  const remaining = Math.max(0, target - current);
  const progress = (current / target) * 100;
  
  useEffect(() => {
    const checkAndNotify = async () => {
      if (progress >= 80 && (!goal.notified || goal.lastNotifiedAt !== current)) {
        await sendGoalWarningNotification(goal.title);
        
        const goalRef = ref(db, `users/${auth.currentUser.uid}/goals/${goal.id}`);
        await update(goalRef, { 
          notified: true,
          lastNotifiedAt: current,
          lastNotificationTime: Date.now()
        });
      } 
      else if (progress < 80 && goal.notified) {
        const goalRef = ref(db, `users/${auth.currentUser.uid}/goals/${goal.id}`);
        await update(goalRef, { 
          notified: false,
          lastNotifiedAt: null,
          lastNotificationTime: null
        });
      }
    };
    
    checkAndNotify();
  }, [progress, goal, current]);

  return (
    <TouchableOpacity onPress={() => onPress(goal)}>
      <Surface style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalIconContainer}>
            <IconButton 
              icon={goal.icon} 
              size={32} 
              color="#001F3F" 
            />
          </View>
          <View style={styles.goalTitleContainer}>
            <Title style={styles.goalTitle}>{goal.title}</Title>
            <Text style={styles.goalPeriod}>{goal.period}</Text>
          </View>
        </View>

        <View style={styles.goalProgress}>
          <View style={styles.progressValues}>
            <Text style={styles.currentValue}>
              {current.toFixed(1)} kWh
            </Text>
            <Text style={styles.targetValue}>
              {target.toFixed(1)} kWh
            </Text>
          </View>
          
          <View style={styles.progressIndicator}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(100, (current / target) * 100)}%`,
                  backgroundColor: current > target ? '#f44336' : '#4CAF50'
                }
              ]} 
            />
          </View>

          <Text style={styles.remainingText}>
            {remaining > 0 
              ? `Hedefe ${remaining.toFixed(1)} kWh kaldı`
              : 'Hedef aşıldı!'
            }
          </Text>
        </View>

        <View style={styles.goalStats}>
          <View style={styles.statItem}>
            <IconButton icon="trending-down" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>
              %{Math.round(Math.max(0, Math.min(100, ((target - current) / target) * 100)))}
            </Text>
            <Text style={styles.statLabel}>Tasarruf</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <IconButton icon="currency-try" size={24} color="#03dac6" />
            <Text style={styles.statValue}>
              {Math.round(remaining * 1.5)} ₺
            </Text>
            <Text style={styles.statLabel}>Potansiyel</Text>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const GoalsScreen = ({ navigation }) => {
  const [goals, setGoals] = useState([]);
  const [dailyConsumption, setDailyConsumption] = useState(0);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    target: '',
    period: 'Aylık'
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;

    // İlk açılışta süresi dolan hedefleri kontrol et
    checkAndCleanExpiredGoals();

    // Hedefleri dinle
    const goalsRef = ref(db, `users/${userId}/goals`);
    const unsubscribeGoals = onValue(goalsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const goalsArray = Object.entries(data).map(([id, goal]) => ({
          id,
          ...goal,
        }));
        setGoals(goalsArray);
      } else {
        setGoals([]);
      }
    });

    // Günlük cihaz verilerini dinle ve hedefleri güncelle
    const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const dailyRef = ref(db, `users/${userId}/cihazlar_gunluk/${currentDate}/cihazlar`);
    const unsubscribeDaily = onValue(dailyRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Günlük toplam tüketimi hesapla
        const total = Object.values(data).reduce((sum, device) => {
          const powerInKW = device.guc / 1000; // Watt'ı kW'a çevir
          const dailyKWh = powerInKW * (device.dailyUsage || 0);
          return sum + dailyKWh;
        }, 0);
        setDailyConsumption(total);

        // Günlük hedefleri güncelle
        goals.forEach(async (goal) => {
          if (goal.period === 'Günlük') {
            const goalRef = ref(db, `users/${userId}/goals/${goal.id}`);
            await update(goalRef, { current: total });
          }
        });
      } else {
        setDailyConsumption(0);
        // Günlük hedefleri sıfırla
        goals.forEach(async (goal) => {
          if (goal.period === 'Günlük') {
            const goalRef = ref(db, `users/${userId}/goals/${goal.id}`);
            await update(goalRef, { current: 0 });
          }
        });
      }
    });

    // Aktif cihazları dinle ve günlük hedefleri güncelle
    const cihazlarRef = ref(db, `users/${userId}/cihazlar`);
    const unsubscribeCihazlar = onValue(cihazlarRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Anlık toplam tüketimi hesapla
        const total = Object.values(data).reduce((sum, device) => {
          const powerInKW = device.guc / 1000;
          const dailyKWh = powerInKW * (device.dailyUsage || 0);
          return sum + dailyKWh;
        }, 0);

        // Günlük hedefleri güncelle
        goals.forEach(async (goal) => {
          if (goal.period === 'Günlük') {
            const goalRef = ref(db, `users/${userId}/goals/${goal.id}`);
            await update(goalRef, { current: total });
          }
        });
      } else {
        // Cihaz yoksa günlük hedefleri sıfırla
        goals.forEach(async (goal) => {
          if (goal.period === 'Günlük') {
            const goalRef = ref(db, `users/${userId}/goals/${goal.id}`);
            await update(goalRef, { current: 0 });
          }
        });
      }
    });

    // Bildirim izinlerini kontrol et
    const checkNotificationPermissions = async () => {
      await registerForPushNotificationsAsync();
    };
    
    checkNotificationPermissions();

    return () => {
      unsubscribeGoals();
      unsubscribeDaily();
      unsubscribeCihazlar();
    };
  }, []);

  const handleAddGoal = async () => {
    if (!newGoal.title || !newGoal.target) return;

    const goalsRef = ref(db, `users/${auth.currentUser.uid}/goals`);
    const newGoalData = {
      ...newGoal,
      current: 0,
      icon: 'target',
      target: parseFloat(newGoal.target),
      createdAt: Date.now()
    };

    await set(goalsRef, [...goals, newGoalData]);
    setDialogVisible(false);
    setNewGoal({ title: '', target: '', period: 'Aylık' });
  };

  const handleGoalPress = (goal) => {
    navigation.navigate('HedefEkle', { goal: { ...goal, id: goal.id } });
  };

  return (
    <View style={styles.container}>
      <NavigationButtons navigation={navigation} />
      
      <LinearGradient
        colors={['#001F3F', '#002c5c']}
        style={styles.header}
      >
        <Title style={styles.headerTitle}>Hedeflerim</Title>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {goals.length > 0 ? (
          <>
            <Surface style={styles.summaryCard}>
              <View style={styles.summaryContent}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{goals.length}</Text>
                  <Text style={styles.summaryLabel}>Aktif Hedef</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {goals.filter(g => g.current <= g.target).length}
                  </Text>
                  <Text style={styles.summaryLabel}>Başarılı</Text>
                </View>
              </View>
            </Surface>

            <View style={styles.goalsList}>
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onPress={handleGoalPress}
                />
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz hedef eklenmemiş</Text>
            <Text style={styles.emptySubText}>
              Yeni bir hedef eklemek için aşağıdaki butonu kullanın
            </Text>
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        color="white"
        backgroundColor="#001F3F"
        onPress={() => navigation.navigate('HedefEkle')}
        label="Hedef Ekle"
      />

      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
        >
          <Dialog.Title>Yeni Hedef</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Hedef Başlığı"
              value={newGoal.title}
              onChangeText={text => setNewGoal({...newGoal, title: text})}
              style={styles.input}
            />
            <TextInput
              label="Hedef Tüketim (kWh)"
              value={newGoal.target}
              onChangeText={text => setNewGoal({...newGoal, target: text})}
              keyboardType="numeric"
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>İptal</Button>
            <Button onPress={handleAddGoal}>Ekle</Button>
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
    paddingHorizontal: 16,
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
  summaryCard: {
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: 'white',
    elevation: 4,
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#001F3F',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  goalsList: {
    gap: 16,
  },
  goalCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalIconContainer: {
    marginRight: 12,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  goalPeriod: {
    fontSize: 12,
    color: '#666',
  },
  goalProgress: {
    marginBottom: 16,
  },
  progressValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  currentValue: {
    fontSize: 16,
    color: '#001F3F',
    fontWeight: 'bold',
  },
  targetValue: {
    fontSize: 16,
    color: '#001F3F',
  },
  progressIndicator: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#001F3F',
  },
  input: {
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default GoalsScreen; 