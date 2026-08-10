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
- 매번 전체를 다시 그리면 느립니다. 그래서 React는 **가상 DOM**(메모리 속 가벼운 복제본)에서 이전 결과와 새 결과를 비교(diff)해 **실제로 바뀐 부분만** 진짜 DOM에 반영해요.

이게 React의 핵심입니다. 오늘은 이걸 몸에 새겨요.

### 🐍 당신을 위한 최고의 비유 — Streamlit

ML 개발자라면 Streamlit(또는 Gradio)을 써봤을 겁니다. React의 멘탈 모델은 **Streamlit과 놀랄 만큼 똑같습니다.**

| Streamlit | React | 설명 |
|---|---|---|
| 위젯 조작 → **스크립트 전체 재실행** | 상태 변경 → **컴포넌트 함수 재실행** | "다시 그린다"가 기본 |
| `st.session_state["count"]` | `const [count, setCount] = useState(0)` | 재실행을 넘어 살아남는 값 |
| `st.session_state.count += 1` | `setCount(count + 1)` | 상태를 바꾸면 화면이 따라옴 |
| 화면 코드를 위에서 아래로 선언 | JSX를 `return` | UI를 "그리는 절차"가 아니라 "모양"으로 기술 |

React 컴포넌트는 이런 Python 함수라고 생각하면 정확합니다:

```python
def chat_view(messages: list[Message]):
    # 이 함수는 messages가 바뀔 때마다 처음부터 다시 호출된다
    return render(messages)
```

⚠️ **딱 하나 다른 점**: Streamlit은 재실행 때 화면 전체를 새로 그립니다. React는 위에서 말한 diff로 **바뀐 DOM만** 갱신하고요. 그래서 입력창 커서가 안 튀고 애니메이션이 안 끊겨요. **"재실행(함수 호출)은 자주, 실제 DOM 수정은 최소로"** — 이게 React가 실전에서 통하는 이유입니다.

### 🎯 배경 — Vite: React를 브라우저에서 굴려주는 도구

**① 왜 있나**: Day 1~3은 `node file.js` 한 줄이면 끝났습니다. 그런데 React 코드는 **브라우저**에서 돌아야 하고, 브라우저는 우리가 쓸 코드를 그대로 못 읽어요. (a) `.tsx` 파일도 JSX(`<h1>{name}</h1>`)도 모르고, (b) `import`로 잘게 쪼갠 파일 수백 개를 하나씩 받으면 느리고, (c) 코드 고칠 때마다 이 변환을 손으로 돌릴 수도 없죠.

**② 쉬운 설명**: 이 세 가지를 대신 해주는 도구가 **Vite**(프랑스어로 "빠르다", 비트)입니다. ⭐ **Vite는 React의 일부가 아니라 완전히 별개의 도구**예요. React는 "화면 그리는 라이브러리"일 뿐이고, 그 코드를 브라우저가 아는 형태로 **번역(transpile)** 하고 **하나로 묶어(bundle)** 서버에 띄워주는 뒷바라지가 Vite의 일입니다. JS 세계에서는 이런 도구를 **빌드 도구(build tool)** 또는 **번들러(bundler)** 라고 부릅니다.

**③ 🐍 Python이었다면**: Python은 인터프리터를 내가 골라 깔면 `python app.py`로 끝입니다. 웹은 다릅니다 — 실행 환경이 **사용자의 브라우저**라서 내가 못 고쳐요. 그래서 "브라우저가 이미 아는 형태로 미리 번역해두기"가 강제됩니다. 굳이 비유하면 Vite는 `uvicorn --reload`(저장하면 자동 반영되는 개발 서버) + 배포용 빌드 도구를 하나로 합친 물건입니다.

**④ 📖 Vite의 두 얼굴** — 명령 두 개가 전부입니다.

| 명령 | 언제 | 하는 일 |
|---|---|---|
| `pnpm dev` | 개발 중 | 로컬 서버(`localhost:5173`)를 띄우고, 파일을 저장하면 브라우저를 즉시 갱신(**핫 리로드**) |
| `pnpm build` | 배포할 때 | 전부 번역·압축해 `dist/` 폴더에 정적 파일로 출력 |

**Day 4에서는 `pnpm dev`만 씁니다.** `build`는 배포를 다루는 Day 10에서 만나요.

**🎯 어쩌다 표준이 됐나**: 원래 이 자리는 webpack(2012~)이 지켰는데, 프로젝트가 커지면 개발 서버 시작에만 수십 초가 걸렸습니다. 2020년 Vue를 만든 Evan You가 "요즘 브라우저는 `import`를 이미 이해하는데(ESM), 왜 매번 전부 묶어서 주지?"라는 발상으로 Vite를 내놨어요. 개발 중에는 브라우저가 **요청한 파일만** 그때그때 변환해주니 시작이 거의 즉각적입니다. 지금은 React 앱을 새로 만들 때의 사실상 표준이고, 예전 방식인 `create-react-app`은 공식 폐기됐습니다.

⚠️ **그런데 Day 5부터는 Vite를 안 씁니다.** Next.js가 똑같은 역할(번역·번들링·개발 서버)을 **Turbopack**이라는 자체 도구로 내장하고 있거든요. 그래서 Vite는 "React만 순수하게 배우기 위한 Day 4 전용 무대"입니다. 포트도 달라요 — **Vite는 5173, Next.js는 3000**.

### 0-1. 오늘 만들 폴더 구조 (Vite + React + TS)

Day 1~3은 순수 Node였지만 React는 브라우저에서 돕니다. 그래서 위에서 본 **Vite**로 무대를 만듭니다.

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

#### ⚠️ 첫 명령에서 질문이 쏟아집니다 — 뭘 고를까

`pnpm create vite`는 대화형이라 몇 가지를 물어봅니다(Vite 버전에 따라 개수가 달라요). `↑`/`↓`로 옮기고 `Enter`로 확정합니다.

| 질문 | 고를 것 | 왜 |
|---|---|---|
| `Which linter to use?` | **ESLint** | Day 5의 Next.js도 ESLint를 씁니다([Day5.md §0-2](Day5.md#L90)). 도구를 하나로 통일 |
| `Which formatter to use?` | **Prettier** | Day 1에서 이미 쓴 그 도구입니다 |
| 그 외(실험 기능 등) | **기본값 그대로 Enter** | 학습에 영향 없음 |

**린터(linter)가 뭔가**: 코드를 **실행하지 않고** 미리 훑어서 "이건 문제 있어 보인다"고 알려주는 검사기입니다. 안 쓴 변수, 훅 규칙 위반(§6에 나올 "훅을 `if` 안에서 호출") 같은 걸 저장하는 순간 빨간 줄로 잡아줘요.
🐍 **Python이면** `ruff`·`flake8`·`pylint`가 하던 그 역할입니다. 타입 검사(`tsc`, mypy)와는 달라요 — 린터는 타입이 아니라 **"나쁜 습관·버그 냄새"** 를 봅니다. 참고로 **ESLint = `flake8`** 포지션(오래된 표준, 자료 많음), **Oxlint = `ruff`** 포지션(Rust로 짠 초고속 후발주자, 아직 자료 적음)이라 지금 단계에선 ESLint가 낫습니다.

#### 💡 `create` / `install` / `add` — 이름이 비슷한데 하는 일이 전혀 다릅니다

| 명령 | 하는 일 | 언제 | 🐍 Python |
|---|---|---|---|
| `pnpm create vite@latest day4` | **폴더와 파일을 새로 만든다** (생성기를 잠깐 빌려와 실행) | 프로젝트당 딱 한 번 | `uvx cookiecutter <템플릿>` |
| `pnpm install` | `package.json`에 적힌 패키지를 **다운로드**한다 | clone 직후, `package.json`이 바뀔 때마다 | `uv sync` |
| `pnpm add tailwindcss` | **새 패키지를 목록에 추가 + 다운로드** | 새 라이브러리가 필요할 때 | `uv add` / `pip install` |

**왜 `create` 다음에 `install`을 또 치나**: 생성기는 **파일만 뿌리고 다운로드는 안 하기** 때문입니다. `package.json`에는 "react 19가 필요해요"라는 **목록**만 적혀 있고(몇 KB), 실제 react 코드는 `pnpm install`이 `node_modules/`로 내려받습니다(수백 MB).

```
package.json   ← "react가 필요해요" (목록. git에 커밋 O)
     ↓ pnpm install
node_modules/  ← 진짜 react 코드 (git에 커밋 X)
```

이게 Day 0 §4-4의 "`node_modules`는 커밋 금지, 남은 `pnpm install`로 복원"과 정확히 같은 이야기예요. 🐍 `.venv`는 커밋 안 하고 `uv sync`로 되살리는 것과 동일합니다.
💡 생성기가 마지막에 "지금 설치할까요?"를 물어보고 Yes를 눌렀다면 `pnpm install`은 이미 끝난 상태입니다. **다시 쳐도 "이미 최신"이라고만 뜨고 아무 일도 안 일어나니 그냥 쳐도 안전**해요.

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

#### 🎯 배경 — Tailwind CSS: "클래스 이름 짓기"를 없앤 꾸밈 도구

**① 왜 있나**: Day 0에서 **웹 = HTML(구조) + CSS(꾸밈) + JS(동작)** 이라고 했죠. 그 "꾸밈" 담당이 CSS인데, 전통 방식은 이렇게 갑니다 — 별도 `.css` 파일을 만들고 → `.chat-bubble-user`처럼 **이름을 짓고** → HTML에서 그 이름을 부릅니다. 문제는 이 **이름 짓기**예요. 파일이 커지면 이름이 겹치고, 어디서 정의됐는지 못 찾고, 지우면 어디가 깨질지 몰라 아무도 못 지웁니다.

**② 쉬운 설명**: Tailwind는 **"하는 일이 곧 이름"인 초미세 클래스를 미리 다 만들어 둔 것**입니다. `p-8`은 "안쪽 여백(padding) 8단위", `flex`는 "가로로 배치", `rounded`는 "모서리 둥글게". 이름을 지을 일도, `.css` 파일을 만들 일도 없습니다. **HTML 태그의 `className`에 필요한 걸 나열하면 끝**이에요.

📖 설명용 — 같은 결과, 두 방식

```html
<!-- 전통 CSS: 이름을 짓고, 별도 파일에 정의하고, 연결 -->
<button class="send-button">전송</button>
<!-- style.css 에서 → .send-button { padding: 8px 16px; border: 1px solid; border-radius: 6px; } -->

<!-- Tailwind: 이름 없이 하는 일을 그대로 나열 -->
<button class="px-4 py-2 border rounded">전송</button>
```

**③ 🐍 Python이었다면**: 안타깝게도 **직접 대응이 없습니다**(Day 0 표에서도 CSS는 "직접 대응 없음"이었죠). 굳이 다리를 놓자면 matplotlib에서 축·여백·색을 매번 손으로 지정하다가 `plt.style.use("ggplot")` 같은 **미리 정해진 프리셋**으로 갈아타는 느낌입니다. 하지만 비유 없이 이렇게만 기억해도 충분해요 — **Tailwind = 남이 미리 만들어 둔 스타일 부품 카탈로그. 나는 부품 번호(`p-8`, `flex`)만 부른다.**

**📖 오늘 실습에 나오는 클래스만 미리 읽어두기** (외우지 마세요. "아, 이게 그거구나" 정도면 충분)

| 클래스 | 뜻 | 클래스 | 뜻 |
|---|---|---|---|
| `p-8` `px-3` `py-2` | 안쪽 여백(전체 / 좌우 / 위아래) | `mt-2` `mb-4` | 바깥쪽 위·아래 간격 |
| `flex` `flex-col` | 가로 배치 / 세로 배치 | `gap-2` | 자식들 사이 간격 |
| `border` `rounded` | 테두리 / 모서리 둥글게 | `max-w-xl` `mx-auto` | 최대 너비 / 가로 가운데 정렬 |
| `text-xl` `font-bold` | 글자 크게 / 굵게 | `text-right` `text-left` | 글자 정렬 |
| `bg-blue-500` `text-white` | 배경색 / 글자색 (숫자 = 진하기) | `h-96` `overflow-y-auto` | 높이 고정 / 넘치면 스크롤 |

💡 숫자는 대체로 **4px 단위**입니다(`p-2` = 8px, `p-8` = 32px). 색은 `색-숫자` 형태로 `50`(연함) ~ `950`(진함)이고요. 규칙이 이것뿐이라 몇 시간이면 눈에 익습니다.

**🎯 어쩌다 표준이 됐나**: 2017년 Adam Wathan이 "CSS에서 제일 어려운 건 이름 짓기다. 그럼 이름을 짓지 말자"는 발상으로 내놨습니다. 처음엔 "HTML이 클래스로 도배돼 지저분하다"는 비판을 크게 받았지만, **"이 스타일이 어디에 영향을 주는지 그 태그만 보면 안다"** 는 장점이 압도해 지금은 사실상 표준이 됐어요. 우리가 Day 5에서 쓸 **shadcn/ui도 Tailwind 위에 만들어져** 있습니다.

⚠️ **함정 1 — `className`이 길어지는 건 정상**: `className="flex flex-col gap-2 p-4 h-96 overflow-y-auto border rounded"` 같은 게 나와도 잘못된 게 아닙니다. 원래 그렇게 씁니다.
⚠️ **함정 2 — 클래스 이름을 문자열로 조립하면 안 됩니다**: Tailwind는 빌드할 때 소스 코드를 **글자 그대로 훑어서** 쓰인 클래스만 만들어 냅니다. 그래서 `` className={`bg-${color}-500`} `` 처럼 쪼개 쓰면 **찾지 못해 스타일이 통째로 안 먹습니다.** 반드시 **완성된 클래스명 전체**를 조건부로 고르세요 — §4-2 `MessageItem`이 `isUser ? "bg-blue-500 text-white" : "bg-gray-200 text-black"` 식으로 쓴 이유가 이겁니다.
💡 VS Code 확장 **Tailwind CSS IntelliSense**를 깔면 클래스 자동완성과 "이게 실제로 무슨 CSS인지" 미리보기가 떠서 훨씬 편합니다. 지금 깔아두세요.
💡 방금 친 `@import "tailwindcss";` 한 줄이 이 전부를 켜는 스위치입니다. **Tailwind v4부터는 설정 파일(`tailwind.config.js`)이 필요 없어요** — 예전 자료에 그 파일이 나오면 v3 시절 이야기입니다.

⌨️ 실습 — 개발 서버 실행

```bash
pnpm dev
```

→ 터미널에 뜬 `http://localhost:5173`을 브라우저로 엽니다. Vite 기본 화면이 보이면 준비 끝. **이 창을 켜둔 채** 코드를 고치면 화면이 즉시 갱신됩니다(핫 리로드).

💡 `pnpm dev`가 곧 우리의 실행입니다. Day 1~3의 `node file.js`처럼 매번 재실행할 필요 없어요. **파일을 저장하면 브라우저가 자동으로 갱신**됩니다.
💡 이 서버를 띄우고 있는 주체가 바로 **Vite**입니다. 터미널에서 `Ctrl+C`로 끄면 브라우저 화면도 같이 죽어요(그래서 실습 내내 이 터미널은 켜둔 채, 명령은 **새 터미널 탭**에서 칩니다).

---

## 1. 세션 1 (오전) — 컴포넌트 · JSX

`src/playground/JsxDemo.tsx`에서 실험합니다.

### 1-1. 컴포넌트 = "JSX를 반환하는 함수"

**② 쉬운 설명**: React 컴포넌트는 **대문자로 시작하는 함수**이고 **JSX**(HTML처럼 생긴 것)를 반환합니다.
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

### 1-2. JSX의 규칙 5가지 (Python 개발자가 자주 걸림)

**① `{ }`로 JS 표현식 삽입**: `{name}`, `{scores.length}`, `{2 + 2}`. 🐍 f-string의 `{}`와 비슷한 감각.
**② `class`가 아니라 `className`**: HTML의 `class`는 JS 예약어라 React는 `className`을 씁니다.
**③ 반드시 하나의 부모로 감싸기**: 여러 요소를 반환하려면 하나의 `<div>`나 빈 태그 `<>...</>`(Fragment)로 감싸야 합니다.
**④ 태그는 닫아야**: `<img />`, `<br />`처럼 self-closing도 슬래시 필수.
**⑤ 주석은 `{/* */}`**: 태그와 태그 **사이**는 "글자를 쓰는 자리"라서, 거기에 `// 메모`라고 쓰면 주석이 아니라 **화면에 그대로 찍히는 글자**가 됩니다.

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

⚠️ **⑤번은 반드시 한 번 당해봅니다** — 태그 사이에 `//` 주석을 달면 이렇게 됩니다.

```tsx
<button>
  +1 // 버튼에 표시될 글자
</button>
// → 화면의 버튼에 "+1 // 버튼에 표시될 글자" 가 통째로 찍힘 ❌

<button>
  +1 {/* 버튼에 표시될 글자 */}
</button>
// → 화면의 버튼에 "+1" 만 찍힘 ✅
```

중괄호 `{}` 안은 **JS 영역**이라 `/* */` 주석이 통합니다. 반대로 `onClick={...}` 안이나 컴포넌트 함수 본문은 원래 JS 영역이라 `//`가 정상 동작해요. **같은 파일 안에서 위치에 따라 주석 문법이 달라지는 게** JSX에서 제일 헷갈리는 부분입니다.

| 어디 | 주석 문법 | 예 |
|---|---|---|
| 컴포넌트 함수 본문 (JS 영역) | `//`, `/* */` | `const x = 1;  // 메모` |
| `{ }` 안 (JS 영역) | `/* */` | `onClick={() => { /* 메모 */ }}` |
| 태그와 태그 사이 (글자 영역) | **`{/* */}`** | `<p>안녕 {/* 메모 */}</p>` |
| 태그 속성 자리 | `{/* */}` | `<img {/* 메모 */} src="..." />` |

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

⚠️ **`key`는 왜 필요?** React가 diff할 때 "어느 항목이 그대로고 어느 게 바뀌었는지" 식별하는 이름표입니다. 없으면 경고가 뜨고 리스트가 바뀔 때 버그가 생겨요. **당장은 인덱스 `key={i}`도 되지만 실무에선 고유 id**(예: 메시지의 `id`)를 씁니다. 오늘 채팅 실습에서 제대로 된 id를 써요.

### ✅ 세션 1 체크
- [ ] 컴포넌트가 화면에 렌더링됨
- [ ] `{ }` 삽입 / `className` / Fragment / `key` 이해
- [ ] `.map`으로 리스트 렌더링

---

## 2. 세션 2 (오전) — props & useState

`src/playground/StateDemo.tsx`에서 실험합니다.

### 2-1. props — 부모가 자식에게 넘기는 값

**① 왜 있나**: 컴포넌트를 재사용하려면 바깥에서 데이터를 넣어줄 통로가 필요합니다.
**② 쉬운 설명**: props는 **컴포넌트 함수의 인자**입니다. 부모가 속성처럼 넘기면(`<Hello name="광명" />`) 자식이 그걸 받아 씁니다. **읽기 전용**이에요(자식이 못 바꿈).
**③ 🐍 + TS**: 함수 인자에 타입을 붙이듯 props도 `interface`로 타이핑합니다(Day 3 회수). 그리고 **매개변수 자리에서 객체 구조 분해**(Day 1 회수)를 써요.

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

**① 왜 있나**: 컴포넌트 함수는 계속 재실행됩니다(Streamlit 재실행). 그런데 클릭 횟수 같은 값은 재실행돼도 살아남아야 하죠. 그렇게 살아남는 값이 상태(state)입니다.

#### ② 쉬운 설명 — 한 줄을 분해해서

곧 이런 줄을 칠 겁니다. **치기 전에 이 한 줄부터 완전히 이해하고 갑니다.**

```tsx
const [count, setCount] = useState(0);
```

먼저 결론. **`useState`는 2칸짜리 배열을 돌려주는 함수**입니다.

```
useState(0)  →  [0, ƒ]
                 ↑   ↑
              현재값  그 값을 바꾸는 함수 (React가 방금 만들어서 넣어준 것)
```

이 두 칸을 각각 변수로 꺼내려고 **배열 구조 분해**([Day1 §4-4](Day1.md#L548))를 씁니다. 왼쪽 대괄호가 그거예요.

```tsx
const [count, setCount] = useState(0);
//     ↑      ↑
//     │      └─ 1번 칸(함수)을 "setCount"라는 이름으로 받겠다
//     └──────── 0번 칸(값)을 "count"라는 이름으로 받겠다
```

⭐ **여기가 제일 헷갈리는 지점**: `count`도 `setCount`도 **React가 정해준 이름이 아닙니다. 내가 지금 지은 이름입니다.** 배열 구조 분해는 이름이 아니라 **순서**로 꺼내기 때문에, 이렇게 써도 완전히 똑같이 동작합니다.

```tsx
const [n, changeN] = useState(0);   // 동작 100% 동일. 이름만 다름
```

그럼 왜 다들 `setCount`라고 쓰냐 — **관례**입니다. `x` / `setX` 짝으로 이름 붙이기로 커뮤니티가 합의해서, 남이 읽을 때 "아 얘가 상태고 얘가 그걸 바꾸는 함수구나"가 즉시 보이거든요.

⚠️ 그래서 **`setCount`라는 함수는 React 어딘가에 정의돼 있는 게 아닙니다.** `useState(0)`를 호출하는 그 순간 React가 함수를 하나 **만들어서** 배열 1번 칸에 담아 돌려주고, 나는 거기에 `setCount`라는 이름표를 붙이는 겁니다.

#### ③ 🐍 Python으로 쓰면 이런 구조

가짜 구현이지만 **구조는 정확합니다.**

```python
def use_state(초깃값):
    def 세터(새값):
        ...  # ① 저장소에 새 값 기록  ② "화면 다시 그려"라고 예약
    return 저장된_값, 세터

count, set_count = use_state(0)   # ← 파일 어디에도 def set_count 는 없다
```

`set_count`를 아무리 찾아도 `def set_count`가 안 나옵니다. `use_state` 안에서 만들어져 나온 함수니까요. **React의 `setCount`도 정확히 이 상태입니다.**

**JS 자체 설명**: 함수가 함수를 만들어서 반환하는 건 JS에서 아주 흔한 패턴입니다. 그렇게 나온 함수는 **자기를 만든 함수 안의 정보를 기억한 채로** 나옵니다. `setCount`가 기억하는 정보는 "어느 컴포넌트의, 몇 번째 상태 칸인지"예요. 그래서 그냥 호출만 해도 자기가 어디를 고쳐야 하는지 압니다.

#### ④ 그래서 `setCount(1)`은 정확히 뭘 하나 — 딱 두 가지

1. **값을 저장한다** — React 내부 저장소의 "이 컴포넌트의 이 상태 칸"에 `1`을 기록
2. **재렌더를 예약한다** — "이 컴포넌트 함수를 처음부터 다시 실행해라"

**2번이 핵심입니다.** 이게 있어서 화면이 바뀝니다.

#### ⑤ 규칙 — 상태를 바꿀 땐 반드시 setter

변수를 직접 `count = 1`로 바꾸면 위의 **2번이 없습니다.** React는 아무것도 모르고, 컴포넌트 함수는 다시 실행되지 않고, 화면은 그대로예요. 게다가 `count`는 함수 안의 지역 변수라 다음 렌더 때 새로 만들어지므로 그 변경은 흔적도 없이 사라집니다.

⌨️ 실습 (1/2) — `src/playground/StateDemo.tsx` 새 파일

```tsx
import { useState } from "react";

function StateDemo() {
  // useState(0) → [0, ƒ] 를 반환. 두 칸을 구조 분해로 꺼내 이름을 붙인다
  // count / setCount 는 React가 정한 이름이 아니라 내가 지은 이름
  const [count, setCount] = useState(0);   // 0 = 첫 렌더에서만 쓰이는 초깃값

  return (
    <div>
      <p>카운트: {count}</p>
      <button
        className="border px-3 py-1 rounded"
        onClick={() => setCount(count + 1)}
      >
        +1 {/* 버튼에 표시되는 글자. 여기 주석은 이 형태여야 함 — §1-2 ⑤ */}
      </button>
    </div>
  );
}

export default StateDemo;
```

⭐ **파일만 만들면 화면엔 아무 일도 일어나지 않습니다.** React는 `App` 하나에서 출발해 **거기서 불린 컴포넌트만** 그리거든요. 그래서 `App.tsx`에 등록하는 단계가 항상 한 번 더 필요합니다.

⌨️ 실습 (2/2) — `src/App.tsx`를 아래로 교체 (§1의 `JsxDemo`와 나란히 띄우기)

```tsx
import JsxDemo from "./playground/JsxDemo";
import StateDemo from "./playground/StateDemo";   // ① import 하고

function App() {
  return (
    <div className="p-8">
      <JsxDemo />
      <StateDemo />                                {/* ② 태그로 불러야 화면에 나옴 */}
    </div>
  );
}

export default App;
```

💡 `pnpm dev`가 켜져 있다면 저장하는 순간 브라우저가 갱신됩니다. 점수판(JsxDemo) 아래에 카운터가 뜨면 성공이에요.
⚠️ **자주 하는 실수**: `import`만 하고 `<StateDemo />`를 안 쓰면 화면엔 아무것도 안 나옵니다(린터가 "안 쓴 변수"라고 경고해 줍니다). 반대로 `import` 없이 태그만 쓰면 `StateDemo is not defined` 에러가 나요. **①과 ②는 항상 세트**입니다.

버튼을 누르면 숫자가 오릅니다. **클릭 한 번에 무슨 일이 벌어지는지** 따라가 봅시다.

```
① 첫 렌더
   React가 StateDemo() 를 실행
   → useState(0) 이 [0, setCount] 를 반환  →  count = 0
   → 화면: "카운트: 0"

② 버튼 클릭 → onClick 실행 → setCount(0 + 1)
   → React: 저장소에 1 기록 + "StateDemo 다시 실행" 예약
   (이 시점에 count 는 아직 0. 함수가 다시 실행돼야 바뀜)

③ React가 StateDemo() 를 처음부터 다시 실행
   → useState(0) 이 이번엔 [1, setCount] 를 반환  →  count = 1
   → 화면: "카운트: 1"
```

③에서 **`useState(0)`이 0이 아니라 1을 돌려주는 게** 포인트입니다. `0`은 **첫 렌더에서만 쓰이는 초깃값**이고, 그 뒤로는 React가 저장해둔 값이 나옵니다. 이 흐름이 React의 심장이에요.

⚠️ **`onClick`에 왜 `() =>`를 붙이나** — 이것도 처음 보면 걸립니다.

```tsx
onClick={() => setCount(count + 1)}   // ✅ "클릭되면 실행할 함수"를 넘김
onClick={setCount(count + 1)}         // ❌ 지금 당장 실행하고 그 결과를 넘김
```

`onClick`이 원하는 건 **함수 자체**입니다("나중에 클릭되면 이걸 실행해줘"). 아래처럼 쓰면 렌더되는 순간 `setCount`가 호출돼 버리고, 그게 또 재렌더를 부르고… 무한 루프가 납니다. 그래서 **실행할 코드를 화살표 함수로 한 겹 감싸서** 넘깁니다.
🐍 Python이면 `button.on_click(handler)` vs `button.on_click(handler())`의 차이 — 괄호를 붙이는 순간 "함수를 넘기는 것"이 "호출 결과를 넘기는 것"으로 바뀌는 그 함정과 같습니다.

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

✅ **해결 — 함수형 업데이트**: 이전 값이 필요하면 setter에 **함수**를 넘기세요.

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
1. (보통) 텍스트 입력창(제어 컴포넌트)을 만들어라. `useState<string>("")`로 입력값을 관리하고 아래 문단에 실시간으로 그 값을 보여준다.

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

💡 이것이 **제어 컴포넌트**입니다: 입력창의 값을 state가 제어해요. `value`(보여줄 값) + `onChange`(바뀌면 state 갱신)가 한 쌍. 오늘 `ChatInput`의 뼈대입니다.

---

## 3. 세션 3 (오후) — useEffect & 렌더링

`src/playground/EffectDemo.tsx`에서 실험합니다.

### 3-1. `useEffect` — "렌더링 이후에 할 부수효과"

**① 왜 있나**: 데이터 가져오기(fetch), 타이머, 구독처럼 **화면 그리는 일과 별개로 바깥 세계와 주고받는 일**을 담는 곳.
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

⌨️ 실습 (1/2) — `src/playground/EffectDemo.tsx` 새 파일

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

⌨️ 실습 (2/2) — `src/App.tsx`에 등록 (§2-2와 같은 패턴. import + 태그 세트)

```tsx
import JsxDemo from "./playground/JsxDemo";
import StateDemo from "./playground/StateDemo";
import EffectDemo from "./playground/EffectDemo";

function App() {
  return (
    <div className="p-8">
      <JsxDemo />
      <StateDemo />
      <EffectDemo />
    </div>
  );
}

export default App;
```

숫자가 1초마다 오르면 성공입니다.

⚠️ **클린업을 빼먹으면**: 컴포넌트가 다시 마운트될 때 타이머가 쌓여 숫자가 2씩, 3씩 뛰는 버그가 생깁니다. **"켠 건 반드시 끈다"**가 규칙이에요.
💡 `setSeconds((prev) => prev + 1)`에서 **함수형 업데이트**를 쓴 이유: effect는 처음 한 번만 도는데, 그 안의 `seconds`는 0으로 고정된 스냅샷이라 `seconds + 1`을 쓰면 계속 1만 됩니다. `prev`를 쓰면 항상 최신값을 봅니다. (§2-3의 스냅샷 함정이 여기서 재등장!)

### 3-3. ⭐ 언제 useEffect가 "필요 없는가" (매우 중요)

초보가 useEffect를 남발합니다. **웬만해선 필요 없어요.**

- ❌ **렌더링용 파생 값 계산에 effect를 쓰지 마세요.** 예: 메시지 개수는 effect+state가 아니라 **렌더 중에 그냥 계산**하면 됩니다.
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

이제 조각들을 합쳐 **채팅 UI 껍데기**를 만듭니다. 백엔드는 아직 없습니다(Day 6에서 붙임). 메시지를 입력하면 화면에 쌓이는 데까지 완성해요.

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

말풍선 **한 개**만 그리는 가장 작은 컴포넌트입니다. 상태도 이벤트도 없이 **받은 props를 화면으로 변환만** 하는 순수 함수예요.

⌨️ 실습 — `src/components/MessageItem.tsx`

```tsx
import type { Message } from "../types";   // 타입만 가져오기 (실행 코드 아님)

interface Props {
  message: Message;                        // 이 컴포넌트가 받을 재료의 설계도
}

function MessageItem({ message }: Props) {   // { } = 구조 분해로 꺼내며 받기
  const isUser = message.role === "user";    // === 는 엄격 비교 (== 쓰지 말 것)
  return (
    // 바깥 div = 정렬 담당. 내 말풍선은 오른쪽, 상대는 왼쪽
    <div className={isUser ? "text-right" : "text-left"}>
      <span
        className={
          "inline-block rounded-lg px-3 py-2 " +   // ⚠️ 끝의 공백 필수!
          (isUser ? "bg-blue-500 text-white" : "bg-gray-200 text-black")
        }
      >
        {message.text}                     {/* { } = 여기부터 JS 값 */}
      </span>
    </div>
  );
}

export default MessageItem;                // 파일당 1개인 "대표 수출품"
```

#### 📖 한 줄씩 뜯어보기

| 코드 | 뜻 | 🐍 Python 다리 |
|------|-----|----------------|
| `import type { ... }` | **타입만** 가져옴. 컴파일 후 이 줄은 사라집니다(번들 크기 0) | `if TYPE_CHECKING:` 자리. 단 JS는 진짜로 지워져 순환 import 사고도 안 남 |
| `interface Props` | 받을 props의 모양. 실행 코드가 아니라 **약속**일 뿐 | `TypedDict`/`dataclass`로 인자 모양을 미리 적어두는 것 |
| `({ message }: Props)` | props 객체에서 `message`만 꺼내며 받기(구조 분해) | 딕셔너리를 받자마자 원하는 키만 변수로 푸는 문법 |
| `isUser ? A : B` | 삼항연산자 — 조건이 참이면 A, 아니면 B | `A if 조건 else B` |
| `className` | HTML의 `class`. JS 예약어 `class`와 겹쳐 이름이 다름 | — |
| `{message.text}` | JSX 안에서 JS 값 꽂아넣기. React가 자동 이스케이프하므로 XSS 안전 | Jinja의 `{{ }}`와 비슷하지만 **문자열이 아니라 코드** |

- **컴포넌트 = props를 받아 JSX를 반환하는 그냥 함수**입니다. 클래스도, 상속도 없습니다.
- ⚠️ 컴포넌트 이름은 **반드시 대문자로 시작**. 소문자면 React가 `<div>` 같은 HTML 태그로 오해합니다.
- `span`은 inline 요소라 원래 상하 여백이 안 먹습니다. `inline-block`을 줘야 "글자만큼만 폭 + padding 적용 가능"이 됩니다.

#### 🐍 왜 `Message`를 바로 안 쓰고 `Props`로 감쌌나

**React 컴포넌트는 인자를 딱 1개만 받기 때문**입니다. JSX는 결국 이렇게 호출돼요.

📖 설명용

```tsx
<MessageItem message={m} />      // 내가 쓴 JSX
MessageItem({ message: m })      // React가 실제로 호출하는 모습 — 인자 1개!
```

Python이면 `def MessageItem(message, on_delete, is_last)`처럼 인자를 나열하면 그만이지만, React는 **모든 값을 객체 하나에 담아** 넘깁니다. 그 봉투의 타입 이름이 관례적으로 `Props`예요. 즉 **`Message`는 편지 내용, `Props`는 봉투** — 지금은 편지 한 장뿐이라 같아 보일 뿐입니다.

봉투를 따로 두는 실익은 두 가지입니다.

- **데이터 모델이 UI에 인질로 잡히지 않습니다.** `Message`는 Day 6에 `/api/chat`과 주고받을 **데이터 계약**이라 필드가 늘어납니다. 이게 곧 props 타입이면 서버 응답이 바뀔 때마다 호출부가 흔들려요.
- **props는 데이터가 아닌 것도 받습니다.** 곧 `onDelete: (id: string) => void`(콜백)나 `isLast: boolean`(화면 사정) 같은 게 붙는데, 이런 건 `Message`에 넣을 수 없죠.

💡 필드가 하나뿐이면 `({ message }: { message: Message })`처럼 인라인으로 써도 됩니다. `Props`라는 이름도 문법이 아니라 **관례**라서 `interface Banana`여도 동작해요. 다만 한 파일에 컴포넌트가 여럿이면 `MessageItemProps`처럼 이름을 붙이는 게 표준입니다.

#### ⚠️ 이 파일에서 흔한 실수 3가지

1. **클래스 문자열 이어붙일 때 공백 누락** — `"...py-2" + "bg-blue-500"` → `py-2bg-blue-500`이 되어 **두 클래스 모두 무효**가 됩니다. 스타일이 통째로 안 먹으면 여기부터 의심하세요.
2. **props를 직접 수정** — `message.text = "..."`는 금지입니다. 화면을 바꾸려면 상태를 가진 부모가 `setMessages`로 **새 props를 내려줘야** 합니다. 🐍 인자로 받은 리스트를 in-place로 고치지 않는 원칙과 같은 결.
3. **`id`를 안 써서 당황** — `Message`엔 `id`가 있는데 여기선 안 씁니다. `id`는 부모 `MessageList`가 `key`로 쓰는 값이라 자식은 몰라도 돼요(바로 다음 절).

> ⌨️ **미니 실습**: 말풍선이 화면 폭을 다 먹지 않도록 `span`의 공통 클래스에 `max-w-[70%]`를 추가해 보세요. 긴 메시지를 넣어 줄바꿈되는지 확인합니다.

### 4-3. 메시지 목록 — `MessageList`

`MessageItem`은 말풍선 **한 개**만 그립니다. 그럼 **배열 전체**를 그리는 건 누구 일일까요? 그게 `MessageList`예요. 하는 일이 딱 두 가지뿐인 얇은 컴포넌트입니다 — **① 배열을 돌며 `MessageItem`을 뿌리고, ② 그것들을 담을 스크롤 상자를 씌운다.**

🐍 Python으로 쓰면 이 정도 분량입니다. **로직이 아니라 "반복 + 껍데기"가 전부**라는 감각으로 보세요.

```python
def message_list(messages):
    return box([message_item(m) for m in messages])   # 리스트 컴프리헨션 자리 = .map
```

⌨️ 실습 — `src/components/MessageItem.tsx`와 같은 폴더에 `src/components/MessageList.tsx`

```tsx
import type { Message } from "../types";   // 타입만 (§4-2와 동일)
import MessageItem from "./MessageItem";   // 자식 컴포넌트를 데려온다 (default export라 { } 없음)

interface Props {
  messages: Message[];   // 메시지 "한 개"가 아니라 "배열". Day 3의 배열 타입 표기
}

function MessageList({ messages }: Props) {
  return (
    // 이 div = 말풍선들을 담는 스크롤 상자. 클래스 뜻은 아래 표 참고
    <div className="flex flex-col gap-2 p-4 h-96 overflow-y-auto border rounded">
      {/* { } 안은 JS 영역 → 배열을 map으로 "JSX 배열"로 바꾸면 React가 알아서 나열해 그린다 */}
      {messages.map((m) => (
        // key = React가 항목을 구별하는 이름표. 인덱스 말고 고유 id를 쓴다
        <MessageItem key={m.id} message={m} />
      ))}
    </div>
  );
}

export default MessageList;
```

⌨️ 아직 `App.tsx`에 등록하지 않았으니 **화면엔 아무 변화가 없습니다.** 정상이에요 — §4-6에서 한꺼번에 조립합니다. 지금은 저장 후 터미널에 빨간 에러만 안 뜨면 통과입니다.

#### 📖 한 줄씩 뜯어보기

| 코드 | 뜻 | 🐍 Python 다리 |
|------|-----|----------------|
| `import MessageItem from "./MessageItem"` | **default export를 받는 문법** — `{ }`가 없습니다. 내보낸 쪽이 `export default`라서 이름은 내 마음대로 지어도 동작(관례상 같게 씀) | `from .message_item import MessageItem`에 가깝지만, 이름이 아니라 **"그 파일의 대표 수출품"** 을 받는 것 |
| `messages: Message[]` | `Message` 객체들의 배열. `[]`가 "여러 개"를 뜻함 | `list[Message]` |
| `{messages.map(...)}` | 배열 → JSX 배열로 **변환**. React는 JSX 배열을 받으면 순서대로 다 그림 | `[message_item(m) for m in messages]` |
| `(m) => ( ... )` | 화살표 함수. 몸통이 **소괄호**면 그 값을 **바로 반환**(`return` 불필요) | `lambda m: ...` |
| `key={m.id}` | React가 diff할 때 쓰는 **이름표**. props가 아니라 **React 전용 예약 속성** | 딕셔너리의 키처럼 "이 항목이 그 항목이 맞다"는 신원 확인용 |
| `message={m}` | 자식에게 내려주는 진짜 props. §4-2의 `Props.message`로 들어감 | `MessageItem(message=m)` |

**📖 상자 클래스 6개** — 각각 한 가지 일만 합니다.

| 클래스 | 하는 일 | 빼면 어떻게 되나 |
|---|---|---|
| `flex` `flex-col` | 자식을 **세로로** 쌓음 | 말풍선 정렬(`text-right`)이 어긋나 보일 수 있음 |
| `gap-2` | 말풍선 사이 간격 8px | 말풍선끼리 딱 붙음 |
| `p-4` | 상자 안쪽 여백 | 말풍선이 테두리에 닿음 |
| `h-96` | **높이를 384px로 고정** | 상자가 내용만큼 계속 늘어남 → 스크롤이 안 생김 |
| `overflow-y-auto` | 내용이 넘치면 **세로 스크롤바** | 넘친 메시지가 잘려서 안 보임 |
| `border` `rounded` | 테두리 + 둥근 모서리 | 상자 경계가 안 보임(기능엔 영향 없음) |

⭐ **`h-96` + `overflow-y-auto`는 한 세트**입니다. 높이가 고정돼야 "넘친다"는 상황이 생기고, 그래야 스크롤이 나옵니다. §4-5의 자동 스크롤도 이 스크롤 상자가 있어야 의미가 있어요.

#### ⭐ `key`를 다시 짚고 갑니다 (§1-3 회수)

메시지가 3개 있다가 맨 앞에 하나가 추가됐다고 해봅시다. React는 새 결과와 옛 결과를 비교해 **"바뀐 것만"** 실제 DOM에 반영하는데(§0 배경), 이때 **누가 누구인지**를 `key`로 판단합니다.

```
key={m.id}  →  ["a1", "b2", "c3"]  →  ["z0", "a1", "b2", "c3"]
               React: "z0이 새로 왔네" → 말풍선 1개만 추가 ✅

key={i}     →  [0, 1, 2]          →  [0, 1, 2, 3]
               React: "0번 내용이 바뀌고, 1번도 바뀌고, 2번도… 3번은 새 거"
               → 전부 갈아엎음. 느리고, 입력 상태가 엉뚱한 항목으로 옮겨붙음 ❌
```

그래서 §4-1 `types.ts`에 `id: string`을 넣어뒀고, §4-6에서 `crypto.randomUUID()`로 채웁니다. **"목록이 끝에만 추가되고 절대 안 변한다"면 인덱스도 괜찮지만, 습관은 처음부터 id로** 들이는 게 낫습니다.

⚠️ `key`는 **props가 아닙니다.** 자식에서 `props.key`로 읽으려 하면 `undefined`이고 경고가 뜹니다. React가 중간에서 가로채 자기가 쓰고 자식에겐 안 넘겨요. 자식이 id를 정말 써야 하면 `<MessageItem key={m.id} id={m.id} ... />`처럼 **따로 한 번 더** 넘겨야 합니다.

#### 🐍 왜 이 컴포넌트엔 `useState`가 없나

`MessageList`는 **자기 데이터를 하나도 안 가집니다.** `messages`를 위(`App`)에서 받아 그리기만 해요. 이런 걸 **표현 컴포넌트(presentational component)** 라고 부릅니다.

React의 데이터는 **위에서 아래로만 흐릅니다**(단방향 데이터 흐름). 상태는 그게 필요한 가장 위쪽 한 곳(`App`)이 소유하고, 아래로는 props로 내려주기만 해요. 그래서 화면이 이상할 때 **범인을 찾는 방향이 항상 위쪽 하나**로 정해집니다 — 데이터가 사방에서 바뀌던 명령형 시절의 지옥이 이걸로 사라졌어요.

🐍 순수 함수로 뷰를 짜고 상태는 한 군데(`st.session_state`)에만 모아두는 Streamlit 습관과 정확히 같습니다. 여기선 그 `session_state` 자리가 `App`의 `useState`예요.

#### ⚠️ 이 파일에서 흔한 실수 4가지

1. **`{/* 주석 */}`을 `map` 안 엉뚱한 자리에 넣음** — 아래는 **문법 에러**입니다. `(m) => ( ... )`의 괄호 안은 "값 하나"만 올 수 있는 JS 영역이라, 요소와 주석 **두 개**가 되어 버려요.
   ```tsx
   {messages.map((m) => (
     <MessageItem key={m.id} message={m} />  {/* ❌ 여긴 태그 사이가 아니라 JS 영역 */}
   ))}
   ```
   이 자리엔 위 실습처럼 **요소 위쪽에 `//` 주석**을 쓰세요. §1-2 표의 "위치에 따라 주석 문법이 달라진다"가 실제로 물리는 첫 지점입니다.
2. **`.map` 대신 `.forEach`** — `forEach`는 **아무것도 반환하지 않아**(`undefined`) 화면이 텅 빕니다. 에러도 안 나서 제일 헷갈려요. 🐍 리스트 컴프리헨션 자리에 `for` 문을 쓴 셈입니다.
3. **화살표 함수 몸통에 `{ }`를 쓰고 `return`을 빼먹음** — `(m) => { <MessageItem ... /> }`는 반환값이 없어 역시 화면이 빕니다. `{ }`를 쓸 거면 `return`을 붙이세요. (그래서 다들 소괄호 `( )`를 씁니다.)
4. **`.map` 전체를 `{ }`로 안 감쌈** — `<div> messages.map(...) </div>`처럼 쓰면 그 글자가 **화면에 그대로 찍힙니다.** 태그 사이는 "글자 자리"라서, JS를 실행하려면 `{ }`로 문을 열어줘야 해요.

> ⌨️ **미니 실습 (조건부 렌더링 §1-3 회수)** — 메시지가 하나도 없을 때 빈 상자만 덩그러니 보이면 허전하죠. 안내 문구를 띄워 보세요.
> ```tsx
> <div className="flex flex-col gap-2 p-4 h-96 overflow-y-auto border rounded">
>   {messages.length === 0 && (
>     <p className="text-gray-400">아직 메시지가 없습니다. 아래에 입력해 보세요.</p>
>   )}
>   {messages.map((m) => (
>     <MessageItem key={m.id} message={m} />
>   ))}
> </div>
> ```
> 💡 `{조건 && <JSX />}`는 "조건이 참일 때만 그린다"는 뜻입니다. ⚠️ 단, `{messages.length && ...}`처럼 **숫자를 그대로 쓰면 안 됩니다** — 배열이 비었을 때 `0`이 화면에 그대로 찍혀요. 반드시 `=== 0`이나 `> 0`으로 **참/거짓으로 만든 뒤** 씁니다.

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

⚠️⚠️ **한글 IME + Enter 버그 (꼭 이해)**: 한글은 자음·모음을 **조합**해 글자를 만듭니다("ㅎ"+"ㅏ"+"ㄴ" → "한"). 이 조합을 확정하려고 Enter를 누르면 그 Enter가 **전송으로 오작동**해 마지막 글자가 잘리거나 두 번 전송됩니다. `e.nativeEvent.isComposing`이 **지금 조합 중인지**를 알려주니, 조합 중이면(`true`) Enter를 무시합니다. **한국어 앱에서 필수 처리**예요. (영어만 쓰면 안 겪어서 놓치기 쉬움)

### 4-5. 커스텀 훅 — `useAutoScroll`

**① 왜 있나**: 메시지가 쌓이면 자동으로 맨 아래로 스크롤되어야 합니다. 이 상태 관련 로직을 **커스텀 훅**으로 뽑아 재사용해요.
**② 쉬운 설명**: 커스텀 훅은 **`use`로 시작하는 함수**입니다. 안에서 `useState`·`useEffect`·`useRef`를 조합해요.

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

💡 여기서 `App.tsx`를 통째로 갈아엎으므로 **세션 1~3에서 띄워둔 playground 데모(`JsxDemo`·`StateDemo`·`EffectDemo`)는 화면에서 사라집니다.** 정상이에요 — 파일은 그대로 남아 있고, `App.tsx`가 더 이상 부르지 않을 뿐입니다. 다시 보고 싶으면 `import`와 태그를 도로 넣으면 됩니다.

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

메시지를 입력하고 Enter/전송 → 내 메시지와 가짜 봇 응답이 쌓이고 자동 스크롤까지 되면 **오늘의 목표 달성**입니다. 🎉

💡 오늘 배운 게 전부 여기 모였어요: props로 데이터 전달, `useState<Message[]>`(제네릭) + 불변/함수형 업데이트, `key`에 고유 id, `useEffect`+`useRef` 커스텀 훅, 리터럴 유니온 role, 그리고 한글 IME 처리. **이 앱을 Day 5에서 Next.js로 옮기고 Day 6에서 진짜 AI를 붙입니다.**

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

`messages.push(...)`는 **기존 배열을 직접 변경**하고 `setMessages(messages)`는 **같은 배열 참조**를 넘깁니다. React는 "상태가 다른 객체로 바뀌었는지"로 갱신을 판단하는데, 참조가 그대로라 "안 바뀌었다"고 여겨 재렌더를 건너뜁니다(§2-4의 불변성 규칙).

✅ 수정: 새 배열로 교체
```tsx
setMessages((prev) => [...prev, userMsg]);
```

교훈: **상태는 절대 직접 변경하지 말고 항상 새 것으로 교체**. Day 1의 불변성이 React에서 왜 그렇게 강조됐는지 여기서 드러납니다.
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

- [ ] Vite와 Tailwind가 각각 무슨 일을 하는 도구인지 한 줄로 설명 가능
- [ ] "화면 = 상태의 함수" 사고를 Streamlit 비유로 설명 가능
- [ ] JSX 규칙(`{}`, `className`, Fragment, `{/* 주석 */}`, `key`)과 조건부/리스트 렌더링
- [ ] 컴포넌트를 새로 만들면 `App.tsx`에 **import + 태그** 두 가지를 모두 해야 화면에 나온다는 것
- [ ] props를 `interface`로 타이핑 + 매개변수 구조 분해
- [ ] `useState` + **스냅샷 함정**(함수형 업데이트 `setX(prev=>...)`)
- [ ] **불변 업데이트**(`[...prev, x]`)의 이유 설명 가능
- [ ] `useEffect` 의존성 배열 3형태 + 클린업, "effect가 불필요한 경우" 1개 설명
- [ ] `useRef`가 왜 필요한지 안다
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
