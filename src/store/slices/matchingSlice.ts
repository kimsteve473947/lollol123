import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Position = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
export type Tier = 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER';

export interface MatchingUser {
  id: string;
  username: string;
  tier: Tier;
  rank: number;
  lp: number;
  preferredPositions: Position[];
  isOnline: boolean;
  waitingTime: number;
  avatar?: string;
}

export interface MatchingRoom {
  id: string;
  name: string;
  tierRange: {
    min: Tier;
    max: Tier;
  };
  positions: {
    [key in Position]: MatchingUser | null;
  };
  waitingUsers: MatchingUser[];
  isReady: boolean;
  createdAt: string;
  estimatedStartTime?: string;
}

interface MatchingState {
  currentUser: MatchingUser | null;
  isMatching: boolean;
  matchingQueue: MatchingUser[];
  activeRooms: MatchingRoom[];
  currentRoom: MatchingRoom | null;
  matchingPreferences: {
    preferredPositions: Position[];
    tierRange: {
      min: Tier;
      max: Tier;
    };
    autoAccept: boolean;
  };
  loading: boolean;
  error: string | null;
}

const initialState: MatchingState = {
  currentUser: null,
  isMatching: false,
  matchingQueue: [],
  activeRooms: [
    {
      id: 'room1',
      name: '골드 이상 내전',
      tierRange: { min: 'GOLD', max: 'DIAMOND' },
      positions: {
        TOP: null,
        JUNGLE: {
          id: 'user1',
          username: '정글러왕',
          tier: 'GOLD',
          rank: 2,
          lp: 1450,
          preferredPositions: ['JUNGLE'],
          isOnline: true,
          waitingTime: 120,
        },
        MID: null,
        ADC: {
          id: 'user2',
          username: '원딜마스터',
          tier: 'PLATINUM',
          rank: 4,
          lp: 1820,
          preferredPositions: ['ADC'],
          isOnline: true,
          waitingTime: 300,
        },
        SUPPORT: null,
      },
      waitingUsers: [
        {
          id: 'user3',
          username: '서폿장인',
          tier: 'GOLD',
          rank: 1,
          lp: 1680,
          preferredPositions: ['SUPPORT', 'MID'],
          isOnline: true,
          waitingTime: 60,
        },
      ],
      isReady: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'room2',
      name: '실버 친선전',
      tierRange: { min: 'BRONZE', max: 'GOLD' },
      positions: {
        TOP: {
          id: 'user4',
          username: '탑라이너',
          tier: 'SILVER',
          rank: 3,
          lp: 1250,
          preferredPositions: ['TOP'],
          isOnline: true,
          waitingTime: 180,
        },
        JUNGLE: null,
        MID: {
          id: 'user5',
          username: '미드갓',
          tier: 'SILVER',
          rank: 1,
          lp: 1420,
          preferredPositions: ['MID'],
          isOnline: true,
          waitingTime: 240,
        },
        ADC: null,
        SUPPORT: {
          id: 'user6',
          username: '서폿신',
          tier: 'BRONZE',
          rank: 1,
          lp: 980,
          preferredPositions: ['SUPPORT'],
          isOnline: true,
          waitingTime: 90,
        },
      },
      waitingUsers: [],
      isReady: false,
      createdAt: new Date(Date.now() - 600000).toISOString(),
    },
  ],
  currentRoom: null,
  matchingPreferences: {
    preferredPositions: ['MID'],
    tierRange: { min: 'BRONZE', max: 'CHALLENGER' },
    autoAccept: false,
  },
  loading: false,
  error: null,
};

const matchingSlice = createSlice({
  name: 'matching',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<MatchingUser>) => {
      state.currentUser = action.payload;
    },
    startMatching: (state) => {
      state.isMatching = true;
      state.error = null;
      if (state.currentUser) {
        state.matchingQueue.push(state.currentUser);
      }
    },
    stopMatching: (state) => {
      state.isMatching = false;
      if (state.currentUser) {
        state.matchingQueue = state.matchingQueue.filter(
          user => user.id !== state.currentUser!.id
        );
      }
    },
    joinRoom: (state, action: PayloadAction<{ roomId: string; position: Position }>) => {
      const { roomId, position } = action.payload;
      const room = state.activeRooms.find(r => r.id === roomId);
      
      if (room && state.currentUser && !room.positions[position]) {
        room.positions[position] = state.currentUser;
        room.waitingUsers = room.waitingUsers.filter(
          user => user.id !== state.currentUser!.id
        );
        state.currentRoom = room;
        state.isMatching = false;
        
        // Check if room is ready (all positions filled)
        const filledPositions = Object.values(room.positions).filter(Boolean).length;
        room.isReady = filledPositions === 5;
        
        if (room.isReady) {
          room.estimatedStartTime = new Date(Date.now() + 300000).toISOString(); // 5분 후
        }
      }
    },
    leaveRoom: (state) => {
      if (state.currentRoom && state.currentUser) {
        const room = state.currentRoom;
        
        // Remove user from position
        Object.keys(room.positions).forEach(pos => {
          const position = pos as Position;
          if (room.positions[position]?.id === state.currentUser!.id) {
            room.positions[position] = null;
          }
        });
        
        // Remove from waiting users
        room.waitingUsers = room.waitingUsers.filter(
          user => user.id !== state.currentUser!.id
        );
        
        room.isReady = false;
        room.estimatedStartTime = undefined;
        state.currentRoom = null;
      }
    },
    addToWaitingList: (state, action: PayloadAction<string>) => {
      const roomId = action.payload;
      const room = state.activeRooms.find(r => r.id === roomId);
      
      if (room && state.currentUser) {
        const isAlreadyWaiting = room.waitingUsers.some(
          user => user.id === state.currentUser!.id
        );
        
        if (!isAlreadyWaiting) {
          room.waitingUsers.push(state.currentUser);
        }
      }
    },
    updateMatchingPreferences: (state, action: PayloadAction<Partial<MatchingState['matchingPreferences']>>) => {
      state.matchingPreferences = { ...state.matchingPreferences, ...action.payload };
    },
    createRoom: (state, action: PayloadAction<Omit<MatchingRoom, 'id' | 'positions' | 'waitingUsers' | 'isReady' | 'createdAt'>>) => {
      const newRoom: MatchingRoom = {
        ...action.payload,
        id: `room_${Date.now()}`,
        positions: {
          TOP: null,
          JUNGLE: null,
          MID: null,
          ADC: null,
          SUPPORT: null,
        },
        waitingUsers: [],
        isReady: false,
        createdAt: new Date().toISOString(),
      };
      state.activeRooms.push(newRoom);
    },
    updateWaitingTime: (state) => {
      state.matchingQueue.forEach(user => {
        user.waitingTime += 1;
      });
      
      state.activeRooms.forEach(room => {
        Object.values(room.positions).forEach(user => {
          if (user) {
            user.waitingTime += 1;
          }
        });
        room.waitingUsers.forEach(user => {
          user.waitingTime += 1;
        });
      });
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
  setCurrentUser,
  startMatching,
  stopMatching,
  joinRoom,
  leaveRoom,
  addToWaitingList,
  updateMatchingPreferences,
  createRoom,
  updateWaitingTime,
  setLoading,
  setError,
} = matchingSlice.actions;

export default matchingSlice.reducer; 