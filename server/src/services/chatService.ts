import OpenAI from 'openai';
import { Response } from 'express';
import { env } from '../config/env';
import { supabase } from '../config/supabase';
import { Transaction } from '../types';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a personal finance assistant. You help users understand their spending habits.
You have access to the user's recent transaction history provided in the context.
Be concise, insightful, and accurate. Format currency values clearly (e.g., $1,234.56).
Do not make up transactions. Only reference the data provided.
If asked about something not in the data, say so clearly.`;

export async function streamChatResponse(
  userId: string,
  userMessage: string,
  res: Response
): Promise<void> {
  // Fetch recent transactions for context
  const { data: transactions } = await supabase
    .from('transactions')
    .select('date, description, amount, type, category')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(200);

  // Fetch recent chat history
  const { data: history } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  const recentHistory = (history || []).reverse();

  const transactionContext =
    transactions && transactions.length > 0
      ? `User's transactions:\n${JSON.stringify(transactions, null, 2)}`
      : 'No transactions found for this user.';

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n${transactionContext}` },
    ...recentHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  // Save user message
  await supabase.from('chat_messages').insert({
    user_id: userId,
    role: 'user',
    content: userMessage,
  });

  // Stream response via SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    stream: true,
    temperature: 0.7,
  });

  let fullContent = '';

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      fullContent += delta;
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();

  // Save assistant reply
  await supabase.from('chat_messages').insert({
    user_id: userId,
    role: 'assistant',
    content: fullContent,
  });
}
