# Day 1 — 개발환경 완성 + JavaScript 코어 문법

> **소요 시간**: 약 8시간 (90분 학습 + 15분 휴식 × 4세션). 급하지 않게, 손을 많이 움직이세요.
> **선행 조건**: Day 0 완료 (`node -v`→v24.x, `pnpm -v`, VS Code + 확장 3종).
> **오늘의 목표**: ① "저장하면 자동으로 검사·정리되는" 환경을 완성하고 ② JS 코어 문법(변수·함수·배열/객체)을 Python과 대조하며 **직접 쳐서** 체화한다.
>
> **태그 범례**: `🐍` Python 대비 · `💡` 팁 · `⚠️` 함정 · `🎯` 배경 · `📖` 설명용(읽기만) · `⌨️` 실습(직접 치기) · `✅` 완성본

---

## 0. 오늘 어떻게 진행되나 (2분)

당신은 이미 강한 프로그래머입니다. 그래서 Day 1의 목표는 "프로그래밍을 배우는 것"이 아니라 **"Python 습관을 JS 습관으로 번역하는 것"**이에요. 문법 자체보다 **함정(⚠️)**에 집중하세요.

이 문서는 **읽는 시간보다 치는 시간이 더 많도록** 설계했습니다. 개념 하나가 나올 때마다 바로 `⌨️ 미니 실습`이 붙어요. **꼭 직접 타이핑**하세요. 복사-붙여넣기 말고요. 손이 기억합니다.

### 0-1. 오늘 만들 폴더 구조

실습 코드는 문서(`docs/`)와 분리해 `practice/`에 Day별로 쌓습니다.

```
nextjs-study/
├── docs/
│   └── Day1.md              ← 지금 이 문서
└── practice/
    └── day1/                ← 오늘 만듦
        ├── package.json
        ├── eslint.config.js
        ├── .prettierrc
        ├── .vscode/settings.json
        ├── 01-variables.js
        ├── 02-functions.js
        ├── 03-arrays-objects.js
        └── exercise/
            └── model-report.js
```

### 0-2. 시작 준비

⌨️ 실습 — 저장소 루트에서

```bash
mkdir -p practice/day1
cd practice/day1
```

이제 여기서 세션 1을 시작합니다.

---

## 1. 세션 1 (오전) — 개발환경 셋업 ⭐가장 중요

### 🎯 배경 — 왜 JS는 "도구 세팅"이 이렇게 중요한가

Python에서는 린터·포매터가 "있으면 좋은 것"이죠. JS에서는 **거의 필수**입니다. 이유가 있어요.

- JS는 Day 0에서 봤듯 급하게 태어나 **함정이 많은 언어**입니다. 세미콜론, `==`, 변수 스코프 등에서 조용히 버그가 납니다.
- 그래서 커뮤니티가 **ESLint**(문제 코드를 잡아주는 린터)와 **Prettier**(코드 모양을 자동 정리하는 포매터)를 만들어 "사람이 실수할 여지"를 도구로 막습니다.
- 🐍 ESLint ≈ ruff/flake8(버그·안티패턴 검출), Prettier ≈ black/ruff format(모양 통일). Python에서 이걸 안 써도 살지만, JS는 **처음부터 켜두는 게 학습 속도를 크게 좌우**합니다.

오늘 이걸 "저장하면 자동으로 도는" 상태로 만들어두면, 남은 8일 내내 이득을 봅니다.

### 1-1. `package.json` — 프로젝트의 신분증

**① 왜 있나**: 프로젝트 이름·버전·의존성·실행 스크립트를 한 곳에 적어두는 파일. 이게 있어야 `pnpm install`로 남이 똑같이 복원합니다.
**② 쉬운 설명**: 🐍 `pyproject.toml`과 거의 같은 역할입니다.
**③ 만들기**

⌨️ 실습 — `practice/day1/`에서

```bash
pnpm init
```

생성된 `package.json`을 VS Code로 열어보세요.

📖 설명용 — 생성된 파일(대략 이런 모양, 타이핑 X)

```json
{
  "name": "day1",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

| 필드 | 🐍 대응 | 설명 |
|------|---------|------|
| `name`/`version` | `[project] name/version` | 프로젝트 메타데이터 |
| `scripts` | Makefile / `poetry run` | `pnpm run <이름>`으로 실행할 명령 모음 |
| `dependencies` | `dependencies` | 실행에 필요한 패키지 (곧 생김) |
| `devDependencies` | dev 그룹 | 개발용(린터 등) 패키지 |

💡 `type` 필드: `package.json`에 `"type": "module"`을 넣으면 최신 `import`/`export` 문법을 씁니다. 오늘은 아직 안 넣습니다(세션 없이도 됨). Day 2에서 모듈을 배울 때 다룰게요.

### 1-2. ESLint + Prettier 설정

**① 왜 있나**: 저장할 때마다 자동으로 코드를 검사(ESLint)하고 모양을 정리(Prettier)하기 위해.
**② 설치**

⌨️ 실습

```bash
pnpm add -D eslint @eslint/js prettier
```

`-D`는 개발용 의존성(🐍 dev 그룹)이라는 뜻이에요. 설치가 끝나면 `node_modules/`와 `pnpm-lock.yaml`이 생깁니다. (⚠️ `node_modules`는 git 커밋 금지 — Day 0 참고)

**③ ESLint 설정 파일 만들기**

⌨️ 실습 — `practice/day1/eslint.config.js` 새 파일

```js
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { console: "readonly", process: "readonly" },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
];
```

💡 이건 ESLint 9의 "플랫 설정(flat config)" 방식입니다. 지금은 내용을 외울 필요 없어요. "recommended 규칙을 켜고, 안 쓰는 변수는 경고, console은 허용" 정도만 읽으면 됩니다.

**④ Prettier 설정 파일**

⌨️ 실습 — `practice/day1/.prettierrc` 새 파일

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all"
}
```

**⑤ 저장 시 자동 포맷 켜기 (핵심)**

⌨️ 실습 — `practice/day1/.vscode/settings.json` 새 파일

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" }
}
```

### 1-3. 동작 확인 — 일부러 지저분하게 쳐보기

⌨️ 실습 — `practice/day1/01-variables.js` 새 파일에 **일부러 못생기게** 입력

```js
const    name="광명"
console.log(   "hi",name    )
```

이제 **저장(Cmd/Ctrl+S)**하세요. Prettier가 자동으로 이렇게 정리하면 성공입니다:

✅ 저장 후 모습

```js
const name = "광명";
console.log("hi", name);
```

⌨️ 실습 — 실행

```bash
node 01-variables.js
```

→ 콘솔에 `hi 광명` 이 출력되면 환경 완성입니다. 🎉

> ⌨️ **미니 실습 (1분)**: `01-variables.js`에 안 쓰는 변수 `const unused = 3;`을 추가하고 저장해 보세요. ESLint가 노란 경고(`unused`가 안 쓰임)를 보여주면, 린터도 잘 도는 겁니다. 확인했으면 그 줄은 지우세요.

### ✅ 세션 1 체크
- [ ] 저장하면 Prettier가 코드를 자동 정리한다
- [ ] 안 쓰는 변수에 ESLint 경고가 뜬다
- [ ] `node 01-variables.js`로 출력에 성공했다

---

## 2. 세션 2 (오전) — 변수·타입·연산

이제 문법입니다. 세션 2~4는 `01-variables.js`, `02-functions.js`, `03-arrays-objects.js`에 나눠 담습니다.

### 2-1. `let`과 `const` (그리고 `var`는 왜 안 쓰나)

**① 왜 중요**: JS는 변수 선언 키워드가 3개(`var`/`let`/`const`)인데, `var`는 옛날 것이고 함정이 많아 **안 씁니다.**
**② 쉬운 설명**:
- `const` = 재할당 불가 (기본값으로 이걸 쓰세요)
- `let` = 재할당 가능 (값이 바뀌어야 할 때만)
**③ 🐍 Python 다리 + JS 자체 설명**: Python은 그냥 `x = 3`이라 선언 키워드가 없죠. JS는 **반드시 `const` 또는 `let`을 붙여** 선언합니다. 안 붙이면 사고가 납니다.

⚠️ **함정 — `const`는 "상수"가 아니라 "재할당 금지"**: `const`로 만든 배열/객체의 **내용은 바꿀 수 있습니다.** "이름표를 다른 값에 다시 못 붙인다"는 뜻이지, "값이 얼어붙는다"가 아니에요.

📖 설명용

```js
const x = 1;
// x = 2;            // ❌ TypeError: Assignment to constant variable
const arr = [1, 2];
arr.push(3);         // ✅ 가능! 내용 변경은 OK → [1, 2, 3]
```

> ⌨️ **미니 실습** — `01-variables.js`에 작성 후 `node 01-variables.js`
> ```js
> const city = "서울";
> let count = 0;
> count = count + 1;
> console.log(city, count); // 서울 1
> ```
> 💡 `city = "부산"`을 추가하고 저장·실행하면 어떤 에러가 나는지 확인해 보세요(그리고 지우세요).

### 2-2. 원시 타입 7가지

**② 쉬운 설명**: JS의 기본 값 종류입니다.

| 타입 | 예시 | 🐍 Python |
|------|------|-----------|
| string | `"hi"`, `` `템플릿` `` | `str` |
| number | `42`, `3.14` (정수/실수 구분 없음!) | `int`+`float` 합침 |
| boolean | `true`, `false` | `True`/`False` (⚠️ 소문자!) |
| null | `null` | `None`과 비슷 |
| undefined | `undefined` | (대응 없음) |
| bigint | `10n` | 큰 정수 (거의 안 씀) |
| symbol | `Symbol()` | (거의 안 씀) |

⚠️ **함정 3개**:
1. `true`/`false`는 **소문자** (Python은 `True`). `null`도 소문자.
2. number는 **정수/실수 구분이 없습니다.** `1`도 `1.0`도 다 number예요.
3. 그래서 `0.1 + 0.2`가 `0.3`이 **아닙니다** (부동소수점). 🐍 Python도 똑같은 현상이 있어요.

> ⌨️ **미니 실습** — `01-variables.js`
> ```js
> console.log(0.1 + 0.2);          // 0.30000000000000004
> console.log(typeof 42);          // "number"
> console.log(typeof "hi");        // "string"
> console.log(typeof true);        // "boolean"
> ```
> `typeof`는 값의 타입을 문자열로 알려주는 연산자입니다(🐍 `type()` 비슷).

### 2-3. `null` vs `undefined` (JS 특유의 함정)

**① 왜 헷갈리나**: Python엔 "없음"이 `None` 하나인데, JS엔 **둘**입니다.
**② 구분**:
- `undefined` = "아직 값이 안 정해짐" (변수를 선언만 하고 값을 안 줌, 없는 객체 속성 등) — **시스템이 주는 '없음'**
- `null` = "의도적으로 비움" — **개발자가 넣는 '없음'**

📖 설명용

```js
let a;                 // 선언만 → a는 undefined
const obj = {};
console.log(obj.name); // 없는 속성 → undefined
const b = null;        // 내가 "비어있음"을 명시
```

⚠️ **악명 높은 버그**: `typeof null`은 `"object"`를 반환합니다(`"null"`이 아니라). JS 초창기의 버그가 하위호환 때문에 지금까지 남은 거예요. 그냥 "그런 게 있다"고 알아두세요.

### 2-4. `===` vs `==` (무조건 `===`)

**① 왜 중요**: `==`는 타입을 멋대로 바꿔서 비교하기 때문에 조용한 버그의 원흉입니다.
**② 규칙**: **항상 `===`(엄격한 같음)와 `!==`를 쓰세요.** `==`는 잊어버려도 됩니다.
**③ 🐍**: Python의 `==`는 안전하지만, JS의 `==`는 위험합니다. JS에서 Python의 `==`에 해당하는 안전한 비교는 `===`예요.

📖 설명용 — `==`가 왜 위험한지 (읽기만)

```js
console.log(0 == "");      // true  (?!) — 타입을 바꿔 비교
console.log(0 == "0");     // true  (?!)
console.log("" == "0");    // false (?!) — 앞 둘과 모순
console.log(0 === "");     // false  ← 이게 우리가 원하는 결과
```

### 2-5. truthy / falsy

**② 쉬운 설명**: `if`문 등에서 boolean이 아닌 값도 참/거짓으로 취급됩니다.
- **falsy(거짓 취급) 6가지**: `false`, `0`, `""`(빈 문자열), `null`, `undefined`, `NaN`
- 나머지는 전부 truthy (예: `"0"`, `[]`, `{}`는 모두 truthy!)

⚠️ 🐍 Python에서 `[]`, `{}`는 falsy지만, **JS에서 빈 배열·빈 객체는 truthy**입니다. 큰 차이니 주의!

> ⌨️ **미니 실습** — `01-variables.js`
> ```js
> if ([]) console.log("빈 배열도 참!"); // 출력됨 (Python과 다름)
> if ("") console.log("안 나옴");        // 빈 문자열은 거짓 → 출력 안 됨
> ```

### 2-6. 템플릿 리터럴 (문자열 조합)

**② 쉬운 설명**: 백틱(`` ` ``)으로 감싸고 `${...}` 안에 값을 넣습니다. 🐍 Python의 f-string(`f"{x}"`)과 똑같아요.

> ⌨️ **미니 실습** — `01-variables.js`
> ```js
> const model = "GPT";
> const acc = 0.97;
> console.log(`모델 ${model}의 정확도는 ${acc * 100}%`);
> // 모델 GPT의 정확도는 97%
> ```

### ✅ 세션 2 연습문제 (풀고 정답 확인)

⌨️ 문제 — `01-variables.js` 하단에 작성
1. (쉬움) `price`에 12000을 `const`로, `qty`에 3을 담고, 템플릿 리터럴로 `"총액: 36000원"`을 출력하라.
2. (보통) 아래가 `false`인지 `true`인지 **먼저 예상**하고, 출력해 확인하라: `0 === false`, `"" === false`, `null === undefined`.

✅ 정답

```js
// 1
const price = 12000;
const qty = 3;
console.log(`총액: ${price * qty}원`); // 총액: 36000원

// 2 (셋 다 false! === 는 타입까지 보므로)
console.log(0 === false);        // false (number vs boolean)
console.log("" === false);       // false (string vs boolean)
console.log(null === undefined); // false (서로 다른 타입)
```

---

## 3. 세션 3 (오후) — 함수

`02-functions.js` 파일에 작성합니다.

### 3-1. 함수를 만드는 3가지 방법

**① 왜 3개나?**: 역사적 이유로 여러 방식이 있는데, **현대 JS는 대부분 화살표 함수**를 씁니다. 나머지 둘은 "읽을 줄만" 알면 됩니다.

📖 설명용 — 셋 다 같은 일을 함

```js
// (A) 함수 선언식 — 옛날부터 있던 방식
function addA(a, b) {
  return a + b;
}

// (B) 함수 표현식 — 함수를 값으로 변수에 담음
const addB = function (a, b) {
  return a + b;
};

// (C) 화살표 함수 ⭐ — 현대 JS의 기본
const addC = (a, b) => {
  return a + b;
};

// (C-축약) 한 줄이면 중괄호·return 생략 가능
const addD = (a, b) => a + b;
```

**③ 🐍 Python 다리 + JS 자체 설명**: Python의 `def`는 (A)에, `lambda`는 (C)에 가깝습니다. 단 **JS 화살표 함수는 `lambda`와 달리 여러 줄·복잡한 로직도 다 담을 수 있어요.** JS에서는 "거의 모든 함수를 화살표로" 쓴다고 보면 됩니다.

⚠️ **함정 — 축약형의 암묵적 return**: `(a, b) => a + b`는 `a + b`를 **자동으로 return**합니다. 하지만 중괄호를 쓰면 `=> { return a + b; }`처럼 **`return`을 직접 써야** 해요. 중괄호 넣고 `return` 빼먹는 실수가 아주 흔합니다.

> ⌨️ **미니 실습** — `02-functions.js`, 실행 `node 02-functions.js`
> ```js
> const square = (n) => n * n;
> const greet = (name) => `안녕, ${name}!`;
> console.log(square(5));      // 25
> console.log(greet("광명"));  // 안녕, 광명!
> ```

### 3-2. 기본값 · 나머지(rest) · 전개(spread)

**② 쉬운 설명**: Python에 있는 것들과 거의 1:1입니다.
- 기본값 매개변수: `(x = 10) => ...` (🐍 `def f(x=10)`)
- 나머지 매개변수 `...args`: 여러 인자를 배열로 모음 (🐍 `*args`)
- 전개 `...`: 배열/객체를 펼침 (🐍 언패킹 `*`, `**`)

> ⌨️ **미니 실습** — `02-functions.js`
> ```js
> const power = (base, exp = 2) => base ** exp;   // ** = 거듭제곱
> console.log(power(3));      // 9  (exp 기본값 2)
> console.log(power(3, 3));   // 27
>
> const sum = (...nums) => nums.reduce((a, b) => a + b, 0);
> console.log(sum(1, 2, 3, 4)); // 10  (reduce는 세션 4에서 자세히)
>
> const a = [1, 2];
> const b = [...a, 3, 4];      // 전개로 새 배열
> console.log(b);              // [1, 2, 3, 4]
> ```

⚠️ `...`는 위치에 따라 **뜻이 다릅니다.** 함수 매개변수에서는 "모으기(rest)", 배열/호출부에서는 "펼치기(spread)". 헷갈리지 마세요.

### 3-3. 고차 함수 (함수를 값으로)

**② 쉬운 설명**: 함수를 **인자로 넘기거나 반환**하는 함수. JS에서 매우 흔합니다(특히 세션 4의 배열 메서드).
**③ 🐍**: Python에서 `map(fn, xs)`에 함수를 넘기는 것과 같은 개념. JS에선 이게 훨씬 일상적입니다.

> ⌨️ **미니 실습** — `02-functions.js`
> ```js
> const applyTwice = (fn, x) => fn(fn(x));
> console.log(applyTwice((n) => n + 3, 10)); // 16 (10→13→16)
> ```

### ✅ 세션 3 연습문제

⌨️ 문제 — `02-functions.js`
1. (쉬움) 섭씨→화씨 변환 화살표 함수 `toF`를 축약형으로. 공식: `F = C * 9/5 + 32`. `toF(100)` → 212.
2. (보통) `makeMultiplier(n)`을 만들어라. 이 함수는 **"n배 해주는 함수를 반환"**한다. `const triple = makeMultiplier(3); triple(5)` → 15.

✅ 정답

```js
// 1
const toF = (c) => c * 9 / 5 + 32;
console.log(toF(100)); // 212

// 2 (함수를 반환하는 함수 = 클로저, Day 2에서 더 배움)
const makeMultiplier = (n) => (x) => x * n;
const triple = makeMultiplier(3);
console.log(triple(5)); // 15
```

---

## 4. 세션 4 (오후) — 배열 & 객체

`03-arrays-objects.js`에 작성합니다. **오늘의 하이라이트**예요. Python 리스트 컴프리헨션 대신 **메서드 체이닝**에 익숙해지는 게 목표입니다.

### 4-1. 배열 기본 & 핵심 메서드

**② 쉬운 설명**: 배열은 🐍 Python 리스트와 거의 같습니다. `[1, 2, 3]`. 인덱스도 0부터.

가장 많이 쓰는 5개를 5단계로 봅니다. 공통점: **원본을 바꾸지 않고 새 배열/값을 반환**합니다(순수 함수).

**`map` — 각 원소를 변환**
🐍 `[x*2 for x in xs]` 또는 `map(fn, xs)`.

📖 설명용
```js
const nums = [1, 2, 3];
const doubled = nums.map((n) => n * 2); // [2, 4, 6]
```

**`filter` — 조건에 맞는 것만 남김**
🐍 `[x for x in xs if cond]`.
```js
const evens = nums.filter((n) => n % 2 === 0); // [2]
```

**`reduce` — 하나의 값으로 접기(누적)**
🐍 `functools.reduce`. 두 번째 인자가 초깃값입니다.
```js
const total = nums.reduce((acc, n) => acc + n, 0); // 6
// acc=누적값, n=현재원소, 0=초깃값
```

**`find` — 조건 맞는 첫 원소** / **`some`·`every` — 존재/전체 검사**
```js
nums.find((n) => n > 1);        // 2  (첫 번째)
nums.some((n) => n > 2);        // true  (하나라도 있나? 🐍 any())
nums.every((n) => n > 0);       // true  (전부 그런가? 🐍 all())
```

⚠️ **함정 — `forEach`는 값을 반환하지 않습니다**: 단순 반복(부수효과)용이에요. 변환 결과가 필요하면 `map`을 쓰세요.

> ⌨️ **미니 실습** — `03-arrays-objects.js`, 실행 `node 03-arrays-objects.js`
> ```js
> const scores = [88, 92, 45, 70, 99];
> const passed = scores.filter((s) => s >= 60);
> const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
> console.log("합격:", passed);         // 합격: [ 88, 92, 70, 99 ]
> console.log("평균:", avg);            // 평균: 78.8
> ```

### 4-2. 메서드 체이닝 (Python 컴프리헨션의 대체)

**② 쉬운 설명**: `map`/`filter`가 새 배열을 반환하므로 **점(.)으로 이어붙일 수 있습니다.**
🐍 Python이라면 `[x*2 for x in xs if x > 2]`로 한 줄 처리할 걸, JS는 체이닝으로 표현합니다.

> ⌨️ **미니 실습**
> ```js
> const result = [1, 2, 3, 4, 5]
>   .filter((n) => n > 2)   // [3, 4, 5]
>   .map((n) => n * 10);    // [30, 40, 50]
> console.log(result);      // [ 30, 40, 50 ]
> ```

### 4-3. 객체 (딕셔너리와 비슷하지만…)

**② 쉬운 설명**: `{ 키: 값 }` 형태. 🐍 Python 딕셔너리와 비슷하지만 **키에 따옴표를 보통 안 붙이고**, 값 접근을 `obj.key`(점)로 많이 합니다.

📖 설명용
```js
const user = { name: "광명", age: 30 };
console.log(user.name);      // "광명"  (점 접근)
console.log(user["age"]);    // 30      (대괄호 접근도 가능)
user.job = "ML";             // 속성 추가
```

⚠️ 🐍 Python 딕셔너리는 `d["key"]`가 기본이고 없는 키는 `KeyError`. **JS 객체는 없는 키에 접근하면 에러 대신 `undefined`**를 줍니다(세션 2에서 본 그 `undefined`).

### 4-4. 구조 분해 할당 (destructuring) ⭐

**① 왜 중요**: React·Next.js 코드가 이걸 **엄청나게** 씁니다. 지금 익혀두면 나중이 편해요.
**② 쉬운 설명**: 배열/객체에서 값을 **한 번에 여러 변수로 꺼내기**.
**③ 🐍**: Python의 언패킹 `a, b = [1, 2]`나 `name = d["name"]`을 한 방에 하는 것.

> ⌨️ **미니 실습**
> ```js
> // 배열 구조 분해
> const [first, second] = [10, 20];
> console.log(first, second);        // 10 20
>
> // 객체 구조 분해 (키 이름으로 꺼냄)
> const user = { name: "광명", age: 30 };
> const { name, age } = user;
> console.log(name, age);            // 광명 30
> ```

💡 **왜 중요한지 미리보기**: Day 4에서 React 컴포넌트가 `function Chat({ messages, onSend }) { ... }`처럼 **매개변수 자리에서 바로 객체 구조 분해**를 씁니다. 오늘 손에 익혀두세요.

### 4-5. 객체 전개 (spread) — 불변 업데이트

**① 왜 중요**: React에서 **상태를 바꿀 때 "원본을 수정하지 않고 새 객체를 만드는"** 패턴이 필수입니다. 그 기초가 객체 전개예요.
**② 쉬운 설명**: `{ ...old, 바꿀키: 새값 }` = 기존 걸 복사한 새 객체에 일부만 덮어쓰기.

> ⌨️ **미니 실습**
> ```js
> const user = { name: "광명", age: 30 };
> const older = { ...user, age: 31 };   // 복사 + age만 교체
> console.log(user);   // { name: '광명', age: 30 }  (원본 그대로!)
> console.log(older);  // { name: '광명', age: 31 }
> ```

⚠️ 이 "원본 안 건드리고 새 걸 만든다(불변성)"는 감각이 Day 4 `useState`의 핵심입니다. 지금 확실히 잡아두세요.

### ✅ 세션 4 연습문제

⌨️ 문제 — `03-arrays-objects.js`
1. (보통) `products = [{name:"A", price:1000}, {name:"B", price:3000}, {name:"C", price:500}]`에서, **가격 1000 이상인 상품의 이름만** 배열로 뽑아라. (`filter` + `map` 체이닝)
2. (보통) 같은 `products`의 **총 가격 합**을 `reduce`로 구하라.

✅ 정답

```js
const products = [
  { name: "A", price: 1000 },
  { name: "B", price: 3000 },
  { name: "C", price: 500 },
];

// 1
const names = products
  .filter((p) => p.price >= 1000)
  .map((p) => p.name);
console.log(names); // [ 'A', 'B' ]

// 2
const totalPrice = products.reduce((sum, p) => sum + p.price, 0);
console.log(totalPrice); // 4500
```

---

## 5. 종합 실습 — "모델 성능 리포트" 스크립트 ⭐

오늘 배운 걸 한 번에 씁니다. ML 개발자다운 예제로, 모델 실험 기록을 가공해 리포트를 뽑습니다.

⌨️ 실습 — `practice/day1/exercise/model-report.js` 새 파일

```js
const experiments = [
  { model: "baseline", acc: 0.71, params: 1_200_000, ok: true },
  { model: "resnet-lite", acc: 0.86, params: 5_400_000, ok: true },
  { model: "broken-run", acc: 0.0, params: 5_400_000, ok: false },
  { model: "transformer-s", acc: 0.93, params: 22_000_000, ok: true },
];

// 1) 실패한 실험 제외
const valid = experiments.filter((e) => e.ok);

// 2) 정확도 내림차순 정렬 (sort는 원본을 바꾸므로 복사 후 정렬)
const ranked = [...valid].sort((a, b) => b.acc - a.acc);

// 3) 보기 좋은 문자열로 변환
const lines = ranked.map(
  (e, i) => `${i + 1}위 ${e.model}: acc ${(e.acc * 100).toFixed(1)}%`
);

// 4) 집계
const best = ranked[0];
const avgAcc =
  valid.reduce((sum, e) => sum + e.acc, 0) / valid.length;

console.log("=== 유효 실험 순위 ===");
lines.forEach((line) => console.log(line));
console.log(`\n최고 모델: ${best.model}`);
console.log(`평균 정확도: ${(avgAcc * 100).toFixed(1)}%`);
```

⌨️ 실행

```bash
node exercise/model-report.js
```

✅ 기대 출력

```
=== 유효 실험 순위 ===
1위 transformer-s: acc 93.0%
2위 resnet-lite: acc 86.0%
3위 baseline: acc 71.0%

최고 모델: transformer-s
평균 정확도: 83.3%
```

💡 새로 나온 것 2개: 숫자의 `_`(예: `1_200_000`)는 **자릿수 구분자**(🐍 Python과 동일). `.toFixed(1)`은 소수 첫째 자리 반올림 문자열이에요. `\n`은 줄바꿈.
⚠️ `sort`는 **원본 배열을 직접 바꿉니다**(map/filter와 다름). 그래서 `[...valid]`로 복사 후 정렬했어요. 또 `sort`는 기본이 문자열 정렬이라, 숫자는 `(a, b) => b.acc - a.acc`처럼 비교 함수를 꼭 줘야 합니다.

---

## 6. 디버깅 실습 — 버그를 직접 잡아보기

일부러 버그가 있는 코드입니다. **읽고 고쳐 보세요.** (정답은 아래)

⌨️ 실습 — `practice/day1/debug.js`에 그대로 입력하고 실행

```js
const nums = [4, 8, 15, 16, 23, 42];

// 목표: 20보다 큰 값들의 합을 구하기
const bigSum = nums
  .filter((n) => n > 20)
  .reduce((acc, n) => acc + n);

console.log(bigSum);
```

실행하면 결과가 나오긴 하는데… 값이 이상하거나, 배열이 비면 에러가 날 수 있습니다. **무엇이 문제일까요?** (힌트: `reduce`의 두 번째 인자)

<details><summary>정답 보기</summary>

`reduce`에 **초깃값이 없습니다.** 초깃값 없이 `reduce`를 쓰면 배열의 첫 원소를 초깃값으로 삼는데, 만약 `filter` 결과가 **빈 배열이면 `TypeError`**가 납니다("Reduce of empty array with no initial value"). 초깃값 `0`을 넣어 안전하게:

✅ 수정

```js
const bigSum = nums
  .filter((n) => n > 20)
  .reduce((acc, n) => acc + n, 0);   // ← , 0 추가

console.log(bigSum); // 81
```

교훈: **`reduce`는 항상 초깃값을 주는 습관**을 들이세요.
</details>

---

## 7. 🎯 오늘 만난 에러 읽는 법

| 에러 메시지 | 뜻 | 🐍 대응 | 해결 |
|-------------|-----|---------|------|
| `ReferenceError: x is not defined` | 없는 변수 사용 | `NameError` | 오타·선언 누락 확인 |
| `TypeError: Assignment to constant variable` | `const`를 재할당 | (없음) | `let`으로 바꾸거나 재할당 제거 |
| `TypeError: xxx.map is not a function` | 배열이 아닌데 배열 메서드 호출 | `AttributeError` | 그 값이 정말 배열인지 확인(`Array.isArray`) |
| `Reduce of empty array with no initial value` | 빈 배열 + 초깃값 없는 reduce | (없음) | `reduce(..., 0)` 초깃값 |

💡 에러가 뜨면 **첫 줄 + 파일:줄번호**부터 보세요. 대부분 거기서 끝납니다.

---

## 8. ✅ Day 1 최종 체크리스트

- [ ] 저장 시 Prettier 자동 포맷 + ESLint 경고 동작
- [ ] `const`/`let` 구분 사용, `var` 안 씀
- [ ] `===`만 사용 (`==` 안 씀), truthy/falsy 6개 falsy 기억
- [ ] `null` vs `undefined` 차이 설명 가능
- [ ] 화살표 함수(축약형 포함) 작성, 암묵적 return 함정 이해
- [ ] `map`/`filter`/`reduce`/`find`/`some`/`every` 각각 사용
- [ ] 구조 분해 + 객체 전개(불변 업데이트) 사용
- [ ] `model-report.js` 기대 출력 재현
- [ ] 디버깅 실습에서 `reduce` 초깃값 버그를 스스로 고침

---

## 9. git 커밋 (오늘 마무리)

⌨️ 실습 — 저장소 루트에서

```bash
# .gitignore에 node_modules가 있는지 먼저 확인 (없으면 추가)
echo "node_modules/" >> .gitignore

git add .
git commit -m "Day 1: 개발환경(ESLint/Prettier) + JS 코어 문법 실습"
```

💡 커밋 메시지는 "무엇을 했는지" 한 줄로. 매일 이렇게 남기면 나중에 회고가 편합니다.

---

## 10. Day 2 미리보기

내일은 **비동기 + 모듈**입니다. 오늘 배운 함수·배열이 곧바로 재료가 돼요.

- 스코프·**클로저**(오늘 `makeMultiplier`가 사실 클로저였어요)
- **이벤트 루프**와 `async/await` (🐍 asyncio와 비교)
- `fetch`로 진짜 API 호출, `Promise.all` 병렬 처리
- `import`/`export`로 파일 나누기 (오늘의 `"type": "module"` 이야기)

💡 시작할 때 로드맵을 붙이고 **"Day 2 상세 자료 만들어줘"**라고 요청하세요.

---

## 부록 — Python ↔ JS 치트시트 (Day 1분)

| 개념 | 🐍 Python | 🟨 JavaScript |
|------|-----------|---------------|
| 변수 선언 | `x = 3` | `const x = 3;` / `let x = 3;` |
| 문자열 조합 | `f"{a}"` | `` `${a}` `` |
| 없음 | `None` | `null` / `undefined` (둘) |
| 같음 비교 | `==` | `===` (항상 이것) |
| 참/거짓 | `True`/`False` | `true`/`false` (소문자) |
| 리스트 변환 | `[f(x) for x in xs]` | `xs.map(f)` |
| 리스트 필터 | `[x for x in xs if c]` | `xs.filter(fn)` |
| 누적 | `reduce(fn, xs, 0)` | `xs.reduce(fn, 0)` |
| 존재/전체 | `any()` / `all()` | `.some()` / `.every()` |
| 익명 함수 | `lambda x: x+1` | `(x) => x + 1` |
| 언패킹 | `a, b = xs` | `const [a, b] = xs;` |
| dict 접근 | `d["k"]` (없으면 에러) | `obj.k` (없으면 `undefined`) |
| dict 복사+수정 | `{**d, "k": v}` | `{ ...obj, k: v }` |
| 가변 인자 | `*args` | `...args` |

오늘도 수고했습니다. 손으로 친 코드가 많을수록 내일이 쉬워집니다. 🟨
