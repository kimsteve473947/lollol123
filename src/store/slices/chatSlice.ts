import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  type: 'text' | 'image' | 'system';
  roomId: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'tournament' | 'mercenary' | 'general';
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isActive: boolean;
}

interface ChatState {
  rooms: ChatRoom[];
  messages: { [roomId: string]: ChatMessage[] };
  activeRoom: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  rooms: [
    {
      id: 'general',
      name: '전체 채팅',
      type: 'general',
      participants: ['user1', 'user2', 'user3'],
      unreadCount: 3,
      isActive: true,
      lastMessage: {
        id: '1',
        senderId: 'user2',
        senderName: '프로용병123',
        message: '오늘 내전 참가하실 분 계신가요?',
        timestamp: new Date().toISOString(),
        type: 'text',
        roomId: 'general',
      },
    },
    {
      id: 'tournament_1',
      name: '롤 내전 챔피언십 2024',
      type: 'tournament',
      participants: ['user1', 'organizer1'],
      unreadCount: 0,
      isActive: true,
      lastMessage: {
        id: '2',
        senderId: 'organizer1',
        senderName: '내전매니저',
        message: '토너먼트 일정이 확정되었습니다!',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'text',
        roomId: 'tournament_1',
      },
    },
    {
      id: 'mercenary_1',
      name: '용병 문의 - 프로용병123',
      type: 'mercenary',
      participants: ['user1', 'mercenary1'],
      unreadCount: 1,
      isActive: true,
      lastMessage: {
        id: '3',
        senderId: 'mercenary1',
        senderName: '프로용병123',
        message: '언제 게임 가능하신지 알려주세요!',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: 'text',
        roomId: 'mercenary_1',
      },
    },
  ],
  messages: {
    general: [
      {
        id: '1',
        senderId: 'user2',
        senderName: '프로용병123',
        message: '오늘 내전 참가하실 분 계신가요?',
        timestamp: new Date().toISOString(),
        type: 'text',
        roomId: 'general',
      },
      {
        id: '4',
        senderId: 'user3',
        senderName: '정글러왕',
        message: '저 참가하고 싶어요!',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        type: 'text',
        roomId: 'general',
      },
    ],
    tournament_1: [
      {
        id: '2',
        senderId: 'organizer1',
        senderName: '내전매니저',
        message: '토너먼트 일정이 확정되었습니다!',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'text',
        roomId: 'tournament_1',
      },
    ],
    mercenary_1: [
      {
        id: '3',
        senderId: 'mercenary1',
        senderName: '프로용병123',
        message: '언제 게임 가능하신지 알려주세요!',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: 'text',
        roomId: 'mercenary_1',
      },
    ],
  },
  activeRoom: null,
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setRooms: (state, action: PayloadAction<ChatRoom[]>) => {
      state.rooms = action.payload;
    },
    addRoom: (state, action: PayloadAction<ChatRoom>) => {
      state.rooms.push(action.payload);
    },
    updateRoom: (state, action: PayloadAction<ChatRoom>) => {
      const index = state.rooms.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.rooms[index] = action.payload;
      }
    },
    setActiveRoom: (state, action: PayloadAction<string | null>) => {
      state.activeRoom = action.payload;
      // Mark room as read when activated
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
      
      // Update room's last message and unread count
      const room = state.rooms.find(r => r.id === roomId);
      if (room) {
        room.lastMessage = action.payload;
        if (state.activeRoom !== roomId) {
          room.unreadCount += 1;
        }
      }
    },
    setMessages: (state, action: PayloadAction<{ roomId: string; messages: ChatMessage[] }>) => {
      state.messages[action.payload.roomId] = action.payload.messages;
    },
    clearUnreadCount: (state, action: PayloadAction<string>) => {
      const room = state.rooms.find(r => r.id === action.payload);
      if (room) {
        room.unreadCount = 0;
      }
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
  setRooms,
  addRoom,
  updateRoom,
  setActiveRoom,
  addMessage,
  setMessages,
  clearUnreadCount,
  setLoading,
  setError,
} = chatSlice.actions;

export default chatSlice.reducer; 