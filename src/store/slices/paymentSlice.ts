import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'kakaopay' | 'tosspay' | 'paypal';
  name: string;
  isDefault: boolean;
  lastFourDigits?: string;
  expiryDate?: string;
  createdAt: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  bonusCredits: number;
  isPopular: boolean;
  description: string;
}

export interface PaymentHistory {
  id: string;
  type: 'credit_purchase' | 'tournament_entry' | 'refund';
  amount: number;
  credits: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: string;
  transactionId: string;
  description: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

interface PaymentState {
  creditPackages: CreditPackage[];
  paymentMethods: PaymentMethod[];
  paymentHistory: PaymentHistory[];
  currentPayment: PaymentHistory | null;
  loading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  creditPackages: [
    {
      id: 'package_1',
      name: '스타터 패키지',
      credits: 1000,
      price: 1000,
      bonusCredits: 0,
      isPopular: false,
      description: '처음 시작하는 분들을 위한 기본 패키지',
    },
    {
      id: 'package_2',
      name: '베이직 패키지',
      credits: 5000,
      price: 5000,
      bonusCredits: 500,
      isPopular: true,
      description: '가장 인기있는 패키지! 10% 보너스 크레딧',
    },
    {
      id: 'package_3',
      name: '프리미엄 패키지',
      credits: 10000,
      price: 10000,
      bonusCredits: 1500,
      isPopular: false,
      description: '15% 보너스 크레딧으로 더 많은 혜택',
    },
    {
      id: 'package_4',
      name: '마스터 패키지',
      credits: 20000,
      price: 20000,
      bonusCredits: 4000,
      isPopular: false,
      description: '20% 보너스 크레딧! 최고의 가성비',
    },
  ],
  paymentMethods: [],
  paymentHistory: [],
  currentPayment: null,
  loading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    setCreditPackages: (state, action: PayloadAction<CreditPackage[]>) => {
      state.creditPackages = action.payload;
    },
    
    addPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      state.paymentMethods.push(action.payload);
    },
    
    removePaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethods = state.paymentMethods.filter(method => method.id !== action.payload);
    },
    
    setDefaultPaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethods.forEach(method => {
        method.isDefault = method.id === action.payload;
      });
    },
    
    startPayment: (state, action: PayloadAction<PaymentHistory>) => {
      state.currentPayment = action.payload;
      state.paymentHistory.unshift(action.payload);
    },
    
    completePayment: (state, action: PayloadAction<{ paymentId: string; transactionId: string }>) => {
      const payment = state.paymentHistory.find(p => p.id === action.payload.paymentId);
      if (payment) {
        payment.status = 'completed';
        payment.transactionId = action.payload.transactionId;
        payment.completedAt = new Date().toISOString();
      }
      if (state.currentPayment?.id === action.payload.paymentId) {
        state.currentPayment = null;
      }
    },
    
    failPayment: (state, action: PayloadAction<{ paymentId: string; reason: string }>) => {
      const payment = state.paymentHistory.find(p => p.id === action.payload.paymentId);
      if (payment) {
        payment.status = 'failed';
        payment.failureReason = action.payload.reason;
      }
      if (state.currentPayment?.id === action.payload.paymentId) {
        state.currentPayment = null;
      }
    },
    
    cancelPayment: (state, action: PayloadAction<string>) => {
      const payment = state.paymentHistory.find(p => p.id === action.payload);
      if (payment) {
        payment.status = 'cancelled';
      }
      if (state.currentPayment?.id === action.payload) {
        state.currentPayment = null;
      }
    },
    
    addPaymentHistory: (state, action: PayloadAction<PaymentHistory>) => {
      state.paymentHistory.unshift(action.payload);
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
  setCreditPackages,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  startPayment,
  completePayment,
  failPayment,
  cancelPayment,
  addPaymentHistory,
  setLoading,
  setError,
} = paymentSlice.actions;

export default paymentSlice.reducer; 