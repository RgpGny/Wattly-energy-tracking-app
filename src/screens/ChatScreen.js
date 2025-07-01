import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph } from 'react-native-paper';
import { messagesRef } from '../firebaseConfig';
import { auth } from '../firebaseConfig';
import { onValue } from 'firebase/database';
import { sendMessage } from '../services/socialService';
import NavigationButtons from '../components/NavigationButtons';

const ChatScreen = ({ route, navigation }) => {
  const { friendId, friendEmail } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const chatId = [currentUser.uid, friendId].sort().join('_');
      const messagesListener = onValue(messagesRef(chatId), (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const messageList = Object.entries(data)
            .map(([id, message]) => ({
              id,
              ...message,
            }))
            .sort((a, b) => b.timestamp - a.timestamp);
          
          setMessages(messageList);
        } else {
          setMessages([]);
        }
      });

      return () => messagesListener();
    } catch (error) {
      console.error('Mesaj dinleme hatası:', error);
    }
  }, [friendId]);

  const handleSend = async () => {
    try {
      if (!newMessage.trim()) return;
      
      await sendMessage(friendId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <NavigationButtons navigation={navigation} />
      <Title style={[styles.header, { marginTop: 40 }]}>{friendEmail}</Title>
      
      <ScrollView style={styles.messagesContainer}>
        {messages.map((message) => (
          <Card
            key={message.id}
            style={[
              styles.messageCard,
              message.senderId === auth.currentUser.uid
                ? styles.sentMessage
                : styles.receivedMessage,
            ]}
          >
            <Card.Content>
              <Paragraph>{message.message}</Paragraph>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
        />
        <Button mode="contained" onPress={handleSend}>
          Gönder
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageCard: {
    marginBottom: 8,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e3f2fd',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f5f5f5',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    marginRight: 8,
  },
});

export default ChatScreen; 