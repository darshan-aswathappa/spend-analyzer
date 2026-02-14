import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '@/lib/apiClient';
import { supabase } from '@/lib/supabaseClient';
import type { AppDispatch, RootState } from '@/app/store';
import {
  setMessages,
  addMessage,
  setStreaming,
  appendStreamingContent,
  setLoading,
  setError,
  clearMessages,
} from './chatSlice';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Send, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types';

const SUGGESTIONS = [
  'How much did I spend last month?',
  "What's my biggest expense category?",
  'Show me my top 5 largest transactions',
  'How does my spending compare across categories?',
];

export function ChatPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { messages, loading, streaming, streamingContent } = useSelector(
    (state: RootState) => state.chat
  );
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadHistory() {
      dispatch(setLoading(true));
      try {
        const res = await apiClient.get('/chat/history');
        dispatch(setMessages(res.data));
      } catch {
        dispatch(setLoading(false));
      }
    }
    loadHistory();
  }, [dispatch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  async function handleSend(text?: string) {
    const message = (text ?? input).trim();
    if (!message || streaming) return;

    setInput('');

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: '',
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    };
    dispatch(addMessage(userMsg));
    dispatch(setStreaming(true));

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${apiBase}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error('Chat request failed');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.delta) {
              dispatch(appendStreamingContent(data.delta));
            }
            if (data.done) {
              // The server has saved the message; refetch history for the persisted ID
              const histRes = await apiClient.get('/chat/history');
              dispatch(setMessages(histRes.data));
              dispatch(setStreaming(false));
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Something went wrong'));
    }
  }

  async function handleClear() {
    try {
      await apiClient.delete('/chat/history');
      dispatch(clearMessages());
    } catch {
      // silent
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-6.5rem)] md:h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ask your finances</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Powered by your uploaded transactions</p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-400 dark:text-gray-500 h-7"
            onClick={handleClear}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear history
          </Button>
        )}
      </div>

      {/* Messages */}
      <Card className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-5 py-4">
          {loading && messages.length === 0 ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            </div>
          ) : messages.length === 0 && !streaming ? (
            <div className="flex flex-col items-center gap-4 py-10">
              <p className="text-sm text-gray-500 dark:text-gray-400">Ask anything about your spending</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-left text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-3 py-2.5 transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {streaming && streamingContent && (
                <AssistantBubble content={streamingContent} isStreaming />
              )}
              {streaming && !streamingContent && (
                <div className="flex gap-2 items-center text-gray-400 dark:text-gray-500 text-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </ScrollArea>
      </Card>

      {/* Input */}
      <div className="mt-3 flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your spending... (Enter to send)"
          className="resize-none min-h-[44px] max-h-32 text-sm"
          rows={1}
          disabled={streaming}
        />
        <Button
          onClick={() => handleSend()}
          disabled={!input.trim() || streaming}
          size="icon"
          className="h-[44px] w-[44px] shrink-0"
        >
          {streaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%] text-sm">
          {message.content}
        </div>
      </div>
    );
  }
  return <AssistantBubble content={message.content} />;
}

function AssistantBubble({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  return (
    <div className={cn('flex justify-start', isStreaming && 'opacity-90')}>
      <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[85%] text-sm whitespace-pre-wrap">
        {content}
        {isStreaming && <span className="inline-block w-1 h-4 ml-0.5 bg-gray-400 dark:bg-gray-500 animate-pulse rounded-sm align-middle" />}
      </div>
    </div>
  );
}
