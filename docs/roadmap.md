# 7일 완성 로드맵 — JavaScript/TypeScript → Next.js → 에이전트/RAG

> ML 개발자(Python 경험)를 위한 실습 중심 프론트/풀스택 온보딩 계획서
> 총 56시간 (7일 × 8시간) · VS Code 기준 · 최신 스택(2026)

---

## 0. 이 문서의 사용법

- 이 문서는 **계획서(로드맵)**입니다. 상세 강의 자료는 아닙니다.
- 매일 학습 시작 시, 이 문서를 컨텍스트에 주입한 뒤
  **"Day N의 세션 X 상세 자료 만들어줘"** 형태로 요청하면 됩니다.
- 각 Day는 `학습 목표 → 세션별 주제 → 실습 → 체크리스트` 구조입니다.
- `🐍` 표시는 **Python 대비 핵심 차이점**, `💡`는 **제안/팁**입니다.

---

## 1. 학습자 프로파일 & 전제

| 항목 | 내용 |
|------|------|
| 배경 | Python 기반 ML 개발자 (알고리즘·비동기·타입힌트·CLI 익숙) |
| 새로 배우는 것 | JS/TS 문법, 브라우저/Node 런타임, React 사고방식, Next.js, JS 생태계 배선 |
| 이미 아는 것 | 변수/함수/클래스/자료구조, 비동기 개념(asyncio), 타입 개념, LLM/임베딩/RAG **개념** |
| 도구 | VS Code |
| 목표 시간 | 하루 8시간 × 7일 |

> 💡 **핵심 관점**: 당신에게 어려운 건 "프로그래밍"이 아니라
> ① JS/TS 특유의 문법과 함정, ② React의 선언형 렌더링 사고방식,
> ③ "서버 컴포넌트 vs 클라이언트 컴포넌트" 멘탈 모델입니다.
> ML/RAG **개념**은 이미 알고 있으니, 프로젝트 단계에서는 **개념이 아니라 JS/TS 배선**에 집중합니다.

---

## 2. 최종 목표 & 산출물

7일 후 다음을 **직접 만들고 이해**한 상태가 됩니다.

1. TypeScript로 타입 안전한 코드를 자신 있게 작성
2. React + Next.js(App Router)로 풀스택 앱 구조 설계
3. **하나의 앱**이 다음 순서로 성장:
   - `채팅 UI` (Day 4~5)
   - → `도구를 쓰는 에이전트` (Day 6)
   - → `문서 기반 RAG 챗봇` (Day 7)
4. (보너스) Vercel 배포

> 💡 **제안 — "하나로 이어지는 프로젝트"**: 예제를 매일 새로 만들지 않고
> **동일한 앱을 계속 확장**합니다. 동기부여도 좋고, "왜 이 구조인지"가 몸에 남습니다.

---

## 3. 기술 스택 (버전 고정)

| 레이어 | 선택 | 비고 |
|--------|------|------|
| 런타임 | **Node.js 24 LTS** (Krypton) | 현재 Active LTS. `nvm`로 버전 관리 권장 |
| 패키지 매니저 | **pnpm** (권장) 또는 npm | pnpm이 빠르고 디스크 효율적. npm도 무방 |
| 언어 | **TypeScript 5.x** | |
| 프레임워크 | **Next.js 16** (App Router, Turbopack 기본) | Pages Router는 배우지 않음 |
| UI 런타임 | **React 19.2** | Next.js에 포함 |
| 스타일링 | **Tailwind CSS v4** + **shadcn/ui** | CSS 늪 회피용. 최소만 학습 |
| AI | **Vercel AI SDK v6** (`ai`, `@ai-sdk/react`) | `streamText` + `useChat` + tool calling |
| LLM 프로바이더 | **Anthropic (Claude)** ✅ | `@ai-sdk/anthropic`. 학습용은 Sonnet 계열(비용/속도) 권장 |
| 스키마 검증 | **Zod** | 도구(tool) 입력 스키마 정의에 사용 |
| 벡터 저장 | **초경량 로컬 (인메모리 + JSON 영속화)** ✅ | 코사인 유사도를 직접 구현 → 메커니즘이 눈에 보임 |

> ✅ **확정 사항 (당신 선택 반영)**
> ① 프로젝트: **전부 TypeScript** (Vercel AI SDK) — Next.js를 제대로 학습
> ② LLM 프로바이더: **Anthropic (Claude)**
> ③ RAG 벡터 저장: **초경량 로컬** (JS 배열 + 직접 구현한 코사인 유사도, JSON 파일로 영속화)
>
> 💡 초경량 로컬을 고른 건 좋은 선택이에요 — ML 개발자에게는 벡터DB의 블랙박스보다
> **유사도 계산을 직접 코드로 보는 편**이 개념이 더 선명하게 남습니다.
> 7일 이후 프로덕션이 필요해지면 그때 pgvector로 갈아끼우면 됩니다(§15).

---

## 4. 설계 원칙 (내가 반영한 것들)

1. **실습 우선**: 이론 설명은 짧게, 손으로 치는 코드 비중을 높게.
2. **Python과의 대조 학습**: 새 문법은 항상 "파이썬이면 이렇게, JS면 이렇게"로 제시.
3. **CSS 최소화**: shadcn/ui 컴포넌트를 가져다 쓰고, Tailwind는 여백/정렬 수준만.
4. **도구 세팅을 Day 1에 끝냄**: ESLint/Prettier/타입체크가 처음부터 돌아가야 학습 효율이 큼.
5. **버릴 것은 버림**: `this` 바인딩, 프로토타입 상속은 "이해만" 하고 깊게 안 팜(모던 코드는 화살표 함수로 회피). 클래스 컴포넌트, Pages Router, Redux 등 레거시는 다루지 않음.
6. **뒤처짐 대비 플랜 내장**: 아래 §12 참고.

---

## 5. Day 0 (선택, 저녁 1~2시간) — 몸풀기

> 정규 7일에 포함하지 않아도 되지만, 전날 밤 30분만 투자하면 Day 1이 편해집니다.

- [ ] Node.js 24 LTS 설치 (`nvm` 사용 권장)
- [ ] VS Code 설치 확인
- [ ] 터미널에서 `node -v`, `npm -v` 확인
- [ ] pnpm 설치 (`npm i -g pnpm`)

---

## 6. Day 1 — 개발환경 + JavaScript 코어 문법

**목표**: 로컬 JS 실행 환경을 완성하고, JS 기본 문법을 Python과 대조하며 체화한다.

### 세션 1 (오전) — 개발환경 셋업 ⭐가장 중요
- Node.js / npm / pnpm 역할과 `package.json` 구조
- VS Code 필수 확장: **ESLint, Prettier, Error Lens**, (선택) Path Intellisense
- 프로젝트 초기화: `pnpm init`, 스크립트 실행, `node file.js`
- ESLint + Prettier 설정 파일 만들고 저장 시 자동 포맷 확인
- 🐍 `package.json` ≈ `pyproject.toml`/`requirements.txt`, `node_modules` ≈ 가상환경, `pnpm add` ≈ `pip install`

### 세션 2 (오전) — 변수·타입·연산
- `let` / `const` (`var`는 안 씀), 스코프
- 원시 타입: string / number / boolean / null / undefined / bigint / symbol
- 템플릿 리터럴(백틱), 문자열 메서드
- `==` vs `===`, truthy/falsy, `null` vs `undefined`
- 🐍 파이썬엔 `None` 하나, JS엔 `null`과 `undefined` 둘 — 함정 주의

### 세션 3 (오후) — 함수
- 함수 선언 vs 함수 표현식 vs **화살표 함수**
- 기본값 매개변수, 나머지(rest) `...args`, 전개(spread) `...`
- 고차 함수 감 잡기
- 🐍 `lambda`보다 훨씬 광범위하게 화살표 함수를 씀

### 세션 4 (오후) — 배열 & 객체
- 배열 메서드: `map` / `filter` / `reduce` / `forEach` / `find` / `some` / `every`
- 객체 리터럴, 구조 분해 할당(destructuring), 전개 연산자
- 🐍 리스트 컴프리헨션 대신 `map`/`filter` 체이닝에 익숙해지기

### 실습
- 간단한 CLI 스크립트: 배열 데이터를 변환/집계 (파이썬으로 하던 걸 JS로)
- ESLint 경고 0개, Prettier 포맷 통과

### ✅ 체크리스트
- [ ] `node script.js`로 결과 출력 성공
- [ ] `const`/`let` 구분해서 사용
- [ ] `map/filter/reduce` 각각 예시 작성
- [ ] 구조 분해로 객체/배열 값 꺼내기

---

## 7. Day 2 — 비동기 + 모듈 + JS 심화

**목표**: JS 비동기 모델과 모듈 시스템을 익힌다 (Next.js의 토대).

### 세션 1 (오전) — 스코프·클로저·고차함수
- 렉시컬 스코프, 클로저(실전에서 매우 자주 씀)
- 콜백 패턴
- (가볍게) `this`가 뭔지 **개념만**, 왜 화살표 함수로 피하는지

### 세션 2 (오전) — 비동기 ①
- 이벤트 루프 멘탈 모델 (파이썬 asyncio와 비교)
- 콜백 → **Promise** → `async/await`
- 🐍 `async/await`는 파이썬과 키워드가 같아 친숙 — 단, 이벤트 루프가 항상 1개(싱글 스레드)

### 세션 3 (오후) — 비동기 ②
- `fetch`로 실제 API 호출, JSON 파싱
- `Promise.all` / `Promise.race`
- try/catch 에러 처리, 에러 객체
- (선택) `AbortController`로 요청 취소

### 세션 4 (오후) — 모듈 & 도구
- **ES Modules** (`import`/`export`) vs CommonJS(`require`) — 차이와 언제 뭐가 쓰이는지
- (맛보기) `tsx`/`node --experimental` 없이도 TS 실행 흐름 이해
- npm 패키지 하나 설치해서 써 보기

### 실습
- 공개 API(예: 환율/날씨/GitHub)를 `async/await`로 호출 → 결과 가공 → 콘솔 출력
- `Promise.all`로 병렬 호출 1건 포함

### ✅ 체크리스트
- [ ] `async/await`로 fetch 성공
- [ ] `Promise.all` 병렬 처리 이해
- [ ] `import/export`로 파일 분리
- [ ] 에러를 try/catch로 처리

---

## 8. Day 3 — TypeScript

**목표**: TS 타입 시스템을 "파이썬 타입힌트의 강화판"으로 흡수한다. Next.js는 사실상 TS로 씀.

### 세션 1 (오전) — 기초 타입
- `tsconfig.json`, `tsc`, 컴파일 흐름
- 기본 타입: string/number/boolean/array/tuple/enum
- `any` vs `unknown` vs `never` (매우 중요)
- 🐍 파이썬 타입힌트는 런타임에 무시되지만, TS는 **컴파일 타임에 강제** → 훨씬 실효적

### 세션 2 (오전) — 타입 구성
- `interface` vs `type` (언제 뭘 쓰나)
- 유니온 `|`, 인터섹션 `&`, 리터럴 타입
- 옵셔널 `?`, 옵셔널 체이닝 `?.`, null 병합 `??`

### 세션 3 (오후) — 함수·제네릭·narrowing
- 함수 타이핑, 반환 타입, 오버로드(맛보기)
- **제네릭** `<T>` (파이썬 `TypeVar`와 대응)
- 타입 가드 / narrowing (`typeof`, `in`, 커스텀 가드)

### 세션 4 (오후) — 유틸리티 타입 & 실전
- `Partial` / `Required` / `Pick` / `Omit` / `Record` / `ReturnType`
- 비동기 코드 타이핑(`Promise<T>`)
- (맛보기) Zod로 런타임 검증 + 타입 추론 → RAG/에이전트에서 재등장

### 실습
- Day 2의 fetch 스크립트를 **TS로 재작성** + API 응답에 타입 정의
- 제네릭 유틸 함수 1개 작성

### ✅ 체크리스트
- [ ] `interface`/`type`로 데이터 모델 정의
- [ ] 유니온 + narrowing으로 분기 처리
- [ ] 제네릭 함수 작성
- [ ] `tsc --noEmit` 타입 에러 0개

---

## 9. Day 4 — React 기초

**목표**: 선언형 UI와 훅(hook) 사고방식을 익힌다. **Next.js의 절반은 React다.**

### 세션 1 (오전) — React 멘탈 모델 + JSX
- 명령형 vs **선언형** UI ("상태를 바꾸면 화면이 따라온다")
- 컴포넌트 트리, 단방향 데이터 흐름
- JSX 문법, 표현식 삽입, 조건부/리스트 렌더링(`key`)
- 🐍 이게 가장 큰 사고 전환 지점 — "DOM을 직접 조작"이 아니라 "상태의 함수로서 UI"

### 세션 2 (오전) — props & state
- props (TS로 타이핑)
- `useState`, 이벤트 핸들링, 폼 입력 제어
- 상태 끌어올리기(lifting state up)

### 세션 3 (오후) — useEffect & 렌더링
- `useEffect`의 정확한 멘탈 모델과 흔한 함정(의존성 배열)
- 언제 effect가 **필요 없는지**(중요)
- `useRef`, `useMemo`, `useCallback` 감 잡기

### 세션 4 (오후) — 컴포지션 + 커스텀 훅
- 컴포넌트 분리/재사용, children
- 커스텀 훅 맛보기
- (도구) Vite로 순수 React 연습 환경 or Next.js로 바로 진입 — 아래 실습 참고

### 실습 — ⭐프로젝트 시작
- **채팅 UI 껍데기** 만들기 (백엔드 없이):
  메시지 목록 렌더링, 입력창, 전송 시 상태 업데이트, 자동 스크롤
- shadcn/ui 컴포넌트로 최소 스타일

### ✅ 체크리스트
- [ ] `useState`로 인터랙션 구현
- [ ] props를 TS로 타이핑
- [ ] 리스트 렌더링 + `key`
- [ ] "effect가 필요 없는 경우"를 하나 설명 가능

---

## 10. Day 5 — Next.js 기초 (App Router)

**목표**: Next.js 16의 구조와 **서버/클라이언트 컴포넌트** 모델을 익히고, 채팅 UI를 Next.js 위로 옮긴다.

### 세션 1 (오전) — 프로젝트 구조 & 라우팅
- `pnpm create next-app` (App Router, TS, Tailwind 선택)
- 파일 기반 라우팅: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- 중첩 레이아웃, 네비게이션(`<Link>`)

### 세션 2 (오전) — ⭐서버 컴포넌트 vs 클라이언트 컴포넌트
- Next.js 16에서 `app/`의 기본은 **서버 컴포넌트(RSC)**
- `"use client"`가 필요한 순간 (state/effect/이벤트/브라우저 API)
- 서버에서 `async/await`로 직접 데이터 페칭
- 🐍 백엔드 개발자가 가장 헷갈리는 지점 — 여기서 시간 넉넉히

### 세션 3 (오후) — 데이터·서버 액션·API
- Route Handlers (`app/api/.../route.ts`) — 우리 채팅 백엔드가 여기 붙음
- Server Actions (폼/뮤테이션)
- 스트리밍, `loading.tsx`로 로딩 UI
- 환경 변수(`.env.local`), 서버/클라이언트 노출 규칙

### 세션 4 (오후) — 채팅 UI 이관
- Day 4 채팅 UI를 Next.js 프로젝트로 이전
- `"use client"` 경계 정리
- (준비) API route 껍데기 하나 만들어 두기 → Day 6에서 채움

### ✅ 체크리스트
- [ ] 서버/클라이언트 컴포넌트 차이를 말로 설명 가능
- [ ] `app/api/*/route.ts`로 API 엔드포인트 작성
- [ ] `.env.local`에서 값 읽기
- [ ] 페이지 2개 이상 + 레이아웃 구성

---

## 11. Day 6 — 프로젝트 ① 스트리밍 챗봇 → 에이전트

**목표**: Vercel AI SDK v6로 스트리밍 챗봇을 만들고, **tool calling**으로 "에이전트"로 확장한다.

> 스택 확정: 전부 TS + Anthropic (`@ai-sdk/anthropic`).

### 세션 1 (오전) — AI SDK 개요 & LLM 연결
- `ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`(또는 openai) 설치
- API 키를 `.env.local`에 설정, 비용/토큰 개념 짧게
- `generateText` / `streamText` / `generateObject` 역할 구분
- 🐍 개념(프롬프트/토큰/스트리밍)은 이미 알 것 — 여기선 **JS 배선**에 집중

### 세션 2 (오전) — 스트리밍 채팅 완성
- 서버: `app/api/chat/route.ts`에서 `streamText`
- 클라이언트: `useChat` 훅 (v6 message-parts 모델)
- 실시간 토큰 스트리밍 UI 연결

### 세션 3 (오후) — 에이전트 = tool calling
- **에이전트란**: `streamText` + `tools` + 다단계 스텝(step) 루프
  (모델이 도구 호출 → 결과 관찰 → 다시 추론)
- **Zod**로 도구 입력 스키마 정의
- 도구 2~3개 구현 (예: 현재 시각, 계산기, 외부 API 조회)
- 도구 호출/결과를 UI에 렌더링 (message-parts)

### 세션 4 (오후) — 다듬기
- 다단계 스텝 한도, 에러 처리, `onError`/재시도
- 시스템 프롬프트 튜닝
- (선택) 로딩/스켈레톤 UI

### ✅ 체크리스트
- [ ] 토큰이 실시간 스트리밍되는 챗봇 동작
- [ ] Zod 스키마 도구 1개 이상 호출 성공
- [ ] 도구 호출 → 결과 → 최종 답변 루프 확인
- [ ] 에러 케이스 1개 처리

---

## 12. Day 7 — 프로젝트 ② RAG + 마무리

**목표**: 문서를 인덱싱하고 검색-증강 생성으로 답하는 RAG를 에이전트 위에 얹는다. 그리고 배포.

> RAG **개념**(청킹/임베딩/유사도 검색/증강)은 이미 알고 있으므로,
> **TS/Next.js에서의 구현 배선**에 집중합니다.

### 세션 1 (오전) — 인덱싱 파이프라인
- 문서 로드 → **청킹(chunking)**
- AI SDK `embed` / `embedMany`로 임베딩 생성
- 벡터 저장: **초경량 로컬** — 임베딩을 JS 객체 배열에 담아 JSON 파일로 저장(영속화)
- 🐍 파이썬 RAG와 흐름 동일, 라이브러리·타입만 다름

### 세션 2 (오전) — 검색(retrieval)
- 쿼리 임베딩 → **코사인 유사도를 직접 구현**해 top-k 검색 (벡터DB 없이)
- 🐍 numpy로 하던 dot/norm 계산을 TS로 — 개념은 동일, 배선만 다름
- (선택) 메타데이터 필터링, 검색 품질 간단 점검

### 세션 3 (오후) — 증강 생성 & 통합
- 검색 결과를 컨텍스트로 주입 → `streamText`
- **RAG를 도구로** 노출해서 Day 6 에이전트와 결합
  (에이전트가 "필요할 때 지식베이스 검색" 도구를 호출)
- 출처(citation) 표시 UI

### 세션 4 (오후) — 배포 & 회고
- (선택) Vercel 배포, 환경 변수 설정
- 전체 코드 리뷰, 리팩터링 포인트 정리
- 7일 회고 + 다음 학습 방향 정리

### ✅ 체크리스트
- [ ] 문서 인덱싱 → 임베딩 저장 성공
- [ ] top-k 검색 결과가 질의와 관련 있음
- [ ] RAG 답변에 출처 표시
- [ ] (선택) 배포 URL 접속 가능

---

## 13. 진도 관리 & 뒤처질 때 대응

> 솔직히 말하면, **JS 무경험 → RAG 앱까지 56시간은 공격적인 일정**입니다.
> 강한 개발자라 가능하지만, Day 6~7 프로젝트가 밀릴 수 있어요. 미리 대비합니다.

- **밀리면 버릴 순서**: Vercel 배포 → RAG 고급(메타데이터 필터) → 에이전트 도구 개수.
  **채팅 스트리밍 + 도구 1개 + 기본 RAG**만 되면 핵심 목표는 달성입니다.
- **너무 여유로우면 추가할 것**: 대화 히스토리 영속화, 인증(Auth.js), 테스트(Vitest), 스타일 고급화.
- **하루 리듬 제안**: 90분 학습 + 15분 휴식 × 4 세션. 각 Day 마지막 30분은 "체크리스트 점검 + 내일 미리보기".
- **막히면**: 이 문서를 붙이고 "Day N 세션 X에서 ___가 이해 안 됨. Python 비유로 설명해줘"라고 물어보세요.

---

## 14. 내가 보강한 항목 (당신이 놓치기 쉬운 것)

1. **개발환경/린팅을 Day 1에 확정** — JS는 도구 세팅이 학습 속도를 크게 좌우합니다.
2. **서버 vs 클라이언트 컴포넌트** — 백엔드 배경일수록 여기서 막히므로 Day 5에 시간 배분을 크게.
3. **CSS 늪 회피 전략** (Tailwind + shadcn/ui) — 안 정하면 스타일에 몇 시간씩 샙니다.
4. **하나로 이어지는 프로젝트** — 에이전트/RAG를 별개가 아니라 한 앱의 확장으로.
5. **Zod** — 도구 스키마·API 검증에 계속 나오므로 Day 3 말미에 미리 맛보기.
6. **버릴 것 명시** — `this`/프로토타입/클래스 컴포넌트/Pages Router/Redux는 학습 범위 밖.
7. **비용/키 관리** — LLM API 키와 소액 과금 발생. Day 6 시작 전 준비.

---

## 15. 7일 이후 (심화 방향, 참고용)

- 상태관리: TanStack Query, Zustand
- 인증/DB: Auth.js, Drizzle ORM + Postgres
- 테스트: Vitest, Playwright
- 에이전트 심화: 멀티 에이전트, 평가(eval), 관측(observability)
- RAG 심화: 하이브리드 검색, 리랭킹, 프로덕션 벡터DB

---

## 16. 상세 자료 요청 템플릿

학습 중 아래처럼 요청하면 됩니다.

- 상세 강의 요청:
  > "이 로드맵의 **Day 3 세션 3(제네릭·narrowing)** 상세 학습 자료 만들어줘.
  > Python 대비 포인트 강조하고, 실습 문제 3개 포함해줘."
- 막힐 때:
  > "Day 5 서버/클라이언트 컴포넌트가 헷갈려. Python 백엔드 비유로 설명해줘."
- 코드 리뷰:
  > "지금 짠 `route.ts`인데 리뷰해줘. TS 타입도 봐줘." + 코드 첨부
