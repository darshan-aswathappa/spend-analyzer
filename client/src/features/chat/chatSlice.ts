import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  streaming: boolean;
  streamingContent: string;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  loading: false,
  streaming: false,
  streamingContent: '',
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages(state, action: PayloadAction<ChatMessage[]>) {
      state.messages = action.payload;
      state.loading = false;
    },
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
    setStreaming(state, action: PayloadAction<boolean>) {
      state.streaming = action.payload;
      if (!action.payload) {
        state.streamingContent = '';
      }
    },
    appendStreamingContent(state, action: PayloadAction<string>) {
      state.streamingContent += action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.streaming = false;
    },
    clearMessages(state) {
      state.messages = [];
    },
  },
});

export const {
  setMessages,
  addMessage,
  setStreaming,
  appendStreamingContent,
  setLoading,
  setError,
  clearMessages,
} = chatSlice.actions;
export default chatSlice.reducer;
