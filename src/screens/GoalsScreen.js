import React, { useState, useEffect, useRef } from 'react';
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
import { auth, db } from '../firebaseConfig';
import { ref, onValue, set, update } from 'firebase/database';
import { sendGoalWarningNotification, registerForPushNotificationsAsync } from '../services/notificationService';
import { checkAndCleanExpiredGoals } from '../services/firebaseService';
import { useEnergy } from '../context/EnergyContext';

const { width } = Dimensions.get('window');

const GoalCard = ({ goal, onPress }) => {
  const { energyData } = useEnergy();
  
  // Period'a göre current değerini hesapla
  let current = 0;
  switch(goal.period) {
    case 'Daily':
      current = energyData.totalDaily;
      break;
    case 'Weekly':
      current = energyData.totalDaily * 7;
      break;
    case 'Monthly':
      current = energyData.totalDaily * 30;
      break;
    case 'Yearly':
      current = energyData.totalDaily * 365;
      break;
    default:
      current = Number(goal.current || 0);
  }

  const target = Number(goal.target || 0);
  const remaining = Math.max(0, target - current);
  const progress = target > 0 ? (current / target) * 100 : 0;

  console.log('🎯 GoalCard debug:', { 
    goalPeriod: goal.period, 
    totalDaily: energyData.totalDaily.toFixed(2) + ' kWh',
    current: current.toFixed(2) + ' kWh', 
    target: target.toFixed(1) + ' kWh', 
    progress: progress.toFixed(2) + '%',
    progressWidth: Math.max(2, Math.min(100, progress)).toFixed(1) + '%'
  }); // Debug
  
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
              {current.toFixed(2).replace(/\.?0+$/, '')} kWh
            </Text>
            <Text style={styles.targetValue}>
              {target.toFixed(0)} kWh
            </Text>
          </View>
          
          <View style={styles.progressIndicator}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${Math.max(2, Math.min(100, progress))}%`, // Min %2 genişlik
                  backgroundColor: progress >= 100 ? '#f44336' : 
                                 progress >= 80 ? '#ff9800' : 
                                 progress >= 60 ? '#ffc107' : '#4CAF50'
                }
              ]} 
            />
          </View>

          <Text style={styles.remainingText}>
            {remaining > 0 
              ? `Remaining ${remaining.toFixed(2).replace(/\.?0+$/, '')} kWh`
              : 'Goal exceeded!'
            }
          </Text>
        </View>

        <View style={styles.goalStats}>
          <View style={styles.statItem}>
            <IconButton icon="trending-down" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>
              %{Math.round(Math.max(0, Math.min(100, ((target - current) / target) * 100)))}
            </Text>
            <Text style={styles.statLabel}>Savings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <IconButton icon="currency-try" size={24} color="#03dac6" />
            <Text style={styles.statValue}>
              {Math.round(remaining * 1.5)} ₺
            </Text>
            <Text style={styles.statLabel}>Potential</Text>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const GoalsScreen = ({ navigation }) => {
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    target: '',
    period: 'Monthly'
  });

  // Dialog input ref'leri
  const dialogTitleRef = useRef(null);
  const dialogTargetRef = useRef(null);
  useEffect(() => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    setIsLoading(true);

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
      setIsLoading(false);
    });

    // Bildirim izinlerini kontrol et
    const checkNotificationPermissions = async () => {
      await registerForPushNotificationsAsync();
    };
    
    checkNotificationPermissions();

    return () => {
      unsubscribeGoals();
    };
  }, []);

  const handleAddGoal = async () => {
    if (!newGoal.title || !newGoal.target) return;

    const userId = auth.currentUser.uid;
    const goalsRef = ref(db, `users/${userId}/goals`);
    const newGoalRef = push(goalsRef);
    
    const newGoalData = {
      title: newGoal.title,
      target: parseFloat(newGoal.target),
      period: newGoal.period,
      current: 0, // Başlangıçta 0, GoalCard'da gerçek zamanlı hesaplanacak
      icon: 'target',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await set(newGoalRef, newGoalData);
    setDialogVisible(false);
    setNewGoal({ title: '', target: '', period: 'Aylık' });
  };

  const handleGoalPress = (goal) => {
    navigation.navigate('HedefEkle', { goal: { ...goal, id: goal.id } });
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
          <Title style={styles.headerTitle}>My Goals</Title>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {goals.length > 0 ? (
          <>
            <Surface style={styles.summaryCard}>
              <View style={styles.summaryContent}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{goals.length}</Text>
                  <Text style={styles.summaryLabel}>Active Target</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {goals.filter(g => g.current <= g.target).length}
                  </Text>
                  <Text style={styles.summaryLabel}>Success</Text>
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
            <Text style={styles.emptyText}>No goals added yet</Text>
                          <Text style={styles.emptySubText}>
                Use the button below to add a new goal
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
                      label="Add Goal"
      />

      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
        >
          <Dialog.Title>New Goal</Dialog.Title>
          <Dialog.Content>
            <TextInput
              ref={dialogTitleRef}
                              label="Goal Title"
              value={newGoal.title}
              onChangeText={text => setNewGoal({...newGoal, title: text})}
              style={styles.input}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => dialogTargetRef.current?.focus()}
            />
            <TextInput
              ref={dialogTargetRef}
              label="Target Consumption (kWh)"
              value={newGoal.target}
              onChangeText={text => setNewGoal({...newGoal, target: text})}
              keyboardType="numeric"
              style={styles.input}
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={() => dialogTargetRef.current?.blur()}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleAddGoal}>Add</Button>
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
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 4, // Minimum görünür genişlik
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