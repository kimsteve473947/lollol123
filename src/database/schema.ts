// 실제 배포용 데이터베이스 스키마 설계
// Firebase Firestore 기반 구조

export interface User {
  id: string;
  email: string;
  username: string;
  realName: string; // 실명 (암호화 저장)
  phoneNumber: string; // 휴대폰 번호 (암호화 저장)
  birthDate: string; // 생년월일 (암호화 저장)
  
  // 라이엇 계정 정보
  riotAccount: {
    puuid: string; // Riot API의 고유 ID
    gameName: string;
    tagLine: string;
    summonerId: string;
    accountId: string;
    verified: boolean;
    verifiedAt: Date;
  };
  
  // 게임 정보
  gameInfo: {
    tier: string;
    rank: string;
    lp: number;
    mainPosition: string;
    subPosition: string;
    profileIconId: number;
    level: number;
  };
  
  // 인증 정보
  verification: {
    phoneVerified: boolean;
    phoneVerifiedAt?: Date;
    emailVerified: boolean;
    emailVerifiedAt?: Date;
    identityVerified: boolean; // 실명 인증
    identityVerifiedAt?: Date;
  };
  
  // 계정 상태
  status: {
    isActive: boolean;
    isSuspended: boolean;
    suspensionReason?: string;
    suspensionUntil?: Date;
    warningCount: number;
    lastLoginAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  
  // 개인정보 (암호화 필요)
  encryptedData: {
    realName: string;
    phoneNumber: string;
    birthDate: string;
  };
}

export interface MercenaryProfile {
  id: string;
  userId: string;
  
  // 기본 정보
  basicInfo: {
    hourlyRate: number;
    description: string;
    specialties: string[];
    availableHours: string[];
    languages: string[];
  };
  
  // 통계 정보
  stats: {
    rating: number;
    reviewCount: number;
    totalGames: number;
    winRate: number;
    totalEarnings: number;
    completedJobs: number;
    cancelledJobs: number;
  };
  
  // 상태 정보
  status: {
    isActive: boolean;
    isOnline: boolean;
    lastActiveAt: Date;
    availabilityStatus: 'available' | 'busy' | 'offline';
  };
  
  // 메타데이터
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    featuredUntil?: Date;
    verificationLevel: 'basic' | 'verified' | 'premium';
  };
}

export interface Tournament {
  id: string;
  organizerId: string;
  
  // 기본 정보
  basicInfo: {
    title: string;
    description: string;
    type: 'free' | 'paid';
    entryFee: number;
    prizePool: number;
    maxParticipants: number;
    currentParticipants: number;
  };
  
  // 일정 정보
  schedule: {
    registrationStart: Date;
    registrationEnd: Date;
    tournamentStart: Date;
    tournamentEnd: Date;
    timezone: string;
  };
  
  // 참가자 정보
  participants: {
    [userId: string]: {
      position: string;
      registeredAt: Date;
      paymentStatus: 'pending' | 'paid' | 'refunded';
      paymentId?: string;
    };
  };
  
  // 상태 정보
  status: {
    current: 'draft' | 'open' | 'closed' | 'ongoing' | 'completed' | 'cancelled';
    isVisible: boolean;
    isFeatured: boolean;
  };
  
  // 메타데이터
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
    region: string;
    discordLink?: string;
  };
}

export interface ChatMessage {
  id: string;
  roomId: string; // 티어별 채팅방 ID (예: "tier_GOLD")
  userId: string;
  
  // 메시지 내용
  content: {
    text: string;
    type: 'text' | 'image' | 'system';
    attachments?: string[];
  };
  
  // 사용자 정보 (캐시)
  userInfo: {
    username: string;
    tier: string;
    rank: string;
    profileIconId: number;
    isVerified: boolean;
  };
  
  // 메타데이터
  metadata: {
    timestamp: Date;
    editedAt?: Date;
    isDeleted: boolean;
    reportCount: number;
    isModerated: boolean;
  };
}

export interface ChatRoom {
  id: string; // 예: "tier_GOLD", "tier_DIAMOND"
  type: 'tier' | 'tournament' | 'private';
  
  // 방 정보
  info: {
    name: string;
    description: string;
    requiredTier?: string;
    maxMembers: number;
    currentMembers: number;
  };
  
  // 권한 설정
  permissions: {
    canWrite: string[]; // 티어 목록 또는 사용자 ID 목록
    canRead: string[];
    moderators: string[];
  };
  
  // 상태 정보
  status: {
    isActive: boolean;
    lastMessageAt: Date;
    createdAt: Date;
  };
}

export interface Payment {
  id: string;
  userId: string;
  
  // 결제 정보
  paymentInfo: {
    amount: number;
    currency: 'KRW';
    type: 'credit_charge' | 'tournament_entry' | 'mercenary_hire';
    method: 'kakaopay' | 'tosspay' | 'card';
    provider: string;
    providerTransactionId: string;
  };
  
  // 관련 정보
  relatedInfo: {
    tournamentId?: string;
    mercenaryId?: string;
    creditAmount?: number;
  };
  
  // 상태 정보
  status: {
    current: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
    completedAt?: Date;
    failureReason?: string;
  };
  
  // 메타데이터
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    ipAddress: string; // 보안용
    userAgent: string; // 보안용
  };
}

export interface UserCredit {
  userId: string;
  
  // 크레딧 정보
  balance: {
    current: number;
    total: number; // 누적 충전 금액
    used: number; // 누적 사용 금액
  };
  
  // 거래 내역
  transactions: {
    id: string;
    type: 'charge' | 'use' | 'refund' | 'bonus';
    amount: number;
    description: string;
    relatedId?: string; // 관련 결제 ID 또는 대회 ID
    timestamp: Date;
  }[];
  
  // 메타데이터
  metadata: {
    lastUpdated: Date;
    version: number; // 동시성 제어용
  };
}

export interface SecurityLog {
  id: string;
  userId?: string;
  
  // 로그 정보
  logInfo: {
    type: 'login' | 'payment' | 'suspicious_activity' | 'data_access' | 'api_call';
    action: string;
    result: 'success' | 'failure' | 'blocked';
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  
  // 세부 정보
  details: {
    ipAddress: string;
    userAgent: string;
    location?: string;
    additionalData: Record<string, any>;
  };
  
  // 메타데이터
  metadata: {
    timestamp: Date;
    processed: boolean;
    alertSent: boolean;
  };
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string; // 신고 대상 사용자 ID
  
  // 신고 정보
  reportInfo: {
    type: 'toxic_behavior' | 'cheating' | 'harassment' | 'inappropriate_content' | 'other';
    category: string;
    description: string;
    evidence: string[]; // 스크린샷, 채팅 로그 등
  };
  
  // 관련 정보
  relatedInfo: {
    tournamentId?: string;
    chatMessageId?: string;
    context: string;
  };
  
  // 처리 상태
  status: {
    current: 'pending' | 'investigating' | 'resolved' | 'dismissed';
    assignedTo?: string; // 관리자 ID
    resolution?: string;
    actionTaken?: string;
  };
  
  // 메타데이터
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    priority: 'low' | 'medium' | 'high';
  };
}

// 데이터베이스 컬렉션 구조
export const Collections = {
  USERS: 'users',
  MERCENARY_PROFILES: 'mercenary_profiles',
  TOURNAMENTS: 'tournaments',
  CHAT_ROOMS: 'chat_rooms',
  CHAT_MESSAGES: 'chat_messages',
  PAYMENTS: 'payments',
  USER_CREDITS: 'user_credits',
  SECURITY_LOGS: 'security_logs',
  REPORTS: 'reports',
  
  // 서브컬렉션
  USER_SESSIONS: 'user_sessions',
  TOURNAMENT_PARTICIPANTS: 'participants',
  MERCENARY_REVIEWS: 'reviews',
  CHAT_PARTICIPANTS: 'participants',
} as const;

// 보안 규칙 (Firestore Security Rules)
export const SecurityRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 데이터 - 본인만 읽기/쓰기 가능
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && resource.data.status.isActive == true;
    }
    
    // 용병 프로필 - 모든 인증된 사용자가 읽기 가능, 본인만 쓰기 가능
    match /mercenary_profiles/{profileId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // 대회 - 모든 인증된 사용자가 읽기 가능, 주최자만 쓰기 가능
    match /tournaments/{tournamentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.organizerId;
    }
    
    // 채팅 메시지 - 해당 티어 이상 사용자만 읽기/쓰기 가능
    match /chat_messages/{messageId} {
      allow read: if request.auth != null && canAccessTierChat(request.auth.uid, resource.data.roomId);
      allow create: if request.auth != null && canWriteToTierChat(request.auth.uid, resource.data.roomId);
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // 결제 정보 - 본인만 읽기 가능, 시스템만 쓰기 가능
    match /payments/{paymentId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow write: if false; // 서버 사이드에서만 처리
    }
    
    // 크레딧 정보 - 본인만 읽기 가능, 시스템만 쓰기 가능
    match /user_credits/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // 서버 사이드에서만 처리
    }
    
    // 보안 로그 - 관리자만 접근 가능
    match /security_logs/{logId} {
      allow read, write: if request.auth != null && isAdmin(request.auth.uid);
    }
    
    // 신고 - 신고자만 읽기 가능, 관리자만 처리 가능
    match /reports/{reportId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.reporterId || isAdmin(request.auth.uid));
      allow create: if request.auth != null && request.auth.uid == request.resource.data.reporterId;
      allow update: if request.auth != null && isAdmin(request.auth.uid);
    }
    
    // 헬퍼 함수들
    function isAdmin(userId) {
      return exists(/databases/$(database)/documents/admins/$(userId));
    }
    
    function canAccessTierChat(userId, roomId) {
      let userDoc = get(/databases/$(database)/documents/users/$(userId));
      let userTier = userDoc.data.gameInfo.tier;
      let roomTier = roomId.split('_')[1];
      return getTierLevel(userTier) >= getTierLevel(roomTier);
    }
    
    function canWriteToTierChat(userId, roomId) {
      return canAccessTierChat(userId, roomId) && isVerifiedUser(userId);
    }
    
    function isVerifiedUser(userId) {
      let userDoc = get(/databases/$(database)/documents/users/$(userId));
      return userDoc.data.verification.phoneVerified == true && 
             userDoc.data.verification.identityVerified == true;
    }
    
    function getTierLevel(tier) {
      return tier == 'IRON' ? 0 :
             tier == 'BRONZE' ? 1 :
             tier == 'SILVER' ? 2 :
             tier == 'GOLD' ? 3 :
             tier == 'PLATINUM' ? 4 :
             tier == 'EMERALD' ? 5 :
             tier == 'DIAMOND' ? 6 :
             tier == 'MASTER' ? 7 :
             tier == 'GRANDMASTER' ? 8 :
             tier == 'CHALLENGER' ? 9 : 0;
    }
  }
}
`;

// 데이터 암호화 유틸리티
export const EncryptionUtils = {
  // 개인정보 암호화 필드
  ENCRYPTED_FIELDS: ['realName', 'phoneNumber', 'birthDate'],
  
  // 암호화가 필요한 데이터 타입
  SENSITIVE_DATA_TYPES: [
    'personal_info',
    'payment_info',
    'location_data',
    'device_info'
  ],
  
  // 데이터 보존 정책
  DATA_RETENTION: {
    CHAT_MESSAGES: 90, // 90일
    SECURITY_LOGS: 365, // 1년
    PAYMENT_LOGS: 2555, // 7년 (법적 요구사항)
    USER_ACTIVITY: 180, // 6개월
  }
};

// API 레이트 리미팅 설정
export const RateLimiting = {
  // 일반 API 호출
  GENERAL_API: {
    windowMs: 15 * 60 * 1000, // 15분
    maxRequests: 100,
  },
  
  // 인증 관련 API
  AUTH_API: {
    windowMs: 15 * 60 * 1000, // 15분
    maxRequests: 5,
  },
  
  // 결제 관련 API
  PAYMENT_API: {
    windowMs: 60 * 60 * 1000, // 1시간
    maxRequests: 10,
  },
  
  // 채팅 메시지
  CHAT_API: {
    windowMs: 60 * 1000, // 1분
    maxRequests: 30,
  },
};

// 모니터링 및 알림 설정
export const MonitoringConfig = {
  // 의심스러운 활동 감지
  SUSPICIOUS_ACTIVITY: {
    MULTIPLE_LOGIN_ATTEMPTS: 5,
    RAPID_API_CALLS: 100,
    UNUSUAL_PAYMENT_PATTERN: true,
    LOCATION_CHANGE_ALERT: true,
  },
  
  // 시스템 알림
  SYSTEM_ALERTS: {
    HIGH_ERROR_RATE: 0.05, // 5%
    SLOW_RESPONSE_TIME: 2000, // 2초
    DATABASE_CONNECTION_ISSUES: true,
    PAYMENT_FAILURES: true,
  },
};

export default {
  Collections,
  SecurityRules,
  EncryptionUtils,
  RateLimiting,
  MonitoringConfig,
}; 