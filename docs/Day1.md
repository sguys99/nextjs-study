# Day 1 — 개발환경 완성 + JavaScript 코어 문법

> **소요 시간**: 8시간 (90분 학습 + 15분 휴식 × 4세션)
> **선행 조건**: Day 0 완료 (`node -v` → v24.x, `pnpm -v`, VS Code + 확장 3종 설치됨)
> **목표**: 로컬 JS 실행·린팅 환경을 "저장 시 자동 포맷"까지 완성하고, JS 코어 문법(변수·함수·배열/객체)을 Python과 대조하며 손으로 체화한다.
> **핵심 태그**: 🐍 = 파이썬 대비 포인트 · 💡 = 팁 · ⚠️ = 함정

---

## 0. 오늘의 목적 & 저장소에 실습 배치하기

Day 0에서 "부품"(Node/pnpm/VS Code)을 깔았습니다. Day 1은 그 부품들을 **실제로 배선**해서 "코드를 쓰면 자동으로 검사·정리되는" 환경을 만들고, 그 위에서 **JS 문법을 파이썬 지식에 얹는** 날입니다.

당신은 이미 강한 프로그래머예요. 그래서 Day 1의 목표는 "프로그래밍을 배우는 것"이 아니라 **"파이썬 습관을 JS 습관으로 번역하는 것"**입니다. 문법 자체보다 **함정(⚠️)**에 집중하세요.

### 0-1. 저장소 구조 (이 문서 기준)

당신의 저장소는 `docs/`에 학습 문서를 두고 있습니다. 실습 코드는 문서와 분리해서 `practice/`에 Day별로 쌓아갑니다. Day 2, Day 3도 같은 규칙으로 이어집니다.

```
nextjs-study/
├── docs/
│   ├── roadmap.md
│   ├── Day0.md
│   └── Day1.md              ← 지금 이 문서
└── practice/                ← 실습 코드 루트 (오늘 새로 만듦)
    └── day1/
        ├── package.json
        ├── eslint.config.js
        ├── .prettierrc
        ├── .vscode/
        │   └── settings.json
        ├── 01-hello.js
        ├── 02-variables.js
        ├── 03-functions.js
        ├── 04-arrays-objects.js
        └── exercise/
            └── model-report.js
```

💡 **왜 Day별 폴더인가?** 각 Day가 독립된 `package.json`을 가지면, 나중에 특정 실습만 다시 돌려보거나 남에게 보여줄 때 깔끔합니다. Day 5부터는 Next.js 앱이 `practice/app/` 하나로 계속 커지지만(로드맵의 "하나로 이어지는 프로젝트"), Day 1~3의 문법 연습은 Day별로 격리하는 게 편해요.

⚠️ **`node_modules`는 커밋 금지**: 실습 폴더에서 `pnpm add`를 하면 `practice/day1/node_modules/`가 생깁니다. 저장소 루트 `.gitignore`에 아래가 있는지 확인하고, 없으면 추가하세요. (= 파이썬에서 `.venv`를 커밋 안 하는 것과 동일)

```gitignore
node_modules/
```

### 0-2. 시작 전 준비 (1분)

```bash
# 저장소 루트에서
mkdir -p practice/day1
cd practice/day1
```

이제 여기서 세션 1을 시작합니다.

---

## 1. 세션 1 (오전) — 개발환경 셋업 ⭐가장 중요

> **이 세션이 오늘의 핵심입니다.** JS는 파이썬보다 도구 세팅이 학습 속도를 훨씬 크게 좌우합니다. "저장하면 자동으로 검사·정리되는" 상태를 만들면, 남은 6일 내내 이득을 봅니다.

### 1-1. `package.json` 해부 (≈ `pyproject.toml`)

먼저 프로젝트를 초기화합니다.

```bash
pnpm init
```

생성된 `package.json`을 열어보세요. 파이썬 프로젝트 설정과 1:1로 대응됩니다.

```json
{
  "name": "day1",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

| `package.json` 필드 | 🐍 `pyproject.toml` 대응 | 설명 |
|---|---|---|
| `name`, `version` | `[project] name/version` | 프로젝트 메타데이터 |
| `scripts` | `[tool.poetry.scripts]` / Makefile | `pnpm run <이름>`으로 실행할 명령 모음 |
| `dependencies` | `[project] dependencies` | 런타임 의존성 (아직 없음) |
| `devDependencies` | `dependency-groups.dev` (uv) | 개발용 의존성 (린터 등) |
| `type` | (직접 대응 없음) | 모듈 방식 지정 — 아래에서 추가 |

**`package.json`을 아래처럼 수정**하세요. (`main`, `keywords` 등 불필요한 필드는 지워도 됩니다.)

```json
{
  "name": "day1",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

🐍 **`"type": "module"`이 뭔가요?** JS에는 역사적 이유로 모듈 방식이 두 가지 있습니다(CommonJS `require` vs ES Modules `import`). `"type": "module"`을 넣으면 **모던 방식(ES Modules)**을 기본으로 쓰겠다는 선언입니다. 파이썬은 `import` 하나뿐이라 고민할 게 없지만, JS는 이 한 줄로 "우리는 최신 문법을 쓴다"를 정합니다. (자세한 모듈 이야기는 Day 2)

### 1-2. 첫 스크립트 실행 — `node file.js`

`01-hello.js` 파일을 만들고:

```js
// 01-hello.js
console.log("Hello from Node", process.version);

const name = "ML 개발자";
console.log(`반가워요, ${name}!`);
```

실행:

```bash
node 01-hello.js
```

출력:
```
Hello from Node v24.x.x
반가워요, ML 개발자!
```

🐍 `console.log(...)`는 파이썬의 `print(...)`입니다. `node 01-hello.js`는 `python 01-hello.py`와 정확히 같은 구조예요.

### 1-3. ESLint + Prettier 설치 (린터 + 포매터)

파이썬의 **ruff/flake8(린터) + black(포매터)** 조합을 JS에서는 **ESLint(린터) + Prettier(포매터)**로 합니다.

| 도구 | 역할 | 🐍 파이썬 대응 |
|---|---|---|
| **ESLint** | 버그성 문제 검출 (안 쓴 변수, 오타 등) | ruff / flake8 |
| **Prettier** | 코드 포맷팅 (들여쓰기, 따옴표, 줄바꿈) | black / ruff format |
| **eslint-config-prettier** | 둘이 안 싸우게 스타일 규칙 조정 | (파이썬엔 딱 맞는 대응 없음) |

💡 **린터 vs 포매터 — 뭐가 다른가?** 린터는 코드의 **의미/논리**를 검사하고("여기 버그 가능성 있어요" 경고), 포매터는 코드의 **모양**만 정리합니다(군말 없이 고쳐서 저장). 🐍 파이썬으로 비유하면:

```python
x = 10
if x == None:   # ← flake8: "== None 대신 is None 쓰세요" → 린터 (논리 문제)
    y=[1,2,  3] # ← black: 띄어쓰기 정리해서 y = [1, 2, 3] → 포매터 (모양 문제)
```

포매터가 `x == None`을 `x is None`으로 바꾸지 않는 이유 — 그건 코드의 **동작이 바뀌는** 수정이라 포매터 영역이 아닙니다. 반대로 린터는 들여쓰기가 2칸이든 4칸이든 신경 안 씁니다. 한 줄 요약: **린터 = 코드 리뷰어(버그 지적), 포매터 = 타이피스트(정렬만)**. 둘의 역할이 살짝 겹치는 지점(줄 길이 같은 스타일 규칙)에서 서로 싸울 수 있어서, `eslint-config-prettier`가 ESLint 쪽 스타일 규칙을 꺼 "스타일은 Prettier, 논리는 ESLint"로 교통정리를 해줍니다.

설치 (개발용 의존성 → `-D`):

```bash
pnpm add -D eslint @eslint/js eslint-config-prettier globals prettier
```

🐍 `pnpm add -D <pkg>`는 `uv add --dev <pkg>` / `pip install -D`와 같습니다. 설치 후 `package.json`에 `devDependencies`가 생기고, `node_modules/`와 `pnpm-lock.yaml`(= `uv.lock`)이 만들어집니다.

### 1-4. ESLint 설정 파일 — `eslint.config.js`

최신 ESLint(9.x)는 **flat config**라는 방식을 씁니다. 아래 파일을 만드세요.

```js
// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

export default [
  js.configs.recommended, // ESLint 권장 규칙 세트
  prettierConfig, // Prettier와 충돌하는 스타일 규칙 끄기
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node, // console, process 등 Node 전역 인식
      },
    },
    rules: {
      "no-unused-vars": "warn", // 안 쓴 변수는 경고 (학습 중엔 error 대신 warn이 편함)
    },
  },
];
```

💡 `globals.node`를 넣는 이유: ESLint는 기본적으로 `console`, `process` 같은 걸 "정의 안 된 변수"로 의심합니다. `globals.node`로 "이건 Node 환경의 전역이야"라고 알려줘야 경고가 안 뜹니다.

### 1-5. Prettier 설정 파일 — `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": false,
  "printWidth": 80
}
```

- `semi`: 문장 끝 세미콜론(`;`) 자동 추가
- `singleQuote`: `false`면 큰따옴표 사용
- `printWidth`: 80자 넘으면 줄바꿈 (black의 line-length와 동일 개념)

💡 Prettier는 "설정으로 싸우지 말자"가 철학이라 옵션이 적습니다. 위 3개면 충분해요. 팀 규칙 없으면 기본값도 무방합니다.

### 1-6. VS Code 배선 — "저장 시 자동 포맷" 완성 ⭐

이게 오늘의 하이라이트입니다. `.vscode/settings.json`을 만드세요. (이 프로젝트에서만 적용되는 설정)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

- `formatOnSave`: 저장할 때마다 Prettier가 자동 정리
- `defaultFormatter`: Prettier 확장을 포매터로 지정 (Day 0에 설치함)
- `codeActionsOnSave`: 저장 시 ESLint가 자동 고칠 수 있는 건 고침

💡 최신 VS Code ESLint 확장은 `eslint.config.js`(flat config)를 자동 인식합니다. 만약 ESLint가 안 도는 것 같으면 `Cmd/Ctrl + Shift + P` → "ESLint: Restart ESLint Server" 실행.

### 1-7. 검증 — 정말 도는지 확인

일부러 지저분한 코드를 `01-hello.js`에 넣고 저장해보세요:

```js
const    x="messy"     ;console.log(   x)
```

저장(`Cmd/Ctrl + S`)하는 순간 Prettier가 아래처럼 정리하면 성공입니다:

```js
const x = "messy";
console.log(x);
```

터미널 검증:
```bash
pnpm lint      # ESLint 실행 → 문제 0개면 조용히 끝남
pnpm format    # Prettier로 전체 파일 정리
```

### ✅ 세션 1 체크
- [ ] `pnpm init`으로 `package.json` 생성, `"type": "module"` 추가
- [ ] `node 01-hello.js` 실행 성공
- [ ] ESLint/Prettier/config-prettier/globals 설치됨 (`devDependencies` 확인)
- [ ] `eslint.config.js`, `.prettierrc`, `.vscode/settings.json` 생성
- [ ] **저장하면 코드가 자동으로 정리됨** ← 가장 중요

---

## 2. 세션 2 (오전) — 변수 · 타입 · 연산

> 새 파일 `02-variables.js`를 만들고, 아래 내용을 직접 쳐보면서 `node 02-variables.js`로 확인하세요.

### 2-1. `let` / `const` (그리고 `var`는 왜 안 쓰나)

```js
const PI = 3.14; // 재할당 불가 (파이썬엔 없는 개념)
let count = 0; // 재할당 가능
count = 1; // OK

// const PI = 3.15;  // ❌ TypeError: Assignment to constant variable
```

🐍 파이썬엔 상수 개념이 문법으로 없습니다(관례상 대문자). JS는 **`const`가 기본, 바뀌는 값만 `let`**입니다.

⚠️ **`const`는 "재할당 금지"지 "불변"이 아닙니다.** 객체/배열의 내부는 바꿀 수 있어요:

```js
const arr = [1, 2];
arr.push(3); // ✅ OK — 배열 "내용" 변경은 가능
console.log(arr); // [1, 2, 3]
// arr = [9];        // ❌ 재할당은 금지
```

💡 **`var`는 안 씁니다.** 옛날 문법이고 스코프 규칙이 헷갈립니다. "`const`를 기본으로, 바뀌면 `let`" 이 한 줄만 기억하세요.

### 2-2. 원시 타입 7종

```js
const s = "hello"; // string
const n = 42; // number (정수/실수 구분 없음!)
const b = true; // boolean
const u = undefined; // undefined
const nul = null; // null
const big = 9007199254740993n; // bigint (뒤에 n)
const sym = Symbol("id"); // symbol (거의 안 씀)

console.log(typeof s, typeof n, typeof b); // string number boolean
```

🐍 **가장 큰 차이**: 파이썬은 `int`와 `float`가 분리돼 있지만, **JS의 `number`는 하나**입니다. `1`도 `1.0`도 전부 `number`.

```js
console.log(10 / 3); // 3.3333333333333335  (파이썬의 / 와 같음)
console.log(Math.floor(10 / 3)); // 3  (파이썬의 // 대응)
console.log(10 % 3); // 1  (나머지, 파이썬과 동일)
console.log(2 ** 10); // 1024  (거듭제곱, 파이썬과 동일)
```

### 2-3. `null` vs `undefined` (⚠️ Day 0에서 예고한 함정)

파이썬은 `None` 하나지만, JS는 **비어있음을 나타내는 값이 둘**입니다.

```js
let a; // 선언만 하고 값 없음 → undefined ("아직 값 안 넣음")
let b = null; // 명시적으로 "비었다"고 지정 → null

console.log(a); // undefined
console.log(b); // null
console.log(typeof a); // "undefined"
console.log(typeof b); // "object"   ⚠️ 유명한 역사적 버그(고쳐지지 못함)
```

💡 **실전 규칙**:
- `undefined` = 시스템이 "값이 없다"고 자동으로 준 상태 (선언만 함, 함수가 return 안 함 등)
- `null` = 개발자가 "의도적으로 비웠다"고 넣는 값
- 🐍 파이썬 `None`에 해당하는 "내가 의도적으로 비운 값"은 보통 **`null`**을 씁니다.

### 2-4. 템플릿 리터럴 & 문자열 메서드

```js
const name = "Kim";
const age = 30;

// 템플릿 리터럴 (백틱 ` `) — 파이썬 f-string에 해당
const msg = `${name}님은 ${age}살, 내년엔 ${age + 1}살`;
console.log(msg);

// 문자열 메서드
console.log("  hi  ".trim()); // "hi"       (파이썬 .strip())
console.log("a,b,c".split(",")); // ["a","b","c"]  (파이썬과 동일)
console.log("hello".toUpperCase()); // "HELLO"    (파이썬 .upper())
console.log("hello".includes("ell")); // true      (파이썬 "ell" in "hello")
console.log("hello".replace("l", "L")); // "heLlo"  ⚠️ 첫 번째만 바뀜
```

🐍 **f-string → 백틱**: `f"{name}"` → `` `${name}` ``. 백틱을 쓰는 것과 `${...}` 문법이 핵심입니다. (일반 따옴표 `"..."` 안에서는 `${}`가 안 먹습니다.)

### 2-5. `==` vs `===`, truthy/falsy

⚠️ **JS에서 가장 유명한 함정.** `==`는 타입을 맞춰서 비교(암묵적 변환), `===`는 타입까지 엄격 비교합니다.

```js
console.log(0 == "0"); // true   ⚠️ 문자열 "0"을 숫자로 변환해서 비교
console.log(0 === "0"); // false  타입이 다르므로
console.log(null == undefined); // true
console.log(null === undefined); // false
```

💡 **철칙: 항상 `===`, `!==`를 쓰세요.** `==`는 예측 불가라 실무에서 거의 금지입니다. (ESLint가 잡아주기도 합니다.)

**truthy / falsy** — `if`에서 자동으로 boolean 취급되는 값들:

```js
// falsy (거짓 취급): false, 0, "", null, undefined, NaN, 0n
// 그 외 전부 truthy

if ("hello") console.log("문자열은 truthy");
if (0) console.log("안 나옴");
```

⚠️ **파이썬과 다른 결정적 함정**: 빈 배열/객체는 **truthy**입니다!

```js
if ([]) console.log("빈 배열도 truthy!"); // ✅ 출력됨
if ({}) console.log("빈 객체도 truthy!"); // ✅ 출력됨

// 🐍 파이썬: if []: 와 if {}: 는 False (빈 컨테이너는 falsy)
// JS에서 "비었나?"를 확인하려면:
const arr = [];
if (arr.length === 0) console.log("배열이 비었음"); // 이렇게 명시적으로
```

### ✅ 세션 2 체크
- [ ] `const` 기본, `let`은 바뀔 때만
- [ ] `number`는 int/float 구분 없음을 이해
- [ ] `null`과 `undefined`의 차이를 말로 설명 가능
- [ ] 템플릿 리터럴(백틱)로 문자열 조립
- [ ] `===`만 쓰기, "빈 배열은 truthy" 함정 인지

---

## 3. 세션 3 (오후) — 함수

> 새 파일 `03-functions.js`.

### 3-1. 함수 정의 세 가지 방식

```js
// 1. 함수 선언문 (hoisting: 정의 전에 호출 가능)
function add(a, b) {
  return a + b;
}

// 2. 함수 표현식 (변수에 함수를 담음)
const sub = function (a, b) {
  return a - b;
};

// 3. 화살표 함수 ⭐ 모던 JS의 기본
const mul = (a, b) => a * b;

console.log(add(2, 3), sub(5, 2), mul(4, 3)); // 5 3 12
```

🐍 파이썬은 `def`(선언)와 `lambda`(간단 표현식) 둘뿐이지만, JS는 세 가지가 있고 **실무에선 화살표 함수가 압도적으로 많습니다.**

### 3-2. 화살표 함수 자세히 (≈ `lambda`의 확장판)

```js
// 인자 1개 → 괄호 생략 가능
const square = (x) => x * x;

// 본문이 한 줄이면 return 생략 (암묵적 반환)
const double = (x) => x * 2;

// 본문이 여러 줄이면 { }와 return 필요
const describe = (x) => {
  const label = x > 0 ? "양수" : "음수 또는 0";
  return `${x}는 ${label}`;
};

// 객체를 반환할 땐 () 로 감싸기 ⚠️ (안 그러면 {}를 코드블록으로 오해)
const toObj = (x) => ({ value: x });

console.log(square(5), double(5)); // 25 10
console.log(describe(3)); // "3는 양수"
console.log(toObj(7)); // { value: 7 }
```

🐍 파이썬 `lambda x: x*x`는 한 줄만 가능하지만, JS 화살표 함수는 **여러 줄 본문도 가능**해서 사실상 모든 함수를 대체합니다. `lambda`처럼 "간단한 콜백"에도 쓰고, 일반 함수에도 씁니다.

💡 로드맵에서 "`this` 바인딩은 이해만 하고 깊게 안 판다"고 한 이유가 여기 있어요. 화살표 함수는 `this` 함정을 자동으로 피해줍니다. 지금은 **"함수는 그냥 화살표로 쓴다"**만 기억하세요.

### 3-3. 기본값 · rest · spread

```js
// 기본값 매개변수 (파이썬과 거의 동일)
const greet = (name = "world") => `Hello, ${name}!`;
console.log(greet()); // "Hello, world!"
console.log(greet("Kim")); // "Hello, Kim!"

// rest: 나머지 인자를 배열로 모음 (파이썬의 *args)
const sum = (...nums) => nums.reduce((acc, n) => acc + n, 0);
console.log(sum(1, 2, 3, 4)); // 10

// spread: 배열을 개별 인자로 펼침 (파이썬의 *arr)
const numbers = [5, 1, 8, 3];
console.log(Math.max(...numbers)); // 8
```

🐍 대응표:

| JS | 🐍 Python |
|---|---|
| `(name = "world") =>` | `def f(name="world"):` |
| `(...nums) =>` (rest) | `def f(*nums):` |
| `Math.max(...numbers)` (spread) | `max(*numbers)` |

⚠️ `...`는 위치에 따라 의미가 다릅니다: **함수 정의에서는 rest(모으기)**, **호출/배열 안에서는 spread(펼치기)**. 파이썬의 `*`와 완전히 같은 이중성이라 익숙할 거예요.

### 3-4. 고차 함수 감 잡기

함수를 인자로 받거나 반환하는 함수입니다. JS는 이걸 **일상적으로** 씁니다(다음 세션의 `map`/`filter`가 전부 이겁니다).

```js
// 함수를 인자로 받기
const applyTwice = (fn, x) => fn(fn(x));
console.log(applyTwice((n) => n + 3, 10)); // 16

// 함수를 반환하기 (클로저 맛보기 — Day 2에서 자세히)
const makeMultiplier = (factor) => (x) => x * factor;
const triple = makeMultiplier(3);
console.log(triple(10)); // 30
```

🐍 파이썬에서도 `functools`나 데코레이터로 하는 것과 같은 개념입니다. JS는 이게 훨씬 일상적이에요.

### ✅ 세션 3 체크
- [ ] 화살표 함수로 함수 작성 (한 줄/여러 줄 모두)
- [ ] 기본값, rest(`...args`), spread(`...arr`) 각각 사용
- [ ] 고차 함수 1개 작성
- [ ] 객체 반환 시 `() => ({...})` 함정 인지

---

## 4. 세션 4 (오후) — 배열 & 객체

> 새 파일 `04-arrays-objects.js`. **이 세션이 실무에서 가장 많이 쓰입니다.**

### 4-1. 배열 메서드 (파이썬 컴프리헨션의 대체)

🐍 파이썬은 리스트 컴프리헨션이 강력하지만, **JS는 메서드 체이닝**으로 같은 일을 합니다. 이 전환이 오늘의 핵심 근육입니다.

```js
const nums = [1, 2, 3, 4, 5];

// map: 각 요소 변환 (파이썬 [n*2 for n in nums])
console.log(nums.map((n) => n * 2)); // [2, 4, 6, 8, 10]

// filter: 조건 통과만 (파이썬 [n for n in nums if n%2===0])
console.log(nums.filter((n) => n % 2 === 0)); // [2, 4]

// reduce: 하나로 접기 (파이썬 sum() / functools.reduce)
console.log(nums.reduce((acc, n) => acc + n, 0)); // 15  (0은 초깃값)

// find: 조건 맞는 첫 요소 (파이썬 next(n for n in nums if n>3))
console.log(nums.find((n) => n > 3)); // 4

// some / every: 하나라도 / 전부 (파이썬 any() / all())
console.log(nums.some((n) => n > 4)); // true
console.log(nums.every((n) => n > 0)); // true

// forEach: 순회만 (반환값 없음, 파이썬 for 루프)
nums.forEach((n) => console.log(n));
```

**메서드 체이닝** — 파이썬 컴프리헨션 한 줄을 JS는 이렇게 이어붙입니다:

```js
// 🐍 파이썬: [n*n for n in nums if n % 2 === 0]  → 짝수만 제곱
// 🟨 JS:
const result = nums.filter((n) => n % 2 === 0).map((n) => n * n);
console.log(result); // [4, 16]
```

💡 처음엔 컴프리헨션보다 장황해 보이지만, 체이닝은 **읽는 순서 = 실행 순서**라 복잡해질수록 오히려 명확합니다. `filter → map → reduce`를 물 흐르듯 이어보세요.

### 4-2. 객체 리터럴 & 구조 분해 할당

JS의 객체(`{}`)는 파이썬의 **딕셔너리**에 가깝습니다(단, 키가 문자열이고 점 표기법 `.`으로 접근).

```js
const user = { name: "Kim", age: 30, city: "Seoul" };

// 접근 (파이썬 user["name"] 대신 점 표기법)
console.log(user.name); // "Kim"
console.log(user["age"]); // 30  (대괄호도 됨)

// 구조 분해 할당 (destructuring) ⭐ 매우 자주 씀
const { name, age } = user;
console.log(name, age); // "Kim" 30

// 이름 바꾸기 + 기본값
const { city, country = "KR" } = user;
console.log(city, country); // "Seoul" "KR"

// 배열도 구조 분해 (파이썬 튜플 언패킹)
const [first, second] = [10, 20];
console.log(first, second); // 10 20
```

🐍 배열 구조 분해 `const [a, b] = arr`는 파이썬 `a, b = arr`와 똑같습니다. 객체 구조 분해는 파이썬엔 직접 대응이 없는 JS의 편의 기능인데, **React/Next.js에서 매 순간 나오니** 지금 꼭 익혀두세요.

### 4-3. 전개 연산자 (spread)로 복사/병합

```js
// 객체 병합 (파이썬 {**base, "c": 3})
const base = { a: 1, b: 2 };
const extended = { ...base, c: 3 }; // { a: 1, b: 2, c: 3 }

// 객체 일부 덮어쓰기 (불변 업데이트 — React에서 핵심 패턴)
const updated = { ...user, age: 31 }; // age만 바꾼 새 객체
console.log(updated); // { name: "Kim", age: 31, city: "Seoul" }

// 배열 병합/복사 (파이썬 [*a, *b])
const a = [1, 2];
const b = [3, 4];
console.log([...a, ...b]); // [1, 2, 3, 4]
```

💡 **`{ ...user, age: 31 }` 패턴을 눈에 익히세요.** "원본을 안 바꾸고, 일부만 수정한 새 객체를 만든다"는 이 불변 업데이트가 **React 상태 관리의 심장**입니다. Day 4에서 다시 만납니다.

### ✅ 세션 4 체크
- [ ] `map`/`filter`/`reduce`/`find`/`some`/`every` 각각 사용
- [ ] `filter().map()` 체이닝 작성
- [ ] 객체/배열 구조 분해로 값 꺼내기
- [ ] `{ ...obj, key: val }`로 불변 업데이트

---

## 5. 통합 실습 — CLI 데이터 처리 스크립트 ⭐

오늘 배운 걸 한 파일에 모읍니다. **ML 개발자에게 익숙한 소재**로 갑니다: 모델 실험 기록을 변환·집계하는 스크립트. (파이썬 + pandas로 하던 걸 순수 JS로)

`exercise/model-report.js`를 만드세요:

```js
// exercise/model-report.js
// 모델 실험 기록을 변환·집계하는 리포트 스크립트

const runs = [
  { name: "baseline", accuracy: 0.81, params: 1_200_000 },
  { name: "resnet", accuracy: 0.93, params: 25_000_000 },
  { name: "tiny-cnn", accuracy: 0.76, params: 300_000 },
  { name: "vit", accuracy: 0.95, params: 86_000_000 },
];

// 1) accuracy 0.9 이상만 추리기
const strong = runs.filter((r) => r.accuracy >= 0.9);

// 2) "이름: 정확도%" 형태 문자열로 변환
const labels = strong.map(
  (r) => `${r.name}: ${(r.accuracy * 100).toFixed(1)}%`
);

// 3) 전체 평균 정확도
const avgAccuracy =
  runs.reduce((acc, r) => acc + r.accuracy, 0) / runs.length;

// 4) 가장 정확한 모델 찾기
const best = runs.reduce((a, b) => (b.accuracy > a.accuracy ? b : a));

// 5) 리포트 출력
console.log("=== 모델 리포트 ===");
console.log("강한 모델(≥0.9):", labels);
console.log("평균 정확도:", avgAccuracy.toFixed(3));
console.log("최고 모델:", `${best.name} (${(best.accuracy * 100).toFixed(1)}%)`);
```

실행:
```bash
node exercise/model-report.js
```

기대 출력:
```
=== 모델 리포트 ===
강한 모델(≥0.9): [ 'resnet: 93.0%', 'vit: 95.0%' ]
평균 정확도: 0.863
최고 모델: vit (95.0%)
```

💡 `1_200_000`처럼 숫자에 `_`를 넣어 가독성을 줄 수 있습니다(파이썬과 동일). `.toFixed(1)`은 소수 자릿수 고정(문자열 반환).

### 🎯 추가 연습 문제 3개 (스스로 풀어보기)

같은 `runs` 데이터로 아래를 구현해보세요. 막히면 힌트를 보고, 그래도 막히면 저에게 "Day 1 실습 문제 N번 힌트/풀이 알려줘"라고 물어보세요.

**문제 1.** 파라미터 수가 100만 개(`1_000_000`) 미만인 "경량 모델"의 이름만 배열로 뽑기.
> 힌트: `filter` → `map`

**문제 2.** 모든 모델의 총 파라미터 합을 구하고, "총 112.5M params" 형태로 출력하기.
> 힌트: `reduce`로 합 → `/ 1_000_000` → 템플릿 리터럴 + `.toFixed(1)`

**문제 3.** 정확도가 0.9 이상이면서 파라미터가 5000만 미만인 "효율적인 강한 모델"이 하나라도 있는지 `true`/`false`로 판정하기.
> 힌트: `some`에 조건 두 개(`&&`)

### 최종 검증
```bash
pnpm lint      # ESLint 경고 0개
pnpm format    # Prettier 포맷 통과
```

---

## 6. ✅ Day 1 완료 체크리스트

아래가 전부 통과하면 Day 2 준비 완료입니다.

- [ ] `practice/day1/`에 `package.json`, `eslint.config.js`, `.prettierrc`, `.vscode/settings.json` 완비
- [ ] **저장 시 자동 포맷**이 실제로 동작함
- [ ] `pnpm lint`, `pnpm format`이 돌아감
- [ ] `const`/`let` 구분, `===`만 사용
- [ ] `null` vs `undefined`, "빈 배열은 truthy" 함정 설명 가능
- [ ] 화살표 함수 + 기본값/rest/spread 사용
- [ ] `map`/`filter`/`reduce` 각각 예시 작성
- [ ] 구조 분해 + `{ ...obj }` 불변 업데이트 사용
- [ ] `model-report.js` 실행 성공 + 추가 문제 3개 시도

---

## 7. 자주 나오는 함정 정리 (⚠️)

| 증상 | 원인 | 해결 |
|---|---|---|
| `0 == "0"`이 `true`라 로직이 꼬임 | `==`의 암묵적 타입 변환 | 항상 `===` 사용 |
| `if (arr)`가 빈 배열에도 참 | JS에선 `[]`, `{}`가 truthy | `arr.length === 0`으로 명시 확인 |
| 화살표 함수로 객체 반환 시 에러 | `x => {a:1}`을 코드블록으로 해석 | `x => ({ a: 1 })`로 괄호 감싸기 |
| `const` 배열에 `push`가 되네? | `const`는 재할당 금지지 불변 아님 | 정상 동작. 재할당(`arr =`)만 막힘 |
| ESLint가 `console`을 모른다고 함 | Node 전역 미등록 | `globals.node`를 config에 추가(1-4 참고) |
| 저장해도 포맷 안 됨 | 포매터 미지정/확장 미설치 | `.vscode/settings.json` 확인, ESLint 서버 재시작 |
| `import`가 에러남 | `"type": "module"` 누락 | `package.json`에 추가 |

---

## 8. 저장소 커밋 & 정리

오늘 실습을 저장소에 남깁니다.

```bash
# 저장소 루트로 이동
cd ../..

# node_modules가 무시되는지 먼저 확인 (.gitignore에 node_modules/ 있어야 함)
git status

# 실습 코드 + 오늘 문서 커밋
git add practice/day1 docs/Day1.md
git commit -m "Day 1: JS 개발환경 셋업 + 코어 문법 실습"
git push
```

⚠️ `git status`에 `node_modules/`가 잔뜩 보이면 **커밋하지 말고** `.gitignore`에 `node_modules/`를 먼저 추가하세요. 한번 커밋되면 지우기 번거롭습니다.

💡 커밋 메시지 컨벤션은 자유지만, `Day N: 주제` 형태로 통일하면 나중에 히스토리 보기 좋아요.

---

## 9. Day 2 미리보기

Day 1에서 "동기적으로 도는 JS 문법"을 익혔습니다. Day 2는:

1. **스코프·클로저** — 오늘 맛본 "함수를 반환하는 함수"를 제대로 파고듭니다.
2. **비동기 (async/await)** — 🐍 파이썬 `asyncio`와 키워드가 같아 친숙하지만, "이벤트 루프는 항상 1개(싱글 스레드)"라는 차이가 있습니다. `fetch`로 실제 API도 호출합니다.
3. **모듈 (`import`/`export`)** — 오늘 넣은 `"type": "module"`의 정체를 밝힙니다. 파일을 나누고 합치는 법.

💡 Day 2 시작할 때 로드맵과 이 문서를 붙이고 **"Day 2 세션 1 상세 자료 만들어줘"**라고 요청하면 이어서 만들어 드립니다.

---

### 부록 — Python ↔ JS 치트시트 (Day 1 범위)

```
# 변수
x = 3.14              →  const x = 3.14;      (안 바뀌면 const)
count = 0             →  let count = 0;       (바뀌면 let)

# 문자열
f"{name}: {age}"      →  `${name}: ${age}`    (백틱 사용)
"a,b".split(",")      →  "a,b".split(",")     (동일)
s.strip()             →  s.trim()
s.upper()             →  s.toUpperCase()
"x" in s              →  s.includes("x")

# 비교
a == b (값 비교)      →  a === b              (항상 === 사용!)

# 없음
None                  →  null (의도적) / undefined (자동)

# 함수
def f(a, b): return a+b        →  const f = (a, b) => a + b;
lambda x: x*x                  →  (x) => x * x
def f(name="w")                →  (name = "w") =>
def f(*args)                   →  (...args) =>
max(*arr)                      →  Math.max(...arr)

# 배열/리스트
[n*2 for n in nums]            →  nums.map(n => n * 2)
[n for n in nums if n>0]       →  nums.filter(n => n > 0)
sum(nums)                      →  nums.reduce((a, n) => a + n, 0)
any(n>4 for n in nums)         →  nums.some(n => n > 4)
all(n>0 for n in nums)         →  nums.every(n => n > 0)
next(n for n in nums if n>3)   →  nums.find(n => n > 3)

# 딕셔너리/객체
d = {"a": 1}                   →  const d = { a: 1 };
d["a"]                         →  d.a  (또는 d["a"])
a, b = pair                    →  const [a, b] = pair;
{**base, "c": 3}               →  { ...base, c: 3 }
[*a, *b]                       →  [...a, ...b]
```

수고했어요. 도구가 준비됐고 문법의 골격이 손에 붙었습니다 — Day 2에서 비동기와 모듈로 넘어갑니다. 🟨
