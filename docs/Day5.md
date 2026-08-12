# Day 5 — Next.js 기초 (App Router): "서버와 클라이언트가 한 프로젝트에"

> **소요 시간**: 약 8시간 (90분 × 4세션). 세션 2(서버/클라이언트)에 시간을 가장 많이 쓰세요.
> **선행 조건**: Day 4 완료 (`useState`/`useEffect`/props/커스텀 훅, `practice/day4/`에 채팅 UI 동작).
> **오늘의 목표**: Next.js 16 App Router 구조와 **서버 컴포넌트 / 클라이언트 컴포넌트** 모델을 새기고 Day 4 채팅 UI를 Next.js로 이사시킨다. Day 6에 LLM이 붙을 API 자리도 미리 판다.
>
> **태그 범례**: `🐍` Python 대비 · `💡` 팁 · `⚠️` 함정 · `🎯` 배경 · `📖` 설명용(읽기만) · `⌨️` 실습(직접 치기) · `✅` 완성본
> (⌨️ 실습에는 "새 파일 / 덮어쓰기 / 부분 수정" 중 무엇인지 함께 표기합니다)

---

## 0. 오늘의 큰 그림 (5분)

Day 4까지는 **브라우저 안** 이야기였습니다(Vite 앱 = 전부 브라우저 JS). 오늘부터 **서버가 합류**합니다.

한 문장 정의:

> **Next.js = React + 라우터 + 서버(백엔드)를 한 프로젝트에 합친 프레임워크**

### 🎯 배경 — 왜 React 위에 또 프레임워크가 필요한가

React는 "화면 그리는 라이브러리"일 뿐입니다. 실제 앱을 만들려면 그 위에 **페이지 주소(라우팅)**, **서버에서 데이터 가져오기**, **번들링/최적화**, **SEO** 같은 걸 매번 직접 배선해야 합니다. 이게 큰일이에요. Next.js는 이 모든 뼈대를 정해진 규칙(convention)으로 제공합니다.

- 🐍 느낌으로는 **Django/FastAPI가 "웹앱의 뼈대"를 제공**하는 것과 비슷합니다. React 혼자가 "요청 처리 함수"라면 Next.js는 "라우팅·미들웨어·템플릿까지 갖춘 프레임워크"예요.
- Next.js 16의 App Router는 **RSC(React Server Components)** 위에 지어졌습니다 — "화면 컴포넌트 일부를 서버에서 미리 실행"하는 새 방식이에요(세션 2에서 자세히).

### 🐍 당신을 위한 비유 — FastAPI + 템플릿의 진화형

Python 웹은 보통 이렇게 나뉩니다.

📖 설명용 — Python 방식(읽기만)

```python
# 서버(FastAPI): DB 접근, 비밀 키 사용
@app.get("/users/{uid}")
async def get_user(uid: int):
    user = await db.fetch_user(uid)          # 서버에서만 가능
    return render("user.html", {"user": user})
```
```html
<!-- 브라우저(JS): 클릭·입력·애니메이션 -->
<script>document.querySelector("button").onclick = () => {...}</script>
```

Next.js는 **이 둘을 같은 언어(TSX)로, 같은 폴더에서** 씁니다.

| 하는 일 | 🐍 Python 세계 | 🟨 Next.js 세계 |
|---|---|---|
| 서버에서 데이터→화면 | FastAPI 핸들러 + 템플릿 | **서버 컴포넌트** (`page.tsx` 기본) |
| 브라우저 클릭/입력 | 별도 `.js` | **클라이언트 컴포넌트** (`"use client"`) |
| REST API | `@app.post("/api/chat")` | **Route Handler** (`app/api/chat/route.ts`) |
| 폼 처리 | `@app.post("/submit")` | **Server Action** (`"use server"`) |
| 비밀 키 | `os.environ["KEY"]` | `process.env.KEY` (서버 전용) |

⚠️ **오늘 가장 헷갈릴 것**: 똑같이 생긴 `.tsx`인데 **어떤 건 서버에서, 어떤 건 브라우저에서** 실행됩니다. 겉모습으론 구분이 안 돼요. 그래서 세션 2가 오늘의 핵심입니다.

### 0-1. 저장소 구조 (오늘부터 앱 하나를 계속 키움)

Day 1~4는 "하루짜리 연습 폴더"였지만 **오늘부터 최종 산출물이 될 앱 `chat-app/`을 만들어 Day 9까지 키웁니다.**

📖 읽기 전용 — 오늘 끝났을 때의 모습 (지금 한꺼번에 만드는 게 아님)

```
nextjs-study/
├── practice/day1 ... day4/         (연습, 보존)
└── chat-app/                       ← ⭐ 오늘 생성, Day 6~9에서 자람
    ├── .env.local                  ← ⚠️ git 금지
    └── src/
        ├── app/
        │   ├── layout.tsx          ← 전역 껍데기
        │   ├── page.tsx            ← 홈 (서버 컴포넌트)
        │   ├── about/page.tsx      ← /about (라우팅 연습)
        │   └── api/chat/route.ts   ← ⭐ Day 6 LLM이 붙을 자리 (오늘 stub)
        ├── components/
        │   ├── ChatPanel.tsx       ← "use client" (상태 보유)
        │   ├── MessageList.tsx
        │   ├── MessageItem.tsx
        │   └── ChatInput.tsx
        └── hooks/useAutoScroll.ts
```

### 0-2. 시작 준비 — Next.js 앱 생성

⌨️ 실습 — 저장소 루트(`nextjs-study/`)에서

```bash
pnpm create next-app@latest chat-app \
  --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
```

⚠️ **플래그를 반드시 붙이세요.** Next.js 16의 `create-next-app`은 TypeScript·Tailwind·App Router·Turbopack이 **이미 기본값이라 묻지 않습니다**(`--turbopack` 플래그도 없어졌어요). 문제는 **`src/` 디렉터리인데, 이건 묻지도 않고 기본이 off**입니다. `--src-dir` 없이 실행하면 `chat-app/app/`이 생기고 `@/`가 `src/`가 아니라 프로젝트 루트를 가리켜서, **오늘 이후 모든 실습의 경로가 어긋납니다.** 남는 프롬프트(React Compiler 등)는 기본값(No)으로 두면 됩니다.

<details><summary>⚠️ 이미 <code>--src-dir</code> 없이 만들었다면 (되돌리기)</summary>

`chat-app/app/`이 생겼고 `chat-app/src/`가 없다면, 지우고 다시 만들 필요 없이 두 가지만 고치면 됩니다.

```bash
cd chat-app
mkdir -p src
mv app src/app
rm -rf .next          # 이전 구조로 만들어진 빌드 캐시 비우기
```

그리고 `chat-app/tsconfig.json`의 `paths`를 `"@/*": ["./*"]` → **`"@/*": ["./src/*"]`**로 고칩니다. (`node_modules`는 그대로 두면 되니 재설치는 필요 없어요.)
</details>

⌨️ 실습 — 개발 서버 실행

```bash
cd chat-app     # ⚠️ 반드시 먼저! 저장소 루트에는 package.json이 없습니다
pnpm dev
```

→ `http://localhost:3000`을 열어 기본 화면이 뜨면 준비 끝. (Day 4의 Vite는 5173, Next.js는 3000 포트예요.)

⚠️ 저장소 루트에서 `pnpm dev`를 치면 `ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND`가 납니다. "이 폴더엔 `package.json`이 없다"는 뜻이에요. 🐍 가상환경을 활성화하지 않고 `python manage.py`를 친 것과 비슷한 실수입니다 — **오늘부터 작업 디렉터리는 `chat-app/`**입니다.

---

## 1. 세션 1 (오전) — 프로젝트 구조 & 파일 기반 라우팅

### 1-1. 파일 위치 = URL (파일 기반 라우팅)

**① 왜 좋은가**: 라우트를 코드로 등록(`@app.get(...)`)하지 않습니다. **폴더/파일 위치가 곧 주소**가 됩니다.
**② 규칙**:
- `src/app/page.tsx` → `/` (홈)
- `src/app/about/page.tsx` → `/about`
- `src/app/blog/[id]/page.tsx` → `/blog/123` (동적 경로)
**③ 🐍**: FastAPI에서 데코레이터로 경로를 붙이던 걸, Next.js는 **폴더 구조로** 대신합니다.

⌨️ 실습 — `src/app/about/page.tsx` 새 파일

```tsx
export default function AboutPage() {
  return <h1>소개 페이지입니다</h1>;
}
```

브라우저에서 `http://localhost:3000/about`로 이동해 보세요. **파일을 만든 것만으로 새 주소가 생겼습니다.**

### 1-2. 특수 파일 4형제 — page / layout / loading / error

**② 쉬운 설명**: 폴더 안 특정 이름의 파일이 특별한 역할을 합니다.

| 파일 | 역할 | 🐍 느낌 |
|------|------|---------|
| `page.tsx` | 그 경로의 **실제 화면** | 뷰 함수 |
| `layout.tsx` | 하위 페이지를 **감싸는 공통 껍데기**(헤더 등) | 베이스 템플릿 |
| `loading.tsx` | 데이터 로딩 중 보여줄 UI | (자동 로딩 스피너) |
| `error.tsx` | 에러 발생 시 보여줄 UI | 에러 핸들러 |

📖 설명용 — 기본 `layout.tsx`(이미 생성돼 있음, 구조만 이해)

```tsx
export default function RootLayout({
  children,   // 하위 페이지가 여기 들어옴
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

💡 `children`은 "이 껍데기 안에 들어올 내용물"입니다. Day 4의 props와 같은 개념이에요.

### 1-3. 페이지 이동 — `<Link>`

**② 쉬운 설명**: 페이지 간 이동은 `<a>` 대신 **`<Link>`**를 씁니다(전체 새로고침 없이 빠르게 전환).

⌨️ 실습 — `src/app/page.tsx` 덮어쓰기

```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">홈</h1>
      <Link href="/about" className="text-blue-600 underline">
        소개 페이지로 →
      </Link>
    </main>
  );
}
```

> ⌨️ **미니 실습**: `/about` 페이지에도 홈으로 돌아가는 `<Link href="/">`를 추가해 보세요.

### ✅ 세션 1 체크
- [ ] 파일을 만들어 새 URL 생성
- [ ] page/layout의 역할 구분, `children` 이해
- [ ] `<Link>`로 페이지 이동

---

## 2. 세션 2 (오전) — ⭐서버 컴포넌트 vs 클라이언트 컴포넌트

**오늘의 핵심입니다.** 천천히.

### 2-1. 기본은 "서버 컴포넌트"

**① 무엇**: App Router에서 `app/` 안의 컴포넌트는 **기본적으로 서버에서 실행**됩니다(= 서버 컴포넌트, RSC).
**② 할 수 있는 것**: 서버에서 도니 **`async/await`로 직접 데이터 페칭**, **DB 접근**, **비밀 키 사용**이 가능합니다. 결과 HTML만 브라우저로 보내요.
**③ 못 하는 것**: `useState`·`useEffect`·`onClick`·브라우저 API(스크롤 등) 사용 **불가**. 브라우저에서 안 도니까요.

📖 설명용 — 서버 컴포넌트에서 직접 페칭

```tsx
// app/users/page.tsx — 서버 컴포넌트는 async 가능!
export default async function UsersPage() {
  const res = await fetch("https://api.github.com/users/torvalds");
  const user = await res.json();
  return <p>{user.login}</p>;   // 이 fetch는 서버에서 실행됨
}
```

🐍 이건 FastAPI 핸들러가 `await db.fetch()` 후 템플릿을 렌더하는 것과 **정확히 같은 위치**예요. `await`가 컴포넌트 함수에 바로 붙는 게 신기하지만 "이건 서버에서 도는 함수다"라고 생각하면 자연스럽습니다.

### 2-2. 상호작용이 필요하면 "클라이언트 컴포넌트"

**① 무엇**: 파일 맨 위에 **`"use client"`**를 적으면, 그 컴포넌트는 브라우저에서도 실행됩니다.
**② 할 수 있는 것**: `useState`·`useEffect`·`onClick` 등 **Day 4에서 배운 모든 것**.
**③ 못/안 되는 것**: 컴포넌트 함수 자체가 `async`일 수 없고 **비밀 키를 쓰면 안 됩니다**(브라우저로 코드가 넘어가니 노출됨).

📖 설명용 — 클라이언트 컴포넌트

```tsx
"use client";              // ← 이 한 줄이 경계

import { useState } from "react";

export default function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
```

⚠️ **함정 — 서버 컴포넌트에서 `useState`를 쓰면 에러**: `"use client"` 없이 `useState`를 쓰면 `You're importing a component that needs useState. It only works in a Client Component...` 에러가 납니다. **이 에러를 만나면 "아, 이 파일은 브라우저용이구나 → `"use client"` 붙이자"**로 반응하면 됩니다.

### 2-3. 멘탈 모델 — "기본은 서버, 상호작용에만 use client"

```
[모든 컴포넌트]
   기본값: 서버 컴포넌트 (빠르고, 비밀 안전, 직접 페칭)
       │
       └─ 상태·이벤트·브라우저 API가 필요? ──▶ 파일 맨 위에 "use client"
```

**설계 원칙**: `"use client"`를 **최대한 잎사귀(작은 말단 컴포넌트)에만** 붙이세요. 페이지 전체를 클라이언트로 만들지 말고 **상호작용하는 부분만** 클라이언트로 떼어냅니다. 오늘 채팅에서 이 패턴을 씁니다: 페이지(`page.tsx`)는 서버, 상태가 있는 `ChatPanel`만 클라이언트.

### 2-4. 둘을 조합하는 규칙

- ✅ **서버 컴포넌트가 클라이언트 컴포넌트를 import해서 렌더**할 수 있습니다(가장 흔한 패턴).
- ⚠️ 반대(클라이언트가 서버 컴포넌트를 import)는 안 됩니다. 대신 `children`으로 넘겨받는 방법이 있어요(지금은 몰라도 됨).
- 서버→클라이언트로 넘기는 props는 **직렬화 가능한 값**(문자열·숫자·배열·객체)이어야 합니다. 함수는 예외적 경우만.

### ✅ 세션 2 체크
- [ ] "기본은 서버, 상호작용만 클라이언트"를 말로 설명 가능
- [ ] `useState`를 서버 컴포넌트에서 쓰면 왜 에러인지 안다
- [ ] `"use client"`를 어디에 붙일지(말단에) 감이 있다

---

## 3. 세션 3 (오후) — Route Handler · Server Action · 환경 변수

### 3-1. Route Handler — REST API 엔드포인트

**① 무엇**: `app/api/.../route.ts`에서 `GET`/`POST` 함수를 export하면 **API 엔드포인트**가 됩니다. 🐍 FastAPI의 `@app.get`/`@app.post`에 해당.
**② Day 6 준비**: 우리 채팅의 LLM 호출이 여기 붙습니다. 오늘은 **stub(가짜 응답)**만 만들어 두고 Day 6에서 진짜로 채워요.

⌨️ 실습 — `src/app/api/chat/route.ts` 새 파일

```ts
// src/app/api/chat/route.ts
// 파일 위치가 곧 주소: app/api/chat/route.ts → POST /api/chat
export async function POST(request: Request) {
  const body = await request.json();       // 기대하는 형태: { messages: [{ role, text }, ...] }

  // 마지막 메시지의 text만 꺼냅니다. 이 한 줄에 JS 문법 3개가 들어 있어요:
  //   .at(-1)  배열의 마지막 원소 (🐍 Python의 messages[-1]. JS는 대괄호에 음수를 못 넣어서 .at()을 씀)
  //   ?.       옵셔널 체이닝 — 앞이 undefined/null이면 에러 대신 undefined를 반환 
  //   ?? ""    널 병합 — 왼쪽이 undefined/null일 때만 ""를 사용 (||와 달리 빈 문자열·0은 그대로 통과)
  // → messages가 없든, 빈 배열이든, text 키가 없든 터지지 않고 ""가 됩니다.
  const lastText = body.messages?.at(-1)?.text ?? "";

  // Response.json(obj) = 객체를 JSON 문자열로 바꾸고 Content-Type: application/json 헤더까지 붙여주는 헬퍼.
  // Route Handler에서는 이 Response 객체를 return하는 것이 곧 "응답 보내기"입니다.
  // 🐍 FastAPI는 return dict만 해도 알아서 JSON으로 바꿔줬지만, 여기선 Response로 감싸 줘야 합니다.
  return Response.json({
    // 백틱(`)으로 감싼 문자열 = 템플릿 리터럴. ${} 안에 값을 끼워 넣습니다 (🐍 f-string과 같은 역할)
    reply: `(stub) "${lastText}" 잘 받았어요. Day 6에서 진짜 AI가 답합니다.`,
  });
}
```

⌨️ 실습 — 터미널에서 API 직접 호출해 확인

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","text":"안녕"}]}'
```

→ `{"reply":"(stub) \"안녕\" 잘 받았어요..."}` 가 나오면 API가 살아 있습니다.

💡 `request`/`Response`는 웹 표준 객체입니다. 🐍 FastAPI의 `Request`/`Response`와 비슷하지만, 여기선 브라우저 표준 그대로예요. `Response.json(...)`은 JSON 응답을 만드는 헬퍼.

### 3-2. Server Action — 폼/뮤테이션 (개념 + 맛보기)

**② 쉬운 설명**: 함수 맨 위에 `"use server"`를 적으면 **클라이언트에서 호출해도 실제 실행은 서버에서** 일어나는 함수가 됩니다. 폼 제출·DB 쓰기에 편해요. 🐍 "RPC처럼 서버 함수를 직접 부르는" 느낌.
💡 오늘은 채팅 API를 Route Handler로 처리하므로 Server Action은 **개념만** 알고 넘어갑니다. (Day 6~9에서 필요하면 다시)

### 3-3. 환경 변수 — 비밀 키 관리 (Day 6 필수 준비)

**① 왜 중요**: LLM API 키 같은 비밀은 **절대 브라우저로 새면 안 됩니다.**
**② 규칙**:
- `.env.local`에 `KEY=값` 형태로 저장 (⚠️ `.gitignore`에 있어 git에 안 올라감 — 기본 포함됨)
- **`process.env.KEY`**로 읽음. **서버 컴포넌트/Route Handler에서만** 접근 가능.
- 브라우저에도 노출해야 하는 값(비밀 아닌 것)만 **`NEXT_PUBLIC_` 접두사**를 붙임.

⌨️ 실습 — `chat-app/.env.local` 새 파일 (Day 6에 진짜 키를 넣습니다)

```bash
# Day 6에서 실제 Anthropic 키로 교체
ANTHROPIC_API_KEY=여기에_나중에_키
```

⚠️⚠️ **가장 위험한 실수**: 비밀 키에 `NEXT_PUBLIC_`을 붙이면 **브라우저 번들에 그대로 노출**됩니다. LLM 키는 **절대** `NEXT_PUBLIC_`을 붙이지 마세요. 🐍 `os.environ`은 서버에만 있었지만 Next.js는 "이 값이 브라우저로 갈 수 있다"는 걸 늘 의식해야 합니다.

---

## 4. 세션 4 (오후) — 채팅 UI 이관 + shadcn/ui

Day 4의 채팅 UI를 `chat-app`으로 옮기고 서버/클라이언트 경계를 정리합니다.

### 4-1. 컴포넌트 이관

⌨️ 실습 — Day 4 파일들을 복사 (저장소 루트에서, macOS/Linux)

```bash
mkdir -p chat-app/src/components chat-app/src/hooks
cp practice/day4/src/types.ts chat-app/src/
cp practice/day4/src/components/*.tsx chat-app/src/components/
cp practice/day4/src/hooks/useAutoScroll.ts chat-app/src/hooks/
```

### 4-2. 경계 정리 — 상태를 가진 부분만 `"use client"`

Day 4의 `App.tsx` 역할을 하는 **상태 보유 컴포넌트**를 만들고 여기에만 `"use client"`를 붙입니다.

⌨️ 실습 — `src/components/ChatPanel.tsx` 새 파일 (Day 4 App.tsx 로직 이식)

```tsx
"use client";

import { useState } from "react";
import type { Message } from "../types";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useAutoScroll } from "../hooks/useAutoScroll";

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useAutoScroll(messages);

  const handleSend = (text: string) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);

    // 아직은 가짜 응답 (Day 6에서 /api/chat 스트리밍으로 교체)
    const botMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: `"${text}" 라고 하셨네요! (Day 6에서 진짜 AI로)`,
    };
    setMessages((prev) => [...prev, botMsg]);
  };

  return (
    <div>
      <MessageList messages={messages} />
      <div ref={bottomRef} />
      <ChatInput onSend={handleSend} />
    </div>
  );
}
```

⚠️ `MessageList`/`MessageItem`/`ChatInput`도 확인하세요. `ChatInput`은 `useState`·`onClick`을 쓰니 **`"use client"`가 필요**합니다(맨 위에 추가). `MessageList`/`MessageItem`은 상태 없이 props만 받아 렌더하므로 서버 컴포넌트로 둬도 되지만 클라이언트인 `ChatPanel`이 렌더하면 자동으로 클라이언트 취급됩니다. **헷갈리면 이 세 개에 `"use client"`를 붙여도 무방**해요(학습 단계에선 안전).

⌨️ 실습 — `src/app/page.tsx` 덮어쓰기 (페이지는 서버, 채팅만 클라이언트)

```tsx
import ChatPanel from "@/components/ChatPanel";

export default function HomePage() {
  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-xl font-bold mb-4">내 채팅 앱</h1>
      <ChatPanel />
    </main>
  );
}
```

💡 `@/`는 `src/`를 가리키는 별칭(alias)입니다(생성 시 설정됨). 긴 상대경로(`../../`) 대신 `@/components/...`로 깔끔하게 import해요.

⌨️ 실행 — `pnpm dev` 후 `http://localhost:3000`에서 채팅 동작 확인. **Day 4와 똑같이 작동하되, 이제 Next.js 위에서 돕니다.**

### 4-3. shadcn/ui 도입 (Day 4에서 미룬 것)

**① 무엇**: shadcn/ui는 UI 컴포넌트 모음인데, **잘 만든 컴포넌트 코드를 내 프로젝트에 복사해 넣는** 방식입니다(패키지 의존성이 아니라 내 코드가 됨 → 자유롭게 수정 가능). 🐍 "라이브러리 import"가 아니라 "검증된 코드를 가져와 내 것으로".

⌨️ 실습 — 초기화 + 컴포넌트 추가

```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input
```

(프롬프트는 기본값 위주로 진행하면 됩니다. `src/components/ui/`에 `button.tsx`, `input.tsx`가 생깁니다.)

⌨️ 실습 — `ChatInput`을 shadcn 컴포넌트로 살짝 교체 (부분 수정)

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onSend: (text: string) => void;
}

export default function ChatInput({ onSend }: Props) {
  const [text, setText] = useState("");
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };
  return (
    <div className="flex gap-2 mt-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) submit();
        }}
        placeholder="메시지를 입력하세요"
      />
      <Button onClick={submit}>전송</Button>
    </div>
  );
}
```

💡 한글 IME 처리(`isComposing`)는 그대로 유지했습니다. shadcn의 `Input`도 결국 일반 input이라 그 처리가 여전히 필요해요.

---

## 5. 디버깅 실습 — "use client" 경계 에러

⌨️ 실습 — `src/app/page.tsx`를 잠깐 아래처럼 바꿔 에러를 만나 보세요 (확인 후 되돌리기)

```tsx
import { useState } from "react";   // 서버 컴포넌트인데 useState?

export default function HomePage() {
  const [n, setN] = useState(0);     // 여기서 터짐
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
```

에러가 납니다. **메시지를 읽고 원인을 말해 보세요.**

<details><summary>정답 보기</summary>

에러: `You're importing a component that needs useState. It only works in a Client Component, but none of its parents are marked with "use client"...`

`page.tsx`는 **기본이 서버 컴포넌트**인데 `useState`(브라우저 전용)를 썼기 때문입니다. 해결은 둘 중 하나:
- 이 파일 맨 위에 `"use client"`를 붙인다, 또는
- (더 좋은 방법) 상호작용 부분을 별도 클라이언트 컴포넌트로 떼어내고 페이지는 서버로 둔다 → **오늘 `ChatPanel`로 한 것**이 바로 이 패턴입니다.

교훈: **이 에러는 "이 코드는 브라우저용이다"라는 신호.** `"use client"`를 어디에 그을지 알려주는 안내판이에요.
</details>

---

## 6. 🎯 Next.js 에러 읽는 법

| 메시지 | 뜻 | 해결 |
|--------|-----|------|
| `ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND` | 그 폴더에 `package.json`이 없음 | `cd chat-app` 후 다시 실행 |
| `... needs useState. It only works in a Client Component` | 서버 컴포넌트에서 훅/이벤트 사용 | 말단에 `"use client"` |
| `Hydration failed ...` | 서버가 그린 HTML과 브라우저 결과 불일치 | 렌더 중 `Math.random`/`Date.now`·브라우저 전용 코드 확인 |
| `Module not found: Can't resolve '@/...'` | 경로 별칭/파일 위치 오류 | 파일 위치와 `@/` 별칭 확인 |
| `ANTHROPIC_API_KEY is undefined` (Day 6) | `.env.local` 미설정 또는 서버 밖 접근 | 키 설정, 서버(Route Handler)에서만 접근 |

💡 "Hydration"(하이드레이션)은 "서버가 만든 정적 HTML에 브라우저에서 상호작용을 입히는 과정"입니다. 지금은 용어만 알아두세요.

---

## 7. ✅ Day 5 최종 체크리스트

- [ ] 파일 기반 라우팅으로 페이지 2개 + `<Link>` 이동
- [ ] page/layout/`children` 역할 설명 가능
- [ ] **서버 컴포넌트 vs 클라이언트 컴포넌트** 차이를 말로 설명 가능
- [ ] `"use client"`를 말단에만 붙이는 이유 이해
- [ ] `app/api/chat/route.ts` stub을 만들고 `curl`로 응답 확인
- [ ] `.env.local` + `process.env` 규칙, `NEXT_PUBLIC_` 위험 이해
- [ ] Day 4 채팅 UI가 Next.js(`chat-app`)에서 동작 (`ChatPanel`만 클라이언트)
- [ ] shadcn/ui `Button`/`Input` 적용
- [ ] 디버깅 실습에서 use client 경계 에러 원인 설명

---

## 8. git 커밋

⌨️ 실습 — `chat-app/`에서 (또는 저장소 루트에서)

```bash
git add .
git commit -m "Day 5: Next.js App Router(서버/클라이언트 컴포넌트) + 채팅 UI 이관 + shadcn/ui + API stub"
```

---

## 9. Day 6 미리보기

내일부터 **진짜 AI**가 붙습니다.

- Vercel AI SDK v6로 `/api/chat` stub을 **실제 LLM 스트리밍**으로 교체
- 클라이언트: `useChat` 훅으로 토큰이 실시간으로 흐르는 UI
- **기본 tool calling** — Day 3의 Zod가 도구 입력 스키마로 재등장
- ⚠️ 시작 전 준비: [console.anthropic.com](https://console.anthropic.com)에서 **API 키 발급 + 소액 크레딧**

💡 시작할 때 로드맵을 붙이고 **"Day 6 상세 자료 만들어줘"**라고 요청하세요.

---

## 부록 — Python(FastAPI) ↔ Next.js 치트시트

| 개념 | 🐍 FastAPI/Python | 🟨 Next.js |
|------|-------------------|------------|
| 라우트 등록 | `@app.get("/x")` | 파일 `app/x/page.tsx` |
| 동적 경로 | `/items/{id}` | `app/items/[id]/page.tsx` |
| 서버에서 데이터→화면 | 핸들러 + 템플릿 | 서버 컴포넌트(async) |
| 브라우저 상호작용 | 별도 JS | 클라이언트 컴포넌트(`"use client"`) |
| REST API | `@app.post("/api/chat")` | `app/api/chat/route.ts`의 `POST` |
| 폼/뮤테이션 | POST 핸들러 | Server Action(`"use server"`) |
| 비밀 키 | `os.environ["KEY"]` | `process.env.KEY` (서버 전용) |
| 공통 레이아웃 | 베이스 템플릿 | `layout.tsx` |
| 페이지 이동 | `<a href>`/리다이렉트 | `<Link href>` |

가장 어려운 개념(서버/클라이언트)을 넘었습니다. 내일은 이 위에 LLM을 얹어 진짜 챗봇을 만듭니다. 🟨
