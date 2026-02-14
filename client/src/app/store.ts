import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import transactionsReducer from '@/features/transactions/transactionsSlice';
import statementsReducer from '@/features/statements/statementsSlice';
import chatReducer from '@/features/chat/chatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    transactions: transactionsReducer,
    statements: statementsReducer,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setSession'],
        ignoredPaths: ['auth.session'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
