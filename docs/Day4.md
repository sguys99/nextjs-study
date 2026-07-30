# Day 4 — React 기초: "상태의 함수로서의 UI"

> **소요 시간**: 약 8시간 (90분 × 4세션). 오늘은 문법보다 **사고 전환**이 핵심이니 서두르지 마세요.
> **선행 조건**: Day 3 완료 (`interface`·제네릭·narrowing, `tsc --noEmit`). Day 0의 "DOM" 개념(§2-3)도 가볍게 복습.
> **오늘의 목표**: 선언형 UI와 훅(hook) 사고를 체화하고, **9일 여정의 최종 산출물이 될 채팅 앱의 첫 삽**을 뜬다.
>
> **태그 범례**: `🐍` Python 대비 · `💡` 팁 · `⚠️` 함정 · `🎯` 배경 · `📖` 설명용(읽기만) · `⌨️` 실습(직접 치기) · `✅` 완성본

---

## 0. 오늘 넘어야 할 산은 "문법"이 아니라 "사고 전환" 하나 (5분)

Day 1~3은 **언어**(JS·비동기·TS)였습니다. 오늘부터는 **UI 라이브러리 React**예요. 로드맵대로 **Next.js의 절반은 React**입니다.

오늘의 전부는 이 한 줄 사고 전환입니다.

> **명령형(옛 방식)**: "버튼이 눌리면 → DOM에서 `<ul>`을 찾아 → `<li>`를 하나 추가해라" (Day 0에서 "DOM 직접 조작은 힘들다"고 했던 그것)
> **선언형(React)**: "화면은 **언제나 `messages` 배열을 그린 결과**다. 나는 `messages`만 바꾼다. 화면은 React가 알아서 맞춘다."

### 🎯 배경 — React는 왜 "선언형"이 됐나

2010년대 초 Facebook은 거대한 웹 UI를 명령형으로 관리하다 지옥을 겪었습니다. "이 데이터가 바뀌면 화면의 어디어디를 직접 고쳐야 하나"를 사람이 일일이 추적하다 버그가 쏟아졌죠. 그래서 발상을 뒤집었습니다:

- **"화면 = 상태(state)의 함수"** — 데이터를 주면 화면이 결정된다. 데이터가 바뀌면 함수를 다시 불러 화면을 새로 만든다.
- 매번 전체를 다시 그리면 느리니, React는 **가상 DOM**(메모리 속 가벼운 복제본)에서 이전과 새 결과를 비교(diff)해 **실제로 바뀐 부분만** 진짜 DOM에 반영합니다.

이게 React의 핵심이고, 오늘 이걸 몸에 새깁니다.

### 🐍 당신을 위한 최고의 비유 — Streamlit

ML 개발자라면 Streamlit(또는 Gradio)을 써봤을 겁니다. React의 멘탈 모델은 **Streamlit과 놀랄 만큼 똑같습니다.**

| Streamlit | React | 설명 |
|---|---|---|
| 위젯 조작 → **스크립트 전체 재실행** | 상태 변경 → **컴포넌트 함수 재실행** | "다시 그린다"가 기본 |
| `st.session_state["count"]` | `const [count, setCount] = useState(0)` | 재실행을 넘어 살아남는 값 |
| `st.session_state.count += 1` | `setCount(count + 1)` | 상태를 바꾸면 화면이 따라옴 |
| 화면 코드를 위에서 아래로 선언 | JSX를 `return` | UI를 "그리는 절차"가 아니라 "모양"으로 기술 |

즉 React 컴포넌트는 이런 Python 함수라고 생각하면 정확합니다:

```python
def chat_view(messages: list[Message]):
    # 이 함수는 messages가 바뀔 때마다 처음부터 다시 호출된다
    return render(messages)
```

⚠️ **딱 하나 다른 점**: Streamlit은 재실행 때 화면 전체를 새로 그리지만, React는 위에서 말한 diff로 **바뀐 DOM만** 갱신합니다. 그래서 입력창 커서가 안 튀고 애니메이션이 안 끊겨요. **"재실행(함수 호출)은 자주, 실제 DOM 수정은 최소로"** — 이게 React가 실전에서 통하는 이유입니다.

### 0-1. 오늘 만들 폴더 구조 (Vite + React + TS)

Day 1~3은 순수 Node였지만, React는 브라우저에서 도니 **Vite**(빠른 개발 서버 + 번들러)로 환경을 만듭니다.

```
practice/day4/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx            ← 진입점
    ├── index.css           ← Tailwind 한 줄
    ├── App.tsx             ← 오늘의 무대
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

### 0-2. 시작 준비 — Vite 프로젝트 만들기

⌨️ 실습 — 저장소 루트에서

```bash
cd practice
pnpm create vite@latest day4 --template react-ts
cd day4
pnpm install
pnpm add tailwindcss @tailwindcss/vite
```

⌨️ 실습 — `vite.config.ts`를 아래로 교체 (Tailwind v4 플러그인 연결)

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

⌨️ 실습 — `src/index.css`를 아래 한 줄로 교체

```css
@import "tailwindcss";
```

⌨️ 실습 — 개발 서버 실행

```bash
pnpm dev
```

→ 터미널에 뜬 `http://localhost:5173`을 브라우저로 엽니다. Vite 기본 화면이 보이면 준비 끝. **이 창을 켜둔 채** 코드를 고치면 화면이 즉시 갱신됩니다(핫 리로드).

💡 `pnpm dev`가 곧 우리의 "실행"입니다. Day 1~3의 `node file.js`처럼 매번 재실행할 필요 없이, **파일을 저장하면 브라우저가 자동 갱신**돼요.

---

## 1. 세션 1 (오전) — 컴포넌트 · JSX

`src/playground/JsxDemo.tsx`에서 실험합니다.

### 1-1. 컴포넌트 = "JSX를 반환하는 함수"

**② 쉬운 설명**: React 컴포넌트는 **대문자로 시작하는 함수**이고, **JSX**(HTML처럼 생긴 것)를 반환합니다.
**③ 🐍**: 위 Streamlit 비유 그대로 — "UI를 반환하는 함수"예요.

⌨️ 실습 — `src/playground/JsxDemo.tsx` 새 파일

```tsx
function JsxDemo() {
  const name = "광명";
  const scores = [88, 92, 70];

  return (
    <div>
      <h1>안녕, {name}!</h1>
      <p>점수 개수: {scores.length}</p>
    </div>
  );
}

export default JsxDemo;
```

⌨️ 실습 — `src/App.tsx`를 아래로 교체해 화면에 띄우기

```tsx
import JsxDemo from "./playground/JsxDemo";

function App() {
  return (
    <div className="p-8">
      <JsxDemo />
    </div>
  );
}

export default App;
```

브라우저에 "안녕, 광명!"이 뜨면 성공입니다.

### 1-2. JSX의 규칙 4가지 (Python 개발자가 자주 걸림)

**① `{ }`로 JS 표현식 삽입**: `{name}`, `{scores.length}`, `{2 + 2}`. 🐍 f-string의 `{}`와 비슷한 감각.
**② `class`가 아니라 `className`**: HTML의 `class`는 JS 예약어라 React는 `className`을 씁니다.
**③ 반드시 하나의 부모로 감싸기**: 여러 요소를 반환하려면 하나의 `<div>`나 빈 태그 `<>...</>`(Fragment)로 감싸야 합니다.
**④ 태그는 닫아야**: `<img />`, `<br />`처럼 self-closing도 슬래시 필수.

📖 설명용 — 위 규칙들

```tsx
// ✅ 표현식 삽입 + className + Fragment
return (
  <>
    <p className="text-red-500">{name}</p>
    <p>{scores.length > 2 ? "많음" : "적음"}</p>
  </>
);
```

### 1-3. 조건부 렌더링 & 리스트 렌더링

**② 쉬운 설명**:
- 조건부: `{조건 && <p>보임</p>}` (조건이 참일 때만), 또는 삼항 `{조건 ? A : B}`
- 리스트: 배열을 `.map`으로 JSX 배열로 변환. **각 항목에 `key` 필수.**
**③ 🐍**: Day 1의 `map`이 여기서 그대로 쓰입니다. 리스트 컴프리헨션으로 위젯을 뿌리던 것과 같아요.

> ⌨️ **미니 실습** — `JsxDemo.tsx`의 `return`을 이렇게 바꿔 보세요
> ```tsx
> return (
>   <div>
>     <h1>점수판</h1>
>     <ul>
>       {scores.map((s, i) => (
>         <li key={i}>{i + 1}번: {s}점 {s >= 90 && "🎉"}</li>
>       ))}
>     </ul>
>   </div>
> );
> ```

⚠️ **`key`는 왜 필요?** React가 diff할 때 "어느 항목이 그대로고 어느 게 바뀌었는지" 식별하는 이름표입니다. 없으면 경고가 뜨고, 리스트가 바뀔 때 버그가 생겨요. **당장은 인덱스 `key={i}`도 되지만, 실무에선 고유 id**(예: 메시지의 `id`)를 씁니다. 오늘 채팅 실습에서 제대로 된 id를 써요.

### ✅ 세션 1 체크
- [ ] 컴포넌트가 화면에 렌더링됨
- [ ] `{ }` 삽입 / `className` / Fragment / `key` 이해
- [ ] `.map`으로 리스트 렌더링

---

## 2. 세션 2 (오전) — props & useState

`src/playground/StateDemo.tsx`에서 실험합니다.

### 2-1. props — 부모가 자식에게 넘기는 값

**① 왜 있나**: 컴포넌트를 재사용하려면, 바깥에서 데이터를 넣어줄 통로가 필요합니다.
**② 쉬운 설명**: props는 **컴포넌트 함수의 인자**입니다. 부모가 속성처럼 넘기고(`<Hello name="광명" />`), 자식은 그걸 받아 씁니다. **읽기 전용**이에요(자식이 못 바꿈).
**③ 🐍 + TS**: 함수 인자에 타입을 붙이듯, props도 `interface`로 타이핑합니다(Day 3 회수). 그리고 **매개변수 자리에서 객체 구조 분해**(Day 1 회수)를 써요.

📖 설명용

```tsx
interface HelloProps {
  name: string;
  emoji?: string;        // 옵셔널 (Day 3의 ?)
}

// 매개변수에서 바로 구조 분해 { name, emoji }
function Hello({ name, emoji = "👋" }: HelloProps) {
  return <p>{emoji} 안녕, {name}!</p>;
}

// 부모에서 사용
// <Hello name="광명" />
// <Hello name="KM" emoji="🎉" />
```

💡 Day 1의 "매개변수 자리 구조 분해", Day 3의 "interface + 옵셔널"이 **여기서 전부 재등장**합니다. 그때 손에 익혀둔 게 지금 값을 합니다.

### 2-2. `useState` — 재실행을 넘어 살아남는 값 ⭐

**① 왜 있나**: 컴포넌트 함수는 계속 재실행됩니다(Streamlit 재실행). 그런데 "클릭 횟수" 같은 값은 재실행돼도 살아남아야 하죠. 그 "살아남는 값"이 상태(state)입니다.
**② 쉬운 설명**: `const [값, 값을바꾸는함수] = useState(초깃값)`. 🐍 `st.session_state`와 정확히 같은 역할.
**③ 규칙**: 상태를 바꿀 땐 **반드시 setter**(`setCount`)를 쓰세요. 변수를 직접 `count = 1`로 바꾸면 React가 모릅니다(화면이 안 바뀜).

⌨️ 실습 — `src/playground/StateDemo.tsx` 새 파일 + `App.tsx`에서 렌더

```tsx
import { useState } from "react";

function StateDemo() {
  const [count, setCount] = useState(0);   // 초깃값 0

  return (
    <div>
      <p>카운트: {count}</p>
      <button
        className="border px-3 py-1 rounded"
        onClick={() => setCount(count + 1)}
      >
        +1
      </button>
    </div>
  );
}

export default StateDemo;
```

버튼을 누르면 숫자가 오릅니다. **버튼 클릭 → `setCount` → 컴포넌트 재실행 → 새 `count`로 화면 갱신**. 이 흐름이 React의 심장입니다.

### 2-3. ⚠️ 스냅샷 모델 — "이번 렌더에서 count는 고정된 사진"

Python 개발자가 가장 놀라는 지점입니다.

📖 설명용 — 왜 이게 2가 아니라 1이 될까?

```tsx
const handleClick = () => {
  setCount(count + 1);
  setCount(count + 1);   // 기대: +2. 실제: +1 !
};
```

**이유**: 이번 렌더에서 `count`는 **바뀌지 않는 스냅샷(사진)**입니다. `count`가 0이면 두 줄 다 `setCount(0 + 1)`이라 결국 1이에요. 다음 렌더가 되어야 `count`가 1로 갱신됩니다.

✅ **해결 — 함수형 업데이트**: "이전 값"이 필요하면 setter에 **함수**를 넘기세요.

```tsx
setCount((prev) => prev + 1);
setCount((prev) => prev + 1);   // 이제 정확히 +2
```

💡 규칙: **이전 상태를 기반으로 바꿀 땐 `setX(prev => ...)`** 형태를 쓰세요. 오늘 채팅에서 메시지를 추가할 때 이 패턴을 씁니다.

### 2-4. ⚠️ 불변 업데이트 — 배열/객체 상태는 "새로 만들어" 교체

**① 왜 중요**: React는 상태가 "**다른 객체로 바뀌었는지**"로 갱신을 판단합니다. 기존 배열을 `push`로 직접 바꾸면 **같은 객체**라 React가 못 알아채요.
**② 규칙**: Day 1의 전개(`[...old, new]`, `{...old, key: v}`)로 **새 배열/객체를 만들어** 교체합니다.

📖 설명용

```tsx
const [items, setItems] = useState<string[]>([]);

// ❌ 직접 변경 → 화면 안 바뀜
// items.push("새 항목");

// ✅ 새 배열로 교체
setItems((prev) => [...prev, "새 항목"]);
```

💡 Day 1에서 "객체 전개로 원본 안 건드리고 새 걸 만든다(불변성)"를 강조했죠? **바로 이걸 위한 준비였습니다.** `useState<string[]>`의 제네릭(Day 3)도 여기서 등장하고요.

### ✅ 세션 2 연습문제

⌨️ 문제 — `StateDemo.tsx`
1. (보통) 텍스트 입력창(제어 컴포넌트)을 만들어라. `useState<string>("")`로 입력값을 관리하고, 아래 문단에 실시간으로 그 값을 보여준다.

✅ 정답

```tsx
function StateDemo() {
  const [text, setText] = useState("");
  return (
    <div>
      <input
        className="border px-2 py-1"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <p>입력: {text}</p>
    </div>
  );
}
```

💡 이것이 **제어 컴포넌트**입니다: 입력창의 값을 state가 "제어"해요. `value`(보여줄 값) + `onChange`(바뀌면 state 갱신)가 한 쌍. 오늘 `ChatInput`의 뼈대입니다.

---

## 3. 세션 3 (오후) — useEffect & 렌더링

`src/playground/EffectDemo.tsx`에서 실험합니다.

### 3-1. `useEffect` — "렌더링 이후에 할 부수효과"

**① 왜 있나**: 데이터 가져오기(fetch), 타이머, 구독처럼 **화면을 그리는 것과 별개인 바깥 세계와의 상호작용**을 담는 곳.
**② 쉬운 설명**: `useEffect(() => { ... }, [의존성])`. 두 번째 인자(의존성 배열)의 값이 바뀔 때마다 안의 함수가 실행됩니다.
**③ 의존성 배열 3가지 형태**:
- `[]` (빈 배열): **처음 한 번만** 실행 (🐍 `__init__` 느낌)
- `[x]`: `x`가 바뀔 때마다
- 생략: 매 렌더마다 (거의 안 씀, 위험)

📖 설명용

```tsx
useEffect(() => {
  console.log("count가 바뀜:", count);
}, [count]);   // count가 바뀔 때마다 실행
```

### 3-2. 클린업(cleanup) — "뒷정리 함수"

**① 왜 있나**: 타이머·구독처럼 "켠 걸 꺼야" 하는 것들. effect가 반환한 함수가 **다음 실행 전 / 컴포넌트가 사라질 때** 호출됩니다.

⌨️ 실습 — `src/playground/EffectDemo.tsx` 새 파일 + `App.tsx`에서 렌더

```tsx
import { useState, useEffect } from "react";

function EffectDemo() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((prev) => prev + 1);   // 함수형 업데이트!
    }, 1000);

    return () => clearInterval(id);      // 클린업: 타이머 정리
  }, []);                                // 처음 한 번만 타이머 시작

  return <p>경과: {seconds}초</p>;
}

export default EffectDemo;
```

⚠️ **클린업을 빼먹으면**: 컴포넌트가 다시 마운트될 때 타이머가 쌓여 숫자가 2씩, 3씩 뛰는 버그가 생깁니다. **"켠 건 반드시 끈다"**가 규칙이에요.
💡 `setSeconds((prev) => prev + 1)`에서 **함수형 업데이트**를 쓴 이유: effect는 처음 한 번만 도는데, 그 안의 `seconds`는 0으로 고정된 스냅샷이라 `seconds + 1`을 쓰면 계속 1만 됩니다. `prev`를 쓰면 항상 최신값 기반이에요. (§2-3의 스냅샷 함정이 여기서 재등장!)

### 3-3. ⭐ 언제 useEffect가 "필요 없는가" (매우 중요)

초보가 useEffect를 남발합니다. **대부분의 경우 필요 없어요.**

- ❌ **렌더링용 파생 값 계산에 effect를 쓰지 마세요.** 예: "메시지 개수"는 effect+state가 아니라 **렌더 중에 그냥 계산**하면 됩니다.
  ```tsx
  // ❌ 불필요
  // const [count, setCount] = useState(0);
  // useEffect(() => setCount(messages.length), [messages]);
  // ✅ 그냥 계산
  const count = messages.length;
  ```
- ❌ **이벤트로 인한 동작을 effect에 넣지 마세요.** "버튼 누르면 저장"은 **클릭 핸들러 안**에 넣습니다.
- ✅ effect가 진짜 필요한 곳: **외부 시스템 동기화** — fetch, 타이머, 브라우저 API(스크롤 등), 구독.

💡 판단 기준: **"이게 사용자 이벤트 때문인가?"** → 그럼 핸들러. **"화면에서 계산 가능한가?"** → 그럼 그냥 계산. **"바깥 세계와 동기화인가?"** → 그럼 effect.

### 3-4. `useRef` / `useMemo` / `useCallback` — 감만 잡기

지금은 **개념만**, 채팅 실습에서 `useRef`만 실제로 씁니다.

- **`useRef`**: 재실행돼도 살아남지만 **바뀌어도 재렌더를 일으키지 않는** 상자. 주로 **DOM 요소를 가리킬 때** 씁니다(예: 스크롤할 요소). 🐍 "화면과 무관한 인스턴스 변수" 느낌.
- **`useMemo`**: 비싼 계산 결과를 기억(캐시). 🐍 `lru_cache` 느낌.
- **`useCallback`**: 함수를 기억(재생성 방지).

⚠️ **성급한 최적화 금지**: `useMemo`/`useCallback`은 **성능 문제를 측정한 뒤에만** 쓰세요. 처음부터 바르면 코드만 복잡해집니다. (로드맵 방침)

---

## 4. 세션 4 (오후) — 컴포지션 · 커스텀 훅 → 채팅 UI ⭐

이제 조각들을 합쳐 **채팅 UI 껍데기**를 만듭니다. 백엔드는 아직 없고(Day 6에서 붙임), "메시지를 입력하면 화면에 쌓이는" 것까지 완성해요.

### 4-1. 데이터 모양 정의

⌨️ 실습 — `src/types.ts` 새 파일

```ts
export interface Message {
  id: string;
  role: "user" | "assistant";   // 리터럴 유니온 (Day 3)
  text: string;
}
```

### 4-2. 메시지 하나 — `MessageItem`

⌨️ 실습 — `src/components/MessageItem.tsx`

```tsx
import type { Message } from "../types";

interface Props {
  message: Message;
}

function MessageItem({ message }: Props) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "text-right" : "text-left"}>
      <span
        className={
          "inline-block rounded-lg px-3 py-2 " +
          (isUser ? "bg-blue-500 text-white" : "bg-gray-200 text-black")
        }
      >
        {message.text}
      </span>
    </div>
  );
}

export default MessageItem;
```

### 4-3. 메시지 목록 — `MessageList`

⌨️ 실습 — `src/components/MessageList.tsx`

```tsx
import type { Message } from "../types";
import MessageItem from "./MessageItem";

interface Props {
  messages: Message[];
}

function MessageList({ messages }: Props) {
  return (
    <div className="flex flex-col gap-2 p-4 h-96 overflow-y-auto border rounded">
      {messages.map((m) => (
        <MessageItem key={m.id} message={m} />   {/* 고유 id를 key로 */}
      ))}
    </div>
  );
}

export default MessageList;
```

### 4-4. 입력창 — `ChatInput` (⚠️ 한글 입력 버그 포함)

⌨️ 실습 — `src/components/ChatInput.tsx`

```tsx
import { useState } from "react";

interface Props {
  onSend: (text: string) => void;   // 부모에게 "이 텍스트 보내줘"라고 알림
}

function ChatInput({ onSend }: Props) {
  const [text, setText] = useState("");

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;      // 빈 입력 무시
    onSend(trimmed);
    setText("");               // 전송 후 입력창 비우기
  };

  return (
    <div className="flex gap-2 mt-2">
      <input
        className="flex-1 border rounded px-3 py-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          // ⚠️ 한글 IME 조합 중 Enter는 무시해야 함 (아래 설명)
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            submit();
          }
        }}
        placeholder="메시지를 입력하세요"
      />
      <button className="border rounded px-4 py-2" onClick={submit}>
        전송
      </button>
    </div>
  );
}

export default ChatInput;
```

⚠️⚠️ **한글 IME + Enter 버그 (꼭 이해)**: 한글은 자음·모음을 **조합**해 글자를 만듭니다("ㅎ"+"ㅏ"+"ㄴ" → "한"). 이 조합을 확정하려고 Enter를 누르면, 그 Enter가 **전송으로 오작동**해 마지막 글자가 잘리거나 두 번 전송됩니다. `e.nativeEvent.isComposing`이 **"지금 조합 중인가?"**를 알려주므로, 조합 중이면(`true`) Enter를 무시합니다. **한국어 앱에서 필수 처리**예요. (영어만 쓰면 안 겪어서 놓치기 쉬움)

### 4-5. 커스텀 훅 — `useAutoScroll`

**① 왜 있나**: 메시지가 쌓이면 자동으로 맨 아래로 스크롤되어야 합니다. 이 "상태 관련 로직"을 **커스텀 훅**으로 뽑아 재사용해요.
**② 쉬운 설명**: 커스텀 훅은 **`use`로 시작하는 함수**로, 안에서 `useState`·`useEffect`·`useRef`를 조합합니다.

⌨️ 실습 — `src/hooks/useAutoScroll.ts`

```ts
import { useEffect, useRef } from "react";

// dep가 바뀔 때마다 ref가 가리키는 요소를 맨 아래로 스크롤
export function useAutoScroll(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [dep]);

  return ref;   // 이 ref를 "맨 아래 표시용 빈 div"에 붙임
}
```

💡 여기서 `useRef`(DOM 가리키기) + `useEffect`(렌더 후 스크롤) + `?.`(Day 3 옵셔널 체이닝)이 전부 합쳐집니다.

### 4-6. 전체 조립 — `App.tsx`

⌨️ 실습 — `src/App.tsx`를 아래로 교체

```tsx
import { useState } from "react";
import type { Message } from "./types";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import { useAutoScroll } from "./hooks/useAutoScroll";

function App() {
  const [messages, setMessages] = useState<Message[]>([]);   // 제네릭!
  const bottomRef = useAutoScroll(messages);                 // 메시지 변할 때 스크롤

  const handleSend = (text: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text,
    };
    // 불변 업데이트 + 함수형 업데이트 (Day 1 + §2)
    setMessages((prev) => [...prev, userMsg]);

    // (가짜) 봇 응답 — Day 6에서 진짜 LLM으로 교체
    const botMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: `"${text}" 라고 하셨네요! (아직 진짜 AI는 아니에요)`,
    };
    setMessages((prev) => [...prev, botMsg]);
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-xl font-bold mb-4">내 채팅 앱</h1>
      <MessageList messages={messages} />
      <div ref={bottomRef} />       {/* 스크롤 목표 지점 */}
      <ChatInput onSend={handleSend} />
    </div>
  );
}

export default App;
```

⌨️ 실행 — 브라우저에서 확인

```bash
pnpm dev
```

메시지를 입력하고 Enter/전송 → 내 메시지와 가짜 봇 응답이 쌓이고, 자동 스크롤되면 **오늘의 목표 달성**입니다. 🎉

💡 오늘 배운 게 전부 여기 모였어요: props로 데이터 전달, `useState<Message[]>`(제네릭) + 불변/함수형 업데이트, `key`에 고유 id, `useEffect`+`useRef` 커스텀 훅, 리터럴 유니온 role, 그리고 한글 IME 처리. **이 앱을 Day 5에서 Next.js로 옮기고, Day 6에서 진짜 AI를 붙입니다.**

---

## 5. 디버깅 실습 — "왜 화면이 안 바뀌지?"

⌨️ 실습 — `handleSend`를 잠깐 아래처럼 바꿔서 무슨 일이 생기는지 보세요 (확인 후 되돌리기)

```tsx
const handleSend = (text: string) => {
  const userMsg: Message = { id: crypto.randomUUID(), role: "user", text };
  messages.push(userMsg);      // ❌ 직접 push
  setMessages(messages);       // ❌ 같은 배열을 그대로 전달
};
```

메시지를 보내도 화면이 안 바뀌거나 이상하게 동작합니다. **왜일까요?**

<details><summary>정답 보기</summary>

`messages.push(...)`는 **기존 배열을 직접 변경**하고, `setMessages(messages)`는 **같은 배열 참조**를 넘깁니다. React는 "상태가 다른 객체로 바뀌었는지"로 갱신을 판단하는데, 참조가 그대로라 "안 바뀌었다"고 여겨 재렌더를 건너뜁니다(§2-4의 불변성 규칙).

✅ 수정: 새 배열로 교체
```tsx
setMessages((prev) => [...prev, userMsg]);
```

교훈: **상태는 절대 직접 변경하지 말고, 항상 새 것으로 교체**. Day 1의 불변성이 React에서 왜 그렇게 강조됐는지가 여기서 드러납니다.
</details>

---

## 6. 🎯 React 에러/경고 읽는 법

React 에러는 브라우저 **콘솔(DevTools)**에 뜹니다. `F12`로 DevTools를 열어 Console 탭을 보세요.

| 메시지 | 뜻 | 해결 |
|--------|-----|------|
| `Each child in a list should have a unique "key" prop` | 리스트에 `key` 누락 | `.map`에 `key={고유값}` |
| `Cannot update a component while rendering a different component` | 렌더 중에 setState 호출 | setState는 이벤트/effect 안에서 |
| `Rendered more hooks than during the previous render` | 훅을 조건문/루프 안에서 호출 | 훅은 **항상 함수 최상단**에서만 |
| `Objects are not valid as a React child` | 객체를 JSX에 직접 넣음 | 문자열/숫자로 변환해 넣기 |

💡 **훅의 절대 규칙**: `useState`/`useEffect` 등은 **컴포넌트 최상단에서, 항상 같은 순서로** 호출해야 합니다. `if` 안이나 `for` 안에서 호출하면 안 돼요(위 세 번째 에러).

---

## 7. ✅ Day 4 최종 체크리스트

- [ ] "화면 = 상태의 함수" 사고를 Streamlit 비유로 설명 가능
- [ ] JSX 규칙(`{}`, `className`, Fragment, `key`)과 조건부/리스트 렌더링
- [ ] props를 `interface`로 타이핑 + 매개변수 구조 분해
- [ ] `useState` + **스냅샷 함정**(함수형 업데이트 `setX(prev=>...)`)
- [ ] **불변 업데이트**(`[...prev, x]`)의 이유 설명 가능
- [ ] `useEffect` 의존성 배열 3형태 + 클린업, "effect가 불필요한 경우" 1개 설명
- [ ] `useRef`가 무엇을 위한 것인지 안다
- [ ] 커스텀 훅(`useAutoScroll`) 작성
- [ ] 채팅 UI 동작 (입력 → 메시지 누적 → 자동 스크롤 → 한글 Enter 정상)
- [ ] 디버깅 실습에서 직접 변경 버그를 불변 업데이트로 고침

---

## 8. git 커밋

⌨️ 실습 — 저장소 루트에서

```bash
git add .
git commit -m "Day 4: React 기초(JSX·props·useState·useEffect·커스텀훅) + 채팅 UI 껍데기"
```

---

## 9. Day 5 미리보기

내일은 **Next.js**입니다. 오늘 만든 채팅 UI를 Next.js로 옮겨요.

- 왜 React 위에 또 프레임워크가 필요한가 (라우팅·서버·번들링)
- ⭐ **서버 컴포넌트 vs 클라이언트 컴포넌트** — 백엔드 배경이 가장 헷갈리는 지점 (시간 넉넉히)
- 파일 기반 라우팅, `app/api/.../route.ts`(Day 6 채팅 백엔드가 붙을 곳)
- shadcn/ui 도입 (Day 4에서 미룬 것 — Next.js에서 설치가 더 매끄러움)

💡 시작할 때 로드맵을 붙이고 **"Day 5 상세 자료 만들어줘"**라고 요청하세요.

---

## 부록 — Streamlit ↔ React 치트시트

| 개념 | 🐍 Streamlit | 🟨 React |
|------|--------------|----------|
| 화면 정의 | 스크립트 위→아래 | 컴포넌트가 JSX `return` |
| 재실행 트리거 | 위젯 조작 | `setState` 호출 |
| 살아남는 값 | `st.session_state.x` | `const [x, setX] = useState()` |
| 값 갱신 | `st.session_state.x = v` | `setX(v)` (직접 변경 ❌) |
| 이전값 기반 갱신 | `st.session_state.x += 1` | `setX(prev => prev + 1)` |
| 리스트 뿌리기 | `for x in xs: st.write(x)` | `{xs.map(x => <Item key=.../>)}` |
| 조건부 표시 | `if cond: st.write(...)` | `{cond && <div/>}` |
| 재사용 컴포넌트 | 함수 + 인자 | 컴포넌트 + props |
| 부수효과(fetch 등) | 스크립트 흐름 안 | `useEffect(() => {...}, [dep])` |

React의 벽을 넘었습니다. 이제 이걸 진짜 웹 프레임워크(Next.js) 위에 올립니다. 🟨
