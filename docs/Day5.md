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

⚠️ **실제로 생성된 `src/app/layout.tsx`를 열어보면 위 예제와 다릅니다.** 폰트 설정(`Geist`)과 `metadata`가 더 있고, props 타입이 `LayoutProps<"/">`로 적혀 있어요. 이건 Next.js 16이 **라우트별 타입을 자동 생성**해주는 기능입니다(`{ children: React.ReactNode }`를 직접 쓴 것과 결과가 같음). 놀라지 말고 그대로 두세요.

⌨️ 미니 실습 — `src/app/layout.tsx` 부분 수정 (한글 앱에 맞게 두 곳만)

```tsx
export const metadata: Metadata = {
  title: "내 채팅 앱",              // ← 브라우저 탭 제목 (기본값: "Create Next App")
  description: "Day 5에서 만든 채팅 앱",
};

// ...
    <html lang="ko" ...>            // ← "en" → "ko" (스크린리더·번역기가 참고하는 언어 표시)
```

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

⌨️ 실습 — 터미널에서 API 직접 호출해 확인 (⚠️ **다른 터미널 탭**에서 `pnpm dev`가 돌고 있어야 합니다)

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

### ✅ 세션 3 체크
- [ ] `app/api/chat/route.ts`에 `POST`를 export해 `/api/chat` 엔드포인트 생성
- [ ] `curl`로 stub 응답 확인 (`{"reply":"(stub) ..."}`)
- [ ] `request.json()` / `Response.json()`의 역할 설명 가능
- [ ] Server Action은 "클라이언트에서 부르지만 서버에서 실행"이라는 개념만 파악
- [ ] `.env.local` 생성, `NEXT_PUBLIC_`을 비밀 키에 붙이면 안 되는 이유 설명 가능

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
import type { Message } from "@/types";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useAutoScroll } from "@/hooks/useAutoScroll";

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]); // 제네릭 타입 인자와 초기값
  const bottomRef = useAutoScroll(messages); // 메시지가 늘어나면 대화창 아래로 자동 스크롤, bottomRef는 어디가 맨 아래인지 표시

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
      {/* bottomRef를 MessageList에 넘긴다 — 아래 ⚠️ 참고 */}
      <MessageList messages={messages} bottomRef={bottomRef} />
      <ChatInput onSend={handleSend} />
    </div>
  );
}
```

⚠️ **`bottomRef`는 `MessageList`에 넘겨야 합니다.** Day 4의 `MessageList`는 `bottomRef`를 **필수 prop으로 선언**해 뒀으니(안 넘기면 `Property 'bottomRef' is missing ... ts(2741)` 에러), 아래 두 곳을 확인하세요.

```tsx
// src/components/MessageList.tsx (부분 수정)
function MessageList({ messages, bottomRef }: Props) {   // ← 구조 분해에 bottomRef 포함
  return (
    <div className="... h-96 overflow-y-auto ...">       // ← 실제로 스크롤되는 상자
      {messages.map((m) => (
        <MessageItem key={m.id} message={m} />
      ))}
      <div ref={bottomRef} />                            // ← 표식은 이 상자 "안"에
    </div>
  );
}
```

표식을 `ChatPanel`에 두면(= 스크롤 상자 **밖**) `scrollIntoView`가 대화창 내부 대신 **페이지 전체**를 움직여서 자동 스크롤이 안 됩니다. 💡 `bottomRef?:`처럼 `?`를 붙여 에러만 끄면 빨간 줄은 사라지지만 스크롤은 영원히 안 돼요 — **타입 에러는 "설계가 어긋났다"는 신호**로 읽으세요.

### 4-2-1. ⭐ `"use client"`는 "문패"가 아니라 "국경 검문소"

여기서 가장 헷갈리는 걸 짚고 갑니다. `MessageList`/`MessageItem`/`ChatInput`에는 `"use client"`를 **안 붙여도 됩니다.** 왜냐하면 `"use client"`의 뜻이 이렇기 때문입니다.

> "이 파일은 클라이언트야"가 **아니라** → **"여기서부터 안쪽은 전부 클라이언트 영역"**

파일에 붙이는 라벨이 아니라 **경계선을 긋는 선언**입니다. 그 선을 넘은 곳에서 import한 컴포넌트는 **자동으로** 클라이언트가 됩니다. 검문소는 **입구에 하나만** 두면 되고, 안쪽 건물마다 세울 필요가 없어요. (아래 그림의 `page.tsx` → `ChatPanel` 연결은 **4-2-2에서** 실제로 만듭니다)

```
[page.tsx]  ← 서버 영역 (지시문 없음 = 기본값)
    │
    │ import ChatPanel
    ▼
╔═══ "use client" ← 검문소. 이 선 아래는 전부 클라이언트 ═══════════╗
║  [ChatPanel]                                                  ║
║      ├── import MessageList  → 자동 클라이언트                  ║
║      │       └── MessageItem → 자동 클라이언트                  ║
║      └── import ChatInput    → 자동 클라이언트 (지시문 없어도 OK) ║
╚═══════════════════════════════════════════════════════════════╝
```

🐍 **프로세스로 생각하면 쉽습니다.** 서버와 브라우저는 실행되는 기계가 아예 다릅니다. `"use client"`는 "이 지점부터 코드를 브라우저 쪽으로 배송하라"는 지시예요. 브라우저로 보내진 `ChatPanel`이 `ChatInput`을 부르려면 **`ChatInput`도 같이 실려 가야만** 하니 번들러가 알아서 따라 보냅니다. Python에서도 어떤 함수를 워커 프로세스에서 돌리면 그 함수가 호출하는 하위 함수들은 당연히 같은 프로세스에서 돌죠 — 함수마다 "나도 워커에서 돕니다"라고 적지 않습니다.

**그럼 언제 진짜로 필요한가?** → **서버 컴포넌트가 직접 import할 때.** 딱 그때만입니다.

⌨️ 미니 실습 — `src/app/page.tsx`를 잠깐 이렇게 바꿔 에러를 만나 보세요 (확인 후 되돌리기)

```tsx
import ChatInput from "@/components/ChatInput";   // ⚠️ page.tsx는 서버 컴포넌트!

export default function HomePage() {
  return <ChatInput onSend={() => {}} />;
}
```

→ `You're importing a component that needs useState. It only works in a Client Component, but **none of its parents are marked with "use client"**`

마지막 구절이 규칙을 그대로 말해줍니다 — "**부모들 중에** `"use client"`가 하나도 없다". 부모 중 하나라도 있으면 통과, 없으면 에러. 지금은 부모 `ChatPanel`에 있으니 통과하는 거예요.

**실전 규칙 한 줄:**

> `"use client"`는 서버→클라이언트로 **처음 넘어가는 그 한 파일**에만 붙인다.

우리 앱에서는 `ChatPanel`이 그 한 파일입니다. [2-3의 "최대한 잎사귀에만"](#2-3-멘탈-모델--기본은-서버-상호작용에만-use-client) 원칙과 같은 이야기예요 — 검문소를 `page.tsx`까지 밀어 올리면 페이지 전체가 브라우저로 배송되니, 되도록 **깊고 작은 곳**에 둡니다.

💡 `MessageList`/`MessageItem`/`ChatInput` 셋에 `"use client"`를 **붙여도 무방**합니다(이미 경계 안쪽이라 아무 효과 없는 중복 표시 = 무해). 다만 "저 파일들도 붙여야 돌아간다"고 오해하지는 마세요. 오히려 나중에 그 컴포넌트를 서버 컴포넌트에서 재사용할 때 **붙어 있는 게 도움이 되는** 정도입니다.

⚠️ **반대 방향이 훨씬 위험합니다.** 경계 **안쪽**에는 `process.env.ANTHROPIC_API_KEY` 같은 서버 전용 코드를 절대 두지 마세요. 지시문을 안 붙였다고 안전한 게 아닙니다 — **클라이언트가 import하는 순간 그 파일 전체가 브라우저로 배송**됩니다. 파일 맨 위에 뭐가 적혀 있느냐가 아니라 **누가 import했느냐**가 실제 실행 위치를 결정합니다.

### 4-2-2. 페이지에 연결 — `page.tsx`가 `ChatPanel`을 렌더

⚠️ **이 단계를 빼먹으면 앱을 켜도 채팅이 안 보입니다.** 컴포넌트를 다 만들어도 **어느 페이지에도 올리지 않았으면** 화면에 없어요. 지금 `/`는 아직 1-3에서 만든 "홈 + 소개 페이지로" 화면입니다.

⌨️ 실습 — `src/app/page.tsx` 덮어쓰기 (페이지는 서버, 채팅만 클라이언트)

```tsx
import Link from "next/link";
import ChatPanel from "@/components/ChatPanel";

// 이 파일은 서버 컴포넌트 (지시문 없음 = 기본값).
// 상태를 가진 ChatPanel만 클라이언트 → "검문소는 깊고 작은 곳에" 원칙
export default function HomePage() {
  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-xl font-bold mb-4">내 채팅 앱</h1>
      <ChatPanel />
      <Link href="/about" className="text-blue-600 underline text-sm">
        소개 페이지로 →
      </Link>
    </main>
  );
}
```

💡 `@/`는 `src/`를 가리키는 별칭(alias)입니다(생성 시 설정됨). 긴 상대경로(`../../`) 대신 `@/components/...`로 깔끔하게 import해요. 🐍 Python의 절대 import(`from myapp.components import ...`)와 상대 import(`from ..components import ...`) 차이와 같은 이야기입니다.

### 4-2-3. ⌨️ 여기서 한 번 돌려보기 (4-3 들어가기 전 동작 확인)

shadcn/ui로 넘어가기 **전에** 반드시 여기서 앱이 도는 걸 확인하세요. 지금 문제가 있는데 shadcn을 얹으면 "UI 교체 때문인지 이관 때문인지" 원인 구분이 안 됩니다.

```bash
cd chat-app
pnpm dev        # 이미 돌고 있으면 그대로 두면 됩니다 (파일 저장 시 자동 반영)
```

`http://localhost:3000` 에서 **5가지**를 확인합니다.

- [ ] **① 채팅 UI가 보인다** — "내 채팅 앱" 제목 + 테두리 있는 빈 대화 상자 + 입력창/전송 버튼
- [ ] **② 전송이 된다** — 입력 후 Enter 또는 [전송] → 파란 말풍선(오른쪽) + 회색 봇 답장(왼쪽) 두 개가 즉시 추가
- [ ] **③ 자동 스크롤** — 메시지를 10개쯤 보내 상자가 꽉 차면, 최신 메시지가 **자동으로** 보이게 내려간다. ⚠️ **페이지 전체가 아니라 대화 상자 안쪽**이 움직여야 합니다
- [ ] **④ 한글이 두 번 안 들어간다** — "안녕"을 치고 Enter → `안녕`만 전송(`안녕녕`이 아님)
- [ ] **⑤ 콘솔이 깨끗하다** — 브라우저 개발자 도구(`F12` → Console)에 빨간 에러 0건

⌨️ 실습 — API stub도 아직 살아 있는지 (3-1 재확인, 새 터미널에서)

```bash
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","text":"안녕"}]}'
```

⌨️ 실습 — 🎯 **서버 컴포넌트가 정말 서버에서 돌았는지 눈으로 확인**

```bash
curl -s http://localhost:3000/ | grep -o '아직 메시지가 없습니다[^<]*'
```

`curl`은 JS를 실행하지 않는 순수 HTTP 클라이언트입니다. 그런데도 이 문구가 나오면 → **서버가 이미 완성된 HTML을 만들어 보냈다**는 증거예요. 🐍 FastAPI가 템플릿을 렌더해 HTML을 내려주던 것과 같은 일이 `MessageList` 컴포넌트로 일어난 겁니다. 브라우저는 그 HTML을 먼저 그리고, 그 위에 상호작용을 입힙니다(= 6절의 **하이드레이션**).

**증상별 진단표**

| 증상 | 원인 | 해결 |
|---|---|---|
| "홈 / 소개 페이지로"만 보이고 채팅이 없다 | `page.tsx`가 아직 1-3 버전 | **4-2-2** 적용 |
| `Property 'bottomRef' is missing ... ts(2741)` | `MessageList`에 ref를 안 넘김 | **4-2**의 ⚠️ 참고 |
| 화면은 뜨는데 입력·클릭이 먹지 않는다 | `ChatPanel`의 `"use client"` 누락/오타(`"user client"` 등) | 파일 **맨 첫 줄** 확인 — 오타는 그냥 문자열이라 에러도 안 납니다 ⚠️ |
| 메시지는 쌓이는데 스크롤이 안 따라간다 | 표식이 스크롤 상자 **밖**에 있음 | **4-2**대로 `MessageList` 안으로 |
| 스크롤 대신 **페이지 전체**가 움직인다 | 위와 같은 원인 | 위와 같음 |
| "안녕" → "안녕녕" | IME 처리(`isComposing`) 누락 | `ChatInput`의 `onKeyDown` 확인 |
| `Module not found: Can't resolve '@/components/ChatPanel'` | 파일 위치 또는 `--src-dir` 누락 | 0-2의 되돌리기 참고 |

### ✅ 세션 4 (전반) 체크
- [ ] Day 4 컴포넌트가 `chat-app/src/`로 이관됨
- [ ] `ChatPanel`에만 `"use client"` — 자식 3개는 자동 전파라는 걸 설명 가능
- [ ] `page.tsx`(서버) → `ChatPanel`(클라이언트) 연결
- [ ] 위 ①~⑤ 동작 확인 통과
- [ ] `curl`로 SSR HTML과 `/api/chat` stub 확인

### 4-3. shadcn/ui 도입 (Day 4에서 미룬 것)

**① 무엇**: shadcn/ui는 UI 컴포넌트 모음인데, **잘 만든 컴포넌트 코드를 내 프로젝트에 복사해 넣는** 방식입니다(패키지 의존성이 아니라 내 코드가 됨 → 자유롭게 수정 가능). 🐍 "라이브러리 import"가 아니라 "검증된 코드를 가져와 내 것으로".

#### 4-3-1. 초기화 — CLI 프롬프트 답안

⌨️ 실습 — `chat-app/`에서 실행

```bash
cd chat-app          # ⚠️ 저장소 루트가 아니라 chat-app 안에서
pnpm dlx shadcn@latest init
```

프롬프트가 두 번 나옵니다. **둘 다 첫 번째 항목(그냥 엔터)**이 정답입니다.

| 프롬프트 | 선택 | 왜 |
|---|---|---|
| `Select a component library` | **Base UI (Recommended)** | 2026년 7월부터 shadcn의 기본 프리미티브가 Radix UI → Base UI로 바뀜. 오늘 쓰는 `Button`/`Input`은 어느 쪽이든 사용법이 동일 |
| `Which preset would you like to use?` | **Nova - Lucide / Geist** | CLI 자체 기본값(`shadcn init --defaults` = `base-nova`). 폰트가 **Geist** = `create-next-app`이 이미 깔아둔 폰트와 일치 |

🎯 **배경 — preset이 뭔가**: "아이콘 라이브러리 + 폰트 + 기본 색 + 모서리 반경"을 한 번에 정해주는 **테마 세트**입니다. 8개 전부 기능은 같고 외형만 다릅니다(모두 `neutral` 회색 기반). 🐍 `ruff`/`black` 설정 프리셋을 고르는 것과 같은 성격이에요 — 나중에 `chat-app/components.json`과 `src/app/globals.css`에서 손으로 바꿀 수 있으니 여기서 고민할 필요가 없습니다.

| preset | 아이콘 | 폰트 |
|---|---|---|
| **Nova** ⭐ | Lucide | **Geist** ← 우리 프로젝트와 일치 |
| Vega / Luma | Lucide | Inter |
| Maia | Hugeicons | Figtree |
| Mira | Hugeicons | Inter |
| Lyra | Phosphor | JetBrains Mono |
| Sera / Rhea | (추가 스타일) | — |

**init이 끝나면 자동으로 생기는 것들** (직접 만들지 않습니다):

- `chat-app/components.json` — 설정 파일 (`"style": "base-nova"`, 경로 별칭)
- `chat-app/src/lib/utils.ts` — `cn()` 헬퍼 (⭐ 4-3-3에서 중요해집니다)
- `chat-app/src/app/globals.css` — **덮어써짐**. 테마 CSS 변수(`--primary`, `--input`, `--ring` …)가 추가됨
- 의존성 추가: `@base-ui/react`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`

💡 `git diff`로 `globals.css`가 어떻게 바뀌었는지 한 번 훑어보세요. `create-next-app` 기본값에 있던 `body { font-family: Arial, ... }`(Geist 폰트를 덮어쓰고 있던 범인)가 이때 정리됩니다.

⌨️ 실습 — 컴포넌트 2개 가져오기 (`chat-app/`에서)

```bash
pnpm dlx shadcn@latest add button input
```

→ `chat-app/src/components/ui/button.tsx`, `chat-app/src/components/ui/input.tsx` 생성. **열어서 읽어보세요.** 이제 이건 라이브러리가 아니라 **내 코드**입니다.

#### 4-3-2. ChatInput을 shadcn 컴포넌트로 교체

⌨️ 실습 — `chat-app/src/components/ChatInput.tsx` **덮어쓰기** (Day 4에서 이관한 파일)

✅ 완성본 — 아래가 **파일 전체**입니다. 첫 줄부터 마지막 줄까지 이게 다예요.

```tsx
// chat-app/src/components/ChatInput.tsx
// "use client" 없음 — 부모 ChatPanel이 이미 검문소라 자동 전파됩니다 (4-2-1 참고)
import { useState } from "react";
import { Button } from "@/components/ui/button"; // shadcn이 생성해 준 "내 코드"
import { Input } from "@/components/ui/input";   // = src/components/ui/input.tsx

interface Props {
  onSend: (text: string) => void; // 부모가 내려준 "다 되면 이걸 불러" 함수 (콜백)
}

export default function ChatInput({ onSend }: Props) {
  const [text, setText] = useState("");

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return; // 빈 입력 무시
    onSend(trimmed);      // 부모에게 넘김 — 여기서 내 일은 끝
    setText("");          // 전송 후 입력창 비우기
  };

  return (
    <div className="flex gap-2 mt-2">
      <Input
        className="flex-1"                        // 배치만 내가 지정, 외형은 Input에 맡김
        value={text}                              // ① 보여줄 값은 state에서 온다
        onChange={(e) => setText(e.target.value)} // ② 글자가 바뀌면 state를 갱신
        onKeyDown={(e) => {
          // ⚠️ 한글 조합 중(isComposing)의 Enter는 "글자 확정"용이라 무시해야 한다
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            submit();
          }
        }}
        placeholder="메시지를 입력하세요"
      />
      {/* onClick={submit} — 괄호 없이! 괄호를 붙이면 렌더 중에 즉시 실행된다 */}
      <Button onClick={submit}>전송</Button>
    </div>
  );
}
```

⚠️ **JSX 주석에는 두 가지 위치가 있습니다** (위 코드에 둘 다 등장):

- **여는 태그 "안"** (`<Input ... />` 내부) → `// 주석` 그대로 씁니다. 태그 안쪽은 평범한 JS 문법 영역이라 됩니다.
- **태그 "사이"** (children 위치, `<div>`와 `<Button>` 사이) → **`{/* 주석 */}`** 형태만 유효합니다. 여기서 `//`를 쓰면 주석이 아니라 **화면에 `//`가 그대로 출력**됩니다.

#### 4-3-3. Day 4 버전과 달라진 곳 — 딱 4군데

📖 설명용 — 무엇이 바뀌었는지 대조

| # | Day 4 버전 | shadcn 버전 | 비고 |
|---|---|---|---|
| ① | (없음) | `import { Button } ...` / `import { Input } ...` 2줄 | 추가 |
| ② | `<input className="flex-1 border rounded px-3 py-2"` | `<Input className="flex-1"` | 대문자 `I` + 외형 클래스 삭제 |
| ③ | `<button className="border rounded px-4 py-2" onClick={submit}>` | `<Button onClick={submit}>` | 대문자 `B` + className 통째로 삭제 |
| ④ | `</button>` | `</Button>` | 닫는 태그도 대문자 |

`value`·`onChange`·`onKeyDown`·`placeholder`·`submit` 함수는 **한 글자도 바뀌지 않습니다.** shadcn `Input`의 타입이 `React.ComponentProps<"input">` — 즉 **순수 `<input>`과 props가 완전히 동일**하기 때문입니다. 한글 IME 처리(`e.nativeEvent.isComposing`)도 그대로 살아 있습니다. 💡 shadcn의 `Input`도 결국 일반 input이라 그 처리가 여전히 필요해요.

**왜 `className`을 지우나** — `Input`/`Button` 파일 안에 스타일이 이미 박혀 있습니다. `Input`은 `h-8 rounded-lg border border-input …`, `Button`은 `h-8 bg-primary text-primary-foreground hover:bg-primary/80 …`. `border rounded px-3 py-2`를 남기면 **중복 지정**이 됩니다. 덤으로 hover 효과·포커스 링·다크모드 대응이 공짜로 붙습니다.

**그럼 왜 `flex-1`은 남기나** — shadcn 컴포넌트는 내부에서 `cn()`(= `tailwind-merge`)으로 클래스를 합치기 때문에 **내가 넘긴 className이 이깁니다.** 그래서 원칙은 이렇습니다.

> **"배치·구조"(`flex-1`, `mt-2`)는 내가 지정하고, "외형"(테두리·색·높이)은 컴포넌트에 맡긴다.**

**왜 `"use client"`가 없나** — 4-2-1의 규칙 그대로입니다. `ChatPanel`이 검문소이고 `ChatInput`은 그 안쪽이라 자동 전파됩니다.

🎯 **증거**: 방금 생성된 `src/components/ui/button.tsx`와 `input.tsx`를 열어보면 **둘 다 `"use client"`가 없습니다.** shadcn이 만든 컴포넌트인데도요. `ChatPanel → ChatInput → Button` 사슬 전체가 이미 클라이언트 영역이라 필요가 없는 겁니다. "파일 맨 위에 뭐가 적혀 있느냐가 아니라 **누가 import했느냐**가 실행 위치를 결정한다"는 4-2-1의 규칙이 실제 라이브러리 코드에서 확인되는 지점이에요.

#### 4-3-4. ⌨️ 동작 확인

```bash
cd chat-app
pnpm dev        # 이미 돌고 있으면 그대로 (저장 시 자동 반영)
```

`http://localhost:3000`에서 **4가지**:

- [ ] **① 모양이 바뀌었다** — 입력창 테두리가 둥글어지고, 버튼이 검정 배경 + 흰 글씨
- [ ] **② 높이가 딱 맞는다** — 입력창과 버튼이 둘 다 `h-8`(32px)이라 자동 정렬
- [ ] **③ 한글이 두 번 안 들어간다** — "안녕" + Enter → `안녕`만 전송 (`안녕녕` 아님)
- [ ] **④ hover 효과** — 버튼에 마우스를 올리면 살짝 흐려짐(`hover:bg-primary/80`). Day 4엔 없던 것

**증상별 진단표**

| 증상 | 원인 | 해결 |
|---|---|---|
| `Module not found: Can't resolve '@/components/ui/button'` | `add` 명령을 안 돌렸거나 `@/`가 `src/`를 못 가리킴 | `pnpm dlx shadcn@latest add button input` / `tsconfig.json`의 `"@/*": ["./src/*"]` 확인 |
| `error TS1005: '(' expected` | 파일을 **일부만** 고쳐서 문법이 깨진 상태 | 4-3-2의 완성본으로 **파일 전체** 교체 |
| 화면에 `//` 같은 글자가 그대로 보인다 | children 위치에 `//` 주석을 씀 | `{/* … */}`로 감싸기 (4-3-2의 ⚠️ 참고) |
| 모양이 안 바뀐다 | `<input>`/`<button>` 소문자 그대로 | 대문자 `<Input>`/`<Button>`인지 확인 |
| 버튼 색이 안 나온다 | `globals.css`의 테마 변수 누락 | `init`을 안 돌렸거나 `globals.css`를 되돌린 경우 — 4-3-1 재실행 |

---

## 5. 디버깅 실습 — "use client" 경계 에러

4-2-1의 미니 실습은 "**남의 컴포넌트**를 서버에서 import"하는 경우였습니다. 이번엔 "**내 파일 안에서 직접** 훅을 쓰는" 경우 — 같은 에러가 뜨지만 고치는 선택지가 다릅니다.

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
