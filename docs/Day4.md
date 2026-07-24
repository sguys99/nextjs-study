# Day 4 — React 기초: "상태의 함수로서의 UI"

> **소요 시간**: 8시간 (90분 학습 + 15분 휴식 × 4세션)
> **선행 조건**: Day 3 완료 (`interface`/`type`, 제네릭, narrowing 사용 가능. `pnpm typecheck`가 도는 상태)
> **목표**: 선언형 UI와 훅(hook) 사고방식을 체화하고, **7일 여정의 최종 산출물이 될 채팅 앱의 첫 삽**을 뜬다.
> **핵심 태그**: 🐍 = 파이썬 대비 포인트 · 💡 = 팁 · ⚠️ = 함정

---

## 0. 오늘의 목적 & 큰 그림

Day 1~3은 **언어**를 배웠습니다(JS 문법 → 비동기/모듈 → TS). 오늘부터는 **UI 라이브러리**입니다. 로드맵에 적어둔 대로 **Next.js의 절반은 React**예요. Day 5의 Next.js는 "React + 라우팅 + 서버"이므로, 오늘 React가 손에 붙으면 내일이 훨씬 편해집니다.

오늘 넘어야 할 산은 문법이 아니라 **사고 전환 하나**입니다.

> **명령형**: "버튼이 눌리면 → DOM에서 `<ul>`을 찾아서 → `<li>`를 하나 추가해라"
> **선언형(React)**: "화면은 언제나 `messages` 배열을 그린 결과다. 나는 `messages`만 바꾼다."

### 0-1. 🐍 당신을 위한 최고의 비유 — Streamlit

ML 개발자라면 Streamlit(또는 Gradio)을 써봤을 겁니다. React의 멘탈 모델은 **Streamlit과 놀랄 만큼 똑같습니다.**

| Streamlit | React | 설명 |
|---|---|---|
| 위젯 조작 → **스크립트 전체 재실행** | 상태 변경 → **컴포넌트 함수 재실행** | "다시 그린다"가 기본 동작 |
| `st.session_state["count"]` | `const [count, setCount] = useState(0)` | 재실행을 넘어 살아남는 값 |
| `st.session_state.count += 1` | `setCount(count + 1)` | 상태를 바꾸면 화면이 따라옴 |
| 화면 코드는 위에서 아래로 선언 | JSX를 return | UI를 "그리는 절차"가 아니라 "모양"으로 기술 |

즉 React 컴포넌트는 이런 파이썬 함수라고 생각하면 정확합니다:

```python
def chat_view(messages: list[Message]) -> UI:
    # 이 함수는 messages가 바뀔 때마다 처음부터 다시 호출된다
    return render(messages)
```

⚠️ **딱 하나 다른 점**: Streamlit은 재실행할 때마다 화면 전체를 새로 그리지만, React는 **이전 결과와 비교(diff)해서 실제로 바뀐 DOM만** 갱신합니다. 그래서 입력창의 커서가 튀지 않고, 애니메이션이 끊기지 않아요. "재실행은 자주, DOM 수정은 최소로" — 이게 React가 실전에서 통하는 이유입니다.

### 0-2. 저장소 구조 (오늘 추가분)

```
nextjs-study/
├── docs/
│   └── Day4.md                      ← 지금 이 문서
└── practice/
    ├── day1/ ... day3/              ← 문법 연습 (완료)
    └── day4/                        ← 오늘 새로 만듦 (Vite + React + TS)
        ├── package.json
        ├── vite.config.ts
        ├── tsconfig.json
        ├── eslint.config.js
        ├── index.html
        └── src/
            ├── main.tsx             ← 진입점
            ├── index.css            ← Tailwind 한 줄
            ├── App.tsx              ← 오늘의 무대
            ├── types.ts
            ├── components/
            │   ├── MessageList.tsx
            │   ├── MessageItem.tsx
            │   └── ChatInput.tsx
            ├── hooks/
            │   └── useAutoScroll.ts
            └── playground/          ← 세션 1~3 문법 실험용
                ├── JsxDemo.tsx
                ├── StateDemo.tsx
                └── EffectDemo.tsx
```

💡 **왜 Next.js가 아니라 Vite로 시작하나요?** Next.js에는 "서버 컴포넌트 vs 클라이언트 컴포넌트"라는 큰 개념이 하나 더 얹혀 있습니다(Day 5의 핵심). 두 개를 동시에 배우면 "이게 React 규칙인가 Next.js 규칙인가"가 뒤섞여요. 오늘은 **순수 React만** 깨끗하게 배우고, 내일 Next.js로 이 채팅 UI를 그대로 이관합니다. 이관 작업 자체가 두 프레임워크의 경계를 알려주는 최고의 학습이 됩니다.

💡 **shadcn/ui는 Day 5로 미룹니다.** Vite에서 shadcn을 붙이려면 path alias·`components.json` 등 배선이 늘어나는데, Next.js에서는 훨씬 매끄럽습니다. 오늘은 **Tailwind만** 최소한으로 씁니다(여백/정렬/색 정도). 로드맵의 "CSS 늪 회피" 원칙 그대로예요.

---

## 1. 세션 1 (오전) — 프로젝트 셋업 · React 멘탈 모델 · JSX

### 1-1. Vite로 React + TS 프로젝트 생성

```bash
# 저장소 루트의 practice/ 에서
cd practice
pnpm create vite@latest day4 --template react-ts
cd day4
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:5173` 이 열리고 Vite 기본 화면이 보이면 성공입니다.

🐍 **Vite는 뭔가요?** 개발 서버 + 번들러입니다. 파이썬은 `python app.py`면 끝이지만, 브라우저 JS는 ① TS/JSX를 브라우저가 이해하는 JS로 변환하고 ② 수십 개 파일을 묶고 ③ 저장 시 화면을 즉시 갱신(HMR)해야 합니다. Vite가 이 셋을 해줍니다. **Next.js는 이 역할까지 내장**하고 있어서 Day 5부터는 Vite가 사라집니다.

### 1-2. 생성된 파일 해부

| 파일 | 역할 | 🐍 대응 감각 |
|---|---|---|
| `index.html` | 유일한 HTML. `<div id="root">`가 앱이 심어질 자리 | 템플릿 껍데기 |
| `src/main.tsx` | 진입점. React를 `#root`에 마운트 | `if __name__ == "__main__":` |
| `src/App.tsx` | 최상위 컴포넌트 | `main()` 함수 |
| `vite.config.ts` | 빌드/플러그인 설정 | (직접 대응 없음) |
| `eslint.config.js` | **이미 들어 있음** (typescript-eslint + react-hooks 포함) | Day 1에 손으로 만든 것을 템플릿이 대신 해줌 |

`src/main.tsx`를 열어보세요:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- `document.getElementById("root")!` — Day 3에서 배운 **non-null 단언 `!`**입니다. "여기 분명히 있다"고 TS에게 알려주는 것.
- `<StrictMode>` — 개발 중에만 동작하는 "버그 탐지 모드". ⚠️ **오늘 세션 3에서 이 녀석 때문에 놀랄 일이 하나 생깁니다.** 미리 기억해두세요.

### 1-3. Prettier + Tailwind 배선 (10분)

**① Prettier** (Day 1과 동일하게 맞춥니다)

```bash
pnpm add -D prettier eslint-config-prettier
```

`.prettierrc` 생성:
```json
{
  "semi": true,
  "singleQuote": false,
  "printWidth": 80
}
```

`eslint.config.js` 맨 위에 import를 추가하고, **설정 배열의 마지막 요소로** `prettierConfig`를 넣으세요(순서 중요 — 마지막이어야 스타일 규칙을 끕니다).

```js
import prettierConfig from "eslint-config-prettier";
// ... 기존 설정들 ...
// 배열의 맨 끝에 prettierConfig 추가
```

`.vscode/settings.json`은 Day 1 것을 그대로 복사하면 됩니다.

**② Tailwind CSS v4**

```bash
pnpm add tailwindcss @tailwindcss/vite
```

`vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

`src/index.css`의 **내용을 전부 지우고** 한 줄만:
```css
@import "tailwindcss";
```

`src/App.css`는 삭제하고, `App.tsx`의 `import "./App.css";`도 지웁니다.

**③ 스크립트 정리** — `package.json`의 `scripts`에 추가:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "tsc -b --noEmit"
  }
}
```

**④ 동작 확인** — `App.tsx`를 통째로 아래로 바꾸고 저장:

```tsx
function App() {
  return (
    <h1 className="p-8 text-3xl font-bold text-blue-600">
      Tailwind 연결 성공 ✅
    </h1>
  );
}

export default App;
```

브라우저에 **파란 굵은 큰 글씨**가 뜨면 배선 완료입니다. (저장하자마자 새로고침 없이 바뀌는 것 = HMR)

### 1-4. 컴포넌트 = "UI를 반환하는 함수"

React 컴포넌트는 특별한 클래스가 아니라 **그냥 함수**입니다. 규칙은 두 개뿐:

1. **이름이 대문자로 시작**할 것 (소문자면 HTML 태그로 취급됨 ⚠️)
2. **JSX를 반환**할 것

```tsx
function Greeting() {
  return <p>안녕하세요</p>;
}

// 사용 (파이썬 함수 호출 f() 대신, 태그 문법으로 씁니다)
<Greeting />
```

🐍 파이썬으로 비유하면:

```python
def greeting() -> str:
    return "<p>안녕하세요</p>"
```
와 구조가 같습니다. 다만 반환값이 **문자열이 아니라 "UI 설명 객체"**이고, 호출을 `greeting()`이 아니라 `<Greeting />`으로 한다는 점만 다릅니다.

💡 **React 19 기준 안 해도 되는 것들**: `import React from "react"` (새 JSX 변환으로 불필요), `React.FC` 타입 (권장 안 함), 클래스 컴포넌트 (로드맵상 학습 범위 밖), `forwardRef` (React 19부터 `ref`가 그냥 prop). 옛날 블로그를 보면 이런 게 나오는데, **무시하세요.**

### 1-5. JSX 문법 — HTML처럼 생겼지만 JS다

`src/playground/JsxDemo.tsx`를 만들고 실험해보세요.

```tsx
export function JsxDemo() {
  const name = "ML 개발자";
  const runs = [
    { id: "a", label: "baseline", acc: 0.81 },
    { id: "b", label: "resnet", acc: 0.93 },
  ];

  return (
    <div className="p-6">
      {/* 1. 중괄호 = "여기부터 JS 표현식" */}
      <h2 className="text-xl font-bold">안녕하세요, {name}님</h2>

      {/* 2. 표현식만 가능. if/for 같은 "문(statement)"은 못 씀 */}
      <p>평균: {(runs.reduce((a, r) => a + r.acc, 0) / runs.length).toFixed(2)}</p>

      {/* 3. style은 객체 + camelCase */}
      <p style={{ marginTop: 8, color: "gray" }}>스타일 예시</p>
    </div>
  );
}
```

**JSX 필수 규칙 5가지**

| 규칙 | 예시 | 이유 |
|---|---|---|
| `class` → **`className`** | `<div className="p-4">` | `class`는 JS 예약어 |
| `for` → **`htmlFor`** | `<label htmlFor="x">` | 마찬가지 |
| 태그는 **반드시 닫기** | `<br />`, `<img />` | XML 규칙 |
| 반환은 **루트 하나** | `<>...</>` (Fragment) | 함수는 값을 하나만 반환 |
| 속성/스타일은 **camelCase** | `onClick`, `marginTop` | JS 객체 속성이라서 |

```tsx
// ⚠️ 형제 요소 2개를 그냥 반환하면 에러
// return (<h1>A</h1><p>B</p>);

// ✅ Fragment로 감싸기 (실제 DOM에는 아무것도 안 생김)
return (
  <>
    <h1>A</h1>
    <p>B</p>
  </>
);
```

🐍 **JSX는 "템플릿 문법"이 아닙니다.** Jinja2처럼 문자열을 치환하는 게 아니라, 빌드 시점에 **함수 호출로 변환되는 JS 문법 확장**입니다. `<h1 className="x">A</h1>`은 대략 `jsx("h1", { className: "x", children: "A" })`가 됩니다. 그래서 JSX를 변수에 담고, 배열에 넣고, 함수에서 반환할 수 있어요.

### 1-6. 조건부 렌더링 & 리스트 렌더링 ⭐

**조건부** — `if`문을 못 쓰므로 삼항 연산자와 `&&`를 씁니다.

```tsx
{isLoading ? <p>불러오는 중…</p> : <p>완료</p>}

{isError && <p className="text-red-500">에러 발생</p>}
```

⚠️ **`&&`의 유명한 함정 — 숫자 0이 화면에 찍힙니다.**

```tsx
{runs.length && <RunList runs={runs} />}
// runs가 빈 배열이면 → runs.length는 0 → falsy라서 렌더 안 될 것 같지만
// React는 0을 "표시할 값"으로 취급해서 화면에 "0"이 찍힙니다 ⚠️

{runs.length > 0 && <RunList runs={runs} />}  // ✅ 반드시 boolean으로
```

💡 `null` / `undefined` / `false`는 "아무것도 안 그림"으로 처리되는데, **`0`과 `""`(빈 문자열은 안 보이지만)은 값으로 취급**됩니다. Day 1의 truthy/falsy 함정이 여기서 모양을 바꿔 재등장한 셈이에요.

**리스트** — `map`으로 배열을 JSX 배열로 바꿉니다. (Day 1 세션 4가 그대로 실전 투입)

```tsx
<ul>
  {runs.map((r) => (
    <li key={r.id}>
      {r.label}: {(r.acc * 100).toFixed(1)}%
    </li>
  ))}
</ul>
```

🐍 파이썬의 `"".join(f"<li>{r.label}</li>" for r in runs)`와 정확히 같은 자리입니다. 컴프리헨션 대신 `map`을 쓴다는 Day 1의 근육이 여기서 매일 쓰입니다.

⚠️ **`key`는 선택이 아닙니다.** React가 "이전 목록의 어느 항목이 지금의 어느 항목인지" 짝지을 때 쓰는 신원증명입니다. 없으면 콘솔 경고가 뜹니다.

```tsx
{runs.map((r, i) => <li key={i}>…</li>)}   // ⚠️ 인덱스 key — 목록이 고정일 때만 OK
{runs.map((r) => <li key={r.id}>…</li>)}   // ✅ 안정적인 고유 ID 사용
```

인덱스를 key로 쓰면, 목록 중간에 항목을 **삽입/삭제/정렬**할 때 React가 엉뚱한 DOM을 재사용해서 입력값이 뒤섞이는 버그가 납니다. 오늘 채팅 메시지에는 `crypto.randomUUID()`로 만든 ID를 씁니다.

### ✅ 세션 1 체크
- [ ] `pnpm dev`로 개발 서버가 뜨고 HMR이 동작
- [ ] Tailwind 클래스(`text-blue-600` 등)가 실제로 적용됨
- [ ] JSX에서 `{}`로 표현식 삽입, Fragment로 형제 반환
- [ ] `map` + `key`로 리스트 렌더링
- [ ] `{arr.length && ...}` 함정을 설명 가능

---

## 2. 세션 2 (오전) — props & state

> `src/playground/StateDemo.tsx`에서 실험합니다.

### 2-1. props — 컴포넌트의 입력 인자 (TS로 타이핑)

props는 **부모가 자식에게 내려주는 읽기 전용 데이터**입니다. Day 3의 `type`이 여기서 즉시 실전 투입됩니다.

```tsx
type RunCardProps = {
  label: string;
  accuracy: number;
  highlight?: boolean; // 옵셔널 (Day 3 세션 2)
};

export function RunCard({ label, accuracy, highlight = false }: RunCardProps) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "bg-yellow-50" : ""}`}>
      <span className="font-medium">{label}</span>{" "}
      <span>{(accuracy * 100).toFixed(1)}%</span>
    </div>
  );
}

// 부모에서 사용
<RunCard label="resnet" accuracy={0.93} highlight />
```

포인트 세 가지:
- **구조 분해로 받는다** — `({ label, accuracy })`는 Day 1의 객체 구조 분해입니다. React 코드의 99%가 이 형태예요.
- **문자열은 `"..."`, 그 외는 `{...}`** — `accuracy={0.93}`처럼 중괄호로 JS 값을 넘깁니다.
- **`highlight`만 쓰면 `true`** — `highlight={true}`의 축약.

🐍 파이썬 대응:

| React | 🐍 Python |
|---|---|
| `<RunCard label="a" accuracy={0.9} />` | `run_card(label="a", accuracy=0.9)` |
| `type Props = { ... }` | `class Props(TypedDict)` / dataclass |
| `highlight?: boolean` + 기본값 | `highlight: bool = False` |
| props는 **읽기 전용** | `@dataclass(frozen=True)` |

⚠️ **props를 자식에서 수정하면 안 됩니다.** `props.label = "x"` 같은 코드는 React의 단방향 데이터 흐름을 깨뜨립니다. 값을 바꾸고 싶으면 **부모의 상태를 바꾸는 함수를 prop으로 받아서 호출**합니다 (2-5의 "상태 끌어올리기").

### 2-2. `useState` — 재실행을 넘어 살아남는 값

```tsx
import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4">
      <p>count: {count}</p>
      <button
        className="rounded bg-blue-600 px-3 py-1 text-white"
        onClick={() => setCount(count + 1)}
      >
        +1
      </button>
    </div>
  );
}
```

- `useState(0)`은 `[현재값, 바꾸는함수]` **배열을 반환**합니다 → Day 1의 배열 구조 분해로 받습니다.
- `setCount`를 호출하면 → React가 상태를 갱신하고 → **`Counter` 함수를 처음부터 다시 실행**하고 → 바뀐 DOM만 수정합니다.

**TS 타이핑**: 초깃값에서 자동 추론되지만, **빈 배열/null로 시작할 땐 제네릭을 명시**해야 합니다. (Day 3의 제네릭이 재등장)

```tsx
const [count, setCount] = useState(0);                  // number로 추론
const [text, setText] = useState("");                   // string으로 추론
const [messages, setMessages] = useState<Message[]>([]); // ⭐ 명시 필요
const [user, setUser] = useState<User | null>(null);     // ⭐ 명시 필요
```

⚠️ **가장 헷갈리는 지점 — 상태는 "스냅샷"입니다.**

```tsx
const handleClick = () => {
  setCount(count + 1);
  console.log(count); // ⚠️ 여전히 옛날 값! (0을 눌렀다면 0)
};
```

`count`는 **이번 렌더에 고정된 상수**입니다. `setCount`는 "다음 렌더 때 이 값으로 시작해줘"라는 예약일 뿐, 현재 실행 중인 함수의 `count`를 바꾸지 않습니다.

🐍 파이썬 감각으로는 `self.count += 1` 하면 즉시 바뀌는 게 당연하지만, React에서는 **`count`가 인스턴스 변수가 아니라 이번 호출의 지역 상수**라고 생각해야 정확합니다.

이 때문에 **연속 호출은 함수형 업데이트**를 씁니다:

```tsx
setCount(count + 1);
setCount(count + 1); // ⚠️ 결과: +1 (둘 다 같은 스냅샷을 봄)

setCount((c) => c + 1);
setCount((c) => c + 1); // ✅ 결과: +2 (직전 결과를 받아서 계산)
```

💡 **실전 규칙: 이전 값을 기반으로 갱신할 땐 항상 `set(prev => ...)` 형태를 쓰세요.** 오늘 채팅 실습의 `setMessages((prev) => [...prev, msg])`가 정확히 이 이유입니다.

### 2-3. 이벤트 핸들링 & 제어 컴포넌트(controlled input)

```tsx
export function NameForm() {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // ⚠️ 없으면 페이지가 새로고침됩니다
    alert(`제출: ${text}`);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4">
      <input
        className="rounded border px-2 py-1"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit">전송</button>
    </form>
  );
}
```

⚠️ **핸들러는 "함수 자체"를 넘겨야 합니다.**

```tsx
<button onClick={handleClick}>   {/* ✅ 함수 참조 */}
<button onClick={() => save(id)}> {/* ✅ 인자 필요하면 화살표로 감싸기 */}
<button onClick={handleClick()}>  {/* ❌ 렌더 즉시 실행되고 반환값이 등록됨 */}
```

**제어 컴포넌트**란 `value`와 `onChange`를 React 상태에 묶어서, **입력창의 진실이 DOM이 아니라 상태에 있게** 만드는 패턴입니다. 이게 React의 기본형이에요.

```
사용자 타이핑 → onChange → setText → 리렌더 → value={text} 반영
```

🐍 명령형 JS/파이썬 GUI에서는 "제출 시점에 `input.value`를 읽는다"가 자연스럽지만, React는 **매 글자마다 상태를 갱신**합니다. 낭비 같지만, 덕분에 "입력값에 따라 전송 버튼 비활성화" 같은 게 조건 한 줄로 끝납니다.

### 2-4. 불변 업데이트 — Day 1의 spread가 여기서 결정적

⚠️ **React는 상태가 바뀌었는지를 "참조 비교"로 판단합니다.** 배열/객체를 제자리에서 고치면 참조가 그대로라 **화면이 안 바뀝니다.**

```tsx
// ❌ 화면이 안 바뀜
messages.push(newMessage);
setMessages(messages);

// ✅ 새 배열을 만들어서 넘김
setMessages([...messages, newMessage]);
setMessages((prev) => [...prev, newMessage]); // ⭐ 권장형
```

| 작업 | ❌ 변경(mutation) | ✅ 불변 업데이트 |
|---|---|---|
| 배열 추가 | `arr.push(x)` | `[...arr, x]` |
| 배열 삭제 | `arr.splice(i, 1)` | `arr.filter((v) => v.id !== id)` |
| 배열 수정 | `arr[i].done = true` | `arr.map((v) => (v.id === id ? { ...v, done: true } : v))` |
| 객체 수정 | `obj.age = 31` | `{ ...obj, age: 31 }` |

🐍 pandas의 `inplace=True`를 피하고 항상 새 DataFrame을 반환받는 습관과 정확히 같습니다. Day 1에서 "React 상태 관리의 심장"이라고 예고했던 게 이겁니다.

### 2-5. 상태 끌어올리기(lifting state up)

두 컴포넌트가 같은 데이터를 공유해야 하면, **가장 가까운 공통 부모로 상태를 올리고 → 값은 props로, 변경은 콜백으로** 내려보냅니다.

```
        App  ← messages 상태는 여기 하나만 존재
        ├── <MessageList messages={messages} />        (값을 내려받아 그리기만)
        └── <ChatInput onSend={handleSend} />          (부모의 함수를 호출)
```

```tsx
// 부모
const [messages, setMessages] = useState<Message[]>([]);
const handleSend = (text: string) => { /* 상태 변경은 부모가 */ };

// 자식(ChatInput)의 props 타입
type ChatInputProps = {
  onSend: (text: string) => void; // 🐍 Callable[[str], None]
};
```

💡 이게 **단방향 데이터 흐름**입니다. 데이터는 위→아래, 이벤트는 아래→위. "어디서 이 값이 바뀌지?"를 추적할 때 항상 위로만 올라가면 되므로 디버깅이 쉬워집니다.

💡 **상태를 어디 둘지 판단하는 기준**: "이 값이 바뀌면 다시 그려져야 하는 컴포넌트들의 **가장 가까운 공통 조상**". 입력창의 임시 텍스트처럼 혼자만 쓰는 값은 **그 컴포넌트 안에** 두세요(오늘 `ChatInput`의 `text`가 그렇습니다).

### ✅ 세션 2 체크
- [ ] props를 `type`으로 타이핑하고 구조 분해로 받기
- [ ] `useState<T>`로 배열 상태 선언
- [ ] 제어 컴포넌트(`value` + `onChange`)로 입력창 구현
- [ ] `[...prev, x]` 불변 업데이트 사용, `push`가 왜 안 되는지 설명 가능
- [ ] `set(prev => ...)` 함수형 업데이트를 언제 쓰는지 설명 가능

---

## 3. 세션 3 (오후) — 렌더링 모델 & `useEffect`

> `src/playground/EffectDemo.tsx`. **오늘 가장 오해가 많은 세션입니다. 천천히 가세요.**

### 3-1. 렌더링은 언제 일어나는가

React의 한 사이클은 3단계입니다.

```
① 트리거   : 최초 마운트 or setState 호출
② 렌더     : 컴포넌트 함수를 실행해서 "이번 UI 모양"을 계산 (아직 화면 변화 없음)
③ 커밋     : 이전 결과와 비교해 실제로 달라진 DOM만 수정
```

⚠️ **"렌더 = 화면 그리기"가 아닙니다.** 렌더는 그냥 **함수 호출**이에요. 그래서 컴포넌트 함수는 반드시 **순수(pure)** 해야 합니다 — 같은 props/state면 같은 결과, 그리고 렌더 중에 바깥 세상을 건드리지 않기.

```tsx
function Bad() {
  count = count + 1;        // ❌ 외부 변수 변경
  document.title = "hi";    // ❌ 렌더 중 DOM 조작
  fetch("/api/x");          // ❌ 렌더 중 네트워크 호출
  return <p>…</p>;
}
```

이런 "바깥 세상과의 상호작용(side effect)"을 담는 공간이 바로 다음에 배울 `useEffect`이고, 사용자 동작에 대한 반응은 **이벤트 핸들러**에 담습니다.

🐍 렌더 함수는 pure function, effect는 I/O — 함수형 프로그래밍에서 "순수 계산과 부수효과를 분리"하는 그 구도와 같습니다.

### 3-2. `useEffect` = "React 바깥 시스템과의 동기화"

```tsx
useEffect(() => {
  // ① 실행할 작업 (커밋 이후에 실행됨)
  const timer = setInterval(() => console.log("tick"), 1000);

  // ② 정리(cleanup) — 다음 실행 전 & 언마운트 시 호출
  return () => clearInterval(timer);
}, []); // ③ 의존성 배열
```

⚠️ **가장 흔한 오해**: `useEffect`를 "컴포넌트가 마운트될 때 실행되는 초기화 함수(생성자)"로 이해하는 것. 정확한 정의는 **"의존성이 바뀔 때마다, 외부 시스템을 현재 상태와 다시 맞추는 코드"**입니다. 정리 함수는 옵션이 아니라 **짝**이에요.

의존성 배열 3형태:

| 형태 | 실행 시점 | 용도 |
|---|---|---|
| 없음 `useEffect(fn)` | **매 렌더마다** | 거의 안 씀 (무한 루프 위험) |
| `[]` | 마운트 시 1회 | 구독 설정, 최초 로드 |
| `[a, b]` | `a` 또는 `b`가 바뀔 때 | 대부분의 경우 |

### 3-3. ⚠️ StrictMode — effect가 두 번 실행되는 이유

개발 모드에서 아래를 실행해보세요.

```tsx
useEffect(() => {
  console.log("mounted");
  return () => console.log("cleanup");
}, []);
```

콘솔: `mounted` → `cleanup` → `mounted`. **버그가 아닙니다.** `<StrictMode>`가 일부러 마운트→언마운트→재마운트를 시뮬레이션해서 **"정리 함수를 제대로 안 썼구나"를 개발 중에 들키게** 만드는 장치입니다. 프로덕션 빌드에서는 한 번만 실행됩니다.

💡 **판단 기준**: 두 번 실행돼도 문제가 없다면 effect를 올바로 쓴 것입니다. 문제가 생긴다면(중복 구독, 중복 요청 등) 정리 함수가 빠진 것입니다. StrictMode를 끄지 마세요 — 그건 화재경보기를 떼는 것과 같습니다.

### 3-4. ⭐ effect가 **필요 없는** 경우 (로드맵 체크리스트 항목)

초보자가 가장 많이 저지르는 실수는 "상태가 바뀌면 뭔가 해야 하니까 effect"입니다. 대부분은 필요 없습니다.

**① 다른 상태에서 계산되는 값(파생 상태) → 렌더 중에 그냥 계산**

```tsx
// ❌ 불필요한 effect + 불필요한 상태 (렌더가 두 번 돌고, 동기화 버그의 원천)
const [messages, setMessages] = useState<Message[]>([]);
const [count, setCount] = useState(0);
useEffect(() => {
  setCount(messages.length);
}, [messages]);

// ✅ 그냥 계산 (매 렌더마다 최신값이 보장됨)
const count = messages.length;
```

🐍 DataFrame에 파생 컬럼을 미리 저장해두고 동기화 관리하느니, 필요할 때 `df.a * df.b`로 계산하는 게 낫다는 감각과 같습니다.

**② 사용자 동작에 대한 반응 → 이벤트 핸들러에서**

```tsx
// ❌ "메시지가 추가되면 봇 응답을 만들자"를 effect로
useEffect(() => { if (last?.role === "user") reply(); }, [messages]);

// ✅ "전송 버튼을 눌렀을 때"는 핸들러에서
const handleSend = (text: string) => {
  setMessages((prev) => [...prev, userMsg]);
  scheduleReply(text);
};
```

💡 **한 줄 판별법**: *"이 코드는 **무슨 일이 일어나서** 도는가?"*
사용자가 뭔가 **했기 때문**이면 → 이벤트 핸들러.
화면에 **표시됐기 때문**에 외부 시스템(타이머·구독·DOM·브라우저 API)과 맞춰야 한다면 → effect.

오늘 실습에서 effect가 정당하게 필요한 곳은 **자동 스크롤 하나뿐**입니다(스크롤 위치 = React가 관리하지 않는 브라우저 DOM 상태).

### 3-5. `useRef` / `useMemo` / `useCallback` — 감만 잡기

**`useRef`** — 두 가지 용도가 있습니다.

```tsx
// ① DOM 요소 참조 (오늘 자동 스크롤에 사용)
const bottomRef = useRef<HTMLDivElement>(null);
bottomRef.current?.scrollIntoView({ behavior: "smooth" });
<div ref={bottomRef} />

// ② 렌더와 무관한 값 보관 (바꿔도 리렌더 안 일어남)
const timerRef = useRef<number | null>(null);
```

🐍 `useState`가 "바뀌면 화면을 다시 그려야 하는 값"이라면, `useRef`는 **화면과 무관한 인스턴스 변수(`self._timer`)**입니다. ⚠️ 값이 바뀌어도 화면은 절대 갱신되지 않으니, 화면에 보여야 하는 값은 절대 ref에 두지 마세요.

**`useMemo` / `useCallback`** — 비싼 계산이나 함수 참조를 렌더 간에 재사용(캐싱)합니다.

```tsx
const sorted = useMemo(() => heavySort(items), [items]);       // 🐍 lru_cache 감각
const handleSend = useCallback((t: string) => { … }, []);      // 함수 참조 고정
```

💡 **오늘은 쓰지 마세요.** React 19에는 컴파일러가 이 최적화를 상당 부분 자동화하는 방향이고, 무엇보다 **측정 없는 최적화는 코드만 지저분하게** 만듭니다. "이런 게 있고, 성능 문제가 실제로 보일 때 꺼내는 도구"로만 기억해두면 됩니다.

### ✅ 세션 3 체크
- [ ] 렌더(함수 실행)와 커밋(DOM 수정)의 차이를 설명 가능
- [ ] `useEffect`의 정리 함수를 작성해봄
- [ ] StrictMode 이중 실행이 왜 정상인지 설명 가능
- [ ] "effect가 필요 없는 경우"를 예시로 하나 설명 가능 ⭐
- [ ] `useRef`로 DOM 요소에 접근

---

## 4. 세션 4 (오후) — 컴포지션 & 커스텀 훅

### 4-1. 컴포넌트 분리 기준 & `children`

**언제 쪼개나?** ① 같은 UI가 반복될 때 ② 한 파일이 길어져 스크롤이 필요할 때 ③ 관심사가 명확히 다를 때(목록 vs 입력창). 미리 쪼개지 말고, **커지면 쪼개세요.**

`children`은 "태그 사이에 끼워 넣은 것"을 받는 특별한 prop입니다.

```tsx
type PanelProps = {
  title: string;
  children: React.ReactNode; // 어떤 JSX든 받을 수 있는 타입
};

export function Panel({ title, children }: PanelProps) {
  return (
    <section className="rounded-lg border p-4">
      <h3 className="mb-2 font-semibold">{title}</h3>
      {children}
    </section>
  );
}

// 사용
<Panel title="실험 결과">
  <RunCard label="resnet" accuracy={0.93} />
</Panel>
```

🐍 파이썬 컨텍스트 매니저(`with panel("제목"):`)나 데코레이터로 "감싸는" 감각과 비슷합니다. **상속 대신 조합(composition)**이 React의 재사용 방식이에요.

### 4-2. 커스텀 훅 — 상태 로직을 함수로 추출

훅(`useState`, `useEffect`, `useRef`…)을 쓰는 로직을 그냥 함수로 빼면, 그게 커스텀 훅입니다. 규칙은 두 개:

1. **이름이 `use`로 시작**할 것 (ESLint가 이 이름으로 훅임을 판별)
2. **훅은 컴포넌트/커스텀 훅의 최상단에서만** 호출 — 조건문·반복문·중첩 함수 안에서 호출 금지 ⚠️

```tsx
// ❌ 조건부 호출 — React가 훅의 순서로 상태를 식별하기 때문에 깨집니다
if (isOpen) {
  const [x, setX] = useState(0);
}
```

🐍 훅은 "호출 순서"로 자기 상태를 찾아갑니다. 매 렌더마다 같은 순서로 같은 개수가 호출돼야 한다고 기억하세요. (ESLint의 `react-hooks` 플러그인이 위반 시 잡아줍니다 — Vite 템플릿에 이미 켜져 있습니다.)

### 4-3. 실전 커스텀 훅 — `useAutoScroll`

`src/hooks/useAutoScroll.ts`:

```ts
import { useEffect, useRef } from "react";

/** 지정한 값이 바뀔 때마다 반환된 ref가 붙은 요소로 스크롤한다. */
export function useAutoScroll(trigger: number) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [trigger]);

  return bottomRef;
}
```

훅으로 뺐을 때의 이득: `MessageList`는 "스크롤 배선"을 몰라도 되고, 나중에 Next.js로 옮길 때 **이 파일은 그대로 복사**하면 됩니다(순수 React 코드니까).

### ✅ 세션 4 체크
- [ ] `children`을 받는 래퍼 컴포넌트 1개 작성
- [ ] 커스텀 훅 1개 작성 (`use` 접두사)
- [ ] 훅 호출 규칙(최상단에서만)을 설명 가능

---

## 5. 통합 실습 ⭐ — 채팅 UI 껍데기 만들기

> **오늘의 결승선이자, 7일 프로젝트의 시작점입니다.** 여기서 만든 UI가
> Day 5에 Next.js로 이사하고 → Day 6에 진짜 LLM에 연결되고 → Day 7에 RAG를 얻습니다.

### 5-1. `src/types.ts`

```ts
export type Role = "user" | "assistant";

export type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
};
```

🐍 Day 3의 리터럴 유니온(`Literal["user", "assistant"]`)이 그대로 왔습니다. Day 6에서 AI SDK의 메시지 타입으로 자연스럽게 교체될 자리예요.

### 5-2. `src/components/MessageItem.tsx`

```tsx
import type { Message } from "../types";

type MessageItemProps = {
  message: Message;
};

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
          isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
```

💡 `import type { Message }` — Day 3의 `verbatimModuleSyntax` 규칙. 타입만 가져올 땐 `import type`을 쓰세요(Vite 템플릿 기본 설정입니다).

### 5-3. `src/components/MessageList.tsx`

```tsx
import type { Message } from "../types";
import { MessageItem } from "./MessageItem";
import { useAutoScroll } from "../hooks/useAutoScroll";

type MessageListProps = {
  messages: Message[];
  isThinking: boolean;
};

export function MessageList({ messages, isThinking }: MessageListProps) {
  const bottomRef = useAutoScroll(messages.length + (isThinking ? 1 : 0));

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.length === 0 && (
        <p className="pt-10 text-center text-sm text-gray-400">
          메시지를 입력해 대화를 시작하세요.
        </p>
      )}

      {messages.map((m) => (
        <MessageItem key={m.id} message={m} />
      ))}

      {isThinking && <p className="text-sm text-gray-400">…입력 중</p>}

      {/* 스크롤 목적지 앵커 */}
      <div ref={bottomRef} />
    </div>
  );
}
```

### 5-4. `src/components/ChatInput.tsx`

```tsx
import { useState } from "react";

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
      <input
        className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="메시지를 입력하세요"
      />
      <button
        type="submit"
        disabled={!canSend}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        전송
      </button>
    </form>
  );
}
```

💡 `canSend`가 바로 **파생 상태를 렌더 중에 계산**하는 예입니다(세션 3-4). `useState`도 `useEffect`도 필요 없죠.

### 5-5. `src/App.tsx`

```tsx
import { useState } from "react";
import type { Message } from "./types";
import { MessageList } from "./components/MessageList";
import { ChatInput } from "./components/ChatInput";

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = (text: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    // ⭐ Day 6에서 이 setTimeout이 진짜 LLM 스트리밍 호출로 바뀝니다
    setTimeout(() => {
      const reply: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `(가짜 응답) "${text}" 라고 하셨군요.`,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
      setIsThinking(false);
    }, 700);
  };

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col border-x">
      <header className="border-b p-4 font-semibold">Day 4 Chat</header>
      <MessageList messages={messages} isThinking={isThinking} />
      <ChatInput onSend={handleSend} disabled={isThinking} />
    </div>
  );
}

export default App;
```

**동작 확인**: `pnpm dev` → 메시지를 보내면 오른쪽 파란 말풍선이 뜨고, 0.7초 뒤 왼쪽 회색 답장이 오고, 목록이 길어지면 자동으로 아래로 스크롤되면 성공입니다.

💡 `crypto.randomUUID()`는 브라우저 표준 API입니다(localhost/HTTPS에서 동작). 🐍 파이썬 `uuid.uuid4()`에 해당해요.

### 5-6. 오늘 배운 것이 어디에 쓰였는지 점검

| 개념 | 사용된 곳 |
|---|---|
| props 타이핑 | `MessageItemProps`, `ChatInputProps` |
| `useState<T>` | `messages`, `isThinking`, `text` |
| 함수형 업데이트 | `setMessages((prev) => [...prev, m])` |
| 불변 업데이트 | 배열 spread |
| 상태 끌어올리기 | `messages`는 `App`에, `onSend` 콜백으로 전달 |
| 조건부 렌더링 | 빈 목록 안내, `isThinking` 표시 |
| 리스트 + `key` | `messages.map` + `key={m.id}` |
| 파생 상태 | `canSend` |
| `useRef` + `useEffect` | `useAutoScroll` |
| 커스텀 훅 | `useAutoScroll` |

### 🎯 추가 연습 문제 3개

**문제 1.** 헤더에 현재 메시지 개수를 `Day 4 Chat (12)`처럼 표시하기.
> 힌트: `useState`도 `useEffect`도 **쓰지 마세요.** 세션 3-4의 파생 상태 원칙.

**문제 2.** 헤더 오른쪽에 "대화 지우기" 버튼을 추가해, 클릭 시 메시지를 모두 비우기. 메시지가 0개일 땐 버튼을 `disabled` 처리.
> 힌트: `setMessages([])`. 버튼을 `App`에 두면 상태 끌어올리기 없이 끝납니다.

**문제 3.** 입력창을 `<textarea>`로 바꾸고, **Enter = 전송 / Shift+Enter = 줄바꿈**으로 만들기.
> 힌트: `onKeyDown={(e) => { ... }}`에서 `e.key === "Enter" && !e.shiftKey`일 때 `e.preventDefault()` 후 전송.
> ⚠️ **한글 사용자 필수 함정**: 한글은 IME 조합 중에도 Enter 키 이벤트가 발생해서, 조합을 확정하는 Enter에 메시지가 먼저 전송됩니다. `e.nativeEvent.isComposing`이 `true`면 무시하도록 조건을 하나 더 넣으세요. (실무에서 한국어 앱을 만들 때 100% 만나는 버그입니다)

### 최종 검증

```bash
pnpm lint       # 경고 0개
pnpm typecheck  # 타입 에러 0개
pnpm build      # 프로덕션 빌드 성공
```

---

## 6. ✅ Day 4 완료 체크리스트

- [ ] `practice/day4/`에 Vite + React + TS + Tailwind + Prettier 배선 완료
- [ ] JSX 규칙(`className`, Fragment, `{}` 표현식) 체화
- [ ] `map` + `key`로 리스트 렌더링, `key`에 인덱스를 쓰면 안 되는 이유 설명 가능
- [ ] props를 TS `type`으로 정의하고 구조 분해로 수신
- [ ] `useState`로 인터랙션 구현, 상태가 "스냅샷"임을 설명 가능
- [ ] 불변 업데이트(`[...prev, x]`)로 배열 상태 갱신
- [ ] **"effect가 필요 없는 경우"를 하나 설명 가능** ⭐ (로드맵 필수 항목)
- [ ] StrictMode 이중 실행이 정상임을 이해
- [ ] 커스텀 훅 `useAutoScroll` 작성 및 사용
- [ ] 채팅 UI 동작 (전송 → 가짜 응답 → 자동 스크롤)
- [ ] 추가 문제 3개 시도 (특히 3번의 IME 함정)

---

## 7. 자주 나오는 함정 정리 (⚠️)

| 증상 | 원인 | 해결 |
|---|---|---|
| 상태를 바꿨는데 화면이 그대로 | `push`/직접 수정으로 참조가 안 바뀜 | `[...prev, x]` / `{ ...obj, k: v }` |
| `setState` 직후 값이 옛날 값 | 상태는 이번 렌더의 스냅샷 | `set(prev => ...)` 사용, 로그는 다음 렌더에서 확인 |
| 연속 `setCount(count+1)` 2번인데 +1만 됨 | 같은 스냅샷 참조 | 함수형 업데이트 |
| 화면에 뜬금없이 `0`이 보임 | `{arr.length && <X/>}` | `{arr.length > 0 && <X/>}` |
| `class`가 안 먹음 | JSX는 `className` | `className`으로 변경 |
| `Each child should have a unique key` | `map`에 `key` 누락 | 안정적인 고유 ID를 `key`로 |
| 목록 편집 시 입력값이 뒤섞임 | 인덱스를 `key`로 사용 | ID 기반 `key` |
| 버튼이 렌더되자마자 실행됨 | `onClick={fn()}` | `onClick={fn}` 또는 `onClick={() => fn(x)}` |
| 폼 제출 시 페이지가 새로고침됨 | 브라우저 기본 동작 | `e.preventDefault()` |
| effect가 두 번 실행됨 | StrictMode(개발 모드) | 정상. 정리 함수를 제대로 작성 |
| effect 무한 루프 | effect 안 `setState` + 의존성에 매 렌더 새로 만들어지는 객체/함수 | 파생값은 렌더 중 계산, 의존성 재점검 |
| `ref.current`가 `null` | 첫 렌더에는 DOM이 아직 없음 | `ref.current?.` 옵셔널 체이닝 |
| Tailwind 클래스가 무시됨 | `@import "tailwindcss"` 누락 or Vite 플러그인 미등록 | `index.css` / `vite.config.ts` 확인 |
| `Hooks can only be called inside...` | 조건/반복문 안에서 훅 호출 | 컴포넌트 최상단으로 이동 |
| 한글 입력 중 Enter가 메시지를 먼저 보냄 | IME 조합 확정 Enter | `e.nativeEvent.isComposing` 체크 |

---

## 8. 저장소 커밋 & 정리

```bash
cd ../..                      # 저장소 루트로

git status                    # node_modules/ dist/ 가 안 보이는지 확인
# 안 보인다면 .gitignore에 dist/ 추가
git add practice/day4 docs/Day4.md
git commit -m "Day 4: React 기초 + 채팅 UI 껍데기"
git push
```

⚠️ Vite는 빌드 결과를 `dist/`에 만듭니다. `.gitignore`에 `node_modules/`와 함께 `dist/`도 있는지 확인하세요.

---

## 9. Day 5 미리보기

오늘 순수 React를 배웠으니, 내일은 그 위에 **Next.js**를 얹습니다.

1. **App Router 구조** — `page.tsx` / `layout.tsx` / `loading.tsx`. 파일 위치가 곧 URL.
2. ⭐ **서버 컴포넌트 vs 클라이언트 컴포넌트** — 로드맵이 "백엔드 배경이 가장 많이 막히는 지점"이라고 못 박은 곳입니다. 오늘 만든 `ChatInput`은 `useState`를 쓰니 **클라이언트 컴포넌트**여야 하고, 메시지를 DB에서 읽어오는 부분은 **서버 컴포넌트**가 됩니다. 오늘 코드가 그대로 예제가 됩니다.
3. **Route Handlers** — `app/api/chat/route.ts`. Day 6에 LLM이 붙을 자리를 미리 파둡니다.
4. **채팅 UI 이관** — 오늘의 `components/`, `hooks/`, `types.ts`는 **거의 그대로 복사**됩니다. 무엇이 그대로 가고 무엇이 바뀌는지가 내일의 핵심 학습 포인트예요.

💡 오늘 만든 `practice/day4/`는 지우지 마세요. 내일 나란히 열어놓고 비교합니다.

---

### 부록 A — Streamlit/Python ↔ React 치트시트

```
# 사고방식
위젯 조작 → 스크립트 전체 rerun     →  setState → 컴포넌트 함수 재실행 (DOM은 diff만)
st.session_state["count"]           →  const [count, setCount] = useState(0)
st.session_state.count += 1         →  setCount(c => c + 1)
st.text_input("이름")               →  <input value={t} onChange={e => setT(e.target.value)} />
st.button("전송")                   →  <button onClick={handleSend}>전송</button>
@st.cache_data                      →  useMemo (감각상)

# 컴포넌트
def card(title, body): ...          →  function Card({ title, body }: Props) { ... }
card(title="a", body="b")           →  <Card title="a" body="b" />
class Props(TypedDict)              →  type Props = { ... }
@dataclass(frozen=True)             →  props는 읽기 전용

# 렌더링
"".join(f"<li>{x}</li>" for x in l) →  {list.map(x => <li key={x.id}>{x.name}</li>)}
if cond: A() else: B()              →  {cond ? <A /> : <B />}
if cond: A()                        →  {cond && <A />}   ⚠️ cond는 boolean으로
None (아무것도 안 그림)             →  null / undefined / false

# 상태 갱신 (불변)
d2 = {**d, "a": 1}                  →  setObj({ ...obj, a: 1 })
l2 = [*l, x]                        →  setList(prev => [...prev, x])
[v for v in l if v.id != i]         →  list.filter(v => v.id !== i)
self._timer (화면과 무관)           →  useRef
```

### 부록 B — 훅 요약표

| 훅 | 한 줄 정의 | 언제 |
|---|---|---|
| `useState` | 바뀌면 화면을 다시 그려야 하는 값 | 거의 항상 |
| `useEffect` | React 바깥 시스템과의 동기화 | 구독·타이머·DOM·브라우저 API |
| `useRef` | 화면과 무관한 값 / DOM 참조 | 스크롤, 포커스, 타이머 ID |
| `useMemo` | 비싼 계산 결과 캐시 | 성능 문제가 **측정된** 뒤 |
| `useCallback` | 함수 참조 고정 | 위와 동일 |
| 커스텀 훅 | 상태 로직 재사용 단위 | 같은 훅 조합이 두 번 나올 때 |

수고했어요. 오늘 "상태를 바꾸면 화면이 따라온다"는 감각이 손에 붙었다면, 가장 큰 사고 전환은 이미 넘은 겁니다 — Day 5에서 이 UI를 Next.js 위에 올립니다. ⚛️
