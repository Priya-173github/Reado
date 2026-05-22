import { TextChunk, RetrievedChunk } from '../../types/bookAI.types';
import { TOP_K_CHUNKS } from '../../constants/bookAIPrompts';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'is', 'was', 'are', 'were', 'be', 'been', 'has', 'have', 'had', 'do', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'it', 'its', 'this', 'that', 'these',
  'those', 'i', 'you', 'he', 'she', 'we', 'they', 'my', 'your', 'his', 'her', 'our',
]);

/**
 * Tokenises a string into meaningful lowercase words, stripping stop words.
 */
function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Builds a term-frequency map for a list of tokens.
 */
function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  return tf;
}

/**
 * TF-IDF cosine similarity search over chunks.
 * Returns topK most relevant chunks for the given query.
 */
export function retrieve(
  query: string,
  chunks: TextChunk[],
  topK: number = TOP_K_CHUNKS,
): RetrievedChunk[] {
  const queryTokens = tokenise(query);
  if (queryTokens.length === 0 || chunks.length === 0) return [];

  const queryTF = termFrequency(queryTokens);

  // Build IDF: how rare each query term is across all chunks
  const idf = new Map<string, number>();
  for (const term of queryTF.keys()) {
    const docCount = chunks.filter(c => tokenise(c.text).includes(term)).length;
    idf.set(term, docCount > 0 ? Math.log(chunks.length / docCount + 1) : 0);
  }

  const scored: RetrievedChunk[] = chunks.map(chunk => {
    const chunkTokens = tokenise(chunk.text);
    const chunkTF = termFrequency(chunkTokens);
    const total = chunkTokens.length || 1;

    let score = 0;
    for (const [term, qFreq] of queryTF.entries()) {
      const cFreq = chunkTF.get(term) ?? 0;
      const tf = cFreq / total;
      const idfVal = idf.get(term) ?? 0;
      // Also check prefix matches (e.g. "kill" matches "killed")
      const prefixBonus = [...chunkTF.keys()].some(
        k => k !== term && k.startsWith(term.slice(0, 4)) && term.length > 3,
      )
        ? 0.1
        : 0;
      score += (tf + prefixBonus) * idfVal * qFreq;
    }

    return { chunk, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(r => r.score > 0);
}

/**
 * Formats retrieved chunks into a single context string for the LLM prompt.
 */
export function formatContext(retrieved: RetrievedChunk[]): string {
  if (retrieved.length === 0) return '';
  return retrieved.map((r, i) => `[Passage ${i + 1}]\n${r.chunk.text}`).join('\n\n---\n\n');
}
