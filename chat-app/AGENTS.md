# AGENTS.md

7일 학습 로드맵(`../docs/roadmap.md`)의 최종 산출물이 되는 채팅 앱입니다.
Day 5에 생성했고 Day 6(LLM 연결·tool calling), Day 7(RAG)에서 계속 자랍니다.

## 스택

- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/postcss`)
- 패키지 매니저: **pnpm** (npm/yarn 명령으로 섞어 쓰지 말 것)

## 명령어

```bash
pnpm dev      # 개발 서버 (http://localhost:3000)
pnpm build    # 프로덕션 빌드 — 서버/클라이언트 경계 위반은 여기서 드러남
pnpm lint     # ESLint
```

## 구조 규칙

- 소스는 전부 `src/` 아래. `@/*` → `src/*` 별칭을 쓰고 상대경로(`../../`)는 피한다.
- `src/app/` 의 폴더 구조 = URL 경로. 화면은 `page.tsx`, API는 `route.ts`.
- **`src/app/` 안의 컴포넌트는 기본이 서버 컴포넌트**다. `useState`·`useEffect`·이벤트 핸들러·브라우저 API가 필요할 때만 파일 첫 줄에 `"use client"`를 붙인다.
- `"use client"`는 아래로 전염된다(그 파일이 import 하는 컴포넌트도 클라이언트가 됨). 경계는 트리의 최대한 잎사귀 쪽에 둔다.
- 서버 → 클라이언트 props는 직렬화 가능한 값만. 함수·클래스 인스턴스는 넘길 수 없다.

## 보안

- API 키는 `.env.local`에 두고 **절대 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.** 붙는 순간 클라이언트 번들에 그대로 박혀 공개된다.
- 비밀 값은 Route Handler(`src/app/api/*/route.ts`)·서버 컴포넌트·Server Action에서만 읽는다.

## 스타일

CSS에 시간을 쓰지 않는다. Tailwind 유틸리티 + shadcn/ui 컴포넌트로 해결하고, 커스텀 CSS는 최소로 유지한다.

## pnpm 주의

pnpm 10+ 는 의존성의 빌드 스크립트를 기본 차단한다. 새 패키지 설치 후 `ERR_PNPM_IGNORED_BUILDS`가 뜨면 `pnpm approve-builds`로 승인하고 `pnpm-workspace.yaml`의 `allowBuilds`에 기록한다.
