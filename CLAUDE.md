# CLAUDE.md

## 프로젝트 개요
Python 기반 ML 개발자가 JS/TS → React/Next.js → 에이전트/RAG를 익히는 **Day 0~10 자습 프로젝트**입니다.
`채팅 UI → 스트리밍 챗봇+도구 → RAG 직접 구현 → LangChain.js → LangGraph.js 에이전트 → 캡스톤` 순으로 **하나의 앱을 계속 키워** 나갑니다.
전체 계획·스택·버전·작성 규칙의 단일 출처는 [docs/roadmap.md](docs/roadmap.md) (개정판 v2.1).

## 폴더 구조
- [docs/](docs/) — **현재 사용하는 교육 자료**. `Day0.md`~`Day10.md` + `roadmap.md`
- [archives/](archives/) — v1 시절의 이전 교육 자료(`archives/docs/`)와 그때 만든 실습 코드(`archives/practice/`, `archives/chat-app/`). **참고만 하고 수정하지 않습니다.** 새 자료를 쓸 때 archives의 옛 버전을 그대로 베끼지 말 것
- `practice/dayN/` — Day 1~4 연습 코드 (하루짜리, 계속 쌓임)
- `chat-app/` — Day 5에서 생성해 Day 9까지 키우는 최종 산출물 앱

## 학습자 배경 (응답 시 항상 고려)
- Python 실무 경험 있음(함수/클래스/비동기/타입힌트 익숙), LLM·임베딩·RAG·에이전트 **개념**도 이미 앎. Python LangChain/LangGraph도 아마 써봄
- 반면 **웹은 거의 처음** — HTML/CSS/브라우저/DOM, JS/TS 문법, React 선언형 렌더링, Next.js 서버/클라이언트 컴포넌트 모두 처음
- ML/RAG 관련 요청은 개념 설명보다 **TypeScript/Next.js 구현 배선**에 집중

## 교육 자료 작성 규칙 (roadmap §7 요약 — Day 자료 만들 때 강제)
- **독자 기준**: "Python은 알지만 웹은 완전 초보". 새 웹 용어는 첫 등장 시 한 줄 정의, 한 문단 3~4문장 이내
- **Python 비유는 다리일 뿐** — 비유 뒤에 "JS/웹만 아는 사람용 자체 설명"을 반드시 덧붙임
- **코드 블록 라벨 필수**: `📖 설명용`(읽기만) / `⌨️ 실습`(직접 타이핑 — **파일 경로 + 실행 명령 필수**) / `✅ 완성본`(파일 경로)
- **개념 5단계 템플릿**: ① 왜 있나(문제) → ② 쉬운 설명 → ③ 🐍 Python 다리 + JS 자체 설명 → ④ 📖 최소 예제 → ⑤ ⚠️ 함정
- **실습 밀도**: 개념 1개 = 미니 실습 1개, 세션 끝에 문제 2~3개+정답, 매일 디버깅 실습 1개. Day 1~3은 읽기:치기 = 4:6
- **🎯 배경 박스**: 각 기술 첫 도입부에 "왜 만들어졌나 / 어떤 문제 / 어쩌다 표준 / Python 세계와 뭐가 다른가" 5~10문장
- **태그**: `🐍` Python 대비 · `💡` 팁 · `⚠️` 함정 · `🎯` 배경지식

## 기술 스택 (버전 고정 — 상세는 roadmap §3)
Node.js 24 LTS · pnpm · TypeScript 5.x(⚠️ 7.x 아님) · Next.js 16.x App Router · React 19 · Tailwind v4 + shadcn/ui · Zod
- LLM: **Anthropic Claude** (`@ai-sdk/anthropic` / `@langchain/anthropic`)
- 스트리밍·도구(Day 6): **Vercel AI SDK v6**
- 임베딩(Day 7~8): **로컬** `@huggingface/transformers` + `Xenova/all-MiniLM-L6-v2` (추가 API 키·비용 0)
- RAG: 직접 구현(Day 7) → LangChain.js(Day 8) · 에이전트: LangGraph.js(Day 9)

## 응답 스타일
- 이론은 짧게, 직접 치는 실습 코드 비중을 높게
- 새 JS/TS 문법은 "Python이면 이렇게, JS면 이렇게" 대조 + JS 자체 설명
- CSS는 최소화 — Tailwind + shadcn/ui 활용, 커스텀 스타일링에 시간 쓰지 않기
- **원리 먼저, 프레임워크 나중** — 직접 구현해본 뒤 프레임워크로 교체·대조하는 순서를 지킴
- 학습 범위 밖: `this`/프로토타입 상속 심화, 클래스 컴포넌트, Pages Router, Redux
