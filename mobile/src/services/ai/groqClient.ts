import { GroqMessage, GroqRequestPayload, GroqResponse } from '../../types/bookAI.types';
import { DEFAULT_MODEL } from '../../constants/bookAIPrompts';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface GroqClientOptions {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Sends a chat completion request to Groq and returns the reply text.
 * Throws an Error if the request fails or Groq returns an error body.
 */
export async function groqChat(
  systemPrompt: string,
  messages: GroqMessage[],
  options: GroqClientOptions,
): Promise<string> {
  const { apiKey, model = DEFAULT_MODEL, maxTokens = 900, temperature = 0.75 } = options;

  const payload: GroqRequestPayload = {
    model,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    max_tokens: maxTokens,
    temperature,
    stream: false,
  };

  const response = await fetch(GROQ_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errorText}`);
  }

  const data: GroqResponse = await response.json();

  if (data.error) {
    throw new Error(`Groq error: ${data.error.message}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from Groq.');

  return content.trim();
}

/**
 * Validates a Groq API key format (starts with gsk_).
 */
export function isValidGroqKey(key: string): boolean {
  return key.trim().startsWith('gsk_') && key.trim().length > 20;
}
