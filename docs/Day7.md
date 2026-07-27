# Day 7 — 프로젝트 ② RAG + 배포 + 회고

> **소요 시간**: 8시간 (90분 학습 + 15분 휴식 × 4세션)
> **선행 조건**: Day 6 완료 (도구를 쓰는 스트리밍 에이전트가 동작하는 상태)
> **목표**: 문서를 인덱싱하고 검색-증강 생성으로 답하는 RAG를 **에이전트 위에 도구로 얹는다.** 그리고 배포하고, 7일을 회고한다.
> **핵심 태그**: 🐍 = 파이썬 대비 포인트 · 💡 = 팁 · ⚠️ = 함정

---

## 0. 오늘의 목적 & 큰 그림

**오늘은 당신이 가장 편한 날입니다.** RAG의 개념 — 청킹, 임베딩, 코사인 유사도, top-k 검색, 컨텍스트 증강 — 은 이미 다 알고 있죠. 오늘 새로운 건 **TypeScript 배선뿐**입니다.

그래서 로드맵의 방침대로 개념 설명은 최소로 하고, **"파이썬에서 이렇게 하던 걸 TS에서는 이렇게 쓴다"**에 집중합니다.

### 0-1. 오늘 만들 것

```
[인덱싱: 하루 한 번, 오프라인]
docs/*.md ──청킹──▶ chunks[] ──embedMany──▶ vectors[] ──▶ data/vector-store.json

[질의: 매 대화마다, 온라인]
사용자 질문
   ▼
Claude 에이전트  ──(필요하다고 판단하면)──▶ searchKnowledgeBase 도구
                                              ▼
                                     질문 임베딩 → 코사인 유사도 → top-k
                                              ▼
                                     관련 청크 + 출처 반환
   ◀────────────────────────────────────────────┘
근거를 인용한 최종 답변 + 출처 UI
```

⭐ **핵심 설계 결정**: RAG를 "항상 검색 → 컨텍스트 주입"이 아니라 **"에이전트의 도구 중 하나"**로 만듭니다. 그러면 "안녕하세요"에는 검색 없이 답하고, "Day 3에서 제네릭을 뭐라고 설명했지?"에는 스스로 검색합니다. Day 6에서 도구 배선을 해뒀으니 **도구 하나 추가하는 일**에 가까워요.

### 0-2. 인덱싱할 문서 — 당신의 학습 자료

가장 좋은 재료는 **당신이 지금까지 만든 `docs/Day0.md ~ Day6.md`**입니다. "7일 학습 자료에 대해 답하는 챗봇"이 되죠. 답이 맞았는지 당신이 즉시 판단할 수 있다는 게 최대 장점입니다.

```bash
cd chat-app
mkdir -p knowledge data
cp ../docs/*.md knowledge/
ls knowledge/     # Day0.md ... Day6.md, roadmap.md
```

### 0-3. 저장소 구조 (오늘 추가분)

```
chat-app/
├── knowledge/                    ← 🆕 인덱싱할 원본 문서
│   └── Day0.md ... Day6.md
├── data/
│   └── vector-store.json         ← 🆕 임베딩 저장소 (git에 커밋 O)
└── src/
    ├── lib/
    │   ├── tools.ts              ← searchKnowledgeBase 추가
    │   └── rag/
    │       ├── embedding.ts      ← 🆕 임베딩 프로바이더 격리
    │       ├── chunk.ts          ← 🆕 청킹
    │       ├── store.ts          ← 🆕 유사도 검색
    │       └── types.ts          ← 🆕
    ├── scripts/
    │   ├── index-docs.ts         ← 🆕 인덱싱 실행
    │   └── query.ts              ← 🆕 검색 품질 확인용 CLI
    └── components/
        └── SourceList.tsx        ← 🆕 출처 표시
```

---

## 1. 세션 1 (오전) — 인덱싱 파이프라인

### 1-1. ⚠️ 먼저: 임베딩 프로바이더를 골라야 합니다

**Anthropic은 임베딩 API를 제공하지 않습니다.** 채팅은 Claude, 임베딩은 다른 곳 — 이건 정상적인 조합입니다.

| 선택지 | 설치 | 장점 | 단점 |
|---|---|---|---|
| **Voyage AI** (권장) | `pnpm add voyage-ai-provider` | Anthropic이 권장하는 파트너, 무료 티어 넉넉, 검색 품질 우수 | 계정 하나 더 |
| **OpenAI** | `pnpm add @ai-sdk/openai` | 가장 널리 쓰임, 예제 많음 | 계정/결제 필요 |

💡 **어느 쪽을 골라도 오늘 코드는 딱 한 파일만 다릅니다.** 그래서 프로바이더를 `embedding.ts` 하나에 격리합니다 — 🐍 파이썬에서 임베딩 함수를 인터페이스 뒤로 숨기던 것과 같은 습관이에요.

```bash
# 선택 A — Voyage
pnpm add voyage-ai-provider
echo 'VOYAGE_API_KEY=pa-...' >> .env.local

# 선택 B — OpenAI
pnpm add @ai-sdk/openai
echo 'OPENAI_API_KEY=sk-...' >> .env.local
```

```ts
// src/lib/rag/embedding.ts
// ⭐ 임베딩 프로바이더를 여기 한 곳에만 둔다. 바꿀 땐 이 파일만 수정.

import { embed, embedMany } from "ai";

// ── 선택 A: Voyage AI ──────────────────────────────
import { voyage } from "voyage-ai-provider";
export const embeddingModel = voyage.textEmbeddingModel("voyage-3-lite");

// ── 선택 B: OpenAI (위를 주석 처리하고 이걸 사용) ──
// import { openai } from "@ai-sdk/openai";
// export const embeddingModel = openai.textEmbeddingModel("text-embedding-3-small");

/** 여러 문서를 한 번에 임베딩 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
  });
  return embeddings;
}

/** 질의 하나를 임베딩 */
export async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });
  return embedding;
}
```

🐍 파이썬 대응:

```python
# 🐍 개념적으로 동일
embeddings = client.embeddings.create(model=..., input=texts).data   # embedMany
embedding  = client.embeddings.create(model=..., input=[q]).data[0]  # embed
```

⚠️ **인덱싱과 질의는 반드시 같은 모델을 써야 합니다.** 벡터 공간이 다르면 유사도가 무의미해져요. 모델을 바꾸면 **전체 재인덱싱**이 필요합니다. (당연한 얘기지만, 실수하기 딱 좋은 자리라 적어둡니다.)

### 1-2. 타입 정의

```ts
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
```

🐍 Day 3에서 배운 `type` + 교차(`&`)가 그대로 쓰였습니다. `EmbeddedChunk = Chunk & { embedding }` — Pydantic 모델 상속과 같은 감각이죠.

### 1-3. 청킹 — 마크다운을 의미 단위로 자르기

```ts
// src/lib/rag/chunk.ts
import type { Chunk } from "./types";

const MAX_CHARS = 1200;   // 청크 최대 길이
const OVERLAP = 150;      // 청크 간 겹침 (문맥 끊김 방지)

/**
 * 마크다운을 헤딩 기준으로 나누고, 너무 긴 섹션은 문단 단위로 다시 자른다.
 * 🐍 LangChain의 MarkdownHeaderTextSplitter + RecursiveCharacterTextSplitter를
 *    직접 구현한 것. 로직이 눈에 보이는 게 학습엔 낫습니다.
 */
export function chunkMarkdown(text: string, source: string): Chunk[] {
  const lines = text.split("\n");
  const sections: { heading: string; body: string[] }[] = [];
  let current = { heading: "(문서 시작)", body: [] as string[] };

  for (const line of lines) {
    const match = /^(#{1,3})\s+(.*)$/.exec(line);   // #, ##, ### 만 경계로
    if (match) {
      if (current.body.length > 0) sections.push(current);
      current = { heading: match[2].trim(), body: [] };
    } else {
      current.body.push(line);
    }
  }
  if (current.body.length > 0) sections.push(current);

  const chunks: Chunk[] = [];
  let index = 0;

  for (const section of sections) {
    const body = section.body.join("\n").trim();
    if (body.length < 30) continue;   // 너무 짧으면 버림

    for (const piece of splitLong(body, MAX_CHARS, OVERLAP)) {
      chunks.push({
        id: `${source}#${index}`,
        // ⭐ 헤딩을 본문 앞에 붙인다 — 임베딩 품질이 눈에 띄게 좋아짐
        text: `[${source} > ${section.heading}]\n${piece}`,
        source,
        heading: section.heading,
        index,
      });
      index += 1;
    }
  }

  return chunks;
}

/** 긴 텍스트를 문단 경계를 존중하며 자르고, 앞부분을 조금 겹쳐준다 */
function splitLong(text: string, maxChars: number, overlap: number): string[] {
  if (text.length <= maxChars) return [text];

  const paragraphs = text.split(/\n{2,}/);
  const out: string[] = [];
  let buf = "";

  for (const p of paragraphs) {
    if (buf.length + p.length + 2 > maxChars && buf.length > 0) {
      out.push(buf.trim());
      buf = buf.slice(-overlap) + "\n\n" + p;   // ← 겹침
    } else {
      buf += (buf ? "\n\n" : "") + p;
    }
  }
  if (buf.trim()) out.push(buf.trim());

  return out;
}
```

💡 **청킹 팁 두 가지** (이미 알고 있겠지만 코드로 확인):
- **헤딩을 청크 텍스트에 포함**시키면 "이게 어디 얘기인지"가 임베딩에 반영됩니다. 효과가 큽니다.
- **겹침(overlap)**은 문장이 청크 경계에서 잘려 의미를 잃는 걸 막습니다.

### 1-4. 인덱싱 스크립트

```ts
// src/scripts/index-docs.ts
import "dotenv/config";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { chunkMarkdown } from "@/lib/rag/chunk";
import { embedTexts } from "@/lib/rag/embedding";
import type { EmbeddedChunk, VectorStore } from "@/lib/rag/types";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const OUT_PATH = path.join(process.cwd(), "data", "vector-store.json");
const BATCH = 50;   // 한 번에 임베딩할 청크 수

async function main() {
  // ① 로드
  const files = (await readdir(KNOWLEDGE_DIR)).filter((f) => f.endsWith(".md"));
  console.log(`📄 문서 ${files.length}개 발견`);

  // ② 청킹
  const allChunks = [];
  for (const file of files) {
    const raw = await readFile(path.join(KNOWLEDGE_DIR, file), "utf-8");
    const chunks = chunkMarkdown(raw, file);
    console.log(`  - ${file}: ${chunks.length} 청크`);
    allChunks.push(...chunks);
  }
  console.log(`✂️  총 ${allChunks.length} 청크`);

  // ③ 임베딩 (배치로 나눠서)
  const embedded: EmbeddedChunk[] = [];
  for (let i = 0; i < allChunks.length; i += BATCH) {
    const batch = allChunks.slice(i, i + BATCH);
    const vectors = await embedTexts(batch.map((c) => c.text));

    batch.forEach((chunk, j) => {
      embedded.push({ ...chunk, embedding: vectors[j] });
    });

    console.log(`🧮 임베딩 ${Math.min(i + BATCH, allChunks.length)}/${allChunks.length}`);
  }

  // ④ 저장
  const store: VectorStore = {
    model: "voyage-3-lite",
    dimensions: embedded[0]?.embedding.length ?? 0,
    createdAt: new Date().toISOString(),
    chunks: embedded,
  };

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(store), "utf-8");

  console.log(`\n✅ 저장 완료: ${OUT_PATH}`);
  console.log(`   차원: ${store.dimensions}, 청크: ${store.chunks.length}개`);
}

main().catch((err) => {
  console.error("❌ 인덱싱 실패:", err);
  process.exit(1);
});
```

`package.json`에 스크립트 추가:

```json
{
  "scripts": {
    "index": "tsx src/scripts/index-docs.ts",
    "query": "tsx src/scripts/query.ts"
  }
}
```

```bash
pnpm index
```

⚠️ `tsx`가 `@/` 별칭을 못 알아들으면 `tsconfig-paths`를 쓰거나, 스크립트 안의 import만 상대경로(`../lib/rag/chunk`)로 바꾸세요. 가장 빠른 해결은 상대경로입니다.

🐍 파이썬으로 짜던 인덱싱 스크립트와 **구조가 완전히 같습니다.** 다른 건 `pathlib` → `node:path`, `open()` → `readFile`, `json.dump` → `JSON.stringify` 정도예요.

### ✅ 세션 1 체크
- [ ] 임베딩 프로바이더 선택 및 키 설정
- [ ] `chunkMarkdown`으로 청크 생성 확인
- [ ] **문서 인덱싱 → 임베딩 저장 성공** ⭐(로드맵 필수)
- [ ] `data/vector-store.json` 생성 확인, 차원 수 확인
- [ ] 청크 하나를 눈으로 열어 내용이 온전한지 확인

---

## 2. 세션 2 (오전) — 검색 (retrieval)

### 2-1. ⭐ 코사인 유사도를 직접 구현

로드맵의 핵심 의도가 여기 있습니다 — **벡터DB의 블랙박스 대신 계산을 눈으로 보기.**

```ts
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
  if (a.length !== b.length) {
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
```

**Day 1~3이 전부 여기서 만납니다:**

| 코드 | 어디서 배웠나 |
|---|---|
| `.map().filter().sort().slice()` 체이닝 | Day 1 배열 메서드 |
| `({ embedding, ...chunk })` | Day 1 구조 분해 + rest — **embedding만 떼어내 결과에서 제외** |
| `async`/`await` | Day 2 |
| `SearchResult`, 제네릭 없는 명시 타입 | Day 3 |

💡 `({ embedding, ...chunk })` 이 한 줄이 예쁩니다. 유사도 계산엔 임베딩이 필요하지만 **반환값에는 1536개짜리 숫자 배열을 담고 싶지 않죠.** 구조 분해로 자연스럽게 제외됩니다. 🐍 파이썬이라면 `{k: v for k, v in chunk.items() if k != "embedding"}` 라고 썼을 자리예요.

⚠️ **`import store from "@/../data/vector-store.json"`으로 가져오는 이유**: 런타임에 `fs.readFile`로 읽으면 Vercel 같은 서버리스 환경에서 파일을 못 찾는 경우가 많습니다. **JSON을 모듈로 import하면 번들에 포함**되어 어디서든 동작해요. (세션 4의 배포에서 다시 언급합니다.)

💡 참고로 AI SDK에도 `cosineSimilarity`가 들어 있습니다(`import { cosineSimilarity } from "ai"`). 하지만 오늘은 직접 짠 버전을 씁니다 — 로드맵의 의도대로요. 결과가 같은지 비교해보는 것도 좋은 연습입니다.

### 2-2. 검색 품질 확인용 CLI

**UI에 붙이기 전에 반드시 콘솔에서 검색 품질을 확인하세요.** RAG가 이상할 때 "검색이 문제인지 생성이 문제인지" 구분하는 가장 빠른 방법입니다.

```ts
// src/scripts/query.ts
import "dotenv/config";
import { searchChunks } from "@/lib/rag/store";

const query = process.argv.slice(2).join(" ");

if (!query) {
  console.error("사용법: pnpm query <질문>");
  process.exit(1);
}

const results = await searchChunks(query, { topK: 5, minScore: 0 });

console.log(`\n🔍 "${query}"\n`);
for (const r of results) {
  console.log(`[${r.score.toFixed(3)}] ${r.source} > ${r.heading}`);
  console.log(`   ${r.text.replace(/\n/g, " ").slice(0, 120)}…\n`);
}
```

```bash
pnpm query "제네릭이 파이썬의 무엇과 대응돼?"
pnpm query "useEffect가 두 번 실행되는 이유"
pnpm query "서버 컴포넌트와 클라이언트 컴포넌트 차이"
pnpm query "오늘 점심 뭐 먹지"        # ← 관련 없는 질문의 점수를 보세요
```

**점검할 것:**

| 확인 | 문제라면 |
|---|---|
| 관련 질문의 top-1이 실제로 맞는 섹션인가? | 청킹 크기 조정, 헤딩 포함 확인 |
| 관련 질문 점수 vs 무관한 질문 점수 차이가 나는가? | `minScore` 임계값을 그 사이로 |
| 청크가 문장 중간에서 잘려 있나? | `MAX_CHARS` / `OVERLAP` 조정 |
| 같은 내용이 여러 청크에 중복되나? | overlap 축소 |

💡 **`minScore` 정하는 법**: 관련 질문 10개, 무관한 질문 10개를 던져서 점수 분포를 보고 그 사이 값을 고릅니다. 🐍 임계값 튜닝은 당신 전공이죠 — 감으로 정하지 말고 숫자를 보세요.

### ✅ 세션 2 체크
- [ ] `cosineSimilarity`를 직접 구현 (numpy 없이)
- [ ] **top-k 검색 결과가 질의와 관련 있음** ⭐(로드맵 필수)
- [ ] CLI로 관련/무관 질문의 점수 분포 확인
- [ ] `minScore` 임계값 결정
- [ ] (선택) `source` 필터로 특정 문서만 검색

---

## 3. 세션 3 (오후) — 증강 생성 & 에이전트 통합

### 3-1. 두 가지 통합 방식

| 방식 | 동작 | 장단점 |
|---|---|---|
| **A. 항상 검색** | 모든 질문에 대해 검색 → 시스템 프롬프트에 컨텍스트 주입 | 단순·예측 가능 / 잡담에도 검색 비용 발생, 검색이 필요 없는 질문에서 오히려 방해 |
| **B. 도구로 노출** ⭐ | 에이전트가 필요하다고 판단할 때만 검색 | 자연스럽고 효율적, 여러 번 다르게 검색 가능 / 모델이 검색을 안 할 위험 |

**우리는 B를 갑니다.** Day 6의 도구 배선이 그대로 재사용되고, 무엇보다 "에이전트가 스스로 판단하는" 모습을 볼 수 있으니까요.

💡 참고로 A도 알아둘 가치가 있습니다. 형태는 이렇습니다.

```ts
// 방식 A (참고용)
const hits = await searchChunks(lastUserText, { topK: 4 });
const context = hits.map((h) => `[출처: ${h.source} > ${h.heading}]\n${h.text}`).join("\n\n---\n\n");

const result = streamText({
  model,
  system: `${SYSTEM_PROMPT}\n\n다음 참고 자료를 근거로 답하세요:\n${context}`,
  messages: await convertToModelMessages(messages),
});
```

### 3-2. ⭐ RAG를 도구로 — `searchKnowledgeBase`

```ts
// src/lib/tools.ts 에 추가
import { tool } from "ai";
import { z } from "zod";
import { searchChunks } from "@/lib/rag/store";

export const searchKnowledgeBase = tool({
  description: `학습 자료 지식베이스(JS/TS/React/Next.js 7일 학습 문서)를 검색한다.
사용자가 학습 내용, 특정 개념, "Day N에서 뭐라고 했지" 같은 질문을 하면 반드시 이 도구를 사용한다.
답을 지어내지 말고 먼저 검색하라. 필요하면 다른 키워드로 여러 번 검색해도 된다.`,
  inputSchema: z.object({
    query: z
      .string()
      .describe("검색어. 사용자 질문을 그대로 쓰기보다 핵심 키워드 위주로 재작성한다."),
    topK: z.number().int().min(1).max(8).default(4)
      .describe("가져올 문서 조각 수"),
  }),
  execute: async ({ query, topK }) => {
    const results = await searchChunks(query, { topK });

    if (results.length === 0) {
      return { found: false, message: "관련 내용을 찾지 못했습니다.", results: [] };
    }

    return {
      found: true,
      results: results.map((r) => ({
        source: r.source,
        heading: r.heading,
        score: Number(r.score.toFixed(3)),
        // ⚠️ 토큰 절약: 너무 긴 청크는 자른다
        text: r.text.slice(0, 1000),
      })),
    };
  },
});

export const chatTools = {
  getCurrentTime,
  calculate,
  getGithubUser,
  searchKnowledgeBase,     // 🆕
};
```

**도구 설명에 담은 의도 3가지** (Day 6에서 배운 원칙 적용):
- "언제 쓰는가"를 구체적으로 (`"Day N에서 뭐라고 했지"` 같은 예시까지)
- **"답을 지어내지 말고 먼저 검색하라"** — 환각 억제의 핵심 문장
- **"여러 번 검색해도 된다"** — 첫 검색이 실패했을 때 다른 키워드로 재시도하게 유도

### 3-3. 시스템 프롬프트에 RAG 규칙 추가

```ts
// src/lib/prompts.ts
export const SYSTEM_PROMPT = `당신은 "7일 JS/TS/Next.js 학습 자료"에 대해 답하는 조수입니다.

원칙:
- 학습 자료 관련 질문은 반드시 searchKnowledgeBase 도구로 먼저 검색하세요. 기억에 의존하지 마세요.
- 검색 결과에 근거해서만 답하세요. 자료에 없는 내용은 "학습 자료에는 없지만, 일반적으로는…"이라고 구분해서 말하세요.
- 답변 끝에 참고한 출처를 "출처: Day3.md > 세션 3" 형식으로 밝히세요.
- 검색 결과가 질문과 무관하면, 다른 키워드로 한 번 더 검색해 보세요.
- 숫자 계산은 calculate, 현재 시각은 getCurrentTime을 사용하세요.
- 한국어로, 간결하게 답하세요.`;
```

⚠️ 이제 `route.ts`의 `stopWhen`을 조금 늘려주세요. "검색 → 결과 부족 → 재검색 → 답변"이 되려면 스텝이 더 필요합니다.

```ts
stopWhen: stepCountIs(6),
```

### 3-4. 출처(citation) UI

Day 6의 `ToolCallCard`가 도구 결과를 JSON으로 덤프하고 있었죠. RAG 검색만은 예쁘게 보여줍시다.

```tsx
// src/components/SourceList.tsx
type SourceItem = {
  source: string;
  heading: string;
  score: number;
  text: string;
};

export function SourceList({ results }: { results: SourceItem[] }) {
  if (results.length === 0) {
    return <p className="text-xs text-gray-400">관련 문서를 찾지 못했습니다.</p>;
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500">📚 참고한 자료</p>
      {results.map((r, i) => (
        <details
          key={i}
          className="rounded border border-gray-200 bg-white/70 px-2 py-1 text-xs"
        >
          <summary className="cursor-pointer text-gray-700">
            {r.source} <span className="text-gray-400">›</span> {r.heading}
            <span className="ml-2 text-gray-400">{r.score.toFixed(2)}</span>
          </summary>
          <p className="mt-1 whitespace-pre-wrap text-gray-500">
            {r.text.slice(0, 400)}…
          </p>
        </details>
      ))}
    </div>
  );
}
```

```tsx
// src/components/MessageItem.tsx — 도구 파트 분기에 추가
if (part.type === "tool-searchKnowledgeBase") {
  const p = part as unknown as {
    state: string;
    output?: { found: boolean; results: SourceItem[] };
  };

  if (p.state !== "output-available") {
    return (
      <p key={i} className="text-xs text-gray-400">
        📚 학습 자료를 검색하는 중…
      </p>
    );
  }
  return <SourceList key={i} results={p.output?.results ?? []} />;
}

// 나머지 도구는 기존 ToolCallCard로
if (part.type.startsWith("tool-")) { /* ... */ }
```

💡 `<details>` / `<summary>`는 **JS 없이 브라우저가 제공하는 접기/펼치기**입니다. `useState`로 토글을 만들 필요가 없어요 — Day 4의 "effect가 필요 없는 경우"와 같은 정신입니다.

### 3-5. 동작 확인

`pnpm dev` 후 이런 질문들을 던져보세요.

| 질문 | 기대 |
|---|---|
| "안녕하세요" | 검색 **없이** 인사 |
| "TS의 제네릭은 파이썬의 뭐랑 대응돼?" | 검색 → Day 3 인용 → 출처 표시 |
| "useEffect가 두 번 실행되는 이유가 뭐였지?" | 검색 → Day 4 인용 |
| "서버 컴포넌트를 3줄로 요약해줘" | 검색 → Day 5 인용 |
| "Day 6에서 배운 걸로 오늘 며칠인지 알려줘" | `searchKnowledgeBase` + `getCurrentTime` 둘 다 |
| "양자컴퓨터 원리 알려줘" | 검색 실패 → "자료에 없다"고 구분해서 답변 |

**마지막 질문이 특히 중요합니다.** RAG의 품질은 "찾았을 때 잘 답하는 것"보다 **"못 찾았을 때 지어내지 않는 것"**으로 판가름 나요. 🐍 ML 하시니 익숙한 이야기죠 — precision을 보세요.

### ✅ 세션 3 체크
- [ ] `searchKnowledgeBase` 도구 동작
- [ ] 에이전트가 **필요할 때만** 검색하는 것 확인
- [ ] **RAG 답변에 출처 표시** ⭐(로드맵 필수)
- [ ] 자료에 없는 질문에 지어내지 않는 것 확인
- [ ] RAG 도구 + 다른 도구 조합 호출 성공

---

## 4. 세션 4 (오후) — 배포 & 회고

### 4-1. 배포 전 점검

```bash
cd chat-app
pnpm lint
pnpm build          # ⭐ 반드시 통과해야 함
```

⚠️ **커밋할 것과 안 할 것:**

| 파일 | git | 이유 |
|---|---|---|
| `data/vector-store.json` | ✅ 커밋 | 배포 시 번들에 포함되어야 함 |
| `knowledge/*.md` | ✅ 커밋 | 원본 문서 |
| `.env.local` | ❌ 절대 금지 | API 키 |
| `.next/`, `node_modules/` | ❌ | 빌드 산출물 |

```bash
grep -rn "sk-ant\|pa-\|sk-proj" src/ && echo "⚠️ 키 하드코딩 발견!" || echo "✅ 깨끗함"
```

💡 `vector-store.json`이 너무 크면(수십 MB) git이 무거워집니다. 학습용 문서 10개 정도면 보통 1~5MB 수준이라 괜찮아요. 실무에서는 이 지점에서 진짜 벡터DB로 갈아탑니다.

### 4-2. Vercel 배포 (선택)

```bash
pnpm dlx vercel
```

또는 GitHub 저장소를 [vercel.com](https://vercel.com)에 연결합니다. ⚠️ **Root Directory를 `chat-app`으로 지정**하세요 (저장소 루트가 아니라).

**환경 변수 설정** (Vercel 대시보드 → Settings → Environment Variables):

```
ANTHROPIC_API_KEY = sk-ant-...
VOYAGE_API_KEY = pa-...          (또는 OPENAI_API_KEY)
```

⚠️ **배포 후 흔한 문제:**

| 증상 | 원인 | 해결 |
|---|---|---|
| 500 에러, 로컬은 정상 | 환경 변수 미설정 | Vercel 대시보드에서 추가 후 **재배포** |
| `Cannot find module '.../vector-store.json'` | `fs.readFile`로 런타임 로드 | JSON을 `import`로 (세션 2-1 참고) |
| 스트리밍이 중간에 끊김 | 함수 실행 시간 초과 | `export const maxDuration = 30` 확인 |
| 빌드 실패 | 로컬 캐시로 가려진 타입 에러 | 로컬에서 `rm -rf .next && pnpm build` |

💡 배포는 **오늘의 보너스**입니다. 시간이 부족하면 로드맵의 우선순위대로 과감히 건너뛰세요 — 핵심 목표는 이미 달성했습니다.

### 4-3. 전체 코드 리뷰 — 스스로 점검

앱 전체를 한 번 훑으면서 확인해 보세요.

**구조**
- [ ] `"use client"`가 최소한의 파일에만 있는가?
- [ ] LLM/임베딩 호출이 **전부 서버(Route Handler)**에서만 일어나는가?
- [ ] 프롬프트가 `lib/prompts.ts`에 모여 있는가?
- [ ] RAG 로직이 `lib/rag/` 안에 격리되어 있는가?

**타입**
- [ ] `any`가 남아 있지 않은가? (`as unknown as`도 최소화)
- [ ] 컴포넌트 props가 전부 타입 정의되어 있는가?
- [ ] `pnpm build`가 타입 에러 없이 통과하는가?

**안전**
- [ ] `stopWhen`이 모든 `streamText`에 걸려 있는가?
- [ ] 도구가 에러를 `throw` 대신 반환하는가?
- [ ] 입력 검증(대화 길이, 필드 타입)이 있는가?
- [ ] 키가 코드나 git 히스토리에 없는가?

**리팩터링 후보** (지금 안 해도 됨, 목록만)
- 대화 히스토리 영속화 (지금은 새로고침하면 사라짐)
- 인덱싱 증분 갱신 (지금은 매번 전체 재계산)
- 검색 결과 리랭킹
- 도구 실행 로깅/관측

### 4-4. 🎓 7일 회고

**당신이 7일 전에 몰랐고 지금 아는 것:**

| Day | 얻은 것 |
|---|---|
| 0~1 | Node 생태계, `package.json`, ESLint/Prettier, JS 코어 문법 |
| 2 | 이벤트 루프, Promise/async-await, `fetch`, ES Modules |
| 3 | TypeScript 타입 시스템, 제네릭, narrowing, Zod |
| 4 | 선언형 UI, `useState`/`useEffect`, 커스텀 훅, 불변 업데이트 |
| 5 | App Router, **서버/클라이언트 컴포넌트**, Route Handler, 스트리밍 |
| 6 | AI SDK v6, `streamText`/`useChat`, tool calling, 에이전트 루프 |
| 7 | 청킹/임베딩/코사인 검색을 TS로, RAG를 도구로 통합, 배포 |

**7일을 관통한 3가지 사고 전환:**

1. **"DOM을 조작한다" → "상태의 함수로서 UI"** (Day 4)
2. **"프론트/백이 별개 프로젝트" → "같은 언어, 다른 실행 위치"** (Day 5)
3. **"LLM을 호출한다" → "LLM에게 도구를 쥐여주고 루프를 돌린다"** (Day 6~7)

**솔직한 자기평가 (체크해 보세요):**
- [ ] `useState`와 `useEffect`를 보고 "왜 여기 쓰였는지" 설명할 수 있다
- [ ] 새 컴포넌트를 만들 때 서버/클라이언트를 망설임 없이 고른다
- [ ] 남의 Next.js 코드를 읽고 데이터 흐름을 따라갈 수 있다
- [ ] AI SDK 문서를 보고 새 기능을 스스로 붙일 수 있다

💡 4개 중 3개 이상이면 목표 달성입니다. 안 되는 항목이 있으면 **해당 Day 문서를 다시 보고 예제를 처음부터 다시 쳐보세요.** 읽는 것보다 치는 게 빠릅니다.

### 4-5. 다음 학습 방향

**바로 이어서 하면 좋은 것 (난이도 순)**

1. **대화 영속화** — SQLite/Postgres + Drizzle ORM. 🐍 SQLAlchemy 자리에 Drizzle. Server Action을 쓸 첫 실전 기회입니다.
2. **인증** — Auth.js(NextAuth). 사용자별 대화 분리.
3. **테스트** — Vitest로 `cosineSimilarity`, `chunkMarkdown` 같은 순수 함수부터. 🐍 pytest 감각 그대로.
4. **상태관리** — TanStack Query(서버 상태), Zustand(클라이언트 전역 상태). ⚠️ 필요해지기 전엔 넣지 마세요.

**당신의 배경을 살리는 방향 (ML 개발자 특화)**

5. **RAG 심화** — 하이브리드 검색(BM25 + 벡터), 리랭킹, 청킹 전략 A/B 비교. **이건 당신이 저보다 잘 아는 영역**이고, 이제 TS로 구현할 배선까지 갖췄습니다.
6. **에이전트 평가(eval)** — 도구 선택 정확도, RAG 정답률을 데이터셋으로 측정. 🐍 실험 관리 습관을 그대로 가져오세요.
7. **프로덕션 벡터DB** — pgvector로 교체. 오늘 만든 `store.ts`의 인터페이스만 유지하면 내부만 갈아끼우면 됩니다.
8. **MCP** — 외부 도구를 표준 프로토콜로 연결. AI SDK v6는 `createMCPClient`를 제공합니다.

**추천 자료**
- React 공식 문서의 "Learn" 섹션 — 특히 *Thinking in React*, *You Might Not Need an Effect*
- Next.js 공식 Learn 코스
- AI SDK 문서의 Agents / RAG 섹션

### ✅ 세션 4 체크
- [ ] `pnpm build` 성공, 키 노출 없음 확인
- [ ] (선택) **배포 URL 접속 가능** ⭐(로드맵 선택 항목)
- [ ] 코드 리뷰 체크리스트 점검
- [ ] 7일 회고 작성

---

## 5. ✅ Day 7 완료 체크리스트

- [ ] **문서 인덱싱 → 임베딩 저장 성공** ⭐(로드맵 필수)
- [ ] **top-k 검색 결과가 질의와 관련 있음** ⭐(로드맵 필수)
- [ ] 코사인 유사도를 직접 구현 (numpy 없이)
- [ ] RAG를 도구로 에이전트에 통합
- [ ] **RAG 답변에 출처 표시** ⭐(로드맵 필수)
- [ ] 자료에 없는 질문에 환각하지 않음 확인
- [ ] (선택) **배포 URL 접속 가능** ⭐
- [ ] 7일 회고 완료

---

## 6. 자주 나오는 함정 정리 (⚠️)

| 증상 | 원인 | 해결 |
|---|---|---|
| `차원 불일치` 에러 | 인덱싱과 질의의 임베딩 모델이 다름 | 같은 모델로 재인덱싱 |
| 검색 결과가 다 엉뚱함 | 청크에 헤딩/맥락이 없음 | 청크 텍스트에 헤딩 포함 |
| 점수가 전부 0.9 이상 | 정규화된 모델의 정상 분포 | 절댓값 대신 **상대 순위**를 보고 임계값 재설정 |
| 관련 없는 질문도 결과가 나옴 | `minScore`가 낮음 | 점수 분포 확인 후 상향 |
| 청크가 문장 중간에서 잘림 | overlap 부족 | `OVERLAP` 증가 |
| 임베딩 API 429 | 배치 크기 과다 / 속도 제한 | `BATCH` 축소, 재시도 추가 |
| 도구가 검색을 안 함 | description·시스템 프롬프트 부실 | "반드시 먼저 검색" 명시 |
| 검색은 했는데 답변에 안 씀 | `stopWhen`이 작음 | `stepCountIs(6)` 이상 |
| 답변이 자료에 없는 내용을 지어냄 | 프롬프트에 근거 제한 없음 | "검색 결과에 근거해서만" 명시 |
| 토큰 비용 급증 | 청크가 너무 크거나 topK 과다 | `topK` 3~4, 청크 텍스트 슬라이스 |
| 배포 후 `Cannot find module json` | 런타임 `fs.readFile` | JSON을 `import` |
| 배포 후 500 | 환경 변수 미설정 | Vercel에 등록 후 재배포 |
| `pnpm index`가 `@/` 못 찾음 | tsx 별칭 미해석 | 스크립트에서 상대경로 사용 |

---

## 7. 저장소 커밋 & 마무리

```bash
cd ..
git status                    # ⚠️ .env.local 없어야 함
git add chat-app docs/Day7.md
git commit -m "Day 7: 로컬 벡터스토어 RAG + 에이전트 통합 + 배포"
git push
```

`README.md`를 하나 써두면 나중의 당신에게 큰 선물이 됩니다.

```markdown
# nextjs-study

Python ML 개발자의 7일 JS/TS → Next.js → 에이전트/RAG 학습 기록.

## 결과물
`chat-app/` — Claude 기반 스트리밍 챗봇
- tool calling 에이전트 (시각/계산/GitHub/지식베이스 검색)
- 로컬 벡터스토어 RAG (코사인 유사도 직접 구현)

## 실행
\`\`\`bash
cd chat-app
pnpm install
cp .env.example .env.local     # 키 입력
pnpm index                     # 문서 인덱싱
pnpm dev
\`\`\`

## 학습 자료
`docs/Day0.md` ~ `docs/Day7.md`
```

💡 `.env.example`도 만들어 두세요 (키 값은 비워두고 이름만).

---

### 부록 A — Python RAG ↔ TypeScript RAG 치트시트

```
# 파일 IO
pathlib.Path("k").glob("*.md")        →  await readdir(dir) + filter(f => f.endsWith(".md"))
path.read_text()                      →  await readFile(p, "utf-8")
json.dump(obj, f)                     →  await writeFile(p, JSON.stringify(obj))
json.load(f)                          →  import store from "./store.json"

# 임베딩
client.embeddings.create(input=texts)  →  await embedMany({ model, values: texts })
client.embeddings.create(input=[q])    →  await embed({ model, value: q })

# 유사도 (numpy 없음!)
a @ b                                  →  루프로 dot 누적
np.linalg.norm(a)                      →  Math.sqrt(루프로 제곱합)
cos = a@b / (|a|*|b|)                  →  cosineSimilarity(a, b)  ← 직접 구현
np.argsort(scores)[::-1][:k]           →  .sort((x,y) => y.score - x.score).slice(0, k)

# 데이터 변환
[{**c, "score": s} for c, s in ...]    →  .map(c => ({ ...c, score }))
{k:v for k,v in d.items() if k!="e"}   →  const { e, ...rest } = obj
[c for c in cs if c.score > t]         →  cs.filter(c => c.score > t)
sorted(xs, key=lambda x: -x.score)     →  xs.sort((a,b) => b.score - a.score)

# 청킹
LangChain TextSplitter                 →  직접 구현 (chunk.ts)
```

### 부록 B — RAG가 이상할 때 진단 순서

```
1. pnpm query "<질문>" 로 검색만 따로 확인
     └─ 결과가 엉뚱함  →  검색 문제 (청킹/임베딩/임계값)
     └─ 결과가 정확함  →  2번으로

2. 서버 콘솔에서 도구가 호출됐는지 확인
     └─ 호출 안 됨    →  description / 시스템 프롬프트 문제
     └─ 호출됨        →  3번으로

3. 도구가 반환한 output을 UI/로그에서 확인
     └─ 내용이 잘림    →  slice 길이, topK 조정
     └─ 정상          →  4번으로

4. 답변이 검색 결과를 무시함
     └─ stopWhen 부족 (결과 받고 끝남)
     └─ 시스템 프롬프트에 "근거해서만 답하라"가 없음
```

### 부록 C — 최종 앱 구조 한눈에

```
chat-app/src/
├── app/
│   ├── layout.tsx              [서버] 전역 껍데기
│   ├── page.tsx                [서버] 홈
│   └── api/chat/route.ts       [서버] streamText + tools + stopWhen
├── components/
│   ├── ChatPanel.tsx           [클라이언트] useChat 경계
│   ├── MessageList.tsx         [클라이언트] parts 순회
│   ├── MessageItem.tsx         [클라이언트] text/tool 파트 분기
│   ├── ToolCallCard.tsx        [클라이언트] 일반 도구 표시
│   ├── SourceList.tsx          [클라이언트] RAG 출처 표시
│   └── ChatInput.tsx           [클라이언트] 입력 + 중단
├── hooks/useAutoScroll.ts      [클라이언트] Day 4에서 온 그대로
├── lib/
│   ├── prompts.ts              시스템 프롬프트
│   ├── tools.ts                도구 4종
│   └── rag/
│       ├── embedding.ts        프로바이더 격리
│       ├── chunk.ts            청킹
│       ├── store.ts            코사인 유사도 + top-k
│       └── types.ts
└── scripts/
    ├── index-docs.ts           인덱싱
    └── query.ts                검색 확인
```

---

## 🎉 마무리

7일 전 당신은 파이썬만 쓰는 ML 개발자였습니다. 지금은 **타입 안전한 풀스택 TypeScript 앱을 직접 만들고, 그 안에서 에이전트와 RAG를 배선할 수 있는 사람**입니다.

솔직히 말하면, 56시간에 이걸 다 소화하는 건 공격적인 일정이었습니다. 다 못 따라온 부분이 있어도 정상이에요. 중요한 건 **"어디를 찾아봐야 하는지 아는 상태"**가 되었다는 것이고, 그건 이미 됐습니다.

그리고 만든 앱은 여기서 끝내지 마세요. 진짜 학습은 **"이 앱에 내가 원하는 기능 하나를 더 붙이는 순간"**에 일어납니다. 🚀

수고 많으셨습니다.
