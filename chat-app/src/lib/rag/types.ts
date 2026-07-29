// src/lib/rag/types.ts

/** 원본 문서를 자른 한 조각 */
export type Chunk = {
  id: string;
  text: string;
  source: string;    // 파일명 (예: "Day3.md")
  heading: string;   // 이 조각이 속한 섹션 제목
  index: number;     // 문서 내 순번
};

/** 임베딩까지 붙은 조각 */
export type EmbeddedChunk = Chunk & {
  embedding: number[];
};

/** 저장소 파일 전체 */
export type VectorStore = {
  model: string;
  dimensions: number;
  createdAt: string;
  chunks: EmbeddedChunk[];
};

/** 검색 결과 */
export type SearchResult = Chunk & {
  score: number;
};