import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  startMatching,
  stopMatching,
  joinRoom,
  leaveRoom,
  addToWaitingList,
  updateWaitingTime,
  Position,
  MatchingRoom,
  MatchingUser,
} from '../store/slices/matchingSlice';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

const QuickMatchScreen = () => {
  const dispatch = useAppDispatch();
  const {
    currentUser,
    isMatching,
    activeRooms,
    currentRoom,
    matchingPreferences,
    loading,
  } = useAppSelector(state => state.matching);

  const [selectedPositions, setSelectedPositions] = useState<Position[]>(['MID']);

  useEffect(() => {
    // 매칭 시간 업데이트 (1초마다)
    const interval = setInterval(() => {
      dispatch(updateWaitingTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleStartMatching = () => {
    if (selectedPositions.length === 0) {
      Alert.alert('알림', '선호 포지션을 선택해주세요.');
      return;
    }
    dispatch(startMatching());
  };

  const handleStopMatching = () => {
    dispatch(stopMatching());
  };

  const handleJoinRoom = (roomId: string, position: Position) => {
    dispatch(joinRoom({ roomId, position }));
  };

  const handleLeaveRoom = () => {
    Alert.alert(
      '방 나가기',
      '정말로 방을 나가시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '나가기', onPress: () => dispatch(leaveRoom()) },
      ]
    );
  };

  const handleJoinWaitingList = (roomId: string) => {
    dispatch(addToWaitingList(roomId));
  };

  const togglePosition = (position: Position) => {
    setSelectedPositions(prev => {
      if (prev.includes(position)) {
        return prev.filter(p => p !== position);
      } else {
        return [...prev, position];
      }
    });
  };

  const getPositionColor = (position: Position) => {
    const colors = {
      TOP: Colors.positionTOP,
      JUNGLE: Colors.positionJUNGLE,
      MID: Colors.positionMID,
      ADC: Colors.positionADC,
      SUPPORT: Colors.positionSUPPORT,
    };
    return colors[position];
  };

  const getPositionIcon = (position: Position) => {
    const icons = {
      TOP: 'shield',
      JUNGLE: 'leaf',
      MID: 'flash',
      ADC: 'bow-arrow',
      SUPPORT: 'heart',
    };
    return icons[position] as keyof typeof Ionicons.glyphMap;
  };

  const formatWaitingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTierColor = (tier: string) => {
    const colors = {
      IRON: '#8B4513',
      BRONZE: '#CD7F32',
      SILVER: '#C0C0C0',
      GOLD: '#FFD700',
      PLATINUM: '#00CED1',
      DIAMOND: '#B9F2FF',
      MASTER: '#9932CC',
      GRANDMASTER: '#FF1493',
      CHALLENGER: '#00FFFF',
    };
    return colors[tier as keyof typeof colors] || Colors.textMuted;
  };

  const renderPositionSelector = () => (
    <View style={styles.positionSelector}>
      <Text style={styles.sectionTitle}>선호 포지션 선택</Text>
      <View style={styles.positionGrid}>
        {(['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as Position[]).map(position => (
          <TouchableOpacity
            key={position}
            style={[
              styles.positionButton,
              {
                backgroundColor: selectedPositions.includes(position)
                  ? getPositionColor(position)
                  : Colors.backgroundSecondary,
                borderColor: getPositionColor(position),
              },
            ]}
            onPress={() => togglePosition(position)}
          >
            <Ionicons
              name={getPositionIcon(position)}
              size={24}
              color={selectedPositions.includes(position) ? Colors.textLight : getPositionColor(position)}
            />
            <Text
              style={[
                styles.positionText,
                {
                  color: selectedPositions.includes(position) ? Colors.textLight : getPositionColor(position),
                },
              ]}
            >
              {position}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMatchingStatus = () => (
    <View style={styles.matchingStatus}>
      <View style={styles.matchingHeader}>
        <Ionicons name="search" size={24} color={Colors.primary} />
        <Text style={styles.matchingTitle}>매칭 중...</Text>
      </View>
      <Text style={styles.matchingSubtitle}>
        선호 포지션: {selectedPositions.join(', ')}
      </Text>
      <TouchableOpacity style={styles.stopButton} onPress={handleStopMatching}>
        <Text style={styles.stopButtonText}>매칭 취소</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRoomCard = (room: MatchingRoom) => {
    const filledPositions = Object.values(room.positions).filter(Boolean).length;
    const progress = (filledPositions / 5) * 100;

    return (
      <View key={room.id} style={styles.roomCard}>
        <View style={styles.roomHeader}>
          <Text style={styles.roomName}>{room.name}</Text>
          <View style={styles.tierRange}>
            <Text style={[styles.tierText, { color: getTierColor(room.tierRange.min) }]}>
              {room.tierRange.min}
            </Text>
            <Text style={styles.tierSeparator}>~</Text>
            <Text style={[styles.tierText, { color: getTierColor(room.tierRange.max) }]}>
              {room.tierRange.max}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{filledPositions}/5</Text>
        </View>

        <View style={styles.positionsContainer}>
          {(['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as Position[]).map(position => {
            const user = room.positions[position];
            const isAvailable = !user;

            return (
              <TouchableOpacity
                key={position}
                style={[
                  styles.positionSlot,
                  {
                    backgroundColor: isAvailable ? Colors.backgroundSecondary : getPositionColor(position),
                    borderColor: getPositionColor(position),
                  },
                ]}
                onPress={() => isAvailable && handleJoinRoom(room.id, position)}
                disabled={!isAvailable}
              >
                <Ionicons
                  name={getPositionIcon(position)}
                  size={16}
                  color={isAvailable ? getPositionColor(position) : Colors.textLight}
                />
                <Text
                  style={[
                    styles.positionSlotText,
                    {
                      color: isAvailable ? getPositionColor(position) : Colors.textLight,
                    },
                  ]}
                >
                  {position}
                </Text>
                {user && (
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.username}</Text>
                    <Text style={[styles.userTier, { color: getTierColor(user.tier) }]}>
                      {user.tier} {user.rank}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {room.waitingUsers.length > 0 && (
          <View style={styles.waitingUsers}>
            <Text style={styles.waitingTitle}>대기 중인 유저 ({room.waitingUsers.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {room.waitingUsers.map(user => (
                <View key={user.id} style={styles.waitingUser}>
                  <Text style={styles.waitingUserName}>{user.username}</Text>
                  <Text style={[styles.waitingUserTier, { color: getTierColor(user.tier) }]}>
                    {user.tier} {user.rank}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          style={styles.joinWaitingButton}
          onPress={() => handleJoinWaitingList(room.id)}
        >
          <Text style={styles.joinWaitingButtonText}>대기열 참가</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCurrentRoom = () => {
    if (!currentRoom) return null;

    return (
      <View style={styles.currentRoomContainer}>
        <View style={styles.currentRoomHeader}>
          <Text style={styles.currentRoomTitle}>현재 참가 중인 방</Text>
          <TouchableOpacity onPress={handleLeaveRoom}>
            <Ionicons name="exit-outline" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <Text style={styles.currentRoomName}>{currentRoom.name}</Text>

        {currentRoom.isReady && (
          <View style={styles.readyStatus}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <Text style={styles.readyText}>모든 포지션이 준비되었습니다!</Text>
            {currentRoom.estimatedStartTime && (
              <Text style={styles.startTime}>
                예상 시작 시간: {new Date(currentRoom.estimatedStartTime).toLocaleTimeString()}
              </Text>
            )}
          </View>
        )}

        <View style={styles.currentRoomPositions}>
          {(['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as Position[]).map(position => {
            const user = currentRoom.positions[position];
            return (
              <View
                key={position}
                style={[
                  styles.currentPositionSlot,
                  {
                    backgroundColor: user ? getPositionColor(position) : Colors.backgroundSecondary,
                    borderColor: getPositionColor(position),
                  },
                ]}
              >
                <Ionicons
                  name={getPositionIcon(position)}
                  size={20}
                  color={user ? Colors.textLight : getPositionColor(position)}
                />
                <Text
                  style={[
                    styles.currentPositionText,
                    {
                      color: user ? Colors.textLight : getPositionColor(position),
                    },
                  ]}
                >
                  {position}
                </Text>
                {user && (
                  <Text style={styles.currentUserName}>{user.username}</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>빠른 매칭</Text>
        <Text style={styles.subtitle}>실시간으로 내전 상대를 찾아보세요</Text>
      </View>

      {currentRoom ? (
        renderCurrentRoom()
      ) : (
        <>
          {!isMatching && renderPositionSelector()}

          {isMatching ? (
            renderMatchingStatus()
          ) : (
            <TouchableOpacity style={styles.startButton} onPress={handleStartMatching}>
              <Ionicons name="play" size={24} color={Colors.textLight} />
              <Text style={styles.startButtonText}>매칭 시작</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <View style={styles.roomsSection}>
        <Text style={styles.sectionTitle}>활성 매칭 방</Text>
        {activeRooms.map(renderRoomCard)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  positionSelector: {
    margin: 20,
    padding: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  positionButton: {
    width: (width - 80) / 3,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  positionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  startButtonText: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  matchingStatus: {
    margin: 20,
    padding: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  matchingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  matchingSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  stopButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  stopButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  roomsSection: {
    padding: 20,
  },
  roomCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  tierRange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tierSeparator: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  positionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  positionSlot: {
    width: (width - 80) / 5,
    aspectRatio: 0.8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  positionSlotText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 4,
  },
  userName: {
    fontSize: 8,
    color: Colors.textLight,
    fontWeight: '500',
  },
  userTier: {
    fontSize: 7,
    fontWeight: '600',
  },
  waitingUsers: {
    marginBottom: 12,
  },
  waitingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  waitingUser: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  waitingUserName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  waitingUserTier: {
    fontSize: 10,
    fontWeight: '600',
  },
  joinWaitingButton: {
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  joinWaitingButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  currentRoomContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  currentRoomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentRoomTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  currentRoomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  readyStatus: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
  readyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
    marginTop: 8,
  },
  startTime: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  currentRoomPositions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currentPositionSlot: {
    width: (width - 80) / 5,
    aspectRatio: 0.8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  currentPositionText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  currentUserName: {
    fontSize: 8,
    color: Colors.textLight,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default QuickMatchScreen; 