# Day 5 — Next.js 기초 (App Router): "서버와 클라이언트가 한 프로젝트에"

> **소요 시간**: 8시간 (90분 학습 + 15분 휴식 × 4세션)
> **선행 조건**: Day 4 완료 (`useState`/`useEffect`/props/커스텀 훅 사용 가능, `practice/day4/`에 채팅 UI가 동작하는 상태)
> **목표**: Next.js 16 App Router의 구조와 **서버 컴포넌트 / 클라이언트 컴포넌트** 모델을 몸에 새기고, Day 4 채팅 UI를 Next.js 위로 이사시킨다. 그리고 Day 6에 LLM이 붙을 **API 자리를 미리 파둔다.**
> **핵심 태그**: 🐍 = 파이썬 대비 포인트 · 💡 = 팁 · ⚠️ = 함정
> **코드 블록 태그**: 🆕 새 파일 · ♻️ 덮어쓰기 · ✏️ 부분 수정 · ⌨️ 터미널 실행 · 📖 읽기 전용 · 📄 출력 예시 (→ 0-3 참고)

---

## 0. 오늘의 목적 & 큰 그림

Day 4까지는 **브라우저 안**의 이야기였습니다. Vite로 띄운 앱은 전부 브라우저에서 도는 JS였죠. 오늘부터는 **서버가 합류**합니다.

Next.js를 한 문장으로 정의하면 이렇습니다.

> **Next.js = React + 라우터 + 서버(백엔드)를 한 프로젝트 안에 합쳐놓은 프레임워크**

당신은 이미 백엔드를 압니다. FastAPI로 라우트를 만들고 핸들러를 붙여봤죠. Next.js에서 새로운 건 "백엔드가 있다"가 아니라 **"백엔드와 프론트엔드의 경계가 파일 단위로 흐릿해진다"**는 점입니다. 이게 오늘의 진짜 산이에요.

### 0-1. 🐍 당신을 위한 비유 — FastAPI + Jinja 템플릿의 진화형

파이썬으로 웹을 만든다면 보통 이렇게 나뉩니다.

```python
# 🐍 서버 (FastAPI) — DB 접근, API 키 사용, 비밀 유지
@app.get("/users/{user_id}")
async def get_user(user_id: int):
    user = await db.fetch_user(user_id)     # 서버에서만 가능
    return templates.TemplateResponse("user.html", {"user": user})
```

```html
<!-- 브라우저 (JS) — 클릭, 입력, 애니메이션 -->
<script>
  document.querySelector("button").onclick = () => { ... }
</script>
```

Next.js는 **이 둘을 똑같은 언어(TSX)로, 같은 폴더 안에서** 씁니다.

| | 파이썬 세계 | Next.js 세계 |
|---|---|---|
| 서버에서 데이터 가져와 HTML 만들기 | FastAPI 핸들러 + Jinja | **서버 컴포넌트** (`page.tsx` 기본값) |
| 브라우저에서 클릭/입력 처리 | 별도 `.js` 파일 | **클라이언트 컴포넌트** (`"use client"`) |
| REST API 엔드포인트 | `@app.post("/api/chat")` | **Route Handler** (`app/api/chat/route.ts`) |
| 폼 처리 | `@app.post("/submit")` + 리다이렉트 | **Server Action** (`"use server"`) |
| 비밀 키 | `os.environ["API_KEY"]` | `process.env.API_KEY` (서버 전용) |

⚠️ **오늘 가장 많이 헷갈릴 것**: 똑같이 생긴 `.tsx` 파일인데 **어떤 건 서버에서 실행되고 어떤 건 브라우저에서 실행됩니다.** 파일 겉모습만 봐선 구분이 안 돼요. 그래서 세션 2에 시간을 가장 많이 씁니다.

### 0-2. 저장소 구조 (오늘부터 바뀝니다)

Day 1~4는 "하루짜리 연습 폴더"였습니다. **오늘부터는 7일 여정의 최종 산출물이 될 앱 하나를 계속 키웁니다.**

**📖 읽기 전용** — 오늘 하루가 끝났을 때의 **최종 모습**입니다. 지금 한꺼번에 만드는 게 아니라 세션 1~4를 따라가며 하나씩 생깁니다

```
nextjs-study/
├── docs/
│   ├── roadmap.md
│   ├── Day0.md ... Day4.md
│   └── Day5.md                     ← 지금 이 문서
├── practice/
│   ├── day1/ ... day4/             ← 문법·React 연습 (보존, 참고용)
└── chat-app/                       ← ⭐ 오늘 생성. Day 6, 7에서 계속 자람
    ├── package.json
    ├── next.config.ts
    ├── tsconfig.json
    ├── eslint.config.mjs
    ├── .env.local                  ← ⚠️ git에 올리지 않음
    └── src/
        ├── app/                    ← 라우팅의 뿌리 (파일 위치 = URL)
        │   ├── layout.tsx          ← 전역 껍데기
        │   ├── page.tsx            ← "/" 페이지
        │   ├── globals.css
        │   ├── about/
        │   │   └── page.tsx        ← "/about"
        │   └── api/
        │       ├── health/route.ts ← "GET /api/health"
        │       └── chat/route.ts   ← ⭐ Day 6에서 LLM이 붙을 자리
        ├── components/
        │   ├── ChatPanel.tsx       ← "use client" 경계
        │   ├── MessageList.tsx
        │   ├── MessageItem.tsx
        │   └── ChatInput.tsx
        ├── hooks/
        │   └── useAutoScroll.ts    ← Day 4에서 그대로 복사
        └── types.ts                ← Day 4에서 그대로 복사
```

💡 `practice/day4/`는 **지우지 마세요.** 세션 4에서 두 폴더를 나란히 열어놓고 "무엇이 그대로 가고 무엇이 바뀌는지" 비교합니다.

### 0-3. ⭐ 이 문서의 코드 블록 읽는 법 — 태그 6종

Day 1~4와 달리 오늘은 **`create-next-app`이 이미 만들어놓은 파일 위에서** 작업합니다. 게다가 "실제로 치는 코드"와 "개념 설명용 예시"가 섞여 나와요. 그래서 **오늘의 모든 코드 블록에는 바로 위에 한 줄짜리 라벨이 붙어 있습니다.**

> ⭐ **규칙은 하나입니다 — 블록 위에 붙은 라벨만 보고 판단하세요.** 코드 안의 주석이나 파일명처럼 보이는 문자열은 판단 근거가 아닙니다.

| 태그 | 뜻 | 어떻게 하나 |
|---|---|---|
| 🆕 | 그 경로에 **파일이 없다** | 폴더·파일을 만들고 블록 **전체**를 붙여넣기 |
| ♻️ | 그 경로에 **파일이 이미 있다** | 파일을 열어 **기존 내용을 전부 지우고** 블록 전체를 붙여넣기 |
| ✏️ | 이미 있는 파일의 **일부만** 고침 | 블록은 **발췌본**이다. 통째로 붙여넣지 말고 표시된 줄만 고치기 |
| ⌨️ | 터미널에 **입력**하는 명령 | 그대로 실행 |
| 📄 | 터미널·빌드가 **출력**한 결과 | 내 화면과 비교만 (입력하는 게 아님) |
| 📖 | 개념 설명용 **읽기 전용** 예시 | 붙여넣을 곳을 찾지 말 것. 일부러 틀린 코드도 섞여 있음 |

💡 라벨이 없는 블록은 두 경우뿐입니다. ① 🐍 파이썬 대조 코드 — 전부 📖입니다. ② 바로 위 블록과 한 쌍(✅/❌ 대조, Before/After)인 블록 — **위 블록의 라벨이 아래 블록에도 적용**됩니다.

**오늘 실제로 손대는 파일 전체 목록입니다.** 헷갈리면 여기로 돌아오세요.

| 절 | 파일 | |
|---|---|---|
| 1-4 | `src/app/layout.tsx` | ♻️ create-next-app 기본값을 교체 (또는 ✏️ 4군데만 수정) |
| 1-5 | `src/app/about/page.tsx` | 🆕 |
| 1-7 | `src/app/chat/[id]/page.tsx` | 🆕 |
| 2-7 | `src/app/page.tsx` | ♻️ 실험용으로 임시 교체 (4-4에서 최종본으로 또 바뀜) |
| 2-7 | `src/components/ClientBox.tsx` | 🆕 (실험용, 나중에 지워도 됨) |
| 3-1 | `src/app/api/health/route.ts` | 🆕 |
| 3-1 | `src/app/api/echo/route.ts` | 🆕 |
| 3-2 | `.env.local` | 🆕 (프로젝트 루트 = `chat-app/`) |
| 3-3 | `src/app/about/page.tsx` | ♻️ 1-5 내용 + Server Action 폼을 합친 전체본으로 교체 |
| 3-4 | `src/app/loading.tsx` | 🆕 |
| 3-5 | `src/app/api/chat/route.ts` | 🆕 ⭐ Day 6에서 또 ♻️ 됩니다 |
| 4-2 | `types.ts`, `hooks/` 1개, `components/` 3개 | 🆕 (단, 손으로 안 쓰고 `cp` 명령으로 복사) |
| 4-2 | 복사해온 파일들의 `import` 경로 | ✏️ 상대경로 → `@/` 별칭 |
| 4-3 | `MessageList.tsx`, `ChatInput.tsx` | ✏️ 맨 윗줄에 `"use client"` 한 줄만 추가 |
| 4-4 | `src/components/ChatPanel.tsx` | 🆕 |
| 4-4 | `src/app/page.tsx` | ♻️ 2-7 실험 코드를 최종본으로 교체 |
| 4-5 | `src/components/ChatInput.tsx` | ♻️ shadcn/ui `Button`/`Input` 적용 전체본 |
| 5-② | `src/app/error.tsx` | 🆕 (추가 연습) |

⚠️ **♻️로 덮어쓸 때 항상 확인할 것**: 특히 `layout.tsx`의 폰트 설정처럼 원래 있던 코드가 새 블록에 없으면, 붙여넣는 순간 사라집니다. 붙여넣기 전에 **원래 파일에 있던 `import` 문과 설정 코드가 새 코드에도 있는지** 눈으로 대조하세요. (이 문서의 ♻️ 블록은 전부 전체본으로 맞춰뒀지만, 인터넷에서 가져온 발췌본에는 이 함정이 흔합니다.)

---

## 1. 세션 1 (오전) — 프로젝트 생성 & 파일 기반 라우팅

### 1-1. 프로젝트 생성

저장소 루트에서:

**⌨️ 터미널 실행**

```bash
cd nextjs-study
pnpm create next-app@latest chat-app
```

대화형 질문이 나옵니다. **이렇게 답하세요.**

| 질문 | 답 | 이유 |
|---|---|---|
| Would you like to use TypeScript? | **Yes** | Day 3에서 배운 이유 그대로 |
| Would you like to use ESLint? | **Yes** | Day 1의 습관 유지 |
| Would you like to use Tailwind CSS? | **Yes** | Day 4에서 쓰던 v4 |
| Would you like your code inside a `src/` directory? | **Yes** | 설정 파일과 소스가 섞이지 않음 |
| Would you like to use App Router? | **Yes** ⭐ | Pages Router는 배우지 않습니다 |
| Would you like to customize the import alias? | **No** (기본 `@/*`) | `@/components/...`로 절대경로 import |

한 줄로 끝내고 싶다면:

**⌨️ 터미널 실행** — 위 대화형 대신 쓰는 방법 (둘 중 하나만)

```bash
pnpm create next-app@latest chat-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

⚠️ **거의 끝에서 이런 메시지로 중단될 수 있습니다. 당황하지 마세요.**

**📄 터미널 출력 예시**

```
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: sharp@0.34.5, unrs-resolver@1.12.2
Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
Aborting installation.
  pnpm install has failed.
```

**"실패"가 아니라 "승인 대기"입니다.** 원인은 이렇습니다.

1. pnpm 10부터 **의존성의 설치 스크립트(`postinstall` 등)를 기본으로 차단**합니다. 악성 패키지가 `pip install` 한 번에 코드를 실행하던 공급망 공격을 막으려는 정책이에요.
2. `next`가 쓰는 `sharp`(이미지 최적화)와 `eslint-config-next`가 쓰는 `unrs-resolver`가 네이티브 바이너리라 이 스크립트를 갖고 있습니다. pnpm은 차단 사실을 알리며 **0이 아닌 종료 코드**로 끝납니다.
3. `create-next-app`은 종료 코드만 보고 판정하므로 **설치가 다 끝났는데도** 실패로 오해하고 `Aborting installation.`을 찍습니다.

⚠️⚠️ **`chat-app` 폴더를 지우고 다시 만들지 마세요.** 파일도 의존성도 이미 전부 자리에 있습니다. 폴더 안에서 두 줄이면 복구됩니다.

**⌨️ 터미널 실행** — 위 메시지를 만났을 때만

```bash
cd chat-app
pnpm approve-builds sharp unrs-resolver   # 인자 없이 치면 대화형 선택 (스페이스 → 엔터)
pnpm install                              # 스토어에 이미 있으니 재다운로드 없음, 몇 초면 끝
```

`pnpm approve-builds`는 `pnpm-workspace.yaml`에 아래를 남깁니다.

**📄 명령이 자동으로 남기는 결과** — 직접 칠 필요 없음 (손으로 고치고 싶다면 이 형식)

```yaml
allowBuilds:
  sharp: true
  unrs-resolver: true
```

🐍 파이썬에도 sdist 빌드를 승인/차단하는 감각(`--no-binary`, `--no-build-isolation`)이 있지만, **pnpm은 기본값이 "차단"**입니다. 이유가 편의가 아니라 보안이라서 그래요.

**⌨️ 터미널 실행** — 개발 서버 켜기 (오늘 내내 켜둡니다)

```bash
cd chat-app
pnpm dev
```

→ `http://localhost:3000` 접속. Next.js 시작 화면이 뜨면 성공입니다.

💡 **Next.js 16의 기본값**: 번들러가 **Turbopack**입니다(dev/build 둘 다). Vite처럼 빠릅니다. Webpack 설정을 만질 일은 이 7일 안엔 없습니다.

### 1-2. ⭐ 파일 위치 = URL

App Router의 규칙은 딱 하나입니다.

> **`src/app/` 아래의 폴더 구조가 그대로 URL 경로가 되고, 그 폴더 안의 `page.tsx`가 화면이 된다.**

🐍 FastAPI와 비교하면 이렇습니다.

```python
# 🐍 파이썬: 데코레이터로 경로를 "선언"
@app.get("/")            → def home()
@app.get("/about")       → def about()
@app.get("/chat/{id}")   → def chat(id: str)
```

**📖 읽기 전용** — 규칙 설명 (여기서 만드는 건 없습니다)

```
🟨 Next.js: 파일을 "그 위치에 두는 것"이 곧 선언
src/app/page.tsx              → /
src/app/about/page.tsx        → /about
src/app/chat/[id]/page.tsx    → /chat/:id
src/app/api/health/route.ts   → /api/health  (API 엔드포인트)
```

⚠️ **폴더만 만들면 라우트가 안 생깁니다.** 그 안에 `page.tsx`(화면) 또는 `route.ts`(API)가 있어야 접근 가능한 URL이 됩니다. 폴더만 있고 파일이 없으면 그냥 정리용 폴더일 뿐이에요.

### 1-3. 특수 파일 6종 — 이름이 곧 역할

App Router에는 **예약된 파일 이름**이 있습니다. 이 이름들만 알면 App Router의 80%입니다.

| 파일 | 역할 | 🐍 비유 |
|---|---|---|
| `page.tsx` | 그 URL의 화면 본문 | 뷰 함수의 반환 템플릿 |
| `layout.tsx` | 하위 페이지들을 감싸는 껍데기 (네비게이션 등) | Jinja의 `base.html` (`{% block %}`) |
| `loading.tsx` | 그 구간이 로딩 중일 때 보여줄 UI | 스피너 (자동 배선) |
| `error.tsx` | 그 구간에서 에러가 났을 때의 UI | 예외 핸들러 |
| `not-found.tsx` | 404 화면 | `HTTPException(404)` 응답 |
| `route.ts` | 화면이 아니라 **API 엔드포인트** | FastAPI 라우터 함수 |

⚠️ **한 폴더에 `page.tsx`와 `route.ts`를 동시에 두면 충돌**합니다. 같은 URL에 화면과 API를 둘 다 붙일 수 없어요. 그래서 API는 관례적으로 `app/api/` 아래에 모읍니다.

### 1-4. 레이아웃 — 중첩되고, 유지된다

`src/app/layout.tsx`를 열어보세요. 이게 **루트 레이아웃**이고, 모든 페이지를 감쌉니다.

⚠️ **이 파일은 새로 만드는 게 아닙니다.** `create-next-app`이 이미 만들어놨고, 지금 안에는 기본값(`title: "Create Next App"`, `lang="en"`, 네비게이션 없음)이 들어 있습니다.

**♻️ 덮어쓰기 — `src/app/layout.tsx`** (전체본입니다. 기존 내용을 전부 지우고 붙여넣으세요)

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";                    // ① 추가: 클라이언트 사이드 네비게이션용
import "./globals.css";

// ⬇️ create-next-app이 넣어준 폰트 설정 — 건드리지 말고 그대로 둡니다
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chat App",                             // ② 수정: 기본값 "Create Next App"에서 변경
  description: "7일 학습 프로젝트",               // ② 수정
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;   // ← Day 4에서 배운 children!
}>) {
  return (
    <html
      lang="ko"                                  // ③ 수정: en → ko
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-gray-900">
        {/* ④ 추가: 모든 페이지에 공통으로 붙을 상단 네비게이션 */}
        <header className="flex items-center gap-4 border-b px-6 py-3">
          <Link href="/" className="font-semibold">
            💬 Chat
          </Link>
          <nav className="flex gap-3 text-sm text-gray-600">
            <Link href="/about" className="hover:text-gray-900">
              소개
            </Link>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
```

💡 **기존 파일과 달라진 곳은 위 주석 ①~④, 딱 네 군데뿐입니다.** 통째로 붙여넣는 대신 네 군데만 손으로 고쳐도 결과는 같습니다. 손으로 고치는 쪽이 기억에 더 남으니 권합니다.

⚠️ **다른 곳에서 본 예제를 붙여넣을 때 주의**: 인터넷 예제나 짧은 발췌본에는 `Geist` 폰트 설정이 없는 경우가 많습니다. 그걸 통째로 덮어쓰면 폰트 설정이 사라집니다(앱이 깨지진 않고, 기본 시스템 폰트로 돌아갑니다). **`layout.tsx`를 덮어쓸 때는 항상 `import` 문과 폰트 설정이 살아남았는지 확인**하세요.

저장하면 `pnpm dev`가 즉시 반영합니다. 화면 맨 위에 `💬 Chat`과 `소개`가 보이면 성공입니다. (`소개`를 누르면 아직 404 — 그게 바로 다음 1-5에서 만드는 `/about`입니다.)

여기서 알아둘 것 3가지:

1. **`children`이 그 자리에 페이지가 끼워지는 구멍**입니다. Day 4의 `children` 개념 그대로예요.
2. **루트 레이아웃만 `<html>`과 `<body>`를 가집니다.** 하위 레이아웃은 `<div>`만 반환하세요.
3. **`metadata` export = `<head>` 태그 생성.** 🐍 파이썬으로 치면 템플릿 컨텍스트에 `title`을 넘기는 것과 같지만, 타입이 붙어 있죠.

**중첩 레이아웃**: `src/app/chat/layout.tsx`를 만들면 `/chat`과 그 하위 모든 페이지에만 적용됩니다. 레이아웃은 겹겹이 쌓입니다. (오늘 만들지는 않습니다 — 개념만.)

**📖 읽기 전용** — 중첩 구조 개념도

```
RootLayout
 └─ ChatLayout
     └─ page.tsx (실제 화면)
```

💡 **레이아웃의 진짜 이득**: 페이지를 이동해도 **레이아웃은 다시 렌더되지 않고 상태를 유지**합니다. 사이드바 스크롤 위치, 열려 있는 메뉴 같은 게 안 날아가요. 🐍 Jinja는 매 요청마다 전체 HTML을 새로 만들지만, Next.js는 바뀐 부분만 갈아 끼웁니다.

### 1-5. 페이지 추가 실습 — `/about`

**🆕 새 파일 — `src/app/about/page.tsx`** (`about` 폴더부터 새로 만드세요)

```tsx
// src/app/about/page.tsx
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold">소개</h1>
      <p className="mt-2 text-sm text-gray-600">
        7일 학습 로드맵으로 만드는 채팅 앱입니다.
      </p>
    </div>
  );
}
```

파일을 저장하고 `http://localhost:3000/about` 접속 → 바로 뜹니다. **서버 재시작도, 라우트 등록도 필요 없습니다.**

⚠️ **`export default`가 필수**입니다. named export로 하면 Next.js가 페이지를 못 찾습니다.

### 1-6. `<Link>` vs `<a>` — 반드시 `<Link>`

**📖 읽기 전용** — 비교용 (1-4 `layout.tsx`에 이미 `<Link>`로 넣어뒀습니다)

```tsx
<a href="/about">소개</a>        // ❌ 전체 페이지 새로고침 (느림, 상태 날아감)
<Link href="/about">소개</Link>  // ✅ 클라이언트 사이드 네비게이션 (빠름)
```

`<Link>`는 필요한 부분만 받아와서 갈아끼우고, 화면에 보이는 링크는 **미리 로딩(prefetch)**까지 해둡니다.

### 1-7. 동적 라우트 & ⚠️ Next.js 16의 async params

`src/app/chat/[id]/page.tsx`를 만들면 `/chat/abc`, `/chat/123` 모두 여기로 옵니다.

**만드는 법** — `chat-app/` 안에 폴더 2개(`chat`, `[id]`)를 만들고 그 안에 `page.tsx`를 새로 만듭니다. 터미널이 편하면:

**⌨️ 터미널 실행** — VS Code 탐색기로 만들 거면 건너뛰어도 됩니다

```bash
# chat-app/ 에서 (저장소 루트라면 chat-app/src/... 로)
mkdir -p 'src/app/chat/[id]'
touch 'src/app/chat/[id]/page.tsx'
```

⚠️ 폴더 이름의 **대괄호는 오타가 아니라 문법**입니다. `[id]`라는 이름 그대로 만드세요. zsh에서는 대괄호가 와일드카드로 해석되니 위처럼 **작은따옴표로 감싸야** 합니다. VS Code 탐색기에서 만들 때는 `src/app` 위에 마우스를 올리고 새 폴더 아이콘을 눌러 `chat` → `[id]` 순서로 만들면 되고, 따옴표는 필요 없습니다.

만든 파일에 아래 내용을 넣습니다.

**🆕 새 파일 — `src/app/chat/[id]/page.tsx`**

```tsx
// src/app/chat/[id]/page.tsx
type PageProps = {
  params: Promise<{ id: string }>;          // ⚠️ Next.js 16: Promise!
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
};

export default async function ChatDetailPage({ params }: PageProps) {
  const { id } = await params;              // ⚠️ await 필수
  return <div className="p-6">대화 ID: {id}</div>;
}
```

저장한 뒤 `http://localhost:3000/chat/abc`, `http://localhost:3000/chat/123`에 차례로 접속해 보세요. 각각 "대화 ID: abc", "대화 ID: 123"이 뜨면 성공입니다. 폴더만 만들고 `page.tsx`를 안 만들면 404가 납니다.

⚠️ **이건 Next.js 15/16의 대표적인 breaking change입니다.** 인터넷의 옛날 예제는 `params.id`를 바로 씁니다(동기). Next.js 16에서는 `params`와 `searchParams`가 **Promise**여서 `await`해야 합니다. 그리고 이렇게 하려면 컴포넌트 함수에 `async`가 붙어야 하죠 — **서버 컴포넌트라서 가능한 일**입니다(세션 2에서 다룹니다).

🐍 파이썬으로 치면 `def get_chat(id)` → `async def get_chat(id)`로 바뀐 것과 같습니다. 이유도 비슷해요: 스트리밍 렌더링을 위해 "params가 준비되기 전에 렌더를 시작"할 수 있게 하려는 겁니다.

### 1-8. 라우트 그룹 `(폴더명)` — URL에 안 나타나는 폴더

**📖 읽기 전용** — 개념 소개. **오늘 이 구조는 만들지 않습니다** (우리 `chat-app`은 라우트 그룹 없이 갑니다)

```
src/app/
├── (marketing)/
│   ├── layout.tsx      ← 마케팅 페이지 전용 레이아웃
│   ├── page.tsx        → "/"        (marketing은 URL에 없음!)
│   └── about/page.tsx  → "/about"
└── (app)/
    ├── layout.tsx      ← 앱 화면 전용 레이아웃
    └── chat/page.tsx   → "/chat"
```

**소괄호로 감싼 폴더는 URL에 포함되지 않습니다.** 레이아웃을 다르게 주고 싶을 때만 씁니다. 오늘은 안 써도 되지만, "왜 폴더 이름에 괄호가 있지?" 하고 당황하지 않으려면 알아두세요.

### ✅ 세션 1 체크
- [x] `chat-app` 생성 후 `pnpm dev`로 화면 확인
- [x] `/about` 페이지 추가 → 접속 성공
- [x] `layout.tsx`의 `children`이 무엇인지 설명 가능
- [x] `<Link>`를 써야 하는 이유 설명 가능
- [x] Next.js 16에서 `params`가 `Promise`인 것을 확인

---

## 2. 세션 2 (오전) — ⭐ 서버 컴포넌트 vs 클라이언트 컴포넌트

> **오늘의 하이라이트입니다.** 로드맵에도 "백엔드 배경일수록 여기서 막힌다"고 적어뒀죠. 천천히, 확실하게 갑니다.

### 2-1. 딱 하나의 문장으로 시작

> **`src/app/` 안의 모든 컴포넌트는 기본적으로 "서버 컴포넌트"다. 즉, 서버에서 한 번 실행되고 그 결과(HTML)만 브라우저로 간다.**
> **`"use client"`를 파일 맨 위에 쓰면 그 파일은 "클라이언트 컴포넌트"가 되어, 브라우저에도 코드가 전송되고 브라우저에서 실행된다.**

### 2-2. 🐍 정확한 파이썬 비유

서버 컴포넌트는 **당신이 이미 쓰던 백엔드 함수**입니다.

```python
# 🐍 이 함수는 서버에서만 돈다. 코드는 절대 브라우저에 안 간다.
async def user_page(user_id: int) -> str:
    user = await db.fetch_user(user_id)          # DB 직접 접근 OK
    key = os.environ["SECRET_KEY"]               # 비밀 키 사용 OK
    return f"<h1>{user.name}</h1>"               # HTML 문자열만 브라우저로
```

**📖 읽기 전용** — 위 파이썬과 대조용. `db`는 우리 프로젝트에 없는 가상의 객체입니다

```tsx
// 🟨 서버 컴포넌트 — 정확히 같은 성질
export default async function UserPage({ params }: PageProps) {
  const { id } = await params;
  const user = await db.fetchUser(id);           // DB 직접 접근 OK
  const key = process.env.SECRET_KEY;            // 비밀 키 사용 OK
  return <h1>{user.name}</h1>;                   // 렌더 결과만 브라우저로
}
```

클라이언트 컴포넌트는 **`<script>` 태그로 브라우저에 보내는 코드**입니다.

**📖 읽기 전용** — 성질 설명용 (비슷한 걸 2-7에서 `ClientBox.tsx`로 직접 만듭니다)

```tsx
// 🟨 클라이언트 컴포넌트 — 이 파일 전체가 브라우저로 다운로드됨
"use client";
import { useState } from "react";

export function Counter() {
  const [n, setN] = useState(0);                 // 상태 = 브라우저에서만 가능
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
```

⚠️ **핵심 결론**: 클라이언트 컴포넌트에 API 키를 쓰면 **브라우저 개발자 도구에서 그대로 보입니다.** Day 6에서 Anthropic API 키를 다룰 때 목숨처럼 지켜야 할 규칙이에요.

### 2-3. 무엇이 되고 무엇이 안 되는가 — 판별표

| 하고 싶은 일 | 서버 컴포넌트 | 클라이언트 컴포넌트 |
|---|---|---|
| `async`/`await`로 데이터 페칭 | ✅ 함수에 바로 `async` | ❌ (훅이나 SDK 필요) |
| DB 직접 접근, 파일 읽기 | ✅ | ❌ |
| `process.env.SECRET` 사용 | ✅ | ❌ 절대 금지 |
| `useState`, `useReducer` | ❌ | ✅ |
| `useEffect`, `useRef` | ❌ | ✅ |
| `onClick`, `onChange` 등 이벤트 | ❌ | ✅ |
| `window`, `localStorage` 등 브라우저 API | ❌ | ✅ |
| 커스텀 훅 (`useAutoScroll` 등) | ❌ | ✅ |
| 큰 라이브러리 사용 시 번들 크기 영향 | 없음 (서버에만 남음) | 있음 (사용자가 다운로드) |

💡 **한 문장 판별법**: **"이 컴포넌트가 사용자의 클릭이나 입력에 반응해야 하나? 또는 시간이 지나며 변하는 상태를 갖나?"** → Yes면 클라이언트, No면 서버.

### 2-4. `"use client"`는 "경계 선언"이지 "이 파일만" 이 아니다

가장 흔한 오해입니다.

**📖 읽기 전용** — 전염 규칙 설명. ⚠️ **진짜 `ChatPanel.tsx`는 4-4에서 만듭니다. 지금 이 두 줄로 파일을 만들지 마세요.**

```tsx
// (개념 예시) "use client"가 붙은 파일이 import하면…
"use client";                    // ← 여기가 경계선
import { MessageList } from "./MessageList";   // ⚠️ MessageList도 클라이언트가 됨
```

> **`"use client"`가 붙은 파일이 `import`하는 모든 컴포넌트는 자동으로 클라이언트 컴포넌트가 됩니다.** (아래로 전염)
> 하지만 **위로는 전염되지 않습니다.** `ChatPanel`을 렌더하는 `page.tsx`는 여전히 서버 컴포넌트입니다.

그래서 실전 원칙은 이렇습니다.

> ⭐ **`"use client"`는 트리의 최대한 아래(잎사귀 쪽)에 두어라.**

**📖 읽기 전용** — 오늘 4-4에서 실제로 만들 구조의 미리보기

```
page.tsx                 [서버]  ← DB에서 초기 메시지 로드
 └─ ChatPanel.tsx        [클라이언트]  ← "use client" 경계는 여기부터
     ├─ MessageList.tsx  [클라이언트]
     └─ ChatInput.tsx    [클라이언트]
```

### 2-5. ⚠️ 직렬화 경계 — props로 넘길 수 있는 것/없는 것

서버 컴포넌트가 클라이언트 컴포넌트에 props를 넘길 때, 그 값은 **서버 → 브라우저로 전송(직렬화)**됩니다. 그래서 제약이 있습니다.

**📖 읽기 전용** — ❌ 줄은 **일부러 틀린 코드**입니다. 붙여넣으면 에러가 납니다

```tsx
// (개념 예시) 서버 컴포넌트가 클라이언트에 props를 넘길 때
export default async function Page() {
  const messages = await db.getMessages();

  return (
    <ChatPanel
      initialMessages={messages}        // ✅ 배열/객체/문자열/숫자/Date — OK
      onSend={() => { ... }}            // ❌ 함수는 직렬화 불가 → 에러
      db={dbConnection}                 // ❌ 클래스 인스턴스도 불가
    />
  );
}
```

🐍 **정확한 비유**: FastAPI에서 응답을 만들 때 `JSONResponse`에 함수나 DB 커넥션을 담을 수 없는 것과 똑같습니다. **"JSON으로 표현 가능한 것만 넘길 수 있다"**고 기억하세요. (예외적으로 Server Action 함수는 넘길 수 있습니다 — 세션 3에서 다룹니다.)

### 2-6. ⭐ 실전 패턴 — `children`으로 서버 컴포넌트를 클라이언트 안에 넣기

"클라이언트 컴포넌트 안에 무거운 서버 컴포넌트를 넣고 싶다"면? `import` 하면 클라이언트로 전염됩니다. 하지만 **`children`으로 넘기면 서버 컴포넌트로 남습니다.**

**📖 읽기 전용** — 안티패턴 (`ExpensiveServerThing`은 가상의 컴포넌트)

```tsx
// ❌ ExpensiveServerThing이 클라이언트로 끌려감
"use client";
import { ExpensiveServerThing } from "./ExpensiveServerThing";
export function Panel() {
  const [open, setOpen] = useState(false);
  return <div>{open && <ExpensiveServerThing />}</div>;
}
```

**📖 읽기 전용** — 권장 패턴. 오늘 이 파일들을 만들지는 않습니다 (Day 7에서 쓸 일이 생깁니다)

```tsx
// ✅ children으로 받으면, 이미 서버에서 렌더된 결과가 꽂힘
"use client";
export function Panel({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div>{open && children}</div>;
}

// 서버 컴포넌트 쪽에서는 이렇게 씁니다
<Panel>
  <ExpensiveServerThing />   {/* 서버에서 렌더된 채로 전달 */}
</Panel>
```

💡 이 패턴은 처음엔 마법처럼 보이는데, 원리는 단순합니다. **`import`는 "코드를 가져오는 것"이라 전염되고, `children`은 "이미 만들어진 결과를 받는 것"이라 전염되지 않습니다.**

### 2-7. 손으로 확인하기 — 서버/클라이언트 실행 위치 실험

여기서부터 다시 **직접 치는 코드**입니다.

**♻️ 덮어쓰기 — `src/app/page.tsx`** (create-next-app 기본 화면을 지우고 교체. 실험용이라 4-4에서 최종본으로 또 바뀝니다)

```tsx
// src/app/page.tsx  (서버 컴포넌트)
import { ClientBox } from "@/components/ClientBox";

export default async function Home() {
  console.log("🖥️ 서버에서 실행됨:", new Date().toISOString());

  // 서버에서 직접 데이터 페칭 — useEffect도 useState도 없다!
  const res = await fetch("https://api.github.com/users/torvalds", {
    cache: "no-store",
  });
  const user = await res.json();

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <p className="text-sm">
        서버가 가져온 값: <b>{user.name}</b> (팔로워 {user.followers})
      </p>
      <ClientBox />
    </div>
  );
}
```

**🆕 새 파일 — `src/components/ClientBox.tsx`** (`components` 폴더도 여기서 처음 만듭니다. 실험용이라 나중에 지워도 됩니다)

```tsx
// src/components/ClientBox.tsx
"use client";
import { useState } from "react";

export function ClientBox() {
  console.log("🌐 브라우저에서 실행됨:", new Date().toISOString());
  const [n, setN] = useState(0);

  return (
    <button
      onClick={() => setN(n + 1)}
      className="rounded-lg border px-3 py-1 text-sm"
    >
      클릭 수: {n}
    </button>
  );
}
```

**확인 방법**:
- `🖥️ 서버에서 실행됨` → **터미널(`pnpm dev` 창)에 출력**됩니다. 브라우저 콘솔엔 안 나옵니다.
- `🌐 브라우저에서 실행됨` → **브라우저 개발자 도구 콘솔에 출력**됩니다.

⚠️ 클라이언트 컴포넌트의 `console.log`는 처음 한 번 **서버에서도** 찍힙니다(서버에서 초기 HTML을 만들기 위해 한 번 렌더하기 때문). 이걸 SSR이라고 합니다. "클라이언트 컴포넌트 = 브라우저에서**만** 실행"이 아니라 **"브라우저에서**도** 실행"**이 정확한 표현이에요.

🐍 Day 2의 `asyncio` 감각으로 보면, 서버 컴포넌트의 `await fetch(...)`는 그냥 백엔드 코드입니다. React도 훅도 필요 없죠. **"데이터 페칭에 `useEffect`가 필요 없다"** — 이게 App Router의 가장 큰 실용적 이득입니다.

### 2-8. 자주 만나는 에러 3종 해설

| 에러 메시지 | 원인 | 해결 |
|---|---|---|
| `You're importing a component that needs useState. This React hook only works in a Client Component.` | 서버 컴포넌트에서 훅 사용 | 그 파일 맨 위에 `"use client"` 추가 |
| `Functions cannot be passed directly to Client Components` | 서버 → 클라이언트로 함수 props 전달 | 함수를 클라이언트 쪽에서 정의하거나 Server Action으로 |
| `window is not defined` | 서버 렌더 중 브라우저 API 접근 | `"use client"` + `useEffect` 안으로 이동 |

### ✅ 세션 2 체크
- [x] "서버 컴포넌트는 서버에서 한 번 실행되고 결과만 간다"를 말로 설명 가능 ⭐
- [x] `"use client"`가 아래로만 전염된다는 것 이해
- [x] 서버 컴포넌트에서 `async`/`await`로 fetch 성공
- [x] 터미널 로그 vs 브라우저 콘솔 로그로 실행 위치 직접 확인
- [x] props 직렬화 제약(함수 못 넘김) 이해

---

## 3. 세션 3 (오후) — Route Handlers · Server Actions · 환경변수 · 스트리밍

### 3-1. Route Handler = FastAPI 엔드포인트

`app/api/*/route.ts` 파일은 화면이 아니라 **HTTP 엔드포인트**입니다.

**🆕 새 파일 — `src/app/api/health/route.ts`** (`api`, `health` 폴더부터 만드세요)

```ts
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ status: "ok", at: new Date().toISOString() });
}
```

`http://localhost:3000/api/health` 접속 → JSON이 뜹니다.

🐍 FastAPI와 나란히 보면 거의 1:1입니다.

| FastAPI | Next.js Route Handler |
|---|---|
| `@app.get("/api/health")` | `export async function GET()` |
| `@app.post("/api/chat")` | `export async function POST(req: Request)` |
| `data = await request.json()` | `const data = await req.json()` |
| `request.query_params.get("q")` | `new URL(req.url).searchParams.get("q")` |
| `return JSONResponse({...})` | `return Response.json({...})` |
| `HTTPException(400, "...")` | `return Response.json({error}, { status: 400 })` |

💡 **`Request`/`Response`는 Next.js 것이 아니라 웹 표준(Fetch API)입니다.** Day 2에서 배운 `fetch`의 반대편이라고 보면 돼요. 같은 규격이라 Node, 브라우저, Vercel Edge 어디서든 통합니다.

POST도 하나 만들어 봅니다.

**🆕 새 파일 — `src/app/api/echo/route.ts`**

```ts
// src/app/api/echo/route.ts
export async function POST(req: Request) {
  const body = await req.json();

  if (typeof body.message !== "string") {
    return Response.json({ error: "message는 문자열이어야 합니다" }, { status: 400 });
  }

  return Response.json({ echo: body.message.toUpperCase() });
}
```

터미널에서 테스트:

**⌨️ 터미널 실행** — `pnpm dev`는 켜둔 채로, 새 터미널 탭에서 (마지막 `#` 줄은 📄 기대 출력)

```bash
curl -X POST http://localhost:3000/api/echo \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'
# {"echo":"HELLO"}
```

⚠️ **`export`하는 함수 이름이 곧 HTTP 메서드**입니다. `GET`, `POST`, `PUT`, `PATCH`, `DELETE`. 소문자로 쓰면 동작하지 않아요.

### 3-2. 환경 변수 — ⚠️ Day 6 전에 반드시 이해할 것

**🆕 새 파일 — `chat-app/.env.local`** (`src/`가 아니라 **프로젝트 루트**입니다. 터미널 명령이 아니라 파일 내용이에요)

```bash
# chat-app/.env.local
ANTHROPIC_API_KEY=sk-ant-여기에실제키
NEXT_PUBLIC_APP_NAME=Chat App
```

💡 키는 오늘 밤(9절)에 발급받습니다. 지금은 `sk-ant-여기에실제키` 그대로 둬도 오늘 실습에는 지장 없습니다.

**규칙은 딱 하나입니다.**

| 이름 | 접근 가능한 곳 | 브라우저 노출 |
|---|---|---|
| `ANTHROPIC_API_KEY` | 서버 컴포넌트, Route Handler, Server Action | ❌ 안전 |
| `NEXT_PUBLIC_APP_NAME` | 어디서나 (클라이언트 포함) | ⚠️ **소스코드에 그대로 박혀서 공개됨** |

> **`NEXT_PUBLIC_` 접두사가 붙은 것만 브라우저로 갑니다. 나머지는 서버에만 남습니다.**

⚠️⚠️ **API 키에는 절대 `NEXT_PUBLIC_`을 붙이지 마세요.** 붙이는 순간 그 키는 세상에 공개된 것과 같습니다. Day 6에서 Anthropic 키를 넣을 때 이 규칙 하나만 지키면 됩니다.

**📖 읽기 전용** — ✅/❌ 대조. 아래 두 블록은 만드는 파일이 아닙니다

```ts
// ✅ Route Handler (서버) — 안전
export async function POST() {
  const key = process.env.ANTHROPIC_API_KEY;   // OK
}
```

```tsx
// ❌ 클라이언트 컴포넌트 — undefined이거나, NEXT_PUBLIC_이면 유출
"use client";
export function Bad() {
  console.log(process.env.ANTHROPIC_API_KEY);  // undefined (다행히)
}
```

`.gitignore` 확인 — `create-next-app`이 이미 `.env*` 를 넣어줬을 겁니다. 없다면 지금 추가하세요.

**⌨️ 터미널 실행** — `chat-app/`에서

```bash
grep -n "env" .gitignore   # .env* 가 보이면 OK
```

**서버에서 실제로 읽어보기** — 3-1에서 만든 `/api/health`에 한 줄만 끼워 넣습니다.

**✏️ 부분 수정 — `src/app/api/health/route.ts`** (`app:` 줄만 추가)

```ts
export async function GET() {
  return Response.json({
    status: "ok",
    at: new Date().toISOString(),
    app: process.env.NEXT_PUBLIC_APP_NAME,   // ← ✏️ 이 줄 추가
  });
}
```

⚠️ `.env.local`을 만든 뒤에는 **`pnpm dev`를 껐다 켜야** 합니다(환경변수는 서버 시작 시 로드). `/api/health`에 `"app":"Chat App"`이 보이면 성공입니다.

🐍 파이썬의 `.env` + `python-dotenv`와 같지만, **차이는 "빌드 시점에 클라이언트 번들로 치환된다"**는 점입니다. 파이썬은 전부 서버에서만 도니까 이런 구분이 없었죠.

### 3-3. Server Actions — 폼과 뮤테이션

Route Handler가 "REST API"라면, Server Action은 **"서버 함수를 클라이언트에서 직접 호출하는 것"**입니다.

**♻️ 덮어쓰기 — `src/app/about/page.tsx`** (1-5에서 만든 파일입니다. 아래는 1-5 내용 + 폼을 합친 **전체본**이니 그대로 교체하세요)

```tsx
// src/app/about/page.tsx
async function saveNote(formData: FormData) {
  "use server";                              // ← 이 함수는 서버에서만 실행됨
  const text = formData.get("text");
  console.log("서버에 저장:", text);          // 터미널에 찍힘
  // await db.insert(...)
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* ⬇️ 1-5에서 만든 부분 — 그대로 유지 */}
      <h1 className="text-xl font-semibold">소개</h1>
      <p className="mt-2 text-sm text-gray-600">
        7일 학습 로드맵으로 만드는 채팅 앱입니다.
      </p>

      {/* ⬇️ 여기부터가 새로 추가되는 Server Action 폼 */}
      <form action={saveNote} className="mt-6 space-y-2">
        <input name="text" className="w-full rounded border px-3 py-2" />
        <button className="rounded bg-blue-600 px-4 py-2 text-white">저장</button>
      </form>
    </div>
  );
}
```

**동작 확인**: `/about`에서 아무 글자나 넣고 저장 → **브라우저가 아니라 `pnpm dev` 터미널**에 `서버에 저장: ...`이 찍히면 성공입니다.

이게 왜 신기하냐면 — **`fetch`도, API 라우트도, JSON 직렬화도 직접 안 썼는데** 브라우저의 폼 제출이 서버 함수를 호출했습니다. Next.js가 그 배선을 대신 만들어준 거예요.

🐍 **가장 가까운 비유는 RPC**입니다. `@app.post("/save")` + 프론트의 `fetch("/save")` 두 벌을 쓰는 대신, 함수 하나로 끝냅니다.

**언제 무엇을 쓰나:**

| 상황 | 선택 |
|---|---|
| 폼 제출, 데이터 생성/수정/삭제 | **Server Action** |
| 외부에서 호출되는 공개 API | **Route Handler** |
| **스트리밍 응답** (LLM 토큰) | **Route Handler** ⭐ ← 우리 채팅이 여기 |
| 웹훅 수신 | **Route Handler** |

💡 오늘은 "이런 게 있다"만 알면 충분합니다. 우리 채팅은 스트리밍이 필요해서 Route Handler로 갑니다.

### 3-4. `loading.tsx`와 스트리밍

서버 컴포넌트가 `await`로 데이터를 기다리는 동안 사용자는 뭘 볼까요? `loading.tsx`를 만들면 자동으로 그게 보입니다.

**🆕 새 파일 — `src/app/loading.tsx`**

```tsx
// src/app/loading.tsx
export default function Loading() {
  return <div className="p-6 text-sm text-gray-400">불러오는 중…</div>;
}
```

**직접 `<Suspense>`를 쓰면 더 세밀하게 제어**할 수 있습니다. 페이지의 나머지는 즉시 보여주고 느린 부분만 나중에 채우는 거죠.

**📖 읽기 전용** — 새 파일이 아닙니다. 눈으로 확인하고 싶다면 2-7의 `src/app/page.tsx`에 `SlowStats`와 `<Suspense>`만 잠깐 넣어봤다가 되돌리세요 (4-4에서 어차피 최종본으로 교체됩니다)

```tsx
import { Suspense } from "react";

async function SlowStats() {
  await new Promise((r) => setTimeout(r, 2000));    // 느린 작업 흉내
  return <p className="text-sm">통계: 42</p>;
}

export default function Home() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">홈</h1>   {/* 즉시 표시 */}
      <Suspense fallback={<p className="text-sm text-gray-400">통계 로딩…</p>}>
        <SlowStats />                                {/* 2초 뒤 채워짐 */}
      </Suspense>
    </div>
  );
}
```

🐍 파이썬에서 `StreamingResponse`로 청크를 흘려보내던 것과 개념이 같습니다. 다만 여기선 **HTML 조각이 순서대로 흘러들어옵니다.**

### 3-5. ⭐ 실습 — Day 6를 위한 스트리밍 API 껍데기

여기가 오늘의 사전 준비 핵심입니다. **가짜 토큰을 한 글자씩 흘려보내는 API**를 만들어 두면, Day 6에 이 자리에 진짜 LLM만 꽂으면 됩니다.

**🆕 새 파일 — `src/app/api/chat/route.ts`** ⭐ 오늘의 핵심 산출물

```ts
// src/app/api/chat/route.ts
// ⚠️ Day 6에서 이 파일의 내용이 Vercel AI SDK의 streamText로 교체됩니다.

export async function POST(req: Request) {
  const { message } = (await req.json()) as { message?: string };

  if (!message?.trim()) {
    return Response.json({ error: "message가 필요합니다" }, { status: 400 });
  }

  const reply = `(가짜 응답) "${message}" 라고 하셨군요. 아직 LLM은 연결되지 않았습니다.`;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (const char of reply) {
        controller.enqueue(encoder.encode(char));      // 한 글자씩 내보냄
        await new Promise((r) => setTimeout(r, 25));   // 타이핑 효과
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

터미널에서 확인:

**⌨️ 터미널 실행**

```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"안녕"}'
```

→ 글자가 **한 글자씩 또르르 나오면 성공**입니다. (`-N`은 버퍼링을 끄는 옵션)

🐍 `ReadableStream`은 파이썬의 제너레이터 기반 `StreamingResponse`와 대응됩니다.

```python
# 🐍 개념적으로 이것과 같습니다
async def gen():
    for ch in reply:
        yield ch
        await asyncio.sleep(0.025)
return StreamingResponse(gen(), media_type="text/plain")
```

💡 **오늘 이걸 직접 만들어보는 이유**: Day 6의 `useChat` 훅은 이 배선을 전부 감춰버립니다. 감춰지기 **전에** 원리를 한 번 봐두면, 나중에 스트리밍이 깨졌을 때 어디를 볼지 알 수 있어요.

### ✅ 세션 3 체크
- [ ] `/api/health` GET, `/api/echo` POST 동작 확인
- [ ] `.env.local` 값을 서버에서 읽기 성공 (`/api/health`의 `app` 필드)
- [ ] `NEXT_PUBLIC_` 규칙 설명 가능 ⭐
- [ ] `/about`의 Server Action 폼 → 터미널에 로그 확인
- [ ] (선택) `<Suspense>`로 느린 부분만 나중에 채우기 확인
- [ ] `/api/chat`에서 글자 단위 스트리밍 확인 (curl)

---

## 4. 세션 4 (오후) — 채팅 UI 이관 & shadcn/ui

### 4-1. 무엇이 그대로 가고, 무엇이 바뀌나

`practice/day4/src/`와 `chat-app/src/`를 나란히 열어놓고 시작하세요.

| Day 4 파일 | Day 5에서 | 왜 |
|---|---|---|
| `types.ts` | **그대로 복사** | 순수 타입, 환경 무관 |
| `hooks/useAutoScroll.ts` | **그대로 복사** | 순수 React 훅 |
| `components/MessageItem.tsx` | 거의 그대로 (import 경로만 `@/`) | 상태 없는 표시용 |
| `components/MessageList.tsx` | 거의 그대로 | 훅을 쓰므로 클라이언트 |
| `components/ChatInput.tsx` | 거의 그대로 | `useState` 사용 |
| `App.tsx` | → **`components/ChatPanel.tsx`** + `app/page.tsx`로 **분리** ⭐ | 서버/클라이언트 경계를 나누기 위해 |
| `main.tsx`, `index.html` | **버림** | Next.js가 대신함 |

💡 **핵심 인사이트**: Day 4에서 만든 컴포넌트의 90%가 손대지 않고 옮겨집니다. **React를 제대로 배워두면 Next.js는 그 위의 얇은 층**이라는 게 여기서 체감돼요.

### 4-2. 파일 복사

**⌨️ 터미널 실행** — ⚠️ `chat-app/`이 아니라 **저장소 루트(`nextjs-study/`)**에서

```bash
# 저장소 루트에서
cp practice/day4/src/types.ts            chat-app/src/types.ts
mkdir -p chat-app/src/hooks chat-app/src/components
cp practice/day4/src/hooks/useAutoScroll.ts   chat-app/src/hooks/
cp practice/day4/src/components/MessageItem.tsx  chat-app/src/components/
cp practice/day4/src/components/MessageList.tsx  chat-app/src/components/
cp practice/day4/src/components/ChatInput.tsx    chat-app/src/components/
```

이제 복사해온 4개 파일을 열어 import 경로를 상대경로에서 `@/` 별칭으로 바꿉니다.

**✏️ 부분 수정 — 복사해온 파일들의 `import` 줄** (아래는 고치는 방법을 보여주는 발췌본입니다)

```tsx
// Before (Day 4)
import type { Message } from "../types";
import { useAutoScroll } from "../hooks/useAutoScroll";

// After (Day 5)
import type { Message } from "@/types";
import { useAutoScroll } from "@/hooks/useAutoScroll";
```

💡 `@/`는 `src/`를 가리킵니다(`tsconfig.json`의 `paths`). 폴더를 옮겨도 import가 안 깨져서 편합니다.

### 4-3. ⭐ `"use client"` 경계 정리

두 파일 맨 위 줄에 `"use client"`를 추가합니다.

**✏️ 부분 수정 — `src/components/MessageList.tsx`, `src/components/ChatInput.tsx`**
⚠️ 아래 블록은 **맨 앞 몇 줄만 보여주는 발췌본**입니다. 통째로 붙여넣으면 파일 내용이 날아갑니다. **`"use client";` 한 줄만 파일 최상단에 추가**하세요.

```tsx
// src/components/MessageList.tsx
"use client";                    // ← ✏️ 이 한 줄만 추가 (useAutoScroll = useEffect/useRef 사용)
import type { Message } from "@/types";
// ... 나머지는 Day 4에서 복사해온 그대로 둡니다
```

```tsx
// src/components/ChatInput.tsx
"use client";                    // ← ✏️ 이 한 줄만 추가 (useState + onChange 사용)
import { useState } from "react";
// ... 나머지는 Day 4에서 복사해온 그대로 둡니다
```

`MessageItem.tsx`는? **훅도 이벤트도 없으니 서버 컴포넌트로 둘 수 있습니다.** 하지만 `MessageList`(클라이언트)가 import하므로 어차피 클라이언트가 됩니다. `"use client"`를 안 써도 되고, 명시해도 됩니다. 💡 저는 **안 쓰는 쪽**을 권합니다 — "이 컴포넌트는 상태가 없다"는 신호가 되거든요.

### 4-4. `App.tsx` → `ChatPanel.tsx` + `page.tsx`로 분리

이게 오늘 배운 모든 걸 쓰는 지점입니다.

**🆕 새 파일 — `src/components/ChatPanel.tsx`** (2-4에서 개념으로만 봤던 그 파일을 이제 진짜로 만듭니다)

```tsx
// src/components/ChatPanel.tsx   ← 상태를 가진 클라이언트 컴포넌트
"use client";

import { useState } from "react";
import type { Message } from "@/types";
import { MessageList } from "@/components/MessageList";
import { ChatInput } from "@/components/ChatInput";

type ChatPanelProps = {
  initialMessages?: Message[];
};

export function ChatPanel({ initialMessages = [] }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = async (text: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    // 어시스턴트 메시지를 빈 껍데기로 먼저 추가하고, 스트리밍으로 채워나간다
    const replyId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: replyId, role: "assistant", content: "", createdAt: Date.now() },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok || !res.body) throw new Error(`요청 실패: ${res.status}`);

      // ⭐ Day 2에서 배운 fetch + Day 5 세션 3의 ReadableStream이 만나는 지점
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId ? { ...m, content: m.content + chunk } : m,
          ),
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === replyId ? { ...m, content: `⚠️ ${msg}` } : m,
        ),
      );
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-57px)] max-w-2xl flex-col border-x">
      <MessageList messages={messages} isThinking={isThinking} />
      <ChatInput onSend={handleSend} disabled={isThinking} />
    </div>
  );
}
```

**♻️ 덮어쓰기 — `src/app/page.tsx`** (2-7의 실험 코드를 지우고 이 최종본으로 교체. `ClientBox.tsx`는 이제 안 쓰이니 지워도 됩니다)

```tsx
// src/app/page.tsx   ← 서버 컴포넌트
import { ChatPanel } from "@/components/ChatPanel";
import type { Message } from "@/types";

export default async function Home() {
  // 나중에 DB에서 읽어올 자리. 지금은 서버에서 만든 인사말 하나.
  const initialMessages: Message[] = [
    {
      id: "welcome",
      role: "assistant",
      content: "안녕하세요! 무엇을 도와드릴까요?",
      createdAt: Date.now(),
    },
  ];

  return <ChatPanel initialMessages={initialMessages} />;
}
```

**여기서 일어난 일을 짚어보세요:**

1. `page.tsx`는 **서버**에서 실행됩니다. 나중에 `await db.getMessages()`로 바뀔 자리예요.
2. `initialMessages`(배열)는 **직렬화되어** 브라우저로 넘어갑니다 — JSON으로 표현 가능하니까 OK.
3. `ChatPanel`부터가 **클라이언트 경계**입니다. 여기부터 `useState`가 살아있죠.
4. `setMessages(prev => prev.map(...))` — Day 4의 **불변 업데이트**가 스트리밍에서 그대로 쓰였습니다.

⚠️ **불변 업데이트를 꼭 지키세요.** `m.content += chunk`처럼 직접 수정하면 참조가 안 바뀌어서 화면이 갱신되지 않습니다(Day 4 함정표 1번).

**동작 확인**: `pnpm dev` → 메시지 전송 → 답변이 **한 글자씩 타이핑되듯** 나타나면 성공입니다. 🎉

### 4-5. shadcn/ui 적용 (Day 4에서 미룬 것)

Day 4에서 미뤄뒀던 이유가 여기 있습니다 — Next.js에서 설치가 훨씬 매끄럽거든요.

**⌨️ 터미널 실행**

```bash
cd chat-app
pnpm dlx shadcn@latest init
```

질문에는 기본값(Neutral 등)을 고르면 됩니다. 그다음 필요한 컴포넌트만 골라 설치:

**⌨️ 터미널 실행** — `src/components/ui/`에 파일이 자동 생성됩니다 (손으로 만들지 않습니다)

```bash
pnpm dlx shadcn@latest add button input scroll-area
```

⚠️ **shadcn/ui는 npm 라이브러리가 아닙니다.** `node_modules`에 들어가는 게 아니라 **`src/components/ui/` 안에 소스 코드가 복사**됩니다. 그래서 마음대로 고칠 수 있어요. 🐍 `pip install`보다는 "코드 스니펫을 프로젝트에 붙여넣기"에 가깝습니다.

`ChatInput.tsx`에 적용합니다.

**♻️ 덮어쓰기 — `src/components/ChatInput.tsx`** (4-3에서 `"use client"`만 붙였던 그 파일입니다. 아래는 **전체본**이니 기존 내용을 전부 지우고 교체하세요)

```tsx
// src/components/ChatInput.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatInputProps = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [text, setText] = useState("");
  const canSend = text.trim() !== "" && !disabled;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="메시지를 입력하세요"
        className="flex-1"
      />
      <Button type="submit" disabled={!canSend}>
        전송
      </Button>
    </form>
  );
}
```

💡 **스타일에 시간 쓰지 마세요.** 로드맵의 원칙대로, shadcn/ui 컴포넌트를 가져다 쓰고 Tailwind는 여백·정렬 수준만 만집니다. 오늘의 학습 목표는 CSS가 아닙니다.

### 4-6. 최종 검증

**⌨️ 터미널 실행** — `chat-app/`에서

```bash
pnpm lint          # 경고 0개
pnpm build         # 프로덕션 빌드 성공 (Turbopack)
```

⚠️ `pnpm build`가 **`pnpm dev`에서 못 잡은 에러를 잡는 경우가 많습니다.** 특히 서버/클라이언트 경계 위반은 빌드에서 드러나요. 오늘 반드시 한 번 돌려보세요.

빌드 출력에서 이런 표를 보게 됩니다.

**📄 빌드 출력 예시**

```
Route (app)                    Size     First Load JS
┌ ○ /                          ...      ...
├ ○ /about                     ...      ...
└ ƒ /api/chat                  ...      ...
```

- `○` = 정적으로 미리 만들어진 페이지
- `ƒ` = 요청마다 서버에서 실행되는 동적 페이지/핸들러

### ✅ 세션 4 체크
- [ ] Day 4 컴포넌트 이관 완료, import를 `@/`로 변경
- [ ] `"use client"` 경계를 `ChatPanel`에 두고 `page.tsx`는 서버로 유지
- [ ] 서버 컴포넌트 → 클라이언트 컴포넌트로 `initialMessages` 전달 성공
- [ ] 스트리밍 응답이 한 글자씩 화면에 쌓이는 것 확인 ⭐
- [ ] shadcn/ui `Button`/`Input` 적용
- [ ] `pnpm build` 성공

---

## 5. 추가 연습 문제 (여유 있으면)

**① `/chat/[id]` 상세 페이지**
동적 라우트를 만들고 `await params`로 id를 표시하세요. `<Link href="/chat/abc">`로 이동해 보세요.

**② `error.tsx`로 에러 화면 만들기**
`src/app/error.tsx`를 만들고(⚠️ 반드시 `"use client"` 필요), 페이지에서 일부러 `throw new Error("테스트")`를 던져 화면을 확인하세요.

**🆕 새 파일 — `src/app/error.tsx`** (추가 연습이라 안 만들어도 오늘 목표에는 지장 없습니다)

```tsx
// src/app/error.tsx
"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6">
      <p className="text-sm text-red-600">문제가 발생했습니다.</p>
      <button onClick={reset} className="mt-2 rounded border px-3 py-1 text-sm">
        다시 시도
      </button>
    </div>
  );
}
```

**③ 스트리밍 중단 버튼**
Day 2에서 배운 `AbortController`를 `ChatPanel`에 붙여 "중단" 버튼을 만드세요. Day 6에서 `useChat`의 `stop()`이 이걸 대신하게 됩니다 — 미리 원리를 봐두면 좋습니다.

---

## 6. ✅ Day 5 완료 체크리스트

- [ ] `chat-app` 생성, `pnpm dev`/`pnpm build` 성공
- [ ] 파일 위치 = URL 규칙 이해, 페이지 2개 이상 + 레이아웃 구성 ⭐(로드맵 필수)
- [ ] `layout.tsx`의 `children`, `<Link>` 사용
- [ ] Next.js 16의 async `params` 이해
- [ ] **서버 컴포넌트 vs 클라이언트 컴포넌트 차이를 말로 설명 가능** ⭐(로드맵 필수)
- [ ] `"use client"`가 아래로 전염되고 위로는 안 된다는 것 이해
- [ ] props 직렬화 제약 이해 (함수 못 넘김)
- [ ] `app/api/*/route.ts`로 API 엔드포인트 작성 ⭐(로드맵 필수)
- [ ] `.env.local`에서 값 읽기 + `NEXT_PUBLIC_` 규칙 ⭐(로드맵 필수)
- [ ] Route Handler에서 `ReadableStream`으로 스트리밍 응답
- [ ] 채팅 UI 이관 완료 + 스트리밍 연결 동작
- [ ] shadcn/ui 최소 적용

---

## 7. 자주 나오는 함정 정리 (⚠️)

| 증상 | 원인 | 해결 |
|---|---|---|
| `create-next-app`이 `ERR_PNPM_IGNORED_BUILDS`로 중단 | pnpm 10+가 `sharp`/`unrs-resolver`의 빌드 스크립트를 기본 차단 | **지우지 말 것.** `pnpm approve-builds` → `pnpm install` |
| 폴더를 만들었는데 404 | `page.tsx`가 없음 | 폴더 안에 `page.tsx` 생성 |
| 페이지가 안 뜸 / 빈 화면 | `export default`가 아님 | 기본 내보내기로 변경 |
| `This React hook only works in a Client Component` | 서버 컴포넌트에서 훅 사용 | 파일 맨 위 `"use client"` |
| `"use client"`를 썼는데 여전히 에러 | 파일 **첫 줄**이 아님 (import 아래에 씀) | 반드시 파일 최상단 |
| `Functions cannot be passed to Client Components` | 서버 → 클라이언트 함수 props | 클라이언트 쪽에서 정의 |
| `window is not defined` | 서버 렌더 중 브라우저 API | `useEffect` 안으로 이동 |
| `params.id`가 undefined | Next.js 16은 `params`가 Promise | `const { id } = await params` |
| API 키가 브라우저에서 보임 | `NEXT_PUBLIC_` 접두사 사용 | 접두사 제거, 서버에서만 사용 ⚠️⚠️ |
| `.env.local` 수정했는데 반영 안 됨 | 환경변수는 서버 시작 시 로드 | `pnpm dev` 재시작 |
| `/api/...`가 404 | 파일명이 `route.ts`가 아님 / 함수명 소문자 | `route.ts` + `export async function POST` |
| 스트리밍이 한 번에 몰려서 도착 | 클라이언트가 전체 응답을 기다림 | `res.body.getReader()`로 청크 단위 읽기 |
| 스트리밍 텍스트가 깨짐 (한글) | 멀티바이트가 청크 경계에서 잘림 | `decoder.decode(value, { stream: true })` |
| 화면이 갱신 안 됨 | `m.content += chunk`로 직접 수정 | `{ ...m, content: ... }` 불변 업데이트 |
| `dev`는 되는데 `build`가 실패 | 서버/클라 경계 위반, 타입 에러 | 빌드 에러 메시지의 파일 확인 |
| `<a>`로 이동하면 상태가 날아감 | 전체 페이지 새로고침 | `<Link>` 사용 |
| shadcn 컴포넌트 import 실패 | `init`을 안 했거나 별칭 설정 문제 | `components.json` 확인 |

---

## 8. 저장소 커밋 & 정리

**⌨️ 터미널 실행**

```bash
cd ..                              # 저장소 루트

git status                         # node_modules/, .next/, .env.local 이 안 보이는지 확인
```

⚠️ 세 가지가 반드시 무시되어야 합니다: `node_modules/`, `.next/`(빌드 산출물), `.env.local`(비밀 키). `create-next-app`이 `chat-app/.gitignore`를 만들어줬을 겁니다.

**⌨️ 터미널 실행**

```bash
git add chat-app docs/Day5.md
git commit -m "Day 5: Next.js App Router + 채팅 UI 이관 + 스트리밍 API 껍데기"
git push
```

💡 커밋 후 GitHub에서 **`.env.local`이 안 올라갔는지 눈으로 확인**하세요. 한 번 올라간 키는 커밋을 지워도 히스토리에 남습니다.

---

## 9. Day 6 미리보기

오늘 판 자리에 내일 진짜 LLM이 들어옵니다.

1. **Vercel AI SDK v6 설치** — `ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`
   💡 설치할 때 오늘 본 `ERR_PNPM_IGNORED_BUILDS`가 또 뜰 수 있습니다. 이제 대응법을 알죠 — `pnpm approve-builds`.
2. **`/api/chat/route.ts` 교체** — 오늘의 가짜 `ReadableStream`이 `streamText(...)` 한 줄로 바뀝니다.
3. **`ChatPanel` 대수술** — 오늘 손으로 짠 `getReader()` 루프가 `useChat` 훅 한 줄로 사라집니다. 오늘 직접 짜봤으니 "무엇이 감춰졌는지" 알게 될 거예요.
4. ⭐ **tool calling으로 에이전트 만들기** — Zod 스키마로 도구를 정의하고, 모델이 도구를 호출 → 결과 관찰 → 재추론하는 루프를 봅니다. Day 2의 GitHub API 호출 코드가 **도구 하나로 재등장**합니다.

**오늘 밤 준비할 것** (5분):
- [ ] [console.anthropic.com](https://console.anthropic.com)에서 API 키 발급
- [ ] 소액($5 정도) 크레딧 충전 — 학습용으로 충분합니다
- [ ] `chat-app/.env.local`에 `ANTHROPIC_API_KEY=...` 넣어두기

---

### 부록 A — FastAPI ↔ Next.js 치트시트

**📖 읽기 전용** — 대조표

```
# 라우팅
@app.get("/about")                    →  src/app/about/page.tsx
@app.get("/chat/{id}")                →  src/app/chat/[id]/page.tsx
@app.post("/api/chat")                →  src/app/api/chat/route.ts (export POST)
APIRouter(prefix="/admin")            →  src/app/admin/layout.tsx

# 핸들러
async def handler(request: Request)   →  export async function POST(req: Request)
data = await request.json()           →  const data = await req.json()
request.query_params.get("q")         →  new URL(req.url).searchParams.get("q")
return JSONResponse({...})            →  return Response.json({...})
raise HTTPException(400, "bad")       →  return Response.json({error}, {status:400})
StreamingResponse(gen())              →  new Response(readableStream)

# 템플릿 / 렌더링
base.html + {% block %}               →  layout.tsx + {children}
render_template("x.html", user=u)     →  서버 컴포넌트가 직접 JSX 반환
os.environ["KEY"]                     →  process.env.KEY  (서버 전용)
python-dotenv (.env)                  →  .env.local  (NEXT_PUBLIC_ 만 클라이언트 노출)

# 실행 위치 (⭐ 가장 중요)
FastAPI 핸들러 (서버에서만)            →  서버 컴포넌트 (기본값)
<script> 안의 JS (브라우저에서만)      →  클라이언트 컴포넌트 ("use client")
JSON 응답만 브라우저로                →  props는 직렬화 가능한 값만
```

### 부록 B — "서버냐 클라이언트냐" 판별 플로차트

**📖 읽기 전용** — 판별용

```
이 컴포넌트가...

  useState / useReducer 를 쓰나?            ──Yes──▶ 클라이언트
  useEffect / useRef / 커스텀 훅을 쓰나?     ──Yes──▶ 클라이언트
  onClick / onChange 등 이벤트가 있나?       ──Yes──▶ 클라이언트
  window / localStorage 를 만지나?          ──Yes──▶ 클라이언트
                  │
                 No
                  ▼
  await 로 데이터를 가져오나?                ──Yes──▶ 서버 (그냥 async 함수로!)
  process.env 비밀 값을 쓰나?               ──Yes──▶ 서버 (반드시!)
                  │
                 No
                  ▼
            그냥 서버 컴포넌트로 두세요 (기본값이 옳습니다)
```

### 부록 C — App Router 특수 파일 요약

| 파일 | 클라이언트 필수? | 한 줄 설명 |
|---|---|---|
| `layout.tsx` | 아니오 | 하위를 감싸는 껍데기, 네비게이션 시 유지 |
| `page.tsx` | 아니오 | 그 URL의 본문 |
| `loading.tsx` | 아니오 | 로딩 중 UI (Suspense 자동 배선) |
| `error.tsx` | **예** ⚠️ | 에러 UI (`reset()` 제공) |
| `not-found.tsx` | 아니오 | 404 UI |
| `route.ts` | — | API 엔드포인트 (`GET`/`POST`… export) |

---

수고했어요. 오늘 넘은 산 — **"같은 언어로 쓰지만 실행되는 곳이 다르다"** — 은 Next.js에서 가장 높은 봉우리입니다. 내일부터는 이 위에 재미있는 걸 올립니다. 진짜 LLM이 붙어요. 🤖
