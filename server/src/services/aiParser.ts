import OpenAI from 'openai';
import { env } from '../config/env';
import { ParsedTransaction } from '../types';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const TRANSACTION_SCHEMA = `Each transaction must follow this exact JSON schema:
{
  "date": "YYYY-MM-DD",
  "description": "merchant or transaction description",
  "amount": 123.45,
  "type": "debit" or "credit",
  "category": one of ["Food & Dining", "Shopping", "Transport", "Entertainment", "Health", "Utilities", "Rent & Housing", "Travel", "Income", "Transfers", "Other"]
}
Rules:
- amount is always a positive number
- type is "credit" for money coming in (deposits, refunds, salary), "debit" for money going out
- Infer category from description. Be accurate.
- If a date is ambiguous, use the most recent year from context.
- Return a JSON object with a "transactions" array.`;

const SYSTEM_PROMPT = `You are a financial data extraction assistant.
Given raw text from a bank statement PDF, extract all transactions and return them as a JSON object.

${TRANSACTION_SCHEMA}`;

export async function parseTransactionsFromText(
  text: string
): Promise<{ transactions: ParsedTransaction[]; bankName: string | null; periodStart: string | null; periodEnd: string | null }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Extract all transactions from this bank statement:\n\n${text.slice(0, 15000)}`,
      },
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content || '{}';

  let parsed: { transactions?: ParsedTransaction[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }

  // GPT might return { transactions: [...] } or just [...]
  const transactions: ParsedTransaction[] = Array.isArray(parsed)
    ? parsed
    : (parsed.transactions ?? []);

  // Extract statement metadata using a second quick call
  const metaResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: `From this bank statement text, extract:
1. Bank name
2. Statement period start date (YYYY-MM-DD)
3. Statement period end date (YYYY-MM-DD)

Return JSON only: {"bank_name": "...", "period_start": "YYYY-MM-DD", "period_end": "YYYY-MM-DD"}

Text:\n${text.slice(0, 3000)}`,
      },
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
  });

  let meta: { bank_name?: string; period_start?: string; period_end?: string } = {};
  try {
    meta = JSON.parse(metaResponse.choices[0].message.content || '{}');
  } catch {
    meta = {};
  }

  return {
    transactions,
    bankName: meta.bank_name || null,
    periodStart: meta.period_start || null,
    periodEnd: meta.period_end || null,
  };
}

/**
 * Parses transactions from a scanned (image-based) PDF using GPT-4o vision.
 * @param images  Array of base64 JPEG data URLs, one per page.
 */
export async function parseTransactionsFromImages(
  images: string[]
): Promise<{ transactions: ParsedTransaction[]; bankName: string | null; periodStart: string | null; periodEnd: string | null }> {
  const imageMessages: OpenAI.Chat.ChatCompletionContentPart[] = images.map((img) => ({
    type: 'image_url',
    image_url: { url: img, detail: 'high' },
  }));

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are a financial data extraction assistant. These images are pages from a scanned bank statement.

Extract ALL transactions visible across all pages and return a JSON object with:
1. "transactions": array of transactions
2. "bank_name": name of the bank (string or null)
3. "period_start": statement start date as YYYY-MM-DD (or null)
4. "period_end": statement end date as YYYY-MM-DD (or null)

${TRANSACTION_SCHEMA}

Return ONLY the JSON object, no markdown fences, no extra text.`,
          },
          ...imageMessages,
        ],
      },
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
    max_tokens: 4096,
  });

  const content = response.choices[0].message.content || '{}';
  let parsed: { transactions?: ParsedTransaction[]; bank_name?: string; period_start?: string; period_end?: string } = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }

  const transactions: ParsedTransaction[] = Array.isArray(parsed.transactions)
    ? parsed.transactions
    : [];

  return {
    transactions,
    bankName: parsed.bank_name || null,
    periodStart: parsed.period_start || null,
    periodEnd: parsed.period_end || null,
  };
}
