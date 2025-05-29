import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 사용자 상태 타입
interface User {
  id: string;
  email: string;
  username: string;
  realName: string;
  tier: string;
  rank: string;
  mainPosition: string;
  subPosition: string;
  profileIcon: string;
  isVerified: boolean;
  credits: number;
}

// 앱 상태 타입
interface AppState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  notifications: Notification[];
  settings: {
    theme: 'light' | 'dark';
    language: 'ko' | 'en';
    pushNotifications: boolean;
    chatNotifications: boolean;
  };
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// 초기 상태
const initialState: AppState = {
  user: null,
  isLoggedIn: false,
  isLoading: false,
  error: null,
  notifications: [],
  settings: {
    theme: 'light',
    language: 'ko',
    pushNotifications: true,
    chatNotifications: true,
  },
};

// 앱 슬라이스
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isLoggedIn = true;
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      state.user = null;
      state.isLoggedIn = false;
      state.error = null;
      state.notifications = [];
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date(),
        read: false,
      };
      state.notifications.unshift(notification);
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    updateSettings: (state, action: PayloadAction<Partial<AppState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
});

// 채팅 상태 타입
interface ChatState {
  rooms: ChatRoom[];
  messages: { [roomId: string]: ChatMessage[] };
  activeRoom: string | null;
  isConnected: boolean;
  typingUsers: { [roomId: string]: string[] };
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'tier' | 'tournament' | 'private';
  requiredTier?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  roomId: string;
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

const initialChatState: ChatState = {
  rooms: [],
  messages: {},
  activeRoom: null,
  isConnected: false,
  typingUsers: {},
};

// 채팅 슬라이스
const chatSlice = createSlice({
  name: 'chat',
  initialState: initialChatState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setRooms: (state, action: PayloadAction<ChatRoom[]>) => {
      state.rooms = action.payload;
    },
    setActiveRoom: (state, action: PayloadAction<string | null>) => {
      state.activeRoom = action.payload;
      if (action.payload) {
        const room = state.rooms.find(r => r.id === action.payload);
        if (room) {
          room.unreadCount = 0;
        }
      }
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      const { roomId } = action.payload;
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      state.messages[roomId].push(action.payload);
      
      // 읽지 않은 메시지 수 증가
      if (state.activeRoom !== roomId) {
        const room = state.rooms.find(r => r.id === roomId);
        if (room) {
          room.unreadCount++;
          room.lastMessage = action.payload;
        }
      }
    },
    setMessages: (state, action: PayloadAction<{ roomId: string; messages: ChatMessage[] }>) => {
      const { roomId, messages } = action.payload;
      state.messages[roomId] = messages;
    },
    updateTypingUsers: (state, action: PayloadAction<{ roomId: string; users: string[] }>) => {
      const { roomId, users } = action.payload;
      state.typingUsers[roomId] = users;
    },
    clearChat: (state) => {
      state.rooms = [];
      state.messages = {};
      state.activeRoom = null;
      state.typingUsers = {};
    },
  },
});

// 대회 상태 타입
interface TournamentState {
  tournaments: Tournament[];
  myTournaments: Tournament[];
  selectedTournament: Tournament | null;
  isLoading: boolean;
  filters: {
    type: 'all' | 'free' | 'paid';
    status: 'all' | 'open' | 'ongoing' | 'completed';
    date: string | null;
  };
}

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
}

interface TournamentParticipant {
  userId: string;
  username: string;
  tier: string;
  rank: string;
  position: string;
  registeredAt: Date;
}

const initialTournamentState: TournamentState = {
  tournaments: [],
  myTournaments: [],
  selectedTournament: null,
  isLoading: false,
  filters: {
    type: 'all',
    status: 'all',
    date: null,
  },
};

// 대회 슬라이스
const tournamentSlice = createSlice({
  name: 'tournament',
  initialState: initialTournamentState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setTournaments: (state, action: PayloadAction<Tournament[]>) => {
      state.tournaments = action.payload;
    },
    setMyTournaments: (state, action: PayloadAction<Tournament[]>) => {
      state.myTournaments = action.payload;
    },
    setSelectedTournament: (state, action: PayloadAction<Tournament | null>) => {
      state.selectedTournament = action.payload;
    },
    updateTournament: (state, action: PayloadAction<Tournament>) => {
      const index = state.tournaments.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tournaments[index] = action.payload;
      }
      if (state.selectedTournament?.id === action.payload.id) {
        state.selectedTournament = action.payload;
      }
    },
    setFilters: (state, action: PayloadAction<Partial<TournamentState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearTournaments: (state) => {
      state.tournaments = [];
      state.myTournaments = [];
      state.selectedTournament = null;
    },
  },
});

// 용병 상태 타입
interface MercenaryState {
  profiles: MercenaryProfile[];
  myProfile: MercenaryProfile | null;
  isLoading: boolean;
  filters: {
    position: string;
    tier: string;
    minRating: number;
    maxRate: number;
  };
  sortBy: 'rating' | 'rate' | 'winRate';
}

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

const initialMercenaryState: MercenaryState = {
  profiles: [],
  myProfile: null,
  isLoading: false,
  filters: {
    position: 'ALL',
    tier: 'ALL',
    minRating: 0,
    maxRate: 100000,
  },
  sortBy: 'rating',
};

// 용병 슬라이스
const mercenarySlice = createSlice({
  name: 'mercenary',
  initialState: initialMercenaryState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setProfiles: (state, action: PayloadAction<MercenaryProfile[]>) => {
      state.profiles = action.payload;
    },
    setMyProfile: (state, action: PayloadAction<MercenaryProfile | null>) => {
      state.myProfile = action.payload;
    },
    updateProfile: (state, action: PayloadAction<MercenaryProfile>) => {
      const index = state.profiles.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.profiles[index] = action.payload;
      }
      if (state.myProfile?.id === action.payload.id) {
        state.myProfile = action.payload;
      }
    },
    setFilters: (state, action: PayloadAction<Partial<MercenaryState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSortBy: (state, action: PayloadAction<MercenaryState['sortBy']>) => {
      state.sortBy = action.payload;
    },
    clearMercenaries: (state) => {
      state.profiles = [];
      state.myProfile = null;
    },
  },
});

// Persist 설정
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['app'], // app 상태만 persist
};

const persistedReducer = persistReducer(persistConfig, appSlice.reducer);

// 스토어 생성
export const store = configureStore({
  reducer: {
    app: persistedReducer,
    chat: chatSlice.reducer,
    tournament: tournamentSlice.reducer,
    mercenary: mercenarySlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

// 타입 정의
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 액션 익스포트
export const {
  setLoading,
  setError,
  setUser,
  updateUser,
  logout,
  addNotification,
  markNotificationAsRead,
  clearNotifications,
  updateSettings,
} = appSlice.actions;

export const {
  setConnected,
  setRooms,
  setActiveRoom,
  addMessage,
  setMessages,
  updateTypingUsers,
  clearChat,
} = chatSlice.actions;

export const {
  setLoading: setTournamentLoading,
  setTournaments,
  setMyTournaments,
  setSelectedTournament,
  updateTournament,
  setFilters: setTournamentFilters,
  clearTournaments,
} = tournamentSlice.actions;

export const {
  setLoading: setMercenaryLoading,
  setProfiles,
  setMyProfile,
  updateProfile,
  setFilters: setMercenaryFilters,
  setSortBy,
  clearMercenaries,
} = mercenarySlice.actions;

export default store; 