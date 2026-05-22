export type ChatMode = 'story' | 'suggest' | 'analyze';

export type MessageRole = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  chunkRef?: string; // e.g. "chapter 18 · matched"
}

export interface BookMeta {
  fileName: string;
  totalPages: number;
  totalChunks: number;
  uploadProgress: number; // 0–100
  isReady: boolean;
}

export interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GroqRequestPayload {
  model: string;
  messages: GroqMessage[];
  max_tokens: number;
  temperature: number;
  stream: false;
}

export interface GroqResponse {
  choices: { message: { content: string } }[];
  error?: { message: string };
}

export interface TextChunk {
  index: number;
  text: string;
}

export interface RetrievedChunk {
  chunk: TextChunk;
  score: number;
}
