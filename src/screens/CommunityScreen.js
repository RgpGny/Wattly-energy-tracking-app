import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { communityRef } from '../firebaseConfig';
import { onValue, push } from 'firebase/database';
import { auth } from '../firebaseConfig';

const CommunityScreen = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const unsubscribe = onValue(communityRef(), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray = Object.entries(data).map(([id, post]) => ({
          id,
          ...post,
        }));
        setPosts(postsArray.reverse());
      }
    });

    return () => unsubscribe();
  }, []);

  const shareTip = async (tip) => {
    const user = auth.currentUser;
    await push(communityRef(), {
      userId: user.uid,
      userEmail: user.email,
      tip,
      timestamp: Date.now(),
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Topluluk İpuçları</Title>
          <Button mode="contained" onPress={() => shareTip("Yeni tasarruf ipucu")}>
            İpucu Paylaş
          </Button>
        </Card.Content>
      </Card>

      {posts.map((post) => (
        <Card key={post.id} style={styles.card}>
          <Card.Content>
            <Paragraph>{post.tip}</Paragraph>
            <Paragraph style={styles.author}>
              Paylaşan: {post.userEmail}
            </Paragraph>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  author: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
});

export default CommunityScreen; 