import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { Colors } from '../constants/colors';
import { Position, applyToTournament } from '../store/slices/tournamentSlice';

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Ionicons key={i} name="star" size={size} color={Colors.warning} />);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<Ionicons key={i} name="star-half" size={size} color={Colors.warning} />);
    } else {
      stars.push(<Ionicons key={i} name="star-outline" size={size} color={Colors.textMuted} />);
    }
  }

  return <View style={styles.starContainer}>{stars}</View>;
};

const OrganizerProfile: React.FC<{ organizer: any }> = ({ organizer }) => {
  return (
    <View style={styles.organizerSection}>
      <Text style={styles.sectionTitle}>주최자 정보</Text>
      <View style={styles.organizerCard}>
        <View style={styles.organizerHeader}>
          <View style={styles.organizerAvatar}>
            <Ionicons name="person" size={24} color={Colors.primary} />
          </View>
          <View style={styles.organizerInfo}>
            <Text style={styles.organizerName}>{organizer.username}</Text>
            <Text style={styles.organizerRiotId}>{organizer.riotId}</Text>
            <View style={styles.ratingRow}>
              <StarRating rating={organizer.rating} size={14} />
              <Text style={styles.ratingText}>
                {organizer.rating.toFixed(1)} ({organizer.reviewCount}개 리뷰)
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.organizerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{organizer.tournamentsHosted}</Text>
            <Text style={styles.statLabel}>주최한 대회</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{organizer.tournamentsCanceled}</Text>
            <Text style={styles.statLabel}>취소한 대회</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{organizer.mercenaryParticipated}</Text>
            <Text style={styles.statLabel}>용병 참여</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{organizer.mercenaryCanceled}</Text>
            <Text style={styles.statLabel}>용병 취소</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const PositionGrid: React.FC<{ positions: Record<Position, { current: number; max: number }> }> = ({ positions }) => {
  const getPositionIcon = (position: Position) => {
    switch (position) {
      case 'TOP': return 'shield';
      case 'JUNGLE': return 'leaf';
      case 'MID': return 'flash';
      case 'ADC': return 'arrow-forward';
      case 'SUPPORT': return 'heart';
    }
  };

  const getPositionName = (position: Position) => {
    switch (position) {
      case 'TOP': return '탑';
      case 'JUNGLE': return '정글';
      case 'MID': return '미드';
      case 'ADC': return '원딜';
      case 'SUPPORT': return '서포터';
    }
  };

  return (
    <View style={styles.positionGrid}>
      {(Object.keys(positions) as Position[]).map((position) => {
        const positionData = positions[position];
        const isFull = positionData.current >= positionData.max;
        
        return (
          <View key={position} style={[styles.positionCard, isFull && styles.positionCardFull]}>
            <Ionicons 
              name={getPositionIcon(position)} 
              size={20} 
              color={isFull ? Colors.textMuted : Colors.primary} 
            />
            <Text style={[styles.positionName, isFull && styles.positionNameFull]}>
              {getPositionName(position)}
            </Text>
            <Text style={[styles.positionCount, isFull && styles.positionCountFull]}>
              {positionData.current}/{positionData.max}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const TournamentDetailScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedTournament } = useAppSelector((state) => state.tournaments);

  if (!selectedTournament) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>토너먼트 정보를 찾을 수 없습니다.</Text>
      </SafeAreaView>
    );
  }

  const tournament = selectedTournament;

  const handleDiscordLink = () => {
    if (tournament.discordLink) {
      Linking.openURL(tournament.discordLink).catch(() => {
        Alert.alert('오류', '디스코드 링크를 열 수 없습니다.');
      });
    }
  };

  const handleApply = (position: Position) => {
    const positionData = tournament.positions[position];
    if (positionData.current >= positionData.max) {
      Alert.alert('알림', '해당 포지션은 이미 마감되었습니다.');
      return;
    }

    // 유료 대회인 경우 크레딧 확인
    if (!tournament.isFree) {
      const userCredits = 15000; // 임시 크레딧 (실제로는 Redux에서 가져와야 함)
      if (userCredits < tournament.entryFee) {
        Alert.alert(
          '크레딧 부족',
          `참가비 ${tournament.entryFee.toLocaleString()} 크레딧이 필요합니다.\n현재 보유: ${userCredits.toLocaleString()} 크레딧`,
          [
            { text: '취소', style: 'cancel' },
            { text: '크레딧 충전', onPress: () => {
              // 크레딧 충전 화면으로 이동
              Alert.alert('알림', '크레딧 충전 화면으로 이동합니다.');
            }}
          ]
        );
        return;
      }

      // 크레딧 차감 확인
      Alert.alert(
        '참가 신청',
        `${position} 포지션으로 참가하시겠습니까?\n\n참가비: ${tournament.entryFee.toLocaleString()} 크레딧\n플랫폼 수수료: ${Math.floor(tournament.entryFee * 0.11).toLocaleString()} 크레딧 (11%)\n상금 풀 기여: ${tournament.entryFee - Math.floor(tournament.entryFee * 0.11).toLocaleString()} 크레딧`,
        [
          { text: '취소', style: 'cancel' },
          { 
            text: '참가 신청', 
            onPress: () => {
              // 크레딧 차감 및 참가 처리
              dispatch(applyToTournament({ tournamentId: tournament.id, position }));
              Alert.alert('완료', '참가 신청이 완료되었습니다!\n크레딧이 차감되었습니다.');
            }
          }
        ]
      );
    } else {
      // 무료 대회
      Alert.alert(
        '참가 신청',
        `${position} 포지션으로 참가하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          { 
            text: '신청', 
            onPress: () => {
              dispatch(applyToTournament({ tournamentId: tournament.id, position }));
              Alert.alert('완료', '참가 신청이 완료되었습니다!');
            }
          }
        ]
      );
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(date);
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
    return `${month}월 ${day}일 (${weekday}) ${time}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>{tournament.title}</Text>
          <View style={[
            styles.feeTag, 
            { backgroundColor: tournament.isFree ? Colors.successLight : Colors.primaryUltraLight }
          ]}>
            <Text style={[
              styles.feeText,
              { color: tournament.isFree ? Colors.success : Colors.primary }
            ]}>
              {tournament.isFree ? '무료 내전' : `참가비 ${tournament.entryFee.toLocaleString()}원`}
            </Text>
          </View>
        </View>

        {/* 설명 */}
        <View style={styles.section}>
          <Text style={styles.description}>{tournament.description}</Text>
        </View>

        {/* 일정 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>일정 정보</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>경기 일시</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(tournament.startDate, tournament.startTime)} - {tournament.endTime}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color={Colors.warning} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>신청 마감</Text>
                <Text style={styles.infoValue}>
                  {new Date(tournament.applicationDeadline).toLocaleString('ko-KR')}
                </Text>
              </View>
            </View>

            {tournament.prizePool !== '없음' && (
              <View style={styles.infoRow}>
                <Ionicons name="trophy" size={20} color={Colors.warning} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>상금</Text>
                  <Text style={styles.infoValue}>{tournament.prizePool}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* 포지션별 신청 현황 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>포지션별 신청 현황</Text>
          <PositionGrid positions={tournament.positions} />
        </View>

        {/* 주최자 정보 */}
        <OrganizerProfile organizer={tournament.organizerProfile} />

        {/* 참가 조건 */}
        {tournament.requirements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>참가 조건</Text>
            <View style={styles.requirementsCard}>
              {tournament.requirements.map((requirement, index) => (
                <View key={index} style={styles.requirementItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.requirementText}>{requirement}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 디스코드 링크 */}
        {tournament.discordLink && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.discordButton} onPress={handleDiscordLink}>
              <Ionicons name="logo-discord" size={20} color={Colors.background} />
              <Text style={styles.discordButtonText}>디스코드 참여하기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 참가 신청 버튼들 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>참가 신청</Text>
          <View style={styles.applyButtons}>
            {(Object.keys(tournament.positions) as Position[]).map((position) => {
              const positionData = tournament.positions[position];
              const isFull = positionData.current >= positionData.max;
              
              return (
                <TouchableOpacity
                  key={position}
                  style={[styles.applyButton, isFull && styles.applyButtonDisabled]}
                  onPress={() => handleApply(position)}
                  disabled={isFull}
                >
                  <Text style={[styles.applyButtonText, isFull && styles.applyButtonTextDisabled]}>
                    {position} {isFull ? '마감' : '신청'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  feeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  feeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  infoCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  positionCard: {
    width: '18%',
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  positionCardFull: {
    backgroundColor: Colors.backgroundGray,
    borderColor: Colors.border,
  },
  positionName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 4,
    marginBottom: 2,
  },
  positionNameFull: {
    color: Colors.textMuted,
  },
  positionCount: {
    fontSize: 11,
    color: Colors.primary,
  },
  positionCountFull: {
    color: Colors.textMuted,
  },
  organizerSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  organizerCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  organizerHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryUltraLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  organizerRiotId: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  organizerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  requirementsCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
  },
  discordButton: {
    backgroundColor: '#5865F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  discordButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.background,
    marginLeft: 8,
  },
  applyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  applyButton: {
    width: '48%',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  applyButtonDisabled: {
    backgroundColor: Colors.backgroundGray,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.background,
  },
  applyButtonTextDisabled: {
    color: Colors.textMuted,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default TournamentDetailScreen; 