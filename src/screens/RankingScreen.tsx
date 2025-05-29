import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface RankingPlayer {
  rank: number;
  puuid: string;
  summonerName: string;
  tier: string;
  division: string;
  lp: number;
  winRate: number;
  totalGames: number;
  recentForm: boolean[];
  avatar?: string;
  points: number;
  change: number; // 순위 변동
}

const RankingScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'season'>('monthly');
  const [selectedCategory, setSelectedCategory] = useState<'overall' | 'winrate' | 'games'>('overall');

  const mockRankings: RankingPlayer[] = [
    {
      rank: 1,
      puuid: 'user1',
      summonerName: '프로용병123',
      tier: 'Master',
      division: '',
      lp: 234,
      winRate: 78.5,
      totalGames: 127,
      recentForm: [true, true, true, false, true, true, true, true, false, true],
      points: 2847,
      change: 2,
    },
    {
      rank: 2,
      puuid: 'user2',
      summonerName: '정글러왕',
      tier: 'Diamond',
      division: 'I',
      lp: 1923,
      winRate: 72.3,
      totalGames: 89,
      recentForm: [true, false, true, true, true, false, true, true, true, true],
      points: 2634,
      change: -1,
    },
    {
      rank: 3,
      puuid: 'user3',
      summonerName: '미드갓',
      tier: 'Diamond',
      division: 'II',
      lp: 1756,
      winRate: 69.8,
      totalGames: 156,
      recentForm: [true, true, false, true, false, true, true, true, false, true],
      points: 2456,
      change: 1,
    },
    {
      rank: 4,
      puuid: 'user4',
      summonerName: '서폿신',
      tier: 'Diamond',
      division: 'III',
      lp: 1534,
      winRate: 74.2,
      totalGames: 203,
      recentForm: [false, true, true, true, true, true, false, true, true, true],
      points: 2298,
      change: 0,
    },
    {
      rank: 5,
      puuid: 'user5',
      summonerName: '탑라이너',
      tier: 'Platinum',
      division: 'I',
      lp: 2156,
      winRate: 66.4,
      totalGames: 178,
      recentForm: [true, false, false, true, true, true, true, false, true, true],
      points: 2134,
      change: 3,
    },
  ];

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
    return colors[tier.toUpperCase() as keyof typeof colors] || Colors.textMuted;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank.toString();
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return 'trending-up';
    if (change < 0) return 'trending-down';
    return 'remove';
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return Colors.success;
    if (change < 0) return Colors.error;
    return Colors.textMuted;
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {[
        { key: 'weekly', label: '주간' },
        { key: 'monthly', label: '월간' },
        { key: 'season', label: '시즌' },
      ].map(period => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.periodButton,
            selectedPeriod === period.key && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod(period.key as any)}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period.key && styles.periodButtonTextActive,
            ]}
          >
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCategorySelector = () => (
    <View style={styles.categorySelector}>
      {[
        { key: 'overall', label: '종합', icon: 'trophy' },
        { key: 'winrate', label: '승률', icon: 'trending-up' },
        { key: 'games', label: '게임수', icon: 'game-controller' },
      ].map(category => (
        <TouchableOpacity
          key={category.key}
          style={[
            styles.categoryButton,
            selectedCategory === category.key && styles.categoryButtonActive,
          ]}
          onPress={() => setSelectedCategory(category.key as any)}
        >
          <Ionicons
            name={category.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={selectedCategory === category.key ? Colors.textLight : Colors.primary}
          />
          <Text
            style={[
              styles.categoryButtonText,
              selectedCategory === category.key && styles.categoryButtonTextActive,
            ]}
          >
            {category.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRecentForm = (form: boolean[]) => (
    <View style={styles.recentForm}>
      {form.slice(0, 5).map((win, index) => (
        <View
          key={index}
          style={[
            styles.formDot,
            { backgroundColor: win ? Colors.success : Colors.error },
          ]}
        />
      ))}
    </View>
  );

  const renderRankingItem = (player: RankingPlayer, index: number) => (
    <View key={player.puuid} style={styles.rankingItem}>
      <View style={styles.rankSection}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{getRankIcon(player.rank)}</Text>
        </View>
        <View style={styles.changeIndicator}>
          <Ionicons
            name={getChangeIcon(player.change)}
            size={12}
            color={getChangeColor(player.change)}
          />
          {player.change !== 0 && (
            <Text style={[styles.changeText, { color: getChangeColor(player.change) }]}>
              {Math.abs(player.change)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.playerInfo}>
        <View style={styles.playerHeader}>
          <Text style={styles.summonerName}>{player.summonerName}</Text>
          <View style={styles.tierInfo}>
            <Text style={[styles.tierText, { color: getTierColor(player.tier) }]}>
              {player.tier} {player.division}
            </Text>
            <Text style={styles.lpText}>{player.lp} LP</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>승률</Text>
            <Text style={[styles.statValue, { color: Colors.success }]}>
              {player.winRate.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>게임</Text>
            <Text style={styles.statValue}>{player.totalGames}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>포인트</Text>
            <Text style={[styles.statValue, { color: Colors.primary }]}>
              {player.points.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formLabel}>최근 전적</Text>
          {renderRecentForm(player.recentForm)}
        </View>
      </View>
    </View>
  );

  const renderTopThree = () => (
    <View style={styles.topThreeContainer}>
      <View style={styles.podium}>
        {/* 2등 */}
        <View style={[styles.podiumItem, styles.secondPlace]}>
          <View style={styles.podiumRank}>
            <Text style={styles.podiumRankText}>🥈</Text>
          </View>
          <Text style={styles.podiumName}>{mockRankings[1]?.summonerName}</Text>
          <Text style={[styles.podiumTier, { color: getTierColor(mockRankings[1]?.tier) }]}>
            {mockRankings[1]?.tier}
          </Text>
          <Text style={styles.podiumPoints}>{mockRankings[1]?.points.toLocaleString()}P</Text>
        </View>

        {/* 1등 */}
        <View style={[styles.podiumItem, styles.firstPlace]}>
          <View style={styles.crownContainer}>
            <Text style={styles.crown}>👑</Text>
          </View>
          <View style={styles.podiumRank}>
            <Text style={styles.podiumRankText}>🥇</Text>
          </View>
          <Text style={styles.podiumName}>{mockRankings[0]?.summonerName}</Text>
          <Text style={[styles.podiumTier, { color: getTierColor(mockRankings[0]?.tier) }]}>
            {mockRankings[0]?.tier}
          </Text>
          <Text style={styles.podiumPoints}>{mockRankings[0]?.points.toLocaleString()}P</Text>
        </View>

        {/* 3등 */}
        <View style={[styles.podiumItem, styles.thirdPlace]}>
          <View style={styles.podiumRank}>
            <Text style={styles.podiumRankText}>🥉</Text>
          </View>
          <Text style={styles.podiumName}>{mockRankings[2]?.summonerName}</Text>
          <Text style={[styles.podiumTier, { color: getTierColor(mockRankings[2]?.tier) }]}>
            {mockRankings[2]?.tier}
          </Text>
          <Text style={styles.podiumPoints}>{mockRankings[2]?.points.toLocaleString()}P</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>랭킹</Text>
        <Text style={styles.subtitle}>최고의 플레이어들을 확인해보세요</Text>
      </View>

      {renderPeriodSelector()}
      {renderCategorySelector()}
      {renderTopThree()}

      <View style={styles.rankingList}>
        <Text style={styles.sectionTitle}>전체 랭킹</Text>
        {mockRankings.map(renderRankingItem)}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          랭킹은 매일 자정에 업데이트됩니다
        </Text>
        <Text style={styles.footerSubtext}>
          포인트는 승률, 게임 수, 최근 성과를 종합하여 계산됩니다
        </Text>
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
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  periodButtonTextActive: {
    color: Colors.textLight,
  },
  categorySelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  categoryButtonTextActive: {
    color: Colors.textLight,
  },
  topThreeContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 200,
  },
  podiumItem: {
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  firstPlace: {
    height: 160,
    width: (width - 56) / 3,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  secondPlace: {
    height: 140,
    width: (width - 56) / 3,
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  thirdPlace: {
    height: 120,
    width: (width - 56) / 3,
    borderWidth: 2,
    borderColor: '#CD7F32',
  },
  crownContainer: {
    position: 'absolute',
    top: -15,
  },
  crown: {
    fontSize: 24,
  },
  podiumRank: {
    marginBottom: 8,
  },
  podiumRankText: {
    fontSize: 24,
  },
  podiumName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  podiumTier: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  podiumPoints: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  rankingList: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  rankingItem: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankSection: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 50,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  playerInfo: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summonerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  tierInfo: {
    alignItems: 'flex-end',
  },
  tierText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lpText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  formSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  recentForm: {
    flexDirection: 'row',
    gap: 4,
  },
  formDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

export default RankingScreen; 