import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import apiClient from '@/lib/apiClient';

export interface NotificationItem {
  id: string;
  type: 'statement_processed' | 'risk_score_updated' | 'statement_failed';
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

interface NotificationsState {
  items: NotificationItem[];
  unreadCount: number;
  panelOpen: boolean;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  panelOpen: false,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async () => {
    const res = await apiClient.get<NotificationItem[]>('/notifications');
    return res.data;
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<NotificationItem>) {
      // Avoid duplicates from SSE re-delivery
      const exists = state.items.some((n) => n.id === action.payload.id);
      if (!exists) {
        state.items.unshift(action.payload);
        if (!action.payload.read) {
          state.unreadCount += 1;
        }
      }
    },
    markAllRead(state) {
      state.items = state.items.map((n) => ({ ...n, read: true }));
      state.unreadCount = 0;
    },
    setPanelOpen(state, action: PayloadAction<boolean>) {
      state.panelOpen = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      // Merge fetched history without duplicating SSE items already added
      const existingIds = new Set(state.items.map((n) => n.id));
      const newItems = action.payload.filter((n) => !existingIds.has(n.id));
      state.items = [...state.items, ...newItems].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      // Unread count = total unread in merged list
      state.unreadCount = state.items.filter((n) => !n.read).length;
    });
  },
});

export const { addNotification, markAllRead, setPanelOpen } = notificationsSlice.actions;
export default notificationsSlice.reducer;
