# 학습 로드맵 (개정판 v2.1) — JavaScript/TypeScript → Next.js → 에이전트/RAG

> ML 개발자(Python 경험)를 위한 **실습 중심** 프론트/풀스택 온보딩 계획서
> Day 0~10 (Day 0 몸풀기 + Day 1~9 본과정 + **Day 10 에이전트 캡스톤**) · VS Code 기준 · 최신 스택(2026)
> 저장소: `github.com/sguys99/nextjs-study`

---

## 📌 개정 요약

v1으로 학습을 마친 뒤 받은 피드백을 반영했습니다. **무엇이, 왜 바뀌었는지**부터 정리합니다.

| # | 받은 피드백 | 반영 |
|---|-------------|------|
| 1 | Python 비교는 좋았지만, js/ts/next.js를 모르는 사람에겐 설명이 부족·어려움 | **§7 작성 규칙 신설** — "Python은 알지만 웹은 완전 초보"를 독자 기준으로. 새 용어는 첫 등장 시 정의, Python 비유 뒤에 "JS만 아는 사람용" 설명을 반드시 덧붙임 |
| 2 | 설명용 코드 / 실습 코드 구분이 안 돼 혼란 | **§7-2 코드 블록 라벨** — `📖 설명용` / `⌨️ 실습` / `✅ 완성본` + 실습은 파일 경로·실행법 필수 |
| 3 | 실습 코드가 더 많았으면 (특히 js/ts) | **§7-4 실습 밀도** — 개념마다 미니 실습, 세션 끝 문제+정답, 디버깅 실습 |
| 4 | 개념 설명 보완 | **§7-3 개념 5단계 템플릿** (왜 있나 → 쉬운 설명 → Python 다리+JS 설명 → 최소 예제 → 함정) |
| 5 | js/ts/next.js 탄생 배경 보완 | **§7-5 배경지식 박스**(`🎯`) 의무화. Day 0에 웹 동작 원리·JS/Node 탄생사 프라이머 신설 |
| 6 | 마지막 프로젝트에 실제 프레임워크(랭체인/랭그래프) 반영 | **"직접 구현 → 프레임워크 교체" 2단계** — Day 7 RAG 직접구현 → Day 8 LangChain.js, Day 6 도구 → Day 9 LangGraph.js |
| 7 | Next.js·에이전트 설계 참고 자료 | **§19 참고 자료** — 공식 문서 + 에이전트 설계 레퍼런스 |
| + | (추가 요청) 에이전트 캡스톤 프로젝트 | **Day 10 캡스톤 신설** — 배운 것을 총동원해 스스로 에이전트 앱 설계·구현 |

### v2 → v2.1 변경점 (프로젝트 구간 확정)

실제 Day 자료를 만들며 프로젝트 구간을 다음과 같이 확정했습니다.

- **Day 6**: 스트리밍 챗봇 + **기본 tool calling** (Vercel AI SDK) — 네이티브 빠른 구현
- **Day 7**: RAG **직접 구현** (로컬 임베딩 + 손으로 짠 코사인 유사도) — 원리 이해
- **Day 8**: **LangChain.js** RAG — Day 7을 프레임워크로 교체·대조
- **Day 9**: **LangGraph.js** 에이전트 + RAG 통합 + 스트리밍 + 배포
- **Day 10**: **에이전트 캡스톤** (자기주도 프로젝트) ← 신설
- 임베딩은 **로컬 모델**(`@huggingface/transformers`, `all-MiniLM-L6-v2`)로 확정 — 추가 API 키·비용 0, "전부 로컬"로 원리 학습. (배포 시 호스팅 임베딩으로 교체 가능)

### ⚠️ 큰 구조 원칙

1. **"직접 구현 → 프레임워크"를 두 번**: RAG(Day 7 직접 → Day 8 LangChain), 에이전트(Day 6 AI SDK → Day 9 LangGraph). 손으로 짜본 뒤 프레임워크로 바꿔 **내부가 블랙박스가 아니게** 만든다.
2. **하나로 이어지는 앱**: Day 4 채팅 UI → Day 5 Next.js 이관 → Day 6 스트리밍 → Day 7~8 RAG → Day 9 LangGraph 에이전트로 **한 앱이 계속 성장**.
3. **캡스톤으로 마무리**: Day 10에서 배운 전부를 총동원해 **스스로 에이전트 앱을 설계·구현**.

---

## 0. 이 문서의 사용법

- 이 문서는 **계획서(로드맵)**입니다. 상세 강의 자료는 각 `docs/DayN.md`에 있습니다.
- 매일 학습 시작 시 이 문서를 컨텍스트에 주입하고 **"Day N 상세 자료 만들어줘"**라고 요청하면 **§7 작성 규칙**이 자동 적용됩니다.
- 각 Day 구조: `학습 목표 → 🎯배경 → 세션별 주제 → 실습 → 체크리스트`.
- **태그 시스템**:
  - `🐍` Python 대비 · `💡` 팁 · `⚠️` 함정 · `🎯` 배경지식
  - `📖` 설명용 코드(읽기만) · `⌨️` 실습 코드(직접 치기) · `✅` 완성본

---

## 1. 학습자 프로파일 & 전제

| 항목 | 내용 |
|------|------|
| 배경 | Python 기반 ML 개발자 (알고리즘·비동기·타입힌트·CLI 익숙) |
| 새로 배우는 것 | JS/TS 문법, 브라우저/Node 런타임, React, Next.js, JS 생태계 배선, LangChain.js/LangGraph.js |
| 이미 아는 것 | 자료구조, 비동기(asyncio), 타입, LLM/임베딩/RAG/에이전트 **개념**, (아마도) Python LangChain/LangGraph |
| 도구 | VS Code |
| 목표 시간 | 하루 6~8시간 × Day 0~9 + 캡스톤(Day 10, 개방형) |

> 💡 **핵심 관점**: 어려운 건 "프로그래밍"이 아니라 ① JS/TS 특유의 문법·함정, ② React 선언형 렌더링, ③ 서버/클라이언트 컴포넌트 멘탈 모델. **웹을 처음 만지는 사람도 따라오도록 설명을 낮춘다.** Python 비유는 다리일 뿐, 다리 건너편(JS/웹) 설명을 생략하지 않는다.

---

## 2. 최종 목표 & 산출물

10일 후 다음을 **직접 만들고 이해**한 상태가 됩니다.

1. TypeScript로 타입 안전한 코드 작성
2. React + Next.js(App Router)로 풀스택 앱 설계
3. **하나의 앱**이 성장: `채팅 UI`(Day 4~5) → `스트리밍 챗봇+도구`(Day 6, AI SDK) → `RAG`(Day 7 직접 → Day 8 LangChain) → `LangGraph 에이전트`(Day 9)
4. **직접 구현 vs 프레임워크**를 둘 다 경험 (RAG·에이전트) — 프레임워크가 뭘 대신 해주는지 체감
5. **Day 10 캡스톤**: 배운 전부로 **스스로 에이전트 앱을 설계·구현** (자기주도)
6. (보너스) Vercel 배포

---

## 3. 기술 스택 (버전 고정)

| 레이어 | 선택 | 비고 |
|--------|------|------|
| 런타임 | **Node.js 24 LTS** | `nvm`/`fnm` |
| 패키지 매니저 | **pnpm** | |
| 언어 | **TypeScript 5.x** | ⚠️ TS 7이 나왔지만 Next.js가 아직 거부 → 5.x 유지 |
| 프레임워크 | **Next.js 16.x** (App Router, Turbopack) | |
| UI | **React 19.x** | |
| 스타일 | **Tailwind CSS v4** + **shadcn/ui** | 최소만 |
| AI ① 스트리밍 UI | **Vercel AI SDK v6** (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`) | `useChat`+`streamText`+`tool`+`stopWhen` (Day 6) |
| AI ② RAG | **로컬 임베딩** `@huggingface/transformers`(`Xenova/all-MiniLM-L6-v2`) + 직접구현(Day 7) → **LangChain.js**(splitter/embeddings/`MemoryVectorStore`, Day 8) | 🐍 Python `sentence-transformers`의 그 모델. 추가 키·비용 0 |
| AI ③ 에이전트 | **LangGraph.js** (`@langchain/langgraph`, `@langchain/anthropic`) | `StateGraph`·`ToolNode`·조건부 엣지 (Day 9) |
| LLM | **Anthropic (Claude)** | Sonnet 계열 권장. AI SDK: `@ai-sdk/anthropic` · LangChain: `@langchain/anthropic` |
| 스키마 | **Zod** | 도구 입력 스키마 (AI SDK `inputSchema` / LangChain `schema`) |
| 벡터 저장 | 직접구현(JSON) → `MemoryVectorStore` → (프로덕션) pgvector/Chroma/Qdrant | |

> ✅ **임베딩 결정 근거**: Anthropic은 임베딩 API가 없어서, 로컬 `all-MiniLM-L6-v2`를 씁니다. ML 개발자가 Python `sentence-transformers`로 써본 바로 그 모델이고, "전부 로컬"이라 원리 학습에 최적. ⚠️ Vercel 서버리스 **배포 시엔** 로컬 임베딩이 어려우니 호스팅 임베딩(OpenAI/Voyage 등)으로 교체하거나 RAG를 분리 (Day 9 §4-3).

---

## 4. 설계 원칙

1. **실습 우선** (§7-4로 강화) · 2. **완전 초보 웹 개발자 기준** · 3. **설명/실습 코드 라벨 구분**(§7-2) · 4. **Python 대조 + JS 자체 설명** · 5. **배경부터**(§7-5) · 6. **CSS 최소화** · 7. **도구 세팅 Day 1에** · 8. **원리 먼저, 프레임워크 나중** · 9. **버릴 것은 버림**(`this`/프로토타입/클래스 컴포넌트/Pages Router/Redux 제외).

---

## 7. ⭐ 강의 자료 작성 규칙 (피드백 1~5 핵심)

> 이 절은 **모든 Day 상세 자료를 만들 때 강제 적용**됩니다.

### 7-1. 독자 & 난이도
- 독자: "Python은 실무로 쓰지만 HTML/CSS/JS/브라우저/Node는 거의 처음."
- 새 웹 용어는 **첫 등장 시 한 줄 정의**. Python 비유 뒤에 **"JS만 아는 사람용 자체 설명"**을 반드시.
- 한 문단 3~4문장 이내.

### 7-2. 코드 블록 라벨 (피드백 #2)
모든 코드 블록에 라벨을 답니다.
| 라벨 | 의미 | 필수 |
|------|------|------|
| `📖 설명용` | 읽고 이해만(타이핑 X) | — |
| `⌨️ 실습` | 직접 타이핑 | **파일 경로 + 실행 명령** |
| `✅ 완성본` | 최종 정답 | 파일 경로 |

### 7-3. 개념 5단계 템플릿 (피드백 #4)
① 왜 있나(문제) → ② 쉬운 설명 → ③ 🐍 Python 다리 + JS 자체 설명 → ④ 📖 최소 예제 → ⑤ ⚠️ 함정.

### 7-4. 실습 밀도 (피드백 #3)
- 개념 1개 = 미니 실습 1개(직후). · 세션 끝 = 문제 2~3개 + 정답. · Day 1~3 "읽기:치기 = 4:6". · 매일 디버깅 실습 1개(버그 있는 코드를 고치게).

### 7-5. 배경지식 박스 (피드백 #5)
각 기술 첫 도입부에 `🎯 배경` 박스(5~10문장): 왜 만들어졌나 / 어떤 문제 / 어쩌다 표준 / Python 세계와 뭐가 다른가.

---

## 8. 전체 일정 개요

| Day | 주제 | 핵심 산출물 | 🎯 배경 |
|-----|------|-------------|---------|
| 0 | 준비 + 지도 | 개발환경 + 웹/생태계 개념 | Node·JS 탄생사, 웹 동작(HTML/CSS/JS/DOM) |
| 1 | 개발환경 + JS 코어 | 린팅 되는 JS 스크립트 | JS는 왜 함정이 많나 |
| 2 | 비동기 + 모듈 | 병렬 GitHub API 스크립트 | 이벤트 루프, ESM vs CommonJS |
| 3 | TypeScript | 타입 안전 스크립트 + Zod | TS는 왜 MS가 만들었나 |
| 4 | React 기초 | 채팅 UI 껍데기 | React는 왜 선언형인가(Streamlit 비유) |
| 5 | Next.js(App Router) | Next.js로 옮긴 채팅 UI | 왜 React 위에 프레임워크, 서버/클라이언트 |
| 6 | 스트리밍 챗봇 + 도구 (AI SDK) | 진짜 LLM 스트리밍 + tool calling | AI SDK가 푸는 문제 |
| 7 | **RAG 직접 구현** | 로컬 임베딩+코사인 검색+도구 통합 | 왜 직접부터 (ML 직관) |
| 8 | **LangChain.js RAG** | 프레임워크로 교체·대조 | LangChain 생태계 |
| 9 | **LangGraph.js 에이전트** | 상태 그래프 + RAG 통합 + 배포 | 왜 그래프 모델인가(에이전트 지형) |
| 10 | **에이전트 캡스톤** | 자기주도 에이전트 앱 | 설계·계획·평가(자기 프로젝트) |

---

## 9. Day 0 — 몸풀기: 큰 그림 + 개발환경

**목표**: 코드 전에 지도. ① JS/Node 생태계 ↔ Python 매핑, ② **웹 동작 원리 프라이머**(브라우저·HTML·CSS·JS·**DOM**), ③ Node·pnpm·VS Code 설치.
- 🎯 JS·Node 탄생사, DOM 개념(→ Day 4 React 연결).

## 10. Day 1 — 개발환경 + JS 코어
**목표**: "저장 시 자동 포맷" 완성 + JS 코어(`let`/`const`, 화살표 함수, `map`/`filter`/`reduce`, 구조 분해/전개).
- 🎯 JS는 왜 함정이 많나. ⚠️ `const`≠상수, `typeof null`, `[]`가 truthy, `0.1+0.2`, `===`만.

## 11. Day 2 — 비동기 + 모듈
**목표**: 클로저 · 이벤트 루프 · Promise/`async·await` · `fetch`(⚠️`res.ok`) · `Promise.all` · ESM. 종합: GitHub 병렬 리포트.
- 🎯 싱글스레드인데 왜 안 멈추나, ESM vs CommonJS.

## 12. Day 3 — TypeScript
**목표**: 기초 타입, `any`/`unknown`/`never`, `interface`/`type`, 유니온·narrowing, **제네릭**, 유틸리티 타입, **Zod**(pydantic). 종합: GitHub 스크립트 TS 3모듈 이관.
- 🎯 TS는 왜 MS가. "실행(tsx) vs 검사(tsc)".

## 13. Day 4 — React 기초
**목표**: 선언형 UI(🐍 Streamlit 비유), JSX, props, `useState`(스냅샷·불변 업데이트), `useEffect`(클린업·불필요한 경우), 커스텀 훅. 종합: **채팅 UI 껍데기**(한글 IME 처리).
- 🎯 React는 왜 선언형(Facebook, 가상 DOM).

## 14. Day 5 — Next.js 기초
**목표**: 파일 라우팅, ⭐**서버 vs 클라이언트 컴포넌트**, Route Handler, 환경변수(⚠️`NEXT_PUBLIC_`), 채팅 UI 이관 + shadcn/ui + API stub.
- 🎯 왜 프레임워크, RSC (🐍 FastAPI 비유).

## 15. Day 6 — 스트리밍 챗봇 + 도구 (Vercel AI SDK)
**목표**: AI SDK v6로 stub을 진짜 LLM 스트리밍으로 교체. `useChat`(parts 모델) + `streamText`+`toUIMessageStreamResponse`. **기본 tool calling**(Zod `inputSchema` 도구 + `stopWhen: stepCountIs`). ⚠️ API 키 준비.
- 🎯 AI SDK가 뭘 대신 해주나(스트리밍 배선).

## 16. Day 7 — RAG 직접 구현 (프레임워크 X)
**목표**: 청킹(직접) → **로컬 임베딩**(`@huggingface/transformers`, all-MiniLM) → **코사인 유사도 직접 구현** → top-k → JSON 저장 → **챗봇 도구로 통합**(searchKnowledgeBase). 인덱싱 대상 = 학습자 본인의 Day0~6 문서.
- 🎯 왜 직접부터(ML 직관). 🐍 numpy dot/norm을 TS로, sentence-transformers의 그 모델.

## 17. Day 8 — LangChain.js RAG (프레임워크 교체)
**목표**: Day 7을 LangChain으로 교체·대조 — `RecursiveCharacterTextSplitter` / `HuggingFaceTransformersEmbeddings`(같은 모델) / `MemoryVectorStore` / `similaritySearch` / `asRetriever`. 도구 엔진을 **한 줄 교체**(같은 인터페이스).
- 🎯 LangChain 생태계, "직접 짜본 덕에 내부가 보인다". ⚠️ v0.x↔v1.x import 경로 churn.

## 18. Day 9 — LangGraph.js 에이전트 + 통합 + 배포
**목표**: Day 6 도구 루프를 **`StateGraph`**(agent 노드 ↔ tools 노드 + 조건부 엣지)로 재구성. Day 8 리트리버를 **에이전트 도구로 통합**. `streamMode:"messages"` → SSE → 커스텀 훅으로 UI 스트리밍. Vercel 배포(⚠️ 로컬 임베딩 서버리스 제약). 9일 회고.
- 🎯 왜 그래프 모델(에이전트 지형 2026). 🐍 Python LangGraph와 동일. AI SDK 도구 vs LangChain 도구 API 차이.

## 19. Day 10 — 에이전트 캡스톤 (자기주도)
**목표**: 배운 전부(Next.js + LangGraph + RAG + 도구 + 스트리밍 + TS)를 총동원해 **스스로 에이전트 앱을 설계·구현**. 단계별 코드가 아니라 **요구사항·아키텍처·마일스톤·평가 루브릭**을 제공하고 학습자가 주도. 캡스톤급 새 기법(계획/라우팅 노드, PDF 로더, HITL, 구조화 출력, LangSmith 평가) 중 택해 도입.
- 프로젝트 트랙 예: 연구/논문 어시스턴트 · 개인 지식 워커 · 코드베이스 Q&A · 데이터 분석 에이전트.
- 상세는 `docs/Day10.md` 참고.

---

## 20. 진도 관리 & 뒤처질 때

> JS 무경험 → LangGraph/LangChain 에이전트까지 10일도 공격적입니다. Day 6~9가 밀릴 수 있으니 대비.

- **밀리면 버릴 순서**: 배포 → HITL/체크포인팅 → RAG 직접구현/LangChain 중 하나 → 도구 개수.
  핵심 최소선: "스트리밍 챗봇(6) + LangGraph 도구 루프(9) + RAG(7 또는 8 택1)".
- **집중 트랙**: Day 0을 Day 1에 흡수, Day 7·8을 하루로 압축(직접 or 프레임워크 택1) → 단축 가능.
- **막히면**: 이 문서를 붙이고 "Day N의 ___가 이해 안 됨. §7 규칙대로 Python 비유 **+ JS 자체 설명**으로"라고 요청.

---

## 21. ⭐ 참고 자료 (피드백 #7)

> 공식 문서를 1순위로. 버전이 빠르니 항상 "현재 버전" 문서를 확인.

**JS/TS**: MDN(`developer.mozilla.org`) · javascript.info · TypeScript Handbook(`typescriptlang.org/docs`)
**React/Next.js**: `react.dev/learn` · `nextjs.org/docs`(App Router, 16.x)
**AI SDK (Day 6)**: `ai-sdk.dev`(구 sdk.vercel.ai) · Vercel 블로그 "AI SDK 6"
**임베딩/RAG (Day 7~8)**: Transformers.js `huggingface.co/docs/transformers.js` · LangChain.js `docs.langchain.com`(JS) / `js.langchain.com`
**에이전트 (Day 9~10)**: LangGraph.js `langchain-ai.github.io/langgraphjs` · 커뮤니티 `langgraphjs.guide` · 풀스택 템플릿 `github.com/agentailor/fullstack-langgraph-nextjs-agent`
**에이전트 설계 개념**: Anthropic "Building effective agents"(`anthropic.com/engineering/building-effective-agents`) · Anthropic 문서(`docs.claude.com`) · ReAct 논문(arXiv 2210.03629) · LangSmith(관측/평가)
**PDF/로더 (캡스톤)**: LangChain `PDFLoader`(`@langchain/community/document_loaders/fs/pdf`)

> 💡 URL은 바뀔 수 있습니다. 안 열리면 "제품명 + docs"로 검색하세요.

---

## 22. 10일 이후 (심화 방향)

- 에이전트: LangGraph 멀티 에이전트, HITL, 체크포인팅 영속화, eval
- RAG: 하이브리드 검색, 리랭킹, pgvector 등 프로덕션 벡터DB
- 상태/인증/DB: TanStack Query, Zustand, Auth.js, Drizzle + Postgres
- 테스트/관측: Vitest, Playwright, LangSmith

---

## 23. 상세 자료 요청 템플릿

- **상세 강의**: "Day 9 세션 2(StateGraph) 상세 자료 만들어줘. §7 규칙대로: `📖/⌨️/✅` 라벨, 개념 5단계, `🎯 배경`, 미니 실습 많이."
- **막힐 때**: "Day 5 서버/클라이언트 컴포넌트 헷갈려. §7 규칙대로 Python 비유 **+ JS 자체 설명**으로."
- **비교 요청**: "Day 8에서 직접구현본과 LangChain 버전을 나란히 비교해줘."
- **캡스톤**: "Day 10 캡스톤에서 '연구 어시스턴트' 트랙의 그래프 설계를 도와줘."
- **코드 리뷰**: "이 `route.ts` 리뷰해줘. TS 타입도." + 코드 첨부
