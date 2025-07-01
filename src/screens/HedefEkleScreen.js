import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { 
  TextInput, 
  Button, 
  Surface, 
  Title, 
  Text,
  HelperText,
  IconButton,
  SegmentedButtons,
  Portal,
  Dialog
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../firebaseConfig';
import { ref, push, set, remove } from 'firebase/database';

const HedefEkleScreen = ({ navigation, route }) => {
  const editingGoal = route.params?.goal;
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  
  const [hedef, setHedef] = useState({
    title: editingGoal?.title || '',
    target: editingGoal?.target?.toString() || '',
    period: editingGoal?.period || 'Monthly',
    icon: editingGoal?.icon || 'target',
    current: editingGoal?.current || 0
  });
  const [errors, setErrors] = useState({});

  // Input ref'leri
  const titleRef = useRef(null);
  const targetRef = useRef(null);

  const validateForm = () => {
    const newErrors = {};
    if (!hedef.title.trim()) newErrors.title = 'Goal name is required';
    if (!hedef.target || hedef.target <= 0) newErrors.target = 'Enter a valid target value';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const userId = auth.currentUser.uid;
      const hedefData = {
        ...hedef,
        target: parseFloat(hedef.target),
        updatedAt: Date.now(),
        current: editingGoal?.current || 0
      };

      if (editingGoal?.id) {
        const hedefRef = ref(db, `users/${userId}/goals/${editingGoal.id}`);
        await set(hedefRef, hedefData);
      } else {
        const hedeflerRef = ref(db, `users/${userId}/goals`);
        await push(hedeflerRef, {
          ...hedefData,
          createdAt: Date.now()
        });
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Hedef kaydetme hatası:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const userId = auth.currentUser.uid;
      const hedefRef = ref(db, `users/${userId}/goals/${editingGoal.id}`);
      await remove(hedefRef);
      navigation.goBack();
    } catch (error) {
      console.error('Hedef silme hatası:', error);
    }
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
            {editingGoal ? 'Edit Goal' : 'Add New Goal'}
          </Title>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Surface style={styles.formCard}>
          <TextInput
            ref={titleRef}
            label="Goal Name"
            value={hedef.title}
            onChangeText={(text) => setHedef({ ...hedef, title: text })}
            style={styles.input}
            error={!!errors.title}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => targetRef.current?.focus()}
            theme={{
              colors: {
                primary: '#001F3F',
              }
            }}
          />
          <HelperText type="error" visible={!!errors.title}>
            {errors.title}
          </HelperText>

          <TextInput
            ref={targetRef}
            label="Target Consumption (kWh)"
            value={hedef.target.toString()}
            onChangeText={(text) => setHedef({ ...hedef, target: text })}
            keyboardType="numeric"
            style={styles.input}
            error={!!errors.target}
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={() => targetRef.current?.blur()}
            theme={{
              colors: {
                primary: '#001F3F',
              }
            }}
          />
          <HelperText type="error" visible={!!errors.target}>
            {errors.target}
          </HelperText>

          <Title style={styles.sectionTitle}>Goal Period</Title>
          <SegmentedButtons
            value={hedef.period}
            onValueChange={(value) => setHedef({ ...hedef, period: value })}
            buttons={[
              { value: 'Daily', label: 'Daily' },
              { value: 'Weekly', label: 'Weekly' },
              { value: 'Monthly', label: 'Monthly' },
              { value: 'Yearly', label: 'Yearly' }
            ]}
            style={styles.segmentedButtons}
            theme={{
              colors: {
                primary: '#001F3F',
                secondaryContainer: 'rgba(0, 31, 63, 0.08)',
              }
            }}
          />
        </Surface>

        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            onPress={handleSave}
            style={styles.saveButton}
            buttonColor="#001F3F"
          >
            {editingGoal ? 'Update' : 'Save'}
          </Button>

          {editingGoal && (
            <Button 
              mode="outlined"
              onPress={() => setDeleteDialogVisible(true)}
              style={styles.deleteButton}
              textColor="#f44336"
            >
              Delete Goal
            </Button>
          )}
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Goal</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this goal?</Text>
            <Text style={styles.warningText}>This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button 
              onPress={handleDelete}
              textColor="#f44336"
            >
              Delete
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
  buttonContainer: {
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#001F3F',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
  },
  deleteButton: {
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    borderColor: '#f44336',
  },
  warningText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 8,
  },
  iconButton: {
    backgroundColor: 'rgba(0, 31, 63, 0.08)',
  },
  selectedIconButton: {
    backgroundColor: '#001F3F',
  },
});

export default HedefEkleScreen; 