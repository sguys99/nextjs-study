// src/lib/rag/store.ts
import store from "@/../data/vector-store.json";
import type { SearchResult, VectorStore } from "./types";
import { embedQuery } from "./embedding";

const vectorStore = store as VectorStore;

/**
 * 코사인 유사도.
 * 🐍 numpy: float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))
 *    JS엔 numpy가 없으니 루프 한 번에 dot과 두 norm을 동시에 누적한다.
 */

export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length){
        throw new Error(`차원 불일치: ${a.length} vs ${b.length}`);
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;

}

export type SearchOptions = {
  topK?: number;
  minScore?: number;
  source?: string;     // 특정 파일로 한정 (메타데이터 필터)
};

/** 질의와 가장 가까운 청크 top-k를 반환 */
export async function searchChunks(
  query: string,
  { topK = 4, minScore = 0.3, source }: SearchOptions = {},
): Promise<SearchResult[]> {
  const queryVector = await embedQuery(query);

  const candidates = source
    ? vectorStore.chunks.filter((c) => c.source === source)
    : vectorStore.chunks;

  return candidates
    .map(({ embedding, ...chunk }) => ({
      ...chunk,
      score: cosineSimilarity(queryVector, embedding),
    }))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)     // 내림차순
    .slice(0, topK);
}