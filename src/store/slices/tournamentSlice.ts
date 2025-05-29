import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Position = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';

export interface PositionStatus {
  current: number;
  max: number;
}

export interface OrganizerProfile {
  id: string;
  username: string;
  riotId: string;
  profileImage?: string;
  tournamentsHosted: number;
  tournamentsCanceled: number;
  mercenaryParticipated: number;
  mercenaryCanceled: number;
  rating: number;
  reviewCount: number;
}

export interface Tournament {
  id: string;
  title: string;
  description: string;
  maxParticipants: number;
  currentParticipants: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  applicationDeadline: string;
  prizePool: string;
  entryFee: number; // 0이면 무료, 양수면 참가비
  isFree: boolean;
  status: 'recruiting' | 'ongoing' | 'completed';
  organizer: string;
  organizerProfile: OrganizerProfile;
  discordLink?: string;
  requirements: string[];
  gameMode: '5v5' | '3v3' | '1v1';
  positions: Record<Position, PositionStatus>;
  tags: string[];
  location?: string;
  createdAt: string;
}

interface TournamentState {
  tournaments: Tournament[];
  loading: boolean;
  error: string | null;
  selectedTournament: Tournament | null;
  filterType: 'all' | 'free' | 'paid';
}

const sampleOrganizerProfile: OrganizerProfile = {
  id: 'org1',
  username: '내전매니저',
  riotId: 'TournamentHost#KR1',
  profileImage: undefined,
  tournamentsHosted: 15,
  tournamentsCanceled: 1,
  mercenaryParticipated: 8,
  mercenaryCanceled: 0,
  rating: 4.8,
  reviewCount: 23,
};

const sampleOrganizerProfile2: OrganizerProfile = {
  id: 'org2',
  username: '롤동아리',
  riotId: 'ClubLeader#KR1',
  profileImage: undefined,
  tournamentsHosted: 8,
  tournamentsCanceled: 0,
  mercenaryParticipated: 12,
  mercenaryCanceled: 1,
  rating: 4.6,
  reviewCount: 15,
};

const initialState: TournamentState = {
  tournaments: [
    {
      id: '1',
      title: '롤 내전 챔피언십 2024',
      description: '연말 대규모 내전 토너먼트입니다. 우승팀에게는 특별한 상품이 준비되어 있습니다! 실력자들의 치열한 경쟁을 기대해주세요.',
      maxParticipants: 10,
      currentParticipants: 8,
      startDate: '2024-12-15',
      endDate: '2024-12-22',
      startTime: '19:00',
      endTime: '22:00',
      applicationDeadline: '2024-12-14 18:00',
      prizePool: '500,000원',
      entryFee: 10000,
      isFree: false,
      status: 'recruiting',
      organizer: '내전매니저',
      organizerProfile: sampleOrganizerProfile,
      discordLink: 'https://discord.gg/tournament1',
      requirements: ['골드 이상', '독성 플레이어 금지', '시간 준수'],
      gameMode: '5v5',
      positions: {
        TOP: { current: 2, max: 2 },
        JUNGLE: { current: 1, max: 2 },
        MID: { current: 2, max: 2 },
        ADC: { current: 2, max: 2 },
        SUPPORT: { current: 1, max: 2 },
      },
      tags: ['랭크전', '상금', '고수'],
      location: '온라인',
      createdAt: '2024-11-20T10:00:00Z',
    },
    {
      id: '2',
      title: '신입생 환영 내전',
      description: '새로 시작하는 분들을 위한 친선 내전입니다. 부담없이 참여하세요!',
      maxParticipants: 10,
      currentParticipants: 6,
      startDate: '2024-12-01',
      endDate: '2024-12-08',
      startTime: '20:00',
      endTime: '23:00',
      applicationDeadline: '2024-11-30 20:00',
      prizePool: '없음',
      entryFee: 0,
      isFree: true,
      status: 'recruiting',
      organizer: '롤동아리',
      organizerProfile: sampleOrganizerProfile2,
      discordLink: 'https://discord.gg/tournament2',
      requirements: ['브론즈~플래티넘', '친목 우선'],
      gameMode: '5v5',
      positions: {
        TOP: { current: 1, max: 2 },
        JUNGLE: { current: 1, max: 2 },
        MID: { current: 2, max: 2 },
        ADC: { current: 1, max: 2 },
        SUPPORT: { current: 1, max: 2 },
      },
      tags: ['친선전', '무료', '초보환영'],
      location: '온라인',
      createdAt: '2024-11-18T15:30:00Z',
    },
    {
      id: '3',
      title: '주말 랭크 내전',
      description: '주말 저녁 랭크 수준의 내전을 진행합니다.',
      maxParticipants: 10,
      currentParticipants: 4,
      startDate: '2024-12-07',
      endDate: '2024-12-07',
      startTime: '21:00',
      endTime: '24:00',
      applicationDeadline: '2024-12-06 21:00',
      prizePool: '200,000원',
      entryFee: 5000,
      isFree: false,
      status: 'recruiting',
      organizer: '내전매니저',
      organizerProfile: sampleOrganizerProfile,
      discordLink: 'https://discord.gg/tournament3',
      requirements: ['플래티넘 이상', '마이크 필수'],
      gameMode: '5v5',
      positions: {
        TOP: { current: 1, max: 2 },
        JUNGLE: { current: 0, max: 2 },
        MID: { current: 1, max: 2 },
        ADC: { current: 1, max: 2 },
        SUPPORT: { current: 1, max: 2 },
      },
      tags: ['랭크전', '주말', '상금'],
      location: '온라인',
      createdAt: '2024-11-25T09:15:00Z',
    },
  ],
  loading: false,
  error: null,
  selectedTournament: null,
  filterType: 'all',
};

const tournamentSlice = createSlice({
  name: 'tournaments',
  initialState,
  reducers: {
    setTournaments: (state, action: PayloadAction<Tournament[]>) => {
      state.tournaments = action.payload;
    },
    addTournament: (state, action: PayloadAction<Tournament>) => {
      state.tournaments.push(action.payload);
    },
    updateTournament: (state, action: PayloadAction<Tournament>) => {
      const index = state.tournaments.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tournaments[index] = action.payload;
      }
    },
    deleteTournament: (state, action: PayloadAction<string>) => {
      state.tournaments = state.tournaments.filter(t => t.id !== action.payload);
    },
    setSelectedTournament: (state, action: PayloadAction<Tournament | null>) => {
      state.selectedTournament = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFilterType: (state, action: PayloadAction<'all' | 'free' | 'paid'>) => {
      state.filterType = action.payload;
    },
    applyToTournament: (state, action: PayloadAction<{ tournamentId: string; position: Position }>) => {
      const tournament = state.tournaments.find(t => t.id === action.payload.tournamentId);
      if (tournament && tournament.positions[action.payload.position].current < tournament.positions[action.payload.position].max) {
        tournament.positions[action.payload.position].current += 1;
        tournament.currentParticipants += 1;
      }
    },
  },
});

export const {
  setTournaments,
  addTournament,
  updateTournament,
  deleteTournament,
  setSelectedTournament,
  setLoading,
  setError,
  setFilterType,
  applyToTournament,
} = tournamentSlice.actions;

export default tournamentSlice.reducer; 