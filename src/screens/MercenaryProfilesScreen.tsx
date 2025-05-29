import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { 
  RootState, 
  AppDispatch, 
  setProfiles, 
  setMyProfile, 
  updateProfile, 
  setMercenaryFilters, 
  setSortBy,
  setMercenaryLoading,
  addNotification
} from '../store';
import { Colors } from '../constants/colors';
import { POSITIONS } from '../constants/positions';
import { MercenaryAPI, handleApiError } from '../api';

interface MercenaryProfile {
  id: string;
  userId: string;
  username: string;
  riotId: string;
  tier: string;
  rank: string;
  mainPosition: string;
  subPosition: string;
  profileIcon: string;
  hourlyRate: number;
  description: string;
  rating: number;
  reviewCount: number;
  gamesPlayed: number;
  winRate: number;
  isVerified: boolean;
  isOnline: boolean;
  lastActive: Date;
  specialties: string[];
  availableHours: string[];
}

interface User {
  id: string;
  username: string;
  riotId: string;
  tier: string;
  rank: string;
  mainPosition: string;
  subPosition: string;
  profileIcon: string;
  isVerified: boolean;
}

const MercenaryProfilesScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.app);
  const { profiles, myProfile, isLoading, filters, sortBy } = useSelector((state: RootState) => state.mercenary);
  
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<MercenaryProfile | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [registerForm, setRegisterForm] = useState({
    hourlyRate: '',
    description: '',
    specialties: [] as string[],
    availableHours: [] as string[],
  });

  const tierOrder = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'];
  const tierColors: { [key: string]: string } = {
    IRON: '#8B4513',
    BRONZE: '#CD7F32',
    SILVER: '#C0C0C0',
    GOLD: '#FFD700',
    PLATINUM: '#00CED1',
    EMERALD: '#50C878',
    DIAMOND: '#B9F2FF',
    MASTER: '#9932CC',
    GRANDMASTER: '#FF4500',
    CHALLENGER: '#FFD700',
  };

  const specialtyOptions = [
    '라인전 우위', '후반 캐리', '팀파이트', '갱킹', '오브젝트', 
    '비전 컨트롤', '로밍', '서포팅', '탱킹', '딜링'
  ];

  const timeSlots = [
    '09:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00', 
    '21:00-24:00', '24:00-03:00', '주말 전체', '평일 전체'
  ];

  const isUserRegistered = useMemo(() => 
    myProfile !== null, [myProfile]
  );

  // 필터링된 프로필
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      if (filters.position !== 'ALL' && 
          profile.mainPosition !== filters.position && 
          profile.subPosition !== filters.position) {
        return false;
      }
      
      if (filters.tier !== 'ALL') {
        const profileTierIndex = tierOrder.indexOf(profile.tier);
        const filterTierIndex = tierOrder.indexOf(filters.tier);
        if (profileTierIndex < filterTierIndex) {
          return false;
        }
      }
      
      if (profile.rating < filters.minRating || profile.hourlyRate > filters.maxRate) {
        return false;
      }
      
      return true;
    });
  }, [profiles, filters, tierOrder]);

  // 정렬된 프로필
  const sortedProfiles = useMemo(() => {
    return [...filteredProfiles].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'rate':
          return a.hourlyRate - b.hourlyRate;
        case 'winRate':
          return b.winRate - a.winRate;
        default:
          return 0;
      }
    });
  }, [filteredProfiles, sortBy]);

  // 데이터 로딩
  useEffect(() => {
    loadProfiles();
    loadMyProfile();
  }, []);

  const loadProfiles = useCallback(async () => {
    try {
      dispatch(setMercenaryLoading(true));
      const response = await MercenaryAPI.getProfiles({
        ...filters,
        sortBy,
        page: 1,
        limit: 50,
      });
      
      if (response.success) {
        dispatch(setProfiles(response.data));
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      dispatch(setMercenaryLoading(false));
    }
  }, [dispatch, filters, sortBy]);

  const loadMyProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      // 내 프로필이 있는지 확인
      const myProfileData = profiles.find(p => p.userId === user.id);
      if (myProfileData) {
        dispatch(setMyProfile(myProfileData));
      }
    } catch (error) {
      console.error('Failed to load my profile:', error);
    }
  }, [user, profiles, dispatch]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadProfiles();
    setIsRefreshing(false);
  }, [loadProfiles]);

  const handleRegisterMercenary = useCallback(async () => {
    if (!registerForm.hourlyRate || !registerForm.description) {
      Alert.alert('오류', '시간당 요금과 소개를 입력해주세요.');
      return;
    }

    if (!user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    try {
      dispatch(setMercenaryLoading(true));
      
      const profileData = {
        hourlyRate: parseInt(registerForm.hourlyRate),
        description: registerForm.description,
        specialties: registerForm.specialties,
        availableHours: registerForm.availableHours,
      };

      const response = await MercenaryAPI.registerProfile(profileData);
      
      if (response.success) {
        const newProfile: MercenaryProfile = {
          id: response.data.id,
          userId: user.id,
          username: user.username,
          riotId: user.username, // 실제로는 riotId 필드 필요
          tier: user.tier,
          rank: user.rank,
          mainPosition: user.mainPosition,
          subPosition: user.subPosition,
          profileIcon: user.profileIcon,
          ...profileData,
          rating: 0,
          reviewCount: 0,
          gamesPlayed: 0,
          winRate: 0,
          isVerified: user.isVerified,
          isOnline: true,
          lastActive: new Date(),
        };

        dispatch(setMyProfile(newProfile));
        dispatch(setProfiles([...profiles, newProfile]));
        dispatch(addNotification({
          type: 'success',
          title: '등록 완료',
          message: '용병 프로필이 성공적으로 등록되었습니다.',
        }));
        
        setShowRegisterModal(false);
        resetRegisterForm();
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      dispatch(setMercenaryLoading(false));
    }
  }, [registerForm, user, dispatch, profiles]);

  const resetRegisterForm = useCallback(() => {
    setRegisterForm({
      hourlyRate: '',
      description: '',
      specialties: [],
      availableHours: [],
    });
  }, []);

  const toggleSpecialty = useCallback((specialty: string) => {
    setRegisterForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  }, []);

  const toggleTimeSlot = useCallback((timeSlot: string) => {
    setRegisterForm(prev => ({
      ...prev,
      availableHours: prev.availableHours.includes(timeSlot)
        ? prev.availableHours.filter(t => t !== timeSlot)
        : [...prev.availableHours, timeSlot],
    }));
  }, []);

  const formatLastActive = useCallback((date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
  }, []);

  const handleProfilePress = useCallback((profile: MercenaryProfile) => {
    setSelectedProfile(profile);
    setShowDetailModal(true);
  }, []);

  const handleHireMercenary = useCallback(async (mercenaryId: string) => {
    try {
      Alert.alert(
        '용병 고용',
        '이 용병을 고용하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '고용하기',
            onPress: async () => {
              try {
                const response = await MercenaryAPI.hireMercenary(mercenaryId, {
                  duration: 2, // 2시간
                  message: '함께 게임하고 싶습니다!',
                });
                
                if (response.success) {
                  dispatch(addNotification({
                    type: 'success',
                    title: '고용 완료',
                    message: '용병 고용 요청이 전송되었습니다.',
                  }));
                  setShowDetailModal(false);
                }
              } catch (error) {
                handleApiError(error);
              }
            }
          }
        ]
      );
    } catch (error) {
      handleApiError(error);
    }
  }, [dispatch]);

  const renderProfile = useCallback(({ item }: { item: MercenaryProfile }) => (
    <TouchableOpacity 
      style={styles.profileCard}
      onPress={() => handleProfilePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          <Image source={{ uri: item.profileIcon }} style={styles.profileImage} />
          <View style={[styles.onlineIndicator, { backgroundColor: item.isOnline ? Colors.success : Colors.textMuted }]} />
        </View>
        
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.username}>{item.username}</Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
            )}
          </View>
          <Text style={styles.riotId}>{item.riotId}</Text>
          
          <View style={styles.tierContainer}>
            <View style={[styles.tierBadge, { backgroundColor: tierColors[item.tier] }]}>
              <Text style={styles.tierText}>{item.tier} {item.rank}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.rateContainer}>
          <Text style={styles.hourlyRate}>{item.hourlyRate.toLocaleString()}원/시간</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={Colors.warning} />
            <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({item.reviewCount})</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.positionsContainer}>
        <View style={styles.positionItem}>
          <Image 
            source={{ uri: POSITIONS[item.mainPosition as keyof typeof POSITIONS].icon }} 
            style={styles.positionIcon} 
          />
          <Text style={styles.positionText}>
            {POSITIONS[item.mainPosition as keyof typeof POSITIONS].name} (주)
          </Text>
        </View>
        <View style={styles.positionItem}>
          <Image 
            source={{ uri: POSITIONS[item.subPosition as keyof typeof POSITIONS].icon }} 
            style={styles.positionIcon} 
          />
          <Text style={styles.positionText}>
            {POSITIONS[item.subPosition as keyof typeof POSITIONS].name} (부)
          </Text>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.specialtiesContainer}>
        {item.specialties.slice(0, 3).map((specialty, index) => (
          <View key={index} style={styles.specialtyTag}>
            <Text style={styles.specialtyText}>{specialty}</Text>
          </View>
        ))}
        {item.specialties.length > 3 && (
          <Text style={styles.moreSpecialties}>+{item.specialties.length - 3}</Text>
        )}
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>게임 수</Text>
          <Text style={styles.statValue}>{item.gamesPlayed}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>승률</Text>
          <Text style={styles.statValue}>{item.winRate}%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>마지막 활동</Text>
          <Text style={styles.statValue}>{formatLastActive(item.lastActive)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [handleProfilePress, tierColors, formatLastActive]);

  const renderTierTab = useCallback(({ item }: { item: typeof POSITIONS[0] }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filters.position === item.id && styles.filterButtonActive,
      ]}
      onPress={() => dispatch(setMercenaryFilters({ position: item.id }))}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.icon }} style={styles.filterIcon} />
      <Text style={[
        styles.filterText,
        filters.position === item.id && styles.filterTextActive,
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  ), [filters.position, dispatch]);

  const renderRegisterModal = () => (
    <Modal visible={showRegisterModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>용병 등록</Text>
              <TouchableOpacity onPress={() => setShowRegisterModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.userInfoContainer}>
              <Image source={{ uri: user?.profileIcon }} style={styles.modalProfileImage} />
              <View style={styles.userInfo}>
                <Text style={styles.modalUsername}>{user?.username}</Text>
                <Text style={styles.modalRiotId}>{user?.riotId}</Text>
                <Text style={styles.modalTier}>{user?.tier} {user?.rank}</Text>
              </View>
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>시간당 요금 (원)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="예: 10000"
                value={registerForm.hourlyRate}
                onChangeText={(text) => setRegisterForm(prev => ({ ...prev, hourlyRate: text }))}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>자기소개</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="자신의 플레이 스타일과 강점을 소개해주세요"
                value={registerForm.description}
                onChangeText={(text) => setRegisterForm(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>전문 분야</Text>
              <View style={styles.optionsGrid}>
                {specialtyOptions.map((specialty) => (
                  <TouchableOpacity
                    key={specialty}
                    style={[
                      styles.optionButton,
                      registerForm.specialties.includes(specialty) && styles.optionButtonSelected,
                    ]}
                    onPress={() => toggleSpecialty(specialty)}
                  >
                    <Text style={[
                      styles.optionText,
                      registerForm.specialties.includes(specialty) && styles.optionTextSelected,
                    ]}>
                      {specialty}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>활동 가능 시간</Text>
              <View style={styles.optionsGrid}>
                {timeSlots.map((timeSlot) => (
                  <TouchableOpacity
                    key={timeSlot}
                    style={[
                      styles.optionButton,
                      registerForm.availableHours.includes(timeSlot) && styles.optionButtonSelected,
                    ]}
                    onPress={() => toggleTimeSlot(timeSlot)}
                  >
                    <Text style={[
                      styles.optionText,
                      registerForm.availableHours.includes(timeSlot) && styles.optionTextSelected,
                    ]}>
                      {timeSlot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <TouchableOpacity style={styles.registerButton} onPress={handleRegisterMercenary}>
              <Text style={styles.registerButtonText}>용병 등록하기</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>용병 프로필</Text>
        {!isUserRegistered && (
          <TouchableOpacity 
            style={styles.registerHeaderButton}
            onPress={() => setShowRegisterModal(true)}
          >
            <Ionicons name="add" size={20} color={Colors.background} />
            <Text style={styles.registerHeaderButtonText}>등록</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'ALL' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('ALL')}
          >
            <Text style={[styles.filterText, selectedFilter === 'ALL' && styles.filterTextActive]}>
              전체
            </Text>
          </TouchableOpacity>
          {Object.values(POSITIONS).map((position) => (
            <TouchableOpacity
              key={position.id}
              style={[styles.filterButton, selectedFilter === position.id && styles.filterButtonActive]}
              onPress={() => setSelectedFilter(position.id)}
            >
              <Image source={{ uri: position.icon }} style={styles.filterIcon} />
              <Text style={[styles.filterText, selectedFilter === position.id && styles.filterTextActive]}>
                {position.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>정렬:</Text>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
          onPress={() => setSortBy('rating')}
        >
          <Text style={[styles.sortText, sortBy === 'rating' && styles.sortTextActive]}>평점순</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'rate' && styles.sortButtonActive]}
          onPress={() => setSortBy('rate')}
        >
          <Text style={[styles.sortText, sortBy === 'rate' && styles.sortTextActive]}>요금순</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'winRate' && styles.sortButtonActive]}
          onPress={() => setSortBy('winRate')}
        >
          <Text style={[styles.sortText, sortBy === 'winRate' && styles.sortTextActive]}>승률순</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={sortedProfiles}
        renderItem={renderProfile}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
      />
      
      {!isUserRegistered && (
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => setShowRegisterModal(true)}
        >
          <Ionicons name="add" size={24} color={Colors.background} />
        </TouchableOpacity>
      )}
      
      {renderRegisterModal()}
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
  registerHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  registerHeaderButtonText: {
    color: Colors.background,
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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
  filterIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  filterTextActive: {
    color: Colors.background,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  sortLabel: {
    fontSize: 14,
    color: Colors.text,
    marginRight: 8,
  },
  sortButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    borderRadius: 8,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
  },
  sortText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sortTextActive: {
    color: Colors.background,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 4,
  },
  riotId: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  tierContainer: {
    flexDirection: 'row',
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.background,
  },
  rateContainer: {
    alignItems: 'flex-end',
  },
  hourlyRate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 2,
  },
  reviewCount: {
    fontSize: 10,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  positionsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  positionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  positionIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  positionText: {
    fontSize: 12,
    color: Colors.text,
  },
  description: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  specialtyTag: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 10,
    color: Colors.text,
  },
  moreSpecialties: {
    fontSize: 10,
    color: Colors.textMuted,
    alignSelf: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalProfileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  modalUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  modalRiotId: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  modalTier: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 12,
    color: Colors.text,
  },
  optionTextSelected: {
    color: Colors.background,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: Colors.background,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default MercenaryProfilesScreen; 