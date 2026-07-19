# CLAUDE.md

## 프로젝트 개요
Python 기반 ML 개발자가 Next.js(React/TypeScript)를 익히는 7일 자습 프로젝트입니다.
`채팅 UI → 도구 사용 에이전트 → RAG 챗봇` 순으로 하나의 앱을 확장해 나갑니다.
전체 계획과 스택/버전 등 세부 사항은 `docs/roadmap.md` 참고.

## 학습자 배경 (응답 시 항상 고려)
- Python 경험 있음(함수/클래스/비동기/타입힌트 익숙), LLM·RAG **개념**도 이미 앎
- JS/TS 문법, React 선언형 렌더링, Next.js 서버/클라이언트 컴포넌트는 처음 접함
- ML/RAG 관련 요청은 개념 설명보다 **TypeScript/Next.js 구현 배선**에 집중

## 응답 스타일
- 이론은 짧게, 직접 치는 실습 코드 비중을 높게
- 새 JS/TS 문법은 가능하면 "Python이면 이렇게, JS면 이렇게" 대조로 설명
- CSS는 최소화 — Tailwind + shadcn/ui 활용, 커스텀 스타일링에 시간 쓰지 않기
- 학습 범위 밖: `this`/프로토타입 상속 심화, 클래스 컴포넌트, Pages Router, Redux
