import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface GameParticipant {
  puuid: string;
  summonerName: string;
  championName: string;
  position: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  damage: number;
  gold: number;
  items: string[];
  win: boolean;
}

export interface GameResult {
  id: string;
  matchId: string;
  tournamentId?: string;
  gameMode: 'CLASSIC' | 'ARAM' | 'CUSTOM';
  gameDuration: number;
  gameCreation: number;
  participants: GameParticipant[];
  blueTeam: GameParticipant[];
  redTeam: GameParticipant[];
  winner: 'blue' | 'red';
  isVerified: boolean;
  verifiedAt?: string;
  reportedBy?: string;
  createdAt: string;
}

export interface PlayerStats {
  puuid: string;
  summonerName: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  averageKDA: {
    kills: number;
    deaths: number;
    assists: number;
    ratio: number;
  };
  averageCS: number;
  averageDamage: number;
  favoriteChampions: {
    name: string;
    games: number;
    winRate: number;
  }[];
  recentForm: boolean[]; // 최근 10게임 승부 기록
  lastUpdated: string;
}

export interface TournamentStats {
  tournamentId: string;
  participants: string[]; // puuid 배열
  games: GameResult[];
  standings: {
    puuid: string;
    summonerName: string;
    wins: number;
    losses: number;
    points: number;
    rank: number;
  }[];
  isCompleted: boolean;
  completedAt?: string;
}

interface GameResultState {
  gameResults: GameResult[];
  playerStats: { [puuid: string]: PlayerStats };
  tournamentStats: { [tournamentId: string]: TournamentStats };
  pendingVerification: GameResult[];
  loading: boolean;
  error: string | null;
  syncStatus: {
    lastSync: string | null;
    isAutoSyncEnabled: boolean;
    syncInterval: number; // minutes
  };
}

const initialState: GameResultState = {
  gameResults: [
    {
      id: 'game1',
      matchId: 'KR_6234567890',
      tournamentId: 'tournament1',
      gameMode: 'CLASSIC',
      gameDuration: 1847, // 30분 47초
      gameCreation: Date.now() - 3600000,
      participants: [],
      blueTeam: [
        {
          puuid: 'user1-puuid',
          summonerName: '프로용병123',
          championName: '진',
          position: 'ADC',
          kills: 8,
          deaths: 2,
          assists: 12,
          cs: 187,
          damage: 24567,
          gold: 14230,
          items: ['무한의 대검', '고속 연사포', '도미닉 경의 인사', '수호 천사', '피바라기', '광전사의 군화'],
          win: true,
        },
        {
          puuid: 'user2-puuid',
          summonerName: '정글러왕',
          championName: '그레이브즈',
          position: 'JUNGLE',
          kills: 6,
          deaths: 3,
          assists: 9,
          cs: 156,
          damage: 18234,
          gold: 12890,
          items: ['이클립스', '요우무의 유령검', '세릴다의 원한', '수호 천사', '맬모셔스의 아귀', '광전사의 군화'],
          win: true,
        },
        {
          puuid: 'user3-puuid',
          summonerName: '미드갓',
          championName: '아지르',
          position: 'MID',
          kills: 4,
          deaths: 1,
          assists: 11,
          cs: 203,
          damage: 21456,
          gold: 13567,
          items: ['루덴의 폭풍', '라바돈의 죽음모자', '존야의 모래시계', '공허의 지팡이', '모렐로노미콘', '마법사의 신발'],
          win: true,
        },
        {
          puuid: 'user4-puuid',
          summonerName: '탑라이너',
          championName: '가렌',
          position: 'TOP',
          kills: 3,
          deaths: 4,
          assists: 8,
          cs: 145,
          damage: 15678,
          gold: 11234,
          items: ['스트라이드브레이커', '스테락의 도전', '데드맨의 갑옷', '정령의 형상', '가시 갑옷', '판금 장화'],
          win: true,
        },
        {
          puuid: 'user5-puuid',
          summonerName: '서폿신',
          championName: '쓰레쉬',
          position: 'SUPPORT',
          kills: 1,
          deaths: 2,
          assists: 18,
          cs: 34,
          damage: 8901,
          gold: 8456,
          items: ['강철의 솔라리 펜던트', '기사의 맹세', '구원', '워모그의 갑옷', '지크의 융합', '기동력의 장화'],
          win: true,
        },
      ],
      redTeam: [
        {
          puuid: 'enemy1-puuid',
          summonerName: '상대팀1',
          championName: '다리우스',
          position: 'TOP',
          kills: 2,
          deaths: 5,
          assists: 4,
          cs: 132,
          damage: 12345,
          gold: 9876,
          items: ['삼위일체', '스테락의 도전', '데드맨의 갑옷', '정령의 형상', '가시 갑옷', '판금 장화'],
          win: false,
        },
        {
          puuid: 'enemy2-puuid',
          summonerName: '상대팀2',
          championName: '리 신',
          position: 'JUNGLE',
          kills: 4,
          deaths: 4,
          assists: 6,
          cs: 98,
          damage: 14567,
          gold: 10234,
          items: ['월식', '칠흑의 양날 도끼', '스테락의 도전', '수호 천사', '가고일 돌갑옷', '광전사의 군화'],
          win: false,
        },
        {
          puuid: 'enemy3-puuid',
          summonerName: '상대팀3',
          championName: '야스오',
          position: 'MID',
          kills: 5,
          deaths: 3,
          assists: 3,
          cs: 178,
          damage: 19876,
          gold: 11567,
          items: ['크라켄 학살자', '무한의 대검', '몰락한 왕의 검', '수호 천사', '광전사의 군화', '피바라기'],
          win: false,
        },
        {
          puuid: 'enemy4-puuid',
          summonerName: '상대팀4',
          championName: '바루스',
          position: 'ADC',
          kills: 3,
          deaths: 6,
          assists: 5,
          cs: 156,
          damage: 16789,
          gold: 10890,
          items: ['구인수의 격노검', '루난의 허리케인', '몰락한 왕의 검', '수호 천사', '광전사의 군화', '도미닉 경의 인사'],
          win: false,
        },
        {
          puuid: 'enemy5-puuid',
          summonerName: '상대팀5',
          championName: '레오나',
          position: 'SUPPORT',
          kills: 0,
          deaths: 4,
          assists: 8,
          cs: 28,
          damage: 6543,
          gold: 7234,
          items: ['강철의 솔라리 펜던트', '기사의 맹세', '가시 갑옷', '정령의 형상', '워모그의 갑옷', '기동력의 장화'],
          win: false,
        },
      ],
      winner: 'blue',
      isVerified: true,
      verifiedAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  playerStats: {
    'user1-puuid': {
      puuid: 'user1-puuid',
      summonerName: '프로용병123',
      totalGames: 47,
      wins: 32,
      losses: 15,
      winRate: 68.1,
      averageKDA: {
        kills: 7.2,
        deaths: 2.8,
        assists: 9.4,
        ratio: 5.9,
      },
      averageCS: 172.3,
      averageDamage: 22456,
      favoriteChampions: [
        { name: '진', games: 12, winRate: 75.0 },
        { name: '카이사', games: 8, winRate: 62.5 },
        { name: '이즈리얼', games: 7, winRate: 71.4 },
      ],
      recentForm: [true, true, false, true, true, true, false, true, true, true],
      lastUpdated: new Date().toISOString(),
    },
  },
  tournamentStats: {
    'tournament1': {
      tournamentId: 'tournament1',
      participants: ['user1-puuid', 'user2-puuid', 'user3-puuid', 'user4-puuid', 'user5-puuid'],
      games: [],
      standings: [
        {
          puuid: 'user1-puuid',
          summonerName: '프로용병123',
          wins: 3,
          losses: 1,
          points: 9,
          rank: 1,
        },
        {
          puuid: 'user2-puuid',
          summonerName: '정글러왕',
          wins: 3,
          losses: 1,
          points: 9,
          rank: 2,
        },
        {
          puuid: 'user3-puuid',
          summonerName: '미드갓',
          wins: 2,
          losses: 2,
          points: 6,
          rank: 3,
        },
      ],
      isCompleted: false,
    },
  },
  pendingVerification: [],
  loading: false,
  error: null,
  syncStatus: {
    lastSync: new Date().toISOString(),
    isAutoSyncEnabled: true,
    syncInterval: 30, // 30분마다
  },
};

const gameResultSlice = createSlice({
  name: 'gameResult',
  initialState,
  reducers: {
    addGameResult: (state, action: PayloadAction<GameResult>) => {
      state.gameResults.unshift(action.payload);
      
      // Update player stats
      action.payload.participants.forEach(participant => {
        if (!state.playerStats[participant.puuid]) {
          state.playerStats[participant.puuid] = {
            puuid: participant.puuid,
            summonerName: participant.summonerName,
            totalGames: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            averageKDA: { kills: 0, deaths: 0, assists: 0, ratio: 0 },
            averageCS: 0,
            averageDamage: 0,
            favoriteChampions: [],
            recentForm: [],
            lastUpdated: new Date().toISOString(),
          };
        }
        
        const stats = state.playerStats[participant.puuid];
        stats.totalGames += 1;
        if (participant.win) {
          stats.wins += 1;
        } else {
          stats.losses += 1;
        }
        stats.winRate = (stats.wins / stats.totalGames) * 100;
        stats.recentForm.unshift(participant.win);
        if (stats.recentForm.length > 10) {
          stats.recentForm.pop();
        }
        stats.lastUpdated = new Date().toISOString();
      });
    },
    
    verifyGameResult: (state, action: PayloadAction<{ gameId: string; verifiedBy: string }>) => {
      const game = state.gameResults.find(g => g.id === action.payload.gameId);
      if (game) {
        game.isVerified = true;
        game.verifiedAt = new Date().toISOString();
      }
      
      // Remove from pending verification
      state.pendingVerification = state.pendingVerification.filter(
        g => g.id !== action.payload.gameId
      );
    },
    
    addToPendingVerification: (state, action: PayloadAction<GameResult>) => {
      state.pendingVerification.push(action.payload);
    },
    
    updatePlayerStats: (state, action: PayloadAction<{ puuid: string; stats: Partial<PlayerStats> }>) => {
      const { puuid, stats } = action.payload;
      if (state.playerStats[puuid]) {
        state.playerStats[puuid] = { ...state.playerStats[puuid], ...stats };
      }
    },
    
    updateTournamentStats: (state, action: PayloadAction<{ tournamentId: string; stats: Partial<TournamentStats> }>) => {
      const { tournamentId, stats } = action.payload;
      if (state.tournamentStats[tournamentId]) {
        state.tournamentStats[tournamentId] = { ...state.tournamentStats[tournamentId], ...stats };
      } else {
        state.tournamentStats[tournamentId] = {
          tournamentId,
          participants: [],
          games: [],
          standings: [],
          isCompleted: false,
          ...stats,
        } as TournamentStats;
      }
    },
    
    syncWithRiotAPI: (state) => {
      state.loading = true;
      state.syncStatus.lastSync = new Date().toISOString();
    },
    
    setSyncStatus: (state, action: PayloadAction<Partial<typeof initialState.syncStatus>>) => {
      state.syncStatus = { ...state.syncStatus, ...action.payload };
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addGameResult,
  verifyGameResult,
  addToPendingVerification,
  updatePlayerStats,
  updateTournamentStats,
  syncWithRiotAPI,
  setSyncStatus,
  setLoading,
  setError,
} = gameResultSlice.actions;

export default gameResultSlice.reducer; 