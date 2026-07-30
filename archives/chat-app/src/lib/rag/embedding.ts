import {embed, embedMany} from "ai";

// ── 선택 A: Voyage AI ──────────────────────────────
import { voyage } from "voyage-ai-provider";
export const embeddingModel = voyage.textEmbeddingModel("voyage-3-lite");

// ── 선택 B: OpenAI (위를 주석 처리하고 이걸 사용) ──
// import { openai } from "@ai-sdk/openai";
// export const embeddingModel = openai.textEmbeddingModel("text-embedding-3-small");

/**
 * 짝 잃은 서로게이트를 U+FFFD로 치환해 유효한 UTF-8을 보장한다.
 * ⚠️ 이모지가 slice()로 반토막 나면 임베딩 API가 400을 낸다. 최후의 안전망.
 */
function sanitize(text: string): string {
  return text.toWellFormed();
}

/** 여러 문서를 한 번에 임베딩 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts.map(sanitize),
    // 429(rate limit)를 만나면 지수 백오프로 재시도. 기본값은 2번뿐이라 늘려둔다.
    maxRetries: 6,
  });
  return embeddings;
}

/** 질의 하나를 임베딩 */
export async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: sanitize(text),
  });
  return embedding;
}