import { TextChunk } from '../../types/bookAI.types';
import { CHUNK_SIZE, CHUNK_OVERLAP } from '../../constants/bookAIPrompts';

/**
 * Splits a large text into overlapping word-based chunks.
 * Overlap ensures context isn't lost at chunk boundaries.
 */
export function chunkText(
  text: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP,
): TextChunk[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: TextChunk[] = [];

  let index = 0;
  let i = 0;

  while (i < words.length) {
    const slice = words.slice(i, i + chunkSize).join(' ');
    chunks.push({ index, text: slice });
    index++;
    i += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Estimate the page number for a chunk based on its position.
 * Assumes ~250 words per page on average.
 */
export function estimatePageForChunk(chunkIndex: number, chunkSize: number = CHUNK_SIZE): number {
  const WORDS_PER_PAGE = 250;
  const wordOffset = chunkIndex * (chunkSize - CHUNK_OVERLAP);
  return Math.floor(wordOffset / WORDS_PER_PAGE) + 1;
}

/**
 * Returns a human-readable label for a chunk (used in chat UI as chunkRef).
 */
export function chunkLabel(chunkIndex: number, chunkSize: number = CHUNK_SIZE): string {
  const page = estimatePageForChunk(chunkIndex, chunkSize);
  return `~page ${page} · matched`;
}
