import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ref, push, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { addMessage, ChatMessage } from '../store/slices/chatSlice';
import { Colors } from '../constants/colors';
import { RootStackParamList } from '../types/navigation';

type ChatDetailRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isCurrentUser }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <View style={[
      styles.messageContainer,
      isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
    ]}>
      {!isCurrentUser && (
        <Text style={styles.senderName}>{message.senderName}</Text>
      )}
      <View style={[
        styles.messageBubble,
        isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
      ]}>
        <Text style={[
          styles.messageText,
          isCurrentUser ? styles.currentUserText : styles.otherUserText
        ]}>
          {message.message}
        </Text>
      </View>
      <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
    </View>
  );
};

const ChatDetailScreen: React.FC = () => {
  const route = useRoute<ChatDetailRouteProp>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);
  const { messages } = useAppSelector((state) => state.chat);
  
  const [inputText, setInputText] = useState('');
  const [roomMessages, setRoomMessages] = useState<ChatMessage[]>([]);
  const flatListRef = useRef<FlatList>(null);
  
  const roomId = route.params?.roomId || 'general';
  const currentUserId = user.profile?.id || 'user1';

  useEffect(() => {
    // Firebase에서 실시간 메시지 수신
    const messagesRef = ref(database, `messages/${roomId}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.values(data) as ChatMessage[];
        setRoomMessages(messagesList.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ));
      }
    });

    return () => off(messagesRef, 'value', unsubscribe);
  }, [roomId]);

  useEffect(() => {
    // Redux store의 메시지도 동기화
    if (messages[roomId]) {
      setRoomMessages(messages[roomId]);
    }
  }, [messages, roomId]);

  const sendMessage = async () => {
    if (inputText.trim() === '') return;

    const newMessage: Omit<ChatMessage, 'id'> = {
      senderId: currentUserId,
      senderName: user.profile?.username || '익명',
      message: inputText.trim(),
      timestamp: new Date().toISOString(),
      type: 'text',
      roomId,
    };

    try {
      // Firebase에 메시지 저장
      const messagesRef = ref(database, `messages/${roomId}`);
      await push(messagesRef, newMessage);
      
      // Redux store에도 추가
      dispatch(addMessage({
        ...newMessage,
        id: Date.now().toString(),
      }));
      
      setInputText('');
      
      // 메시지 전송 후 스크롤을 맨 아래로
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('메시지 전송 실패:', error);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <MessageBubble 
      message={item} 
      isCurrentUser={item.senderId === currentUserId}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={roomMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="메시지를 입력하세요..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, inputText.trim() === '' && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={inputText.trim() === ''}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() === '' ? Colors.textSecondary : Colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    marginLeft: 8,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '100%',
  },
  currentUserBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  currentUserText: {
    color: Colors.text,
  },
  otherUserText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    marginHorizontal: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: Colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    color: Colors.text,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  sendButtonDisabled: {
    borderColor: Colors.textSecondary,
  },
});

export default ChatDetailScreen; 