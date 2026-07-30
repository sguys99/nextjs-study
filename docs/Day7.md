# Day 7 — RAG 직접 구현: 원리를 눈으로 본다

> **소요 시간**: 약 8시간 (90분 × 4세션).
> **선행 조건**: Day 6 완료 (도구를 쓰는 스트리밍 챗봇 동작, `chat-app`).
> **오늘의 목표**: RAG를 **프레임워크 없이 손으로** 구현해 개념을 눈으로 본다 — 청킹 → 임베딩 → **직접 짠 코사인 유사도** → top-k 검색 → 챗봇에 도구로 통합. 내일(Day 8) 이걸 LangChain.js로 교체하며 "라이브러리가 뭘 대신 해주나"를 대조한다.
>
> **태그 범례**: `🐍` Python 대비 · `💡` 팁 · `⚠️` 함정 · `🎯` 배경 · `📖` 설명용(읽기만) · `⌨️` 실습(직접 치기) · `✅` 완성본

---

## 0. 오늘의 큰 그림 (5분)

**당신이 가장 편한 날입니다.** RAG의 개념 — 청킹·임베딩·코사인 유사도·top-k·컨텍스트 증강 — 은 이미 다 아니까요. 오늘 새로운 건 **TypeScript 배선뿐**이에요.

### 🎯 배경 — 왜 "직접 구현"부터 하나

RAG를 라이브러리(LangChain·벡터DB)로 시작하면 편하지만, **내부가 블랙박스**가 됩니다. ML 개발자에게는 반대가 낫습니다:

1. **오늘(Day 7)**: 임베딩·유사도·검색을 **손으로** 짜서 "벡터 검색이 그냥 숫자 계산"임을 눈으로 봅니다.
2. **내일(Day 8)**: 같은 걸 LangChain.js로 다시 짜서 "라이브러리가 감춰주는 게 무엇인지" 대조합니다.

🐍 오늘 쓰는 임베딩 모델 `all-MiniLM-L6-v2`는 **당신이 Python `sentence-transformers`로 써봤을 바로 그 모델**입니다. numpy로 하던 dot/norm 계산을 TS로 옮기는 것뿐이에요.

### 0-1. 오늘 만들 것

```
[인덱싱: 오프라인, 한 번만]
knowledge/*.md ──청킹──▶ chunks[] ──임베딩──▶ vectors[] ──▶ data/vector-store.json

[질의: 매 대화마다]
사용자 질문 ──▶ Claude 챗봇 ──(필요 판단)──▶ searchKnowledgeBase 도구
                                                 ▼
                                    질문 임베딩 → 코사인 유사도 → top-k 청크
                                                 ▼
                                    관련 청크 + 출처 반환 → Claude가 인용해 답변
```

⭐ **핵심 설계**: RAG를 "항상 검색"이 아니라 **"챗봇의 도구 중 하나"**로 만듭니다(Day 6 도구 시스템 재사용). "안녕"에는 검색 없이 답하고, "Day 3에서 제네릭을 뭐라 설명했지?"에는 스스로 검색해요.

### 0-2. 임베딩 방식 — 로컬 모델 (추가 키·비용 없음)

⚠️ **Anthropic은 임베딩 API가 없습니다.** 그래서 오늘은 **로컬에서 도는 임베딩 모델**을 씁니다.

- `@huggingface/transformers`(Transformers.js)로 `Xenova/all-MiniLM-L6-v2`를 **당신 컴퓨터에서** 실행 → 384차원 벡터.
- 장점: **추가 API 키 불필요, 호출 비용 0**, "전부 로컬"이라는 오늘 테마에 딱.
- ⚠️ 첫 실행 때 모델(약 90MB)을 자동 다운로드합니다(한 번만).
- 💡 API 임베딩(OpenAI 등)을 원하면 나중에 교체 가능하지만, 오늘은 로컬로 원리를 봅니다.

### 0-3. 인덱싱할 문서 — 당신의 학습 자료

가장 좋은 재료는 **지금까지 만든 `docs/Day0.md ~ Day6.md`**입니다. "내 7일 학습 자료에 답하는 챗봇"이 되죠. 답이 맞는지 **당신이 즉시 판단**할 수 있는 게 최대 장점이에요.

⌨️ 실습 — `chat-app/`에서 (macOS/Linux)

```bash
mkdir -p knowledge data scripts src/lib
cp ../docs/*.md knowledge/     # Day0.md ... Day6.md, roadmap.md
ls knowledge/
```

### 0-4. 설치 & Next.js 설정

⌨️ 실습 — `chat-app/`에서

```bash
pnpm add @huggingface/transformers
```

⚠️ **Next.js 설정 필수**: Transformers.js는 네이티브 모듈을 써서, Next.js가 번들링하려 하면 에러가 납니다. **서버 외부 패키지로 지정**하세요.

⌨️ 실습 — `chat-app/next.config.ts` **부분 수정**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@huggingface/transformers"],
};

export default nextConfig;
```

---

## 1. 세션 1 (오전) — 인덱싱 파이프라인

문서를 벡터로 바꿔 저장하는 오프라인 단계입니다.

### 1-1. 청킹 — 문서를 조각으로

**① 왜**: 문서 전체를 한 벡터로 만들면 검색이 뭉툭해집니다. **의미 단위(문단)로 잘라** 각 조각을 벡터화해야 정확히 찾아요.
**② 쉬운 설명**: 문단 단위로 자르되, 너무 길면 나누고, 문맥이 끊기지 않게 **약간 겹치기(overlap)**.

⌨️ 실습 — `src/lib/chunk.ts` 새 파일

```ts
// 문단(빈 줄) 기준으로 자르고, maxChars를 넘으면 새 청크로. overlap으로 문맥 연결.
export function chunkText(text: string, maxChars = 800, overlap = 100): string[] {
  const paragraphs = text.split(/\n\s*\n/); // 빈 줄로 문단 분리
  const chunks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    if (current && (current + "\n\n" + p).length > maxChars) {
      chunks.push(current.trim());
      current = current.slice(-overlap) + "\n\n" + p; // 겹침
    } else {
      current = current ? current + "\n\n" + p : p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
```

💡 이건 **단순한 청커**입니다. Day 8에서 LangChain의 `RecursiveCharacterTextSplitter`(더 똑똑한 버전)로 교체해요. 오늘은 "청킹이 별거 아니라 그냥 문자열 자르기"임을 보는 게 목적입니다.

### 1-2. 임베딩 — 텍스트를 벡터로 (로컬 모델)

**② 쉬운 설명**: 임베딩 모델은 텍스트를 **의미를 담은 숫자 배열(벡터)**로 바꿉니다. 비슷한 뜻이면 비슷한 벡터가 나와요.

⌨️ 실습 — `src/lib/embed.ts` 새 파일

```ts
import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

// 모델은 무겁다 → 한 번만 로드해 재사용(싱글턴)
let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return extractorPromise;
}

// 텍스트 하나 → 384차원 벡터
export async function embed(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}
```

💡 두 옵션의 뜻:
- `pooling: "mean"`: 단어별 벡터를 평균 내 **문장 하나의 벡터**로. 🐍 sentence-transformers가 내부에서 하던 그것.
- `normalize: true`: 벡터를 **길이 1로 정규화**. 이게 세션 2에서 코사인 계산을 단순하게 만들어줍니다(중요!).

> ⌨️ **미니 실습** — `src/lib/embed.ts` 하단에 임시로 추가하고 `pnpm exec tsx src/lib/embed.ts`로 실행
> ```ts
> // 임시 확인 (확인 후 지우기)
> const v = await embed("안녕하세요");
> console.log("차원:", v.length);          // 384
> console.log("앞 5개:", v.slice(0, 5));
> ```
> (첫 실행은 모델 다운로드로 느립니다.)

### 1-3. 인덱싱 스크립트 — 전부 벡터화해 저장

먼저 저장할 데이터 모양을 정의합니다.

⌨️ 실습 — `src/lib/vector-store.ts` 새 파일 (타입 + 나중에 검색 함수도 여기 추가)

```ts
export interface StoredChunk {
  id: string;         // 예: "Day3.md#2"
  source: string;     // 예: "Day3.md"
  text: string;
  embedding: number[];
}
```

⌨️ 실습 — `scripts/index-docs.ts` 새 파일

```ts
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { chunkText } from "../src/lib/chunk";
import { embed } from "../src/lib/embed";
import type { StoredChunk } from "../src/lib/vector-store";

const KNOWLEDGE = path.join(process.cwd(), "knowledge");
const OUT = path.join(process.cwd(), "data", "vector-store.json");

async function main() {
  const files = readdirSync(KNOWLEDGE).filter((f) => f.endsWith(".md"));
  const store: StoredChunk[] = [];

  for (const file of files) {
    const text = readFileSync(path.join(KNOWLEDGE, file), "utf-8");
    const chunks = chunkText(text);
    console.log(`${file}: ${chunks.length} 청크`);
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await embed(chunks[i]);
      store.push({ id: `${file}#${i}`, source: file, text: chunks[i], embedding });
    }
  }

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(store));
  console.log(`✅ 총 ${store.length}개 청크 → ${OUT}`);
}

main();
```

⌨️ 실행

```bash
pnpm exec tsx scripts/index-docs.ts
```

→ `data/vector-store.json`이 생기고 청크 수가 출력되면 **인덱싱 성공**입니다. 🎉 (JSON을 열어보면 각 청크에 384개 숫자 배열이 붙어 있어요.)

⚠️ **문서를 고치면 다시 인덱싱해야** 최신이 반영됩니다(이 스크립트를 재실행). 🐍 임베딩은 "미리 계산해 저장"하는 오프라인 작업이에요.

### ✅ 세션 1 체크
- [ ] 청킹 함수로 문서를 조각냄
- [ ] 로컬 모델로 384차원 임베딩 생성
- [ ] `vector-store.json` 생성 확인

---

## 2. 세션 2 (오전) — 검색: 코사인 유사도 직접 구현 ⭐

이제 질문과 가장 비슷한 청크를 찾습니다. **벡터DB 없이 손으로.**

### 2-1. 코사인 유사도 — numpy를 TS로

**② 쉬운 설명**: 두 벡터가 얼마나 "같은 방향"인지(-1~1). 클수록 비슷.
**③ 🐍**: `np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))` 그대로를 TS로 옮깁니다.

⌨️ 실습 — `src/lib/vector-store.ts`에 추가

```ts
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];        // 🐍 np.dot(a, b)
    normA += a[i] * a[i];      // 🐍 np.sum(a**2)
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

💡 **정규화의 보너스**: `embed`에서 `normalize: true`를 줬으니 모든 벡터의 길이가 1입니다. 그러면 `normA`·`normB`가 1이라 **코사인 유사도 = 그냥 내적(dot)**으로 단순화돼요. 위 코드는 안전하게 전체 공식을 썼지만, "정규화하면 내적만으로 충분"이라는 걸 알아두면 좋습니다. 🐍 numpy에서 정규화 후 dot만 쓰던 것과 동일.

### 2-2. top-k 검색

⌨️ 실습 — `src/lib/vector-store.ts`에 추가

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { embed } from "./embed";

// 저장된 청크를 한 번만 로드해 캐시
let cache: StoredChunk[] | null = null;
function loadStore(): StoredChunk[] {
  if (!cache) {
    const p = path.join(process.cwd(), "data", "vector-store.json");
    cache = JSON.parse(readFileSync(p, "utf-8")) as StoredChunk[];
  }
  return cache;
}

export interface SearchResult extends StoredChunk {
  score: number;
}

export async function search(query: string, topK = 4): Promise<SearchResult[]> {
  const store = loadStore();
  const queryVec = await embed(query);           // 질문도 같은 모델로 임베딩

  return store
    .map((c) => ({ ...c, score: cosineSimilarity(queryVec, c.embedding) }))
    .sort((a, b) => b.score - a.score)            // 점수 내림차순 (Day 1 sort!)
    .slice(0, topK);                              // 상위 k개
}
```

💡 검색이 딱 **"질문 임베딩 → 전체와 코사인 → 정렬 → 상위 k"**입니다. Day 1의 `map`·`sort`·`slice`가 전부 쓰였어요. 벡터DB는 이걸 **빠르게(수백만 개도)** 해주는 것뿐, 원리는 이게 전부입니다.

> ⌨️ **미니 실습** — `src/lib/vector-store.ts` 하단에 임시 추가 후 `pnpm exec tsx src/lib/vector-store.ts`
> ```ts
> // 확인용 (확인 후 지우기)
> const hits = await search("제네릭이 뭐야?");
> hits.forEach((h) => console.log(h.score.toFixed(3), h.source, "-", h.text.slice(0, 40)));
> ```
> "Day3.md" 청크들이 상위에 뜨면 검색이 잘 도는 겁니다.

### ✅ 세션 2 체크
- [ ] 코사인 유사도를 직접 구현
- [ ] "정규화하면 코사인=내적" 이해
- [ ] top-k 검색이 관련 문서를 찾음

---

## 3. 세션 3 (오후) — 챗봇에 RAG 도구로 통합

Day 6의 도구 시스템에 `searchKnowledgeBase`를 하나 더 추가하면 끝입니다.

### 3-1. 검색을 도구로 노출

⌨️ 실습 — `src/lib/tools.ts`에 도구 추가 (부분 수정)

```ts
import { search } from "./vector-store";
// ... 기존 import (tool, z) 유지 ...

// tools 객체 안에 추가:
  searchKnowledgeBase: tool({
    description:
      "사용자의 학습 자료(Day0~6 문서)에 대한 질문에 답해야 할 때 호출한다. " +
      "'Day 3에서 뭐라고 했지', '제네릭 설명해줘' 같은 질문에 사용.",
    inputSchema: z.object({ query: z.string() }),
    execute: async ({ query }) => {
      const results = await search(query, 4);
      return {
        chunks: results.map((r) => ({
          source: r.source,
          score: Number(r.score.toFixed(3)),
          text: r.text,
        })),
      };
    },
  }),
```

### 3-2. 출처를 밝히도록 시스템 프롬프트 조정

⌨️ 실습 — `src/app/api/chat/route.ts`의 `system` 부분 수정

```ts
system:
  "너는 사용자의 학습 자료를 잘 아는 도우미야. " +
  "학습 내용에 대한 질문은 searchKnowledgeBase 도구로 근거를 찾은 뒤, " +
  "반드시 출처(source, 예: Day3.md)를 밝혀 답해. 근거가 없으면 모른다고 말해.",
```

💡 `stopWhen: stepCountIs(5)`는 Day 6에서 이미 걸어뒀죠. "검색 도구 호출 → 결과 관찰 → 인용 답변" 루프가 그 안에서 돕니다.

### 3-3. 확인 — RAG가 도는지

⌨️ 실행 — `pnpm dev` 후 물어보세요:
- "안녕" → 검색 없이 그냥 답 (도구 불필요를 스스로 판단)
- "Day 4에서 useState 스냅샷이 뭐였지?" → `searchKnowledgeBase` 호출 → Day4.md 청크 검색 → **출처를 밝힌 답변**
- "클로저가 왜 중요하다고 했어?" → Day2.md 근거로 답

🔧 노란 `ToolCallCard`에 검색된 청크(source·score)가 보이고, 이어서 Claude가 그걸 인용해 답하면 **RAG 완성**입니다! 🎉

### ✅ 세션 3 체크
- [ ] `searchKnowledgeBase` 도구가 학습 질문에 호출됨
- [ ] 답변에 출처(Day_.md)가 표시됨
- [ ] 일상 대화("안녕")엔 검색 없이 답함

---

## 4. 세션 4 (오후) — 튜닝 & 한계 성찰 (Day 8 복선)

직접 짠 RAG의 품질을 만져보고, **뭐가 부족한지**를 느낍니다. 이게 내일 LangChain을 쓰는 이유가 돼요.

### 4-1. 파라미터 튜닝 실습

⌨️ 실습 — 아래를 바꿔가며 검색 품질을 비교해 보세요.
- `chunkText`의 `maxChars`(예: 400 vs 800 vs 1500) → 다시 인덱싱 후 검색 품질 변화 관찰
- `search`의 `topK`(예: 2 vs 4 vs 8) → 답변 근거의 양 변화

💡 정답은 없습니다. **너무 작으면 문맥이 끊기고, 너무 크면 잡음이 섞여요.** 데이터에 맞게 실험하는 감을 익히는 게 목표입니다. 🐍 하이퍼파라미터 튜닝과 같은 감각.

### 4-2. 🎯 직접 구현의 한계 — 내일 LangChain이 풀어줄 것

오늘 손으로 짜보니 아쉬운 점들이 보일 거예요:

- **청킹이 투박함**: 문장 중간을 자르거나, 코드 블록·헤딩 경계를 무시함 → LangChain `RecursiveCharacterTextSplitter`가 더 똑똑하게 분할.
- **전체 스캔**: 매 검색이 전체 청크와 코사인 계산(O(n)) → 문서가 많아지면 느림 → 벡터스토어/인덱스가 최적화.
- **로더가 수동**: `.md`만 `readFileSync` → LangChain은 PDF·웹·노션 등 다양한 **Document Loader** 제공.
- **메타데이터·필터 없음** → LangChain의 retriever는 메타데이터 필터·리랭킹 등을 지원.

💡 **하지만 오늘 손으로 짠 게 헛수고가 아닙니다.** 내일 LangChain을 쓸 때 "아, 이 `split`이 내가 짠 `chunkText`구나", "이 `similaritySearch`가 내 `search`구나" 하고 **내부가 훤히 보입니다.** 블랙박스가 아니게 되는 거예요.

---

## 5. 디버깅 실습 — "검색 결과가 이상해요"

⌨️ 상황 — 문서를 수정했는데 검색 결과가 옛날 내용이거나, `search`가 빈 배열/에러를 냅니다. 무엇을 점검할까요?

<details><summary>정답 보기</summary>

**흔한 원인 3가지:**
1. **재인덱싱 안 함**: `vector-store.json`은 인덱싱 시점의 스냅샷입니다. 문서를 고쳤으면 `pnpm exec tsx scripts/index-docs.ts`를 **다시 실행**해야 합니다.
2. **차원 불일치**: 인덱싱과 검색이 **다른 모델**을 쓰면 벡터 차원(384)이 안 맞아 `cosineSimilarity`가 이상한 값을 냅니다. **질문과 문서는 반드시 같은 임베딩 모델**로.
3. **store가 비어있음**: 인덱싱이 실패했거나 `knowledge/`가 비어 `data/vector-store.json`이 `[]`. 파일을 열어 청크가 들어있는지 확인.

교훈: **RAG의 3대 점검 포인트 = 재인덱싱 / 동일 모델 / 저장소 내용.**
</details>

---

## 6. 🎯 오늘 만난 에러 읽는 법

| 메시지 | 뜻 | 해결 |
|--------|-----|------|
| `Cannot find module 'onnxruntime-node'` / 번들 에러 | Next가 네이티브 모듈 번들 시도 | `next.config.ts`에 `serverExternalPackages` 설정 |
| `ENOENT: ... vector-store.json` | 인덱싱 전이거나 경로 문제 | 인덱싱 스크립트 먼저 실행 |
| 검색 점수가 전부 `NaN` | 차원 불일치·빈 벡터 | 같은 모델 사용, 임베딩 확인 |
| 첫 요청이 아주 느림 | 모델 최초 로딩·다운로드 | 정상(한 번만). 이후 캐시됨 |

---

## 7. ✅ Day 7 최종 체크리스트

- [ ] `chunkText`로 문서 청킹
- [ ] 로컬 모델로 임베딩(384차원) + `vector-store.json` 생성
- [ ] **코사인 유사도 직접 구현** + "정규화하면 내적" 이해
- [ ] top-k 검색이 관련 문서를 찾음
- [ ] `searchKnowledgeBase` 도구로 챗봇에 RAG 통합, 출처 표시
- [ ] 일상 대화엔 검색 안 함(도구를 스스로 판단)
- [ ] chunk size·topK 튜닝 실험
- [ ] 직접 구현의 한계 4가지를 말할 수 있음 (Day 8 동기)

---

## 8. git 커밋

⌨️ 실습 — `chat-app/`에서

```bash
# data/vector-store.json은 커밋해도 되고(재현), 커서 제외해도 됩니다(용량).
git add .
git commit -m "Day 7: RAG 직접 구현(로컬 임베딩+코사인 유사도) + 챗봇 도구 통합"
```

💡 `data/vector-store.json`은 용량이 크면 `.gitignore`에 넣고 "인덱싱 스크립트로 재생성"하는 게 관례입니다(`node_modules`처럼).

---

## 9. Day 8 미리보기

내일은 오늘의 **직접 구현 RAG를 LangChain.js로 교체**합니다.

- `RecursiveCharacterTextSplitter`(똑똑한 청킹) — 오늘의 `chunkText` 대체
- LangChain `Embeddings` + `MemoryVectorStore`(`similaritySearch`) — 오늘의 `embed`+`search` 대체
- Document Loader로 문서 로드
- "직접 구현 ↔ LangChain" **나란히 비교**
- 🐍 Python LangChain의 그 API들이 JS에도 거의 그대로 있음

💡 시작할 때 로드맵을 붙이고 **"Day 8 상세 자료 만들어줘"**라고 요청하세요.

---

## 부록 — Python(RAG) ↔ TS 치트시트 (Day 7분)

| 개념 | 🐍 Python | 🟨 TS (오늘 직접 구현) |
|------|-----------|------------------------|
| 임베딩 모델 | `SentenceTransformer("all-MiniLM-L6-v2")` | `pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")` |
| 임베딩 | `model.encode(text)` | `embed(text)` (mean pooling + normalize) |
| 벡터 차원 | 384 | 384 |
| 내적 | `np.dot(a, b)` | `a.reduce((s,v,i)=>s+v*b[i], 0)` |
| 노름 | `np.linalg.norm(a)` | `Math.sqrt(a.reduce((s,v)=>s+v*v,0))` |
| top-k | `np.argsort(scores)[-k:]` | `.sort(...).slice(0, k)` |
| 저장 | `pickle`/`np.save` | `JSON.stringify` → 파일 |

RAG의 원리를 손으로 만졌습니다. 내일은 이걸 프레임워크로 바꿔, 실무에서 쓰는 방식을 익힙니다. 🟨
