import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetName: string;
  targetType: 'user' | 'tournament' | 'chat';
  category: 'toxic_behavior' | 'cheating' | 'inappropriate_content' | 'spam' | 'harassment' | 'other';
  reason: string;
  description: string;
  evidence?: string[];
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  adminNotes?: string;
  action?: 'warning' | 'temporary_ban' | 'permanent_ban' | 'no_action';
}

export interface UserReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  targetId: string;
  targetName: string;
  tournamentId: string;
  tournamentName: string;
  rating: number;
  comment: string;
  categories: {
    skill: number;
    communication: number;
    attitude: number;
    punctuality: number;
  };
  isAnonymous: boolean;
  createdAt: string;
}

export interface BlockedUser {
  id: string;
  userId: string;
  blockedUserId: string;
  blockedUserName: string;
  reason: string;
  createdAt: string;
}

interface ReportState {
  reports: Report[];
  userReviews: UserReview[];
  blockedUsers: BlockedUser[];
  loading: boolean;
  error: string | null;
}

const initialState: ReportState = {
  reports: [],
  userReviews: [],
  blockedUsers: [],
  loading: false,
  error: null,
};

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    addReport: (state, action: PayloadAction<Report>) => {
      state.reports.unshift(action.payload);
    },
    
    updateReportStatus: (state, action: PayloadAction<{ reportId: string; status: Report['status']; adminNotes?: string; action?: Report['action'] }>) => {
      const report = state.reports.find(r => r.id === action.payload.reportId);
      if (report) {
        report.status = action.payload.status;
        report.updatedAt = new Date().toISOString();
        if (action.payload.adminNotes) {
          report.adminNotes = action.payload.adminNotes;
        }
        if (action.payload.action) {
          report.action = action.payload.action;
        }
        if (action.payload.status === 'resolved') {
          report.resolvedAt = new Date().toISOString();
        }
      }
    },
    
    addUserReview: (state, action: PayloadAction<UserReview>) => {
      state.userReviews.unshift(action.payload);
    },
    
    blockUser: (state, action: PayloadAction<BlockedUser>) => {
      state.blockedUsers.push(action.payload);
    },
    
    unblockUser: (state, action: PayloadAction<string>) => {
      state.blockedUsers = state.blockedUsers.filter(blocked => blocked.id !== action.payload);
    },
    
    setReports: (state, action: PayloadAction<Report[]>) => {
      state.reports = action.payload;
    },
    
    setUserReviews: (state, action: PayloadAction<UserReview[]>) => {
      state.userReviews = action.payload;
    },
    
    setBlockedUsers: (state, action: PayloadAction<BlockedUser[]>) => {
      state.blockedUsers = action.payload;
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
  addReport,
  updateReportStatus,
  addUserReview,
  blockUser,
  unblockUser,
  setReports,
  setUserReviews,
  setBlockedUsers,
  setLoading,
  setError,
} = reportSlice.actions;

export default reportSlice.reducer; 