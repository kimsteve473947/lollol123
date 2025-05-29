import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, setActiveRoom, addMessage, setMessages, setConnected } from '../store';
import { Colors } from '../constants/colors';
import { ChatAPI, wsClient } from '../api';

// 롤 티어 정보
const TIERS = [
  { id: 'IRON', name: '아이언', color: '#8B4513', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/ranked-mini-crests/iron.png' },
  { id: 'BRONZE', name: '브론즈', color: '#CD7F32', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/ranked-mini-crests/bronze.png' },
  { id: 'SILVER', name: '실버', color: '#C0C0C0', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/ranked-mini-crests/silver.png' },
  { id: 'GOLD', name: '골드', color: '#FFD700', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/ranked-mini-crests/gold.png' },
  { id: 'PLATINUM', name: '플래티넘', color: '#00CED1', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/ranked-mini-crests/platinum.png' },
  { id: 'EMERALD', name: '에메랄드', color: '#50C878', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/ranked-mini-crests/emerald.png' },
  { id: 'DIAMOND', name: '다이아몬드', color: '#B9F2FF', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/ranked-mini-crests/diamond.png' },
  { id: 'MASTER', name: '마스터', color: '#9932CC', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/ranked-mini-crests/master.png' },
  { id: 'GRANDMASTER', name: '그랜드마스터', color: '#FF4500', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/ranked-mini-crests/grandmaster.png' },
  { id: 'CHALLENGER', name: '챌린저', color: '#FFD700', icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/ranked-mini-crests/challenger.png' },
];

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  userTier: string;
  userRank: string;
  profileIcon: string;
  message: string;
  timestamp: Date;
  isVerified: boolean;
  type: 'text' | 'image' | 'system';
}

const ChatScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.app);
  const { activeRoom, messages, isConnected } = useSelector((state: RootState) => state.chat);
  
  const [selectedTier, setSelectedTier] = useState('GOLD');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // 현재 방의 메시지들
  const currentMessages = useMemo(() => {
    const roomId = `tier_${selectedTier}`;
    return messages[roomId] || [];
  }, [messages, selectedTier]);

  // 현재 유저가 선택된 티어에 채팅할 권한이 있는지 확인
  const canChatInTier = useCallback((userTier: string, targetTier: string): boolean => {
    const tierOrder = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
    const userTierIndex = tierOrder.indexOf(userTier);
    const targetTierIndex = tierOrder.indexOf(targetTier);
    
    return userTierIndex >= targetTierIndex;
  }, []);

  const hasPermission = useMemo(() => {
    return user ? canChatInTier(user.tier, selectedTier) : false;
  }, [user, selectedTier, canChatInTier]);

  // WebSocket 연결 및 메시지 로딩
  useEffect(() => {
    if (user) {
      // WebSocket 연결
      wsClient.connect(user.id);
      dispatch(setConnected(true));

      // 메시지 로딩
      loadMessages();
    }

    return () => {
      wsClient.disconnect();
      dispatch(setConnected(false));
    };
  }, [user, dispatch]);

  // 방 변경 시 메시지 로딩
  useEffect(() => {
    const roomId = `tier_${selectedTier}`;
    dispatch(setActiveRoom(roomId));
    loadMessages();
  }, [selectedTier, dispatch]);

  // 새 메시지 시 스크롤
  useEffect(() => {
    if (currentMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentMessages.length]);

  const loadMessages = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const roomId = `tier_${selectedTier}`;
      const response = await ChatAPI.getMessages(roomId, 1, 50);
      
      if (response.success) {
        dispatch(setMessages({ roomId, messages: response.data }));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedTier, dispatch]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadMessages();
    setIsRefreshing(false);
  }, [loadMessages]);

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !user || !hasPermission) return;

    try {
      const roomId = `tier_${selectedTier}`;
      const messageData = {
        text: inputMessage.trim(),
        type: 'text' as const,
      };

      // 낙관적 업데이트
      const optimisticMessage: ChatMessage = {
        id: `temp_${Date.now()}`,
        userId: user.id,
        username: user.username,
        userTier: user.tier,
        userRank: user.rank,
        profileIcon: user.profileIcon,
        message: inputMessage.trim(),
        timestamp: new Date(),
        isVerified: user.isVerified,
        type: 'text',
      };

      dispatch(addMessage({ ...optimisticMessage, roomId }));
      setInputMessage('');
      
      // 키보드 숨기기
      Keyboard.dismiss();

      // 서버로 전송
      const response = await ChatAPI.sendMessage(roomId, messageData);
      
      if (!response.success) {
        // 실패 시 메시지 제거 로직 추가 가능
        Alert.alert('오류', '메시지 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('오류', '메시지 전송 중 오류가 발생했습니다.');
    }
  }, [inputMessage, user, hasPermission, selectedTier, dispatch]);

  const handleInputChange = useCallback((text: string) => {
    setInputMessage(text);

    // 타이핑 표시 로직
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      // 타이핑 중지 신호 전송
    }, 1000);

    setTypingTimeout(timeout);
  }, [typingTimeout]);

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const renderTierTab = useCallback(({ item }: { item: typeof TIERS[0] }) => (
    <TouchableOpacity
      style={[
        styles.tierTab,
        selectedTier === item.id && styles.selectedTierTab,
      ]}
      onPress={() => setSelectedTier(item.id)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.icon }} style={styles.tierIcon} />
      <Text style={[
        styles.tierTabText,
        selectedTier === item.id && styles.selectedTierTabText,
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  ), [selectedTier]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.userId === user?.id;
    const tierInfo = TIERS.find(t => t.id === item.userTier);

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage && styles.myMessageContainer,
      ]}>
        {!isMyMessage && (
          <TouchableOpacity activeOpacity={0.7}>
            <Image source={{ uri: item.profileIcon }} style={styles.profileIcon} />
          </TouchableOpacity>
        )}
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
        ]}>
          {!isMyMessage && (
            <View style={styles.messageHeader}>
              <Text style={styles.username}>{item.username}</Text>
              <View style={styles.tierBadge}>
                <Image source={{ uri: tierInfo?.icon }} style={styles.tierBadgeIcon} />
                <Text style={styles.tierBadgeText}>{tierInfo?.name} {item.userRank}</Text>
              </View>
              {item.isVerified && (
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
              )}
            </View>
          )}
          <Text style={[
            styles.messageText,
            isMyMessage && styles.myMessageText,
          ]}>
            {item.message}
          </Text>
          <Text style={[
            styles.messageTime,
            isMyMessage && styles.myMessageTime,
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
        {isMyMessage && (
          <TouchableOpacity activeOpacity={0.7}>
            <Image source={{ uri: item.profileIcon }} style={styles.profileIcon} />
          </TouchableOpacity>
        )}
      </View>
    );
  }, [user, formatTime]);

  const selectedTierInfo = useMemo(() => 
    TIERS.find(t => t.id === selectedTier), [selectedTier]
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>로그인이 필요합니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>티어별 채팅</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.headerSubtitle}>
            현재 티어: {TIERS.find(t => t.id === user.tier)?.name} {user.rank}
          </Text>
          <View style={[styles.connectionStatus, { backgroundColor: isConnected ? Colors.success : Colors.error }]}>
            <Text style={styles.connectionText}>
              {isConnected ? '연결됨' : '연결 끊김'}
            </Text>
          </View>
        </View>
      </View>

      {/* 티어 탭 */}
      <View style={styles.tierTabContainer}>
        <FlatList
          data={TIERS}
          renderItem={renderTierTab}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tierTabList}
          getItemLayout={(data, index) => ({
            length: 80,
            offset: 80 * index,
            index,
          })}
        />
      </View>

      {/* 채팅 영역 */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* 선택된 티어 정보 */}
        <View style={styles.selectedTierInfo}>
          <Image source={{ uri: selectedTierInfo?.icon }} style={styles.selectedTierIcon} />
          <Text style={styles.selectedTierText}>{selectedTierInfo?.name} 채팅방</Text>
          {!hasPermission && (
            <Text style={styles.permissionWarning}>
              (채팅 권한 없음 - {selectedTierInfo?.name} 이상 필요)
            </Text>
          )}
        </View>

        {/* 메시지 리스트 */}
        <FlatList
          ref={flatListRef}
          data={currentMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={20}
          getItemLayout={(data, index) => ({
            length: 80,
            offset: 80 * index,
            index,
          })}
        />

        {/* 입력 영역 */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={[
              styles.textInput,
              !hasPermission && styles.disabledInput,
            ]}
            value={inputMessage}
            onChangeText={handleInputChange}
            placeholder={
              hasPermission 
                ? `${selectedTierInfo?.name} 채팅방에 메시지를 입력하세요...`
                : '채팅 권한이 없습니다'
            }
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
            editable={hasPermission}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputMessage.trim() || !hasPermission) && styles.disabledSendButton,
            ]}
            onPress={sendMessage}
            disabled={!inputMessage.trim() || !hasPermission}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={(!inputMessage.trim() || !hasPermission) ? Colors.textMuted : Colors.background} 
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  tierTabContainer: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tierTabList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tierTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedTierTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tierIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  tierTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  selectedTierTabText: {
    color: Colors.background,
  },
  chatContainer: {
    flex: 1,
  },
  selectedTierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedTierIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  selectedTierText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  permissionWarning: {
    fontSize: 12,
    color: Colors.error,
    marginLeft: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    flexDirection: 'row-reverse',
  },
  profileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: Colors.cardBackground,
    borderBottomLeftRadius: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 6,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
  },
  tierBadgeIcon: {
    width: 12,
    height: 12,
    marginRight: 3,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.text,
  },
  messageText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.background,
  },
  messageTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.cardBackground,
  },
  disabledInput: {
    backgroundColor: Colors.disabled,
    color: Colors.textMuted,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: Colors.disabled,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.error,
  },
  connectionStatus: {
    padding: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.background,
  },
});

export default ChatScreen; 