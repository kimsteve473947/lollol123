import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { Colors } from '../constants/colors';
import { logout } from '../store/slices/userSlice';

type NavigationProp = StackNavigationProp<any>;

const MyPageScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.user);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // 임시 사용자 데이터 (로그인 시스템 구현 전까지)
  const tempUser = currentUser || {
    profile: {
      id: 'temp_user',
      email: 'user@example.com',
      username: '롤매니저',
      isVerified: true,
      isMinor: false,
      createdAt: '2024-01-01',
      lastLoginAt: '2024-12-01',
    },
    riotAccount: {
      puuid: 'temp_puuid',
      gameName: 'LoLManager',
      tagLine: 'KR1',
      summonerLevel: 156,
      rank: 'Gold III',
      tier: 'GOLD',
      leaguePoints: 1456,
      wins: 67,
      losses: 33,
      isVerified: true,
    },
    credits: 15000,
    stats: {
      tournamentsParticipated: 12,
      tournamentsWon: 8,
      tournamentsHosted: 3,
      tournamentsCanceled: 0,
      totalEarnings: 45000,
      totalSpent: 30000,
      rating: 4.7,
      reviewCount: 23,
      reportCount: 0,
      warningCount: 0,
    },
    creditHistory: [],
    isLoggedIn: true,
    isSuspended: false,
    agreedToTerms: true,
    agreedToPrivacy: true,
    marketingConsent: true,
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '로그아웃', 
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
            // 로그인 화면으로 이동
          }
        }
      ]
    );
  };

  const handleRiotAccountLink = () => {
    Alert.alert(
      'Riot 계정 연동',
      'Riot Games 계정을 연동하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '연동하기', onPress: () => {
          // Riot OAuth 플로우 시작
          Alert.alert('알림', 'Riot 계정 연동 기능을 준비중입니다.');
        }}
      ]
    );
  };

  const MenuSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={styles.menuSection}>
      <Text style={styles.menuSectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const MenuItem: React.FC<{
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
    color?: string;
  }> = ({ icon, title, subtitle, onPress, showArrow = true, rightComponent, color = Colors.text }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon as any} size={20} color={color} />
        <View style={styles.menuItemText}>
          <Text style={[styles.menuItemTitle, { color }]}>{title}</Text>
          {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {rightComponent}
        {showArrow && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 프로필 헤더 */}
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={32} color={Colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{tempUser.profile.username}</Text>
            <Text style={styles.profileEmail}>{tempUser.profile.email}</Text>
            {tempUser.riotAccount && (
              <View style={styles.riotInfo}>
                <Text style={styles.riotName}>
                  {tempUser.riotAccount.gameName}#{tempUser.riotAccount.tagLine}
                </Text>
                <Text style={styles.riotRank}>{tempUser.riotAccount.rank}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* 크레딧 카드 */}
        <TouchableOpacity 
          style={styles.creditCard}
          onPress={() => navigation.navigate('CreditCharge')}
        >
          <View style={styles.creditInfo}>
            <Text style={styles.creditLabel}>보유 크레딧</Text>
            <Text style={styles.creditAmount}>{tempUser.credits.toLocaleString()}</Text>
          </View>
          <View style={styles.creditActions}>
            <TouchableOpacity style={styles.chargeButton}>
              <Ionicons name="add" size={16} color={Colors.background} />
              <Text style={styles.chargeButtonText}>충전</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* 통계 카드 */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>내 활동 통계</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{tempUser.stats.tournamentsParticipated}</Text>
              <Text style={styles.statLabel}>참여한 대회</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{tempUser.stats.tournamentsWon}</Text>
              <Text style={styles.statLabel}>우승 횟수</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{tempUser.stats.tournamentsHosted}</Text>
              <Text style={styles.statLabel}>주최한 대회</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{tempUser.stats.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>평점</Text>
            </View>
          </View>
        </View>

        {/* 계정 관리 */}
        <MenuSection title="계정 관리">
          <MenuItem
            icon="game-controller"
            title="Riot 계정 연동"
            subtitle={tempUser.riotAccount ? '연동됨' : '연동 필요'}
            onPress={handleRiotAccountLink}
          />
          <MenuItem
            icon="card"
            title="결제 수단 관리"
            onPress={() => navigation.navigate('PaymentMethods')}
          />
          <MenuItem
            icon="receipt"
            title="결제 내역"
            onPress={() => navigation.navigate('PaymentHistory')}
          />
          <MenuItem
            icon="time"
            title="크레딧 사용 내역"
            onPress={() => navigation.navigate('CreditHistory')}
          />
        </MenuSection>

        {/* 내 활동 */}
        <MenuSection title="내 활동">
          <MenuItem
            icon="trophy"
            title="참여한 대회"
            subtitle={`${tempUser.stats.tournamentsParticipated}개`}
            onPress={() => navigation.navigate('MyTournaments')}
          />
          <MenuItem
            icon="star"
            title="받은 리뷰"
            subtitle={`${tempUser.stats.reviewCount}개`}
            onPress={() => navigation.navigate('MyReviews')}
          />
          <MenuItem
            icon="people"
            title="차단한 사용자"
            onPress={() => navigation.navigate('BlockedUsers')}
          />
        </MenuSection>

        {/* 설정 */}
        <MenuSection title="설정">
          <MenuItem
            icon="notifications"
            title="알림 설정"
            onPress={() => {}}
            showArrow={false}
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={notificationsEnabled ? Colors.primary : Colors.textMuted}
              />
            }
          />
          <MenuItem
            icon="shield-checkmark"
            title="개인정보 설정"
            onPress={() => navigation.navigate('PrivacySettings')}
          />
          <MenuItem
            icon="document-text"
            title="이용약관"
            onPress={() => navigation.navigate('Terms')}
          />
          <MenuItem
            icon="document-text"
            title="개인정보처리방침"
            onPress={() => navigation.navigate('Privacy')}
          />
        </MenuSection>

        {/* 고객지원 */}
        <MenuSection title="고객지원">
          <MenuItem
            icon="help-circle"
            title="자주 묻는 질문"
            onPress={() => navigation.navigate('FAQ')}
          />
          <MenuItem
            icon="chatbubble"
            title="1:1 문의"
            onPress={() => navigation.navigate('Support')}
          />
          <MenuItem
            icon="flag"
            title="신고하기"
            onPress={() => navigation.navigate('Report')}
          />
          <MenuItem
            icon="information-circle"
            title="앱 정보"
            subtitle="v1.0.0"
            onPress={() => navigation.navigate('AppInfo')}
          />
        </MenuSection>

        {/* 로그아웃 */}
        <View style={styles.logoutSection}>
          <MenuItem
            icon="log-out"
            title="로그아웃"
            onPress={handleLogout}
            showArrow={false}
            color={Colors.error}
          />
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacing} />
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryUltraLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  riotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riotName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 8,
  },
  riotRank: {
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: Colors.backgroundGray,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  editButton: {
    padding: 8,
  },
  creditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 20,
    padding: 20,
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  creditInfo: {
    flex: 1,
  },
  creditLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  creditAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  creditActions: {
    flexDirection: 'row',
  },
  chargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chargeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.background,
    marginLeft: 4,
  },
  statsCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: 24,
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default MyPageScreen; 