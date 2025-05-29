import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PremiumPlan {
  id: string;
  name: string;
  price: number;
  duration: number; // days
  features: string[];
  isPopular: boolean;
  discountPercent?: number;
}

export interface PremiumSubscription {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoRenew: boolean;
  paymentMethod: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  requiredPlan: 'basic' | 'premium' | 'pro';
}

interface PremiumState {
  plans: PremiumPlan[];
  currentSubscription: PremiumSubscription | null;
  features: PremiumFeature[];
  isPremiumUser: boolean;
  premiumLevel: 'none' | 'basic' | 'premium' | 'pro';
  loading: boolean;
  error: string | null;
}

const initialState: PremiumState = {
  plans: [
    {
      id: 'basic',
      name: '베이직',
      price: 4900,
      duration: 30,
      features: [
        '광고 제거',
        '우선 매칭',
        '기본 통계 확인',
        '일반 채팅방 이용',
      ],
      isPopular: false,
    },
    {
      id: 'premium',
      name: '프리미엄',
      price: 9900,
      duration: 30,
      features: [
        '베이직 플랜 모든 혜택',
        '상세 통계 및 분석',
        '프리미엄 매칭 큐',
        '전용 채팅방 이용',
        '게임 리플레이 저장',
        '커스텀 프로필 꾸미기',
      ],
      isPopular: true,
      discountPercent: 20,
    },
    {
      id: 'pro',
      name: '프로',
      price: 19900,
      duration: 30,
      features: [
        '프리미엄 플랜 모든 혜택',
        'AI 기반 개인 코칭',
        '프로 선수와의 매칭',
        '무제한 리플레이 저장',
        '전용 고객 지원',
        '토너먼트 우선 참가',
        '수익 공유 프로그램',
      ],
      isPopular: false,
    },
  ],
  currentSubscription: null,
  features: [
    {
      id: 'ad_free',
      name: '광고 제거',
      description: '모든 광고를 제거하고 깔끔한 환경에서 이용하세요',
      icon: 'remove-circle',
      isUnlocked: false,
      requiredPlan: 'basic',
    },
    {
      id: 'priority_matching',
      name: '우선 매칭',
      description: '매칭 대기 시간을 50% 단축시켜드립니다',
      icon: 'flash',
      isUnlocked: false,
      requiredPlan: 'basic',
    },
    {
      id: 'detailed_stats',
      name: '상세 통계',
      description: '게임별 상세 분석과 개선점을 확인하세요',
      icon: 'analytics',
      isUnlocked: false,
      requiredPlan: 'premium',
    },
    {
      id: 'premium_queue',
      name: '프리미엄 매칭',
      description: '고수들만 모이는 프리미엄 매칭 큐를 이용하세요',
      icon: 'star',
      isUnlocked: false,
      requiredPlan: 'premium',
    },
    {
      id: 'replay_save',
      name: '리플레이 저장',
      description: '게임 리플레이를 저장하고 분석해보세요',
      icon: 'videocam',
      isUnlocked: false,
      requiredPlan: 'premium',
    },
    {
      id: 'ai_coaching',
      name: 'AI 코칭',
      description: 'AI가 분석한 개인 맞춤 코칭을 받아보세요',
      icon: 'school',
      isUnlocked: false,
      requiredPlan: 'pro',
    },
    {
      id: 'pro_matching',
      name: '프로 매칭',
      description: '프로 선수들과 함께 게임할 기회를 얻으세요',
      icon: 'trophy',
      isUnlocked: false,
      requiredPlan: 'pro',
    },
    {
      id: 'revenue_share',
      name: '수익 공유',
      description: '플랫폼 수익의 일부를 공유받으세요',
      icon: 'cash',
      isUnlocked: false,
      requiredPlan: 'pro',
    },
  ],
  isPremiumUser: false,
  premiumLevel: 'none',
  loading: false,
  error: null,
};

const premiumSlice = createSlice({
  name: 'premium',
  initialState,
  reducers: {
    setPlans: (state, action: PayloadAction<PremiumPlan[]>) => {
      state.plans = action.payload;
    },
    
    subscribeToPlan: (state, action: PayloadAction<{ planId: string; subscription: PremiumSubscription }>) => {
      const { planId, subscription } = action.payload;
      state.currentSubscription = subscription;
      state.isPremiumUser = true;
      
      // Update premium level based on plan
      if (planId === 'basic') {
        state.premiumLevel = 'basic';
      } else if (planId === 'premium') {
        state.premiumLevel = 'premium';
      } else if (planId === 'pro') {
        state.premiumLevel = 'pro';
      }
      
      // Unlock features based on plan
      state.features.forEach(feature => {
        if (
          (state.premiumLevel === 'basic' && feature.requiredPlan === 'basic') ||
          (state.premiumLevel === 'premium' && ['basic', 'premium'].includes(feature.requiredPlan)) ||
          (state.premiumLevel === 'pro' && ['basic', 'premium', 'pro'].includes(feature.requiredPlan))
        ) {
          feature.isUnlocked = true;
        }
      });
    },
    
    cancelSubscription: (state) => {
      if (state.currentSubscription) {
        state.currentSubscription.status = 'cancelled';
        state.currentSubscription.autoRenew = false;
      }
    },
    
    expireSubscription: (state) => {
      state.currentSubscription = null;
      state.isPremiumUser = false;
      state.premiumLevel = 'none';
      
      // Lock all features
      state.features.forEach(feature => {
        feature.isUnlocked = false;
      });
    },
    
    toggleAutoRenew: (state) => {
      if (state.currentSubscription) {
        state.currentSubscription.autoRenew = !state.currentSubscription.autoRenew;
      }
    },
    
    updateSubscriptionStatus: (state, action: PayloadAction<'active' | 'expired' | 'cancelled' | 'pending'>) => {
      if (state.currentSubscription) {
        state.currentSubscription.status = action.payload;
        
        if (action.payload === 'expired' || action.payload === 'cancelled') {
          state.isPremiumUser = false;
          state.premiumLevel = 'none';
          state.features.forEach(feature => {
            feature.isUnlocked = false;
          });
        }
      }
    },
    
    unlockFeature: (state, action: PayloadAction<string>) => {
      const feature = state.features.find(f => f.id === action.payload);
      if (feature) {
        feature.isUnlocked = true;
      }
    },
    
    lockFeature: (state, action: PayloadAction<string>) => {
      const feature = state.features.find(f => f.id === action.payload);
      if (feature) {
        feature.isUnlocked = false;
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
  setPlans,
  subscribeToPlan,
  cancelSubscription,
  expireSubscription,
  toggleAutoRenew,
  updateSubscriptionStatus,
  unlockFeature,
  lockFeature,
  setLoading,
  setError,
} = premiumSlice.actions;

export default premiumSlice.reducer; 