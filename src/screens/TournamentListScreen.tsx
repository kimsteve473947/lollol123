import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { 
  RootState, 
  AppDispatch, 
  setTournaments, 
  setMyTournaments,
  setSelectedTournament,
  setTournamentFilters,
  setTournamentLoading,
  addNotification
} from '../store';
import { Colors } from '../constants/colors';
import { POSITIONS } from '../constants/positions';
import { TournamentAPI, handleApiError } from '../api';
import useOptimizedList from '../hooks/useOptimizedList';

interface Tournament {
  id: string;
  title: string;
  description: string;
  type: 'free' | 'paid';
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  currentParticipants: number;
  organizerId: string;
  organizerName: string;
  status: 'open' | 'closed' | 'ongoing' | 'completed' | 'cancelled';
  registrationStart: Date;
  registrationEnd: Date;
  tournamentStart: Date;
  tournamentEnd: Date;
  participants: TournamentParticipant[];
  tags: string[];
  region: string;
  discordLink?: string;
}

interface TournamentParticipant {
  userId: string;
  username: string;
  tier: string;
  rank: string;
  position: string;
  registeredAt: Date;
}

const TournamentListScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.app);
  const { tournaments, myTournaments, isLoading, filters } = useSelector((state: RootState) => state.tournament);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedTournament, setSelectedTournamentLocal] = useState<Tournament | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    type: 'free' as 'free' | 'paid',
    entryFee: '',
    prizePool: '',
    maxParticipants: '10',
    registrationEnd: '',
    tournamentStart: '',
    tags: [] as string[],
    discordLink: '',
  });

  // 필터링된 대회 목록
  const filteredTournaments = useMemo(() => {
    return tournaments.filter(tournament => {
      if (filters.type !== 'all' && tournament.type !== filters.type) {
        return false;
      }
      
      if (filters.status !== 'all' && tournament.status !== filters.status) {
        return false;
      }
      
      if (filters.date) {
        const tournamentDate = new Date(tournament.tournamentStart).toDateString();
        const filterDate = new Date(filters.date).toDateString();
        if (tournamentDate !== filterDate) {
          return false;
        }
      }
      
      return true;
    });
  }, [tournaments, filters]);

  // 데이터 로딩
  useEffect(() => {
    loadTournaments();
    loadMyTournaments();
  }, []);

  const loadTournaments = useCallback(async () => {
    try {
      dispatch(setTournamentLoading(true));
      const response = await TournamentAPI.getTournaments({
        ...filters,
        page: 1,
        limit: 50,
      });
      
      if (response.success) {
        dispatch(setTournaments(response.data));
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      dispatch(setTournamentLoading(false));
    }
  }, [dispatch, filters]);

  const loadMyTournaments = useCallback(async () => {
    if (!user) return;
    
    try {
      // 내가 참여한 대회들 필터링
      const myTournamentList = tournaments.filter(tournament => 
        tournament.participants.some(p => p.userId === user.id)
      );
      dispatch(setMyTournaments(myTournamentList));
    } catch (error) {
      console.error('Failed to load my tournaments:', error);
    }
  }, [user, tournaments, dispatch]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadTournaments();
    setIsRefreshing(false);
  }, [loadTournaments]);

  const handleCreateTournament = useCallback(async () => {
    if (!createForm.title || !createForm.description) {
      Alert.alert('오류', '제목과 설명을 입력해주세요.');
      return;
    }

    if (!user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    try {
      dispatch(setTournamentLoading(true));
      
      const tournamentData = {
        title: createForm.title,
        description: createForm.description,
        type: createForm.type,
        entryFee: createForm.type === 'paid' ? parseInt(createForm.entryFee) : 0,
        prizePool: parseInt(createForm.prizePool) || 0,
        maxParticipants: parseInt(createForm.maxParticipants),
        schedule: {
          registrationStart: new Date(),
          registrationEnd: new Date(createForm.registrationEnd),
          tournamentStart: new Date(createForm.tournamentStart),
          tournamentEnd: new Date(new Date(createForm.tournamentStart).getTime() + 4 * 60 * 60 * 1000), // 4시간 후
        },
      };

      const response = await TournamentAPI.createTournament(tournamentData);
      
      if (response.success) {
        dispatch(addNotification({
          type: 'success',
          title: '대회 생성 완료',
          message: '대회가 성공적으로 생성되었습니다.',
        }));
        
        setShowCreateModal(false);
        resetCreateForm();
        loadTournaments();
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      dispatch(setTournamentLoading(false));
    }
  }, [createForm, user, dispatch]);

  const resetCreateForm = useCallback(() => {
    setCreateForm({
      title: '',
      description: '',
      type: 'free',
      entryFee: '',
      prizePool: '',
      maxParticipants: '10',
      registrationEnd: '',
      tournamentStart: '',
      tags: [],
      discordLink: '',
    });
  }, []);

  const handleJoinTournament = useCallback(async () => {
    if (!selectedTournament || !selectedPosition) {
      Alert.alert('오류', '포지션을 선택해주세요.');
      return;
    }

    if (!user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    try {
      const response = await TournamentAPI.joinTournament(selectedTournament.id, selectedPosition);
      
      if (response.success) {
        dispatch(addNotification({
          type: 'success',
          title: '참가 완료',
          message: '대회 참가가 완료되었습니다.',
        }));
        
        setShowJoinModal(false);
        setSelectedPosition('');
        loadTournaments();
      }
    } catch (error) {
      handleApiError(error);
    }
  }, [selectedTournament, selectedPosition, user, dispatch]);

  const handleTournamentPress = useCallback((tournament: Tournament) => {
    dispatch(setSelectedTournament(tournament));
    navigation.navigate('TournamentDetail' as never);
  }, [dispatch, navigation]);

  const handleJoinPress = useCallback((tournament: Tournament) => {
    setSelectedTournamentLocal(tournament);
    setShowJoinModal(true);
  }, []);

  const formatDate = useCallback((date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'open': return Colors.success;
      case 'ongoing': return Colors.warning;
      case 'completed': return Colors.textMuted;
      case 'cancelled': return Colors.error;
      default: return Colors.textMuted;
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'open': return '모집중';
      case 'ongoing': return '진행중';
      case 'completed': return '완료';
      case 'cancelled': return '취소됨';
      default: return '알 수 없음';
    }
  }, []);

  const renderTournament = useCallback(({ item }: { item: Tournament }) => {
    const isParticipating = item.participants.some(p => p.userId === user?.id);
    const canJoin = item.status === 'open' && !isParticipating && item.currentParticipants < item.maxParticipants;
    
    return (
      <TouchableOpacity 
        style={styles.tournamentCard}
        onPress={() => handleTournamentPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.tournamentHeader}>
          <View style={styles.tournamentInfo}>
            <Text style={styles.tournamentTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.organizerName}>주최: {item.organizerName}</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: item.type === 'free' ? Colors.success : Colors.primary }]}>
              <Text style={styles.typeText}>{item.type === 'free' ? '무료' : '유료'}</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.tournamentDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.tournamentDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="people" size={16} color={Colors.textMuted} />
            <Text style={styles.detailText}>
              {item.currentParticipants}/{item.maxParticipants}명
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="time" size={16} color={Colors.textMuted} />
            <Text style={styles.detailText}>
              {formatDate(item.tournamentStart)}
            </Text>
          </View>
          
          {item.prizePool > 0 && (
            <View style={styles.detailItem}>
              <Ionicons name="trophy" size={16} color={Colors.warning} />
              <Text style={styles.detailText}>
                {item.prizePool.toLocaleString()}원
              </Text>
            </View>
          )}
        </View>
        
        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.tournamentActions}>
          {isParticipating && (
            <View style={styles.participatingBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.participatingText}>참가중</Text>
            </View>
          )}
          
          {canJoin && (
            <TouchableOpacity 
              style={styles.joinButton}
              onPress={() => handleJoinPress(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.joinButtonText}>참가하기</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [user, handleTournamentPress, handleJoinPress, formatDate, getStatusColor, getStatusText]);

  const listProps = useOptimizedList({
    data: filteredTournaments,
    keyExtractor: (item) => item.id,
    renderItem: renderTournament,
    itemHeight: 200,
  });

  const renderCreateModal = () => (
    <Modal visible={showCreateModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>대회 생성</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>대회 제목</Text>
              <TextInput
                style={styles.formInput}
                placeholder="대회 제목을 입력하세요"
                value={createForm.title}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, title: text }))}
              />
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>대회 설명</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="대회에 대한 설명을 입력하세요"
                value={createForm.description}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>대회 유형</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeButton, createForm.type === 'free' && styles.typeButtonActive]}
                  onPress={() => setCreateForm(prev => ({ ...prev, type: 'free' }))}
                >
                  <Text style={[styles.typeButtonText, createForm.type === 'free' && styles.typeButtonTextActive]}>
                    무료
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, createForm.type === 'paid' && styles.typeButtonActive]}
                  onPress={() => setCreateForm(prev => ({ ...prev, type: 'paid' }))}
                >
                  <Text style={[styles.typeButtonText, createForm.type === 'paid' && styles.typeButtonTextActive]}>
                    유료
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {createForm.type === 'paid' && (
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>참가비 (원)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="참가비를 입력하세요"
                  value={createForm.entryFee}
                  onChangeText={(text) => setCreateForm(prev => ({ ...prev, entryFee: text }))}
                  keyboardType="numeric"
                />
              </View>
            )}
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>상금 (원)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="상금을 입력하세요 (선택사항)"
                value={createForm.prizePool}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, prizePool: text }))}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>최대 참가자 수</Text>
              <TextInput
                style={styles.formInput}
                placeholder="최대 참가자 수"
                value={createForm.maxParticipants}
                onChangeText={(text) => setCreateForm(prev => ({ ...prev, maxParticipants: text }))}
                keyboardType="numeric"
              />
            </View>
            
            <TouchableOpacity style={styles.createButton} onPress={handleCreateTournament}>
              <Text style={styles.createButtonText}>대회 생성하기</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderJoinModal = () => (
    <Modal visible={showJoinModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>대회 참가</Text>
            <TouchableOpacity onPress={() => setShowJoinModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          {selectedTournament && (
            <View style={styles.tournamentInfo}>
              <Text style={styles.modalTournamentTitle}>{selectedTournament.title}</Text>
              <Text style={styles.modalTournamentDescription}>{selectedTournament.description}</Text>
            </View>
          )}
          
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>포지션 선택</Text>
            <View style={styles.positionGrid}>
              {Object.values(POSITIONS).map((position) => (
                <TouchableOpacity
                  key={position.id}
                  style={[
                    styles.positionOption,
                    selectedPosition === position.id && styles.positionOptionSelected,
                  ]}
                  onPress={() => setSelectedPosition(position.id)}
                >
                  <Image source={{ uri: position.icon }} style={styles.positionIcon} />
                  <Text style={[
                    styles.positionText,
                    selectedPosition === position.id && styles.positionTextSelected,
                  ]}>
                    {position.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.joinModalButton, !selectedPosition && styles.joinModalButtonDisabled]}
            onPress={handleJoinTournament}
            disabled={!selectedPosition}
          >
            <Text style={styles.joinModalButtonText}>참가하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // 대회 생성 화면으로 이동
  const navigateToCreateTournament = useCallback(() => {
    // @ts-ignore: 타입 문제 무시
    navigation.navigate('TournamentCreate');
  }, [navigation]);

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>모집중 내전</Text>
        
        <TouchableOpacity 
          style={styles.createButton}
          onPress={navigateToCreateTournament}
        >
          <Ionicons name="add-circle" size={24} color={Colors.primary} />
          <Text style={styles.createButtonText}>새 내전</Text>
        </TouchableOpacity>
      </View>

      {/* 필터 */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, filters.type === 'all' && styles.filterButtonActive]}
            onPress={() => dispatch(setTournamentFilters({ type: 'all' }))}
          >
            <Text style={[styles.filterText, filters.type === 'all' && styles.filterTextActive]}>
              전체
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filters.type === 'free' && styles.filterButtonActive]}
            onPress={() => dispatch(setTournamentFilters({ type: 'free' }))}
          >
            <Text style={[styles.filterText, filters.type === 'free' && styles.filterTextActive]}>
              무료
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filters.type === 'paid' && styles.filterButtonActive]}
            onPress={() => dispatch(setTournamentFilters({ type: 'paid' }))}
          >
            <Text style={[styles.filterText, filters.type === 'paid' && styles.filterTextActive]}>
              유료
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 대회 목록 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>대회 목록을 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          {...listProps}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>모집중인 내전이 없습니다.</Text>
              <TouchableOpacity 
                style={styles.createEmptyButton}
                onPress={navigateToCreateTournament}
              >
                <Text style={styles.createEmptyButtonText}>내전 만들기</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {renderCreateModal()}
      {renderJoinModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  createButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  filterTextActive: {
    color: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: Colors.textMuted,
    fontSize: 16,
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
  listContainer: {
    padding: 16,
  },
  tournamentCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tournamentInfo: {
    flex: 1,
    marginRight: 12,
  },
  tournamentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  organizerName: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.background,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.background,
  },
  tournamentDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  tournamentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: Colors.text,
  },
  tournamentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participatingText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: Colors.background,
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.cardBackground,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    color: Colors.text,
  },
  typeButtonTextActive: {
    color: Colors.background,
    fontWeight: '600',
  },
  modalTournamentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  modalTournamentDescription: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  positionOption: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  positionOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  positionIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  positionText: {
    fontSize: 12,
    color: Colors.text,
  },
  positionTextSelected: {
    color: Colors.background,
    fontWeight: '600',
  },
  joinModalButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  joinModalButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  joinModalButtonText: {
    color: Colors.background,
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  createEmptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createEmptyButtonText: {
    color: Colors.textLight,
    fontWeight: '600',
  },
});

export default TournamentListScreen; 