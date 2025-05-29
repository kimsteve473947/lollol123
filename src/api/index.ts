// 실제 배포용 API 구조
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// API 응답 타입 정의
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    tier: string;
    rank: string;
    profileIcon: string;
    isVerified: boolean;
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// API 기본 설정
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://lol-naejeon-api.vercel.app/api';

// API 클라이언트 생성
class ApiClient {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 요청 인터셉터 - 토큰 자동 추가
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // 요청 로깅 (개발 환경에서만)
        if (__DEV__) {
          console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 응답 인터셉터 - 토큰 갱신 및 에러 처리
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            await this.logout();
            return Promise.reject(refreshError);
          }
        }

        // 에러 로깅
        console.error('API Error:', error.response?.data || error.message);
        
        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        
        return accessToken;
      } finally {
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  private async logout() {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
    // 로그인 화면으로 리다이렉트 로직 추가
  }

  // HTTP 메서드들
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }
}

const apiClient = new ApiClient();

// 인증 API
export const AuthAPI = {
  // 이메일 회원가입
  register: async (userData: {
    email: string;
    password: string;
    realName: string;
    phoneNumber: string;
    birthDate: string;
  }): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post('/auth/register', userData);
  },

  // 로그인
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
    
    // 토큰 저장
    await AsyncStorage.setItem('accessToken', response.data.accessToken);
    await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    
    return response.data;
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
    }
  },

  // 휴대폰 인증 번호 발송
  sendVerificationCode: async (phoneNumber: string): Promise<ApiResponse> => {
    return apiClient.post('/auth/send-verification', { phoneNumber });
  },

  // 휴대폰 인증 번호 확인
  verifyPhone: async (phoneNumber: string, code: string): Promise<ApiResponse> => {
    return apiClient.post('/auth/verify-phone', { phoneNumber, code });
  },

  // 라이엇 계정 연동
  connectRiotAccount: async (riotId: string, tagLine: string): Promise<ApiResponse> => {
    return apiClient.post('/auth/connect-riot', { riotId, tagLine });
  },

  // 소셜 로그인
  socialLogin: async (provider: 'google' | 'kakao' | 'apple', token: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/social-login', { provider, token });
    return response.data;
  },
};

// 사용자 API
export const UserAPI = {
  // 프로필 조회
  getProfile: async (userId?: string) => {
    const url = userId ? `/users/${userId}` : '/users/me';
    return apiClient.get(url);
  },

  // 프로필 업데이트
  updateProfile: async (userData: any) => {
    return apiClient.put('/users/me', userData);
  },

  // 라이엇 정보 동기화
  syncRiotData: async () => {
    return apiClient.post('/users/sync-riot');
  },

  // 계정 삭제
  deleteAccount: async () => {
    return apiClient.delete('/users/me');
  },
};

// 용병 API
export const MercenaryAPI = {
  // 용병 목록 조회
  getProfiles: async (filters?: {
    position?: string;
    tier?: string;
    minRating?: number;
    maxRate?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) => {
    return apiClient.get('/mercenaries', { params: filters });
  },

  // 용병 프로필 등록
  registerProfile: async (profileData: {
    hourlyRate: number;
    description: string;
    specialties: string[];
    availableHours: string[];
  }) => {
    return apiClient.post('/mercenaries', profileData);
  },

  // 용병 프로필 업데이트
  updateProfile: async (profileId: string, profileData: any) => {
    return apiClient.put(`/mercenaries/${profileId}`, profileData);
  },

  // 용병 프로필 삭제
  deleteProfile: async (profileId: string) => {
    return apiClient.delete(`/mercenaries/${profileId}`);
  },

  // 용병 고용
  hireMercenary: async (mercenaryId: string, details: {
    duration: number;
    message: string;
    proposedRate?: number;
  }) => {
    return apiClient.post(`/mercenaries/${mercenaryId}/hire`, details);
  },

  // 리뷰 작성
  writeReview: async (mercenaryId: string, review: {
    rating: number;
    comment: string;
    categories: Record<string, number>;
  }) => {
    return apiClient.post(`/mercenaries/${mercenaryId}/reviews`, review);
  },
};

// 대회 API
export const TournamentAPI = {
  // 대회 목록 조회
  getTournaments: async (filters?: {
    type?: 'free' | 'paid';
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
  }) => {
    return apiClient.get('/tournaments', { params: filters });
  },

  // 대회 상세 조회
  getTournament: async (tournamentId: string) => {
    return apiClient.get(`/tournaments/${tournamentId}`);
  },

  // 대회 생성
  createTournament: async (tournamentData: {
    title: string;
    description: string;
    type: 'free' | 'paid';
    entryFee: number;
    prizePool: number;
    maxParticipants: number;
    schedule: {
      registrationStart: Date;
      registrationEnd: Date;
      tournamentStart: Date;
      tournamentEnd: Date;
    };
  }) => {
    return apiClient.post('/tournaments', tournamentData);
  },

  // 대회 참가
  joinTournament: async (tournamentId: string, position: string) => {
    return apiClient.post(`/tournaments/${tournamentId}/join`, { position });
  },

  // 대회 참가 취소
  leaveTournament: async (tournamentId: string) => {
    return apiClient.delete(`/tournaments/${tournamentId}/leave`);
  },
};

// 채팅 API
export const ChatAPI = {
  // 채팅방 목록 조회
  getRooms: async () => {
    return apiClient.get('/chat/rooms');
  },

  // 메시지 목록 조회
  getMessages: async (roomId: string, page?: number, limit?: number) => {
    return apiClient.get(`/chat/rooms/${roomId}/messages`, {
      params: { page, limit }
    });
  },

  // 메시지 전송
  sendMessage: async (roomId: string, message: {
    text: string;
    type?: 'text' | 'image';
    attachments?: string[];
  }) => {
    return apiClient.post(`/chat/rooms/${roomId}/messages`, message);
  },

  // 메시지 삭제
  deleteMessage: async (roomId: string, messageId: string) => {
    return apiClient.delete(`/chat/rooms/${roomId}/messages/${messageId}`);
  },

  // 메시지 신고
  reportMessage: async (messageId: string, reason: string) => {
    return apiClient.post(`/chat/messages/${messageId}/report`, { reason });
  },
};

// 결제 API
export const PaymentAPI = {
  // 크레딧 패키지 목록
  getCreditPackages: async () => {
    return apiClient.get('/payments/credit-packages');
  },

  // 크레딧 충전
  chargeCredits: async (packageId: string, paymentMethod: string) => {
    return apiClient.post('/payments/charge-credits', {
      packageId,
      paymentMethod,
    });
  },

  // 결제 내역 조회
  getPaymentHistory: async (page?: number, limit?: number) => {
    return apiClient.get('/payments/history', {
      params: { page, limit }
    });
  },

  // 크레딧 잔액 조회
  getCreditBalance: async () => {
    return apiClient.get('/payments/credits/balance');
  },

  // 결제 검증
  verifyPayment: async (paymentId: string) => {
    return apiClient.post(`/payments/${paymentId}/verify`);
  },
};

// 신고 API
export const ReportAPI = {
  // 사용자 신고
  reportUser: async (targetUserId: string, report: {
    type: string;
    category: string;
    description: string;
    evidence?: string[];
    context?: string;
  }) => {
    return apiClient.post('/reports/user', {
      targetUserId,
      ...report,
    });
  },

  // 신고 내역 조회
  getMyReports: async () => {
    return apiClient.get('/reports/my-reports');
  },

  // 신고 상태 조회
  getReportStatus: async (reportId: string) => {
    return apiClient.get(`/reports/${reportId}/status`);
  },
};

// 라이엇 API 연동
export const RiotAPI = {
  // 소환사 정보 조회
  getSummonerInfo: async (gameName: string, tagLine: string) => {
    return apiClient.get('/riot/summoner', {
      params: { gameName, tagLine }
    });
  },

  // 랭크 정보 조회
  getRankInfo: async (summonerId: string) => {
    return apiClient.get(`/riot/rank/${summonerId}`);
  },

  // 매치 히스토리 조회
  getMatchHistory: async (puuid: string, count?: number) => {
    return apiClient.get(`/riot/matches/${puuid}`, {
      params: { count }
    });
  },

  // 매치 상세 정보 조회
  getMatchDetail: async (matchId: string) => {
    return apiClient.get(`/riot/match/${matchId}`);
  },
};

// 관리자 API
export const AdminAPI = {
  // 사용자 관리
  getUsers: async (filters?: any) => {
    return apiClient.get('/admin/users', { params: filters });
  },

  // 사용자 정지
  suspendUser: async (userId: string, reason: string, duration: number) => {
    return apiClient.post(`/admin/users/${userId}/suspend`, {
      reason,
      duration,
    });
  },

  // 신고 처리
  processReport: async (reportId: string, action: {
    status: string;
    resolution: string;
    actionTaken: string;
  }) => {
    return apiClient.put(`/admin/reports/${reportId}`, action);
  },

  // 시스템 통계
  getSystemStats: async () => {
    return apiClient.get('/admin/stats');
  },
};

// 에러 처리 유틸리티
export const handleApiError = (error: any) => {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        Alert.alert('요청 오류', data.message || '잘못된 요청입니다.');
        break;
      case 401:
        Alert.alert('인증 오류', '로그인이 필요합니다.');
        break;
      case 403:
        Alert.alert('권한 오류', '접근 권한이 없습니다.');
        break;
      case 404:
        Alert.alert('찾을 수 없음', '요청한 리소스를 찾을 수 없습니다.');
        break;
      case 429:
        Alert.alert('요청 제한', '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.');
        break;
      case 500:
        Alert.alert('서버 오류', '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
        break;
      default:
        Alert.alert('오류', data.message || '알 수 없는 오류가 발생했습니다.');
    }
  } else if (error.request) {
    Alert.alert('네트워크 오류', '인터넷 연결을 확인해주세요.');
  } else {
    Alert.alert('오류', '요청 처리 중 오류가 발생했습니다.');
  }
};

// WebSocket 연결 (실시간 채팅용)
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;

  connect(userId: string) {
    const wsUrl = __DEV__ 
      ? `ws://localhost:3000/ws?userId=${userId}`
      : `wss://lol-naejeon-api.vercel.app/ws?userId=${userId}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect(userId);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private attemptReconnect(userId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(userId);
      }, this.reconnectInterval * this.reconnectAttempts);
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case 'chat_message':
        // 채팅 메시지 처리
        break;
      case 'tournament_update':
        // 대회 업데이트 처리
        break;
      case 'notification':
        // 알림 처리
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  sendMessage(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsClient = new WebSocketClient();

export default {
  AuthAPI,
  UserAPI,
  MercenaryAPI,
  TournamentAPI,
  ChatAPI,
  PaymentAPI,
  ReportAPI,
  RiotAPI,
  AdminAPI,
  handleApiError,
  wsClient,
}; 