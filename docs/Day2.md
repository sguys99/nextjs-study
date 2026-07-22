# Day 2 — 비동기 + 모듈 + JavaScript 심화

> **소요 시간**: 8시간 (90분 학습 + 15분 휴식 × 4세션)
> **선행 조건**: Day 1 완료 (`practice/day1/`에 린팅 환경 완비, `map`/`filter`/`reduce`·구조 분해·화살표 함수 체화)
> **목표**: JS의 **비동기 모델**(이벤트 루프·Promise·async/await)과 **모듈 시스템**(import/export)을 Python asyncio와 대조하며 손으로 익힌다. 이 둘은 **Next.js의 토대**다 — 서버에서 `async/await`로 데이터를 가져오고, 파일을 `import`로 배선하는 게 Day 5부터 매 순간 나온다.
> **핵심 태그**: 🐍 = 파이썬 대비 포인트 · 💡 = 팁 · ⚠️ = 함정

---

## 0. 오늘의 목적 & 저장소에 실습 배치하기

Day 1은 **"동기적으로, 위에서 아래로" 도는 JS 문법**이었습니다. 오늘은 그 실행 흐름이 **시간 축으로 늘어나는** 세계로 들어갑니다. "지금 당장 값이 없고, 나중에 도착하는" 데이터를 다루는 법 — 이게 비동기입니다.

당신은 이미 `asyncio`로 이 개념을 알고 있어요. 그래서 Day 2의 진짜 목표는 "비동기를 이해하는 것"이 아니라 **"파이썬 async 습관을 JS async 습관으로 번역하고, JS만의 함정 3~4개를 피하는 것"**입니다. 키워드(`async`/`await`)가 같아서 오히려 방심하기 쉬운데, **이벤트 루프의 동작·`fetch`의 에러 처리·모듈 확장자** 같은 곳에 파이썬과 다른 지뢰가 있습니다. 거기에 집중하세요.

### 0-1. 저장소 구조 (Day 2 추가분)

Day 1과 동일한 규칙으로 `practice/day2/`를 새로 만듭니다.

```
nextjs-study/
├── docs/
│   ├── roadmap.md
│   ├── Day0.md
│   ├── Day1.md
│   └── Day2.md              ← 지금 이 문서
└── practice/
    ├── day1/                (어제 것)
    └── day2/                ← 오늘 새로 만듦
        ├── package.json
        ├── eslint.config.js
        ├── .prettierrc
        ├── .vscode/
        │   └── settings.json
        ├── 01-scope-closure.js
        ├── 02-async-basics.js
        ├── 03-fetch-promise.js
        ├── 04-modules/
        │   ├── math.js
        │   └── main.js
        └── exercise/
            ├── github-lib.js
            └── github-report.js
```

### 0-2. 시작 전 준비 (2분) — Day 1 설정 재활용

Day 1에서 만든 린팅/포맷 설정을 **그대로 복사**해 옵니다. (매번 처음부터 만들 필요 없음)

```bash
# 저장소 루트에서
mkdir -p practice/day2/.vscode
cd practice/day2

# Day 1의 설정 파일 4개를 복사 (macOS/Linux 기준)
cp ../day1/eslint.config.js .
cp ../day1/.prettierrc .
cp ../day1/.vscode/settings.json .vscode/

# package.json은 새로 초기화
pnpm init
```

그리고 `package.json`을 Day 1과 동일하게 다듬습니다. **`"type": "module"`을 꼭 넣으세요** — 오늘 세션 4에서 그 정체를 정확히 밝힙니다.

```json
{
  "name": "day2",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

💡 **Windows(cp 없이)**: 탐색기에서 복사하거나 PowerShell `Copy-Item ..\day1\eslint.config.js .` 를 쓰세요. 핵심은 "설정 파일 3개 + `.vscode/settings.json`이 day2에도 있다"는 것뿐입니다.

⚠️ 새 폴더에서 `pnpm add`를 하면 여기에도 `node_modules/`가 생깁니다. 루트 `.gitignore`에 `node_modules/`가 있으면 Day 2 폴더 것도 자동으로 무시되니 걱정 마세요.

---

## 1. 세션 1 (오전) — 스코프 · 클로저 · 고차함수

> 새 파일 `01-scope-closure.js`. 이 세션은 "비동기의 준비운동"입니다. 클로저를 모르면 다음 세션의 콜백/Promise가 왜 동작하는지 안 보여요. 또한 클로저는 **React `useState`의 심장**이라 Day 4에서 다시 만납니다.

### 1-1. 스코프 — `let`/`const`는 블록, `var`는 함수

🐍 파이썬의 스코프는 함수 단위(그리고 모듈/전역)입니다. `if`나 `for` 블록은 새 스코프를 만들지 **않죠**.

```python
# 🐍 Python — for 블록은 스코프를 안 만듦
for i in range(3):
    pass
print(i)   # 2  ← 루프 끝난 뒤에도 i가 살아있음
```

🟨 JS의 `let`/`const`는 **블록 스코프**입니다. `{ }` 안에서 선언하면 그 밖에선 안 보입니다.

```js
{
  const secret = 42;
  console.log(secret); // 42
}
// console.log(secret);  // ❌ ReferenceError: secret is not defined

for (let i = 0; i < 3; i++) {
  // i는 이 블록 안에서만 유효
}
// console.log(i);  // ❌ 파이썬과 달리 여기선 i가 없음
```

⚠️ **`var`는 함수 스코프라 함정투성이**입니다. 블록을 무시하고 함수 전체로 새어 나갑니다. `var`를 안 쓰는 이유가 이겁니다.

```js
if (true) {
  var leaked = "샘";
}
console.log(leaked); // "샘"  ⚠️ 블록 밖인데도 보임 (var는 블록을 무시)
```

💡 한 줄 규칙: **`const` 기본, 바뀌면 `let`, `var`는 절대 안 씀.** Day 1과 동일합니다.

### 1-2. 클로저 — "함수가 자기 태어난 환경을 기억한다"

클로저는 **함수가 정의된 위치의 바깥 변수를 계속 붙잡고 있는** 현상입니다. 파이썬에도 있습니다(중첩 함수).

```python
# 🐍 Python
def make_counter():
    count = 0
    def counter():
        nonlocal count      # ← 재할당하려면 nonlocal 필요
        count += 1
        return count
    return counter

c = make_counter()
print(c(), c(), c())   # 1 2 3
```

```js
// 🟨 JS — 완전히 같은 개념
function makeCounter() {
  let count = 0;
  return () => {
    count += 1; // ← nonlocal 선언 불필요 (JS는 자동으로 바깥 변수를 잡음)
    return count;
  };
}

const counter = makeCounter();
console.log(counter(), counter(), counter()); // 1 2 3
```

🐍 **결정적 차이**: 파이썬은 바깥 변수를 **재할당**하려면 `nonlocal`을 명시해야 합니다. JS는 그런 선언이 없습니다 — 안쪽 함수가 바깥 변수를 그냥 잡아서 읽고 씁니다. 파이썬 습관으로 `nonlocal`을 찾지 마세요.

**클로저 = "비공개 상태"**: `count`는 `makeCounter` 밖에서 직접 접근할 방법이 없습니다. 반환된 함수만 만질 수 있죠. 이게 JS에서 캡슐화를 만드는 고전적 방법입니다.

```js
// 클로저로 "설정을 담은 함수 공장" 만들기 (Day 1의 makeMultiplier 확장판)
const makeGreeter = (greeting) => (name) => `${greeting}, ${name}!`;
```

⚠️ **화살표가 두 개**라 처음엔 안 읽힙니다. 새 문법이 아니라 **"함수를 반환하는 함수"를 줄여 쓴 것**뿐입니다. 풀어 쓰면:

```js
// 위 한 줄과 완전히 동일한 코드
const makeGreeter = (greeting) => {
  return (name) => {
    return `${greeting}, ${name}!`;
  };
};
```

화살표 함수는 `{ return X; }`를 `X`로 줄일 수 있죠(Day 1). 그 축약을 **두 겹 다** 적용하면 원래의 한 줄이 됩니다. 즉 **`=>`가 두 개 = 인자를 두 번 나눠 받는다**는 뜻입니다.

🐍 파이썬으로 쓰면 이미 아는 그 모양입니다:

```python
def make_greeter(greeting):
    def greeter(name):
        return f"{greeting}, {name}!"
    return greeter
```

**그래서 호출도 두 번**입니다. `makeGreeter("Hello")`는 인사말이 아니라 **함수**를 돌려줍니다.

```js
const hello = makeGreeter("Hello"); // ① 아직 인사 안 함. hello는 "함수"
console.log(hello); // [Function (anonymous)]  ← 문자열이 아님!
console.log(hello("Kim")); // ② 이제 실행 → "Hello, Kim!"

// 두 번 호출을 한 줄로 붙여 쓸 수도 있음 (괄호가 두 쌍)
console.log(makeGreeter("안녕")("Kim")); // "안녕, Kim!"
```

여기서 **클로저가 하는 일**: ①이 끝난 시점에 `makeGreeter`는 이미 종료됐는데, 반환된 `hello` 안에서는 `greeting`("Hello")이 **아직 살아 있습니다**. 바로 위 `makeCounter`의 `count`와 똑같은 원리죠. 그래서 아래 둘은 **각자 다른 `greeting`을 기억하는 별개의 함수**가 됩니다.

```js
const hello = makeGreeter("Hello");
const annyeong = makeGreeter("안녕");
console.log(hello("Kim")); // "Hello, Kim!"
console.log(annyeong("Kim")); // "안녕, Kim!"
```

💡 이 "설정은 미리 받고, 데이터는 나중에" 패턴은 React 이벤트 핸들러에서 그대로 재등장합니다 — `const onDelete = (id) => () => remove(id);` 후 `onClick={onDelete(3)}`. Day 4에서 다시 봅니다.

### 1-3. ⚠️ 클로저 + 루프의 고전 함정 (`var` vs `let`)

이건 JS 면접 단골이자, `var`를 없애야 하는 결정적 이유입니다. 코드를 보기 전에 **용어 두 개**를 먼저 정리합니다 — 이 둘을 모르면 아래 예제가 안 읽혀요.

#### ① 콜백(callback) = "지금 말고, 나중에 대신 불러줄 함수"

함수를 **호출해서 결과를 넘기는 것**과 함수 **자체를 넘기는 것**은 완전히 다릅니다. 파이썬으로 보면 이미 아는 구분이죠 — **괄호가 붙었냐 안 붙었냐**입니다.

```python
# 🐍 Python
print(len("abc"))     # ① len을 "지금 실행"한 결과(3)를 넘김
cb = len              # ② len이라는 "함수 자체"를 넘김 (아직 실행 안 됨)
cb("abc")             # ③ 나중에 원할 때 실행 → 3
```

JS도 똑같습니다. `f()`는 실행, `f`는 함수 자체. 이렇게 **누군가에게 인자로 넘겨져서 "나중에" 대신 호출되는 함수를 콜백**이라고 부릅니다. `map`에 넘기는 `(n) => n * 2`도 콜백이고(Day 1), 아래 `setTimeout`에 넘기는 것도 콜백입니다.

#### ② `setTimeout(콜백, 밀리초)` = "이 함수를 N밀리초 뒤에 실행해줘" 예약

```js
setTimeout(() => console.log("3초 뒤 안녕"), 3000);
console.log("먼저 나옴");

// 출력:
// 먼저 나옴        ← 즉시
// 3초 뒤 안녕      ← 3초 후
```

🐍 여기가 파이썬과 갈리는 지점입니다. `time.sleep(3)`은 **그 줄에서 3초 멈추지만**, `setTimeout`은 **예약만 걸어두고 즉시 다음 줄로 넘어갑니다**. 그래서 "먼저 나옴"이 먼저 찍히죠. (자세한 건 세션 2에서)

⚠️ 그래서 첫 인자에는 **반드시 함수를 넘겨야** 합니다. 괄호를 붙이는 순간 예약이 아니라 즉시 실행이 돼버립니다.

```js
setTimeout(console.log("안녕"), 1000); // ❌ 지금 당장 찍히고, 그 결과(undefined)를 예약
setTimeout(() => console.log("안녕"), 1000); // ✅ () => {}로 감싸서 "나중에 할 일"로 포장
```

#### ③ 문제의 코드

```js
// ❌ var — 클로저가 "같은 하나의 i"를 공유 (루프 끝난 뒤의 i=3을 봄)
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log("var:", i), 0);
}
// 출력: var: 3  var: 3  var: 3

// ✅ let — 반복마다 "새로운 j"가 생겨서 각자 붙잡음
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log("let:", j), 0);
}
// 출력: let: 0  let: 1  let: 2
```

⚠️ `0`밀리초인데도 루프 도중이 아니라 **루프가 완전히 끝난 뒤에** 실행됩니다. `setTimeout`은 "0초 뒤"가 아니라 "지금 하던 동기 코드 다 끝나면"이라는 뜻에 가깝습니다. 이 함정의 핵심이 바로 이 시차예요.

**왜 `var`는 전부 3인가**: `var i`는 함수 스코프라 루프 전체에 **변수 `i`가 딱 하나**입니다. 루프는 예약만 3번 걸고 즉시 끝나고(그 시점에 `i`는 3), 그 **뒤에** 콜백 3개가 실행됩니다. 세 콜백 모두 "그 하나뿐인 `i`"를 들여다보니 전부 3이죠.

#### ④ 바인딩(binding) = "이름표와 저장 공간의 연결"

`let`은 반복마다 **새로운 바인딩**을 만든다 — 이 말이 핵심인데, 바인딩이란 `j`라는 **이름표가 어느 메모리 칸에 붙어 있는지의 연결**을 뜻합니다. 상자에 붙인 라벨이라고 생각하세요.

| | 상자(칸) 개수 | 콜백이 보는 것 | 결과 |
|---|---|---|---|
| `var i` | **1개** (이름표 `i` 하나가 계속 같은 칸) | 세 콜백이 **같은 칸** | 3, 3, 3 |
| `let j` | **3개** (반복마다 칸을 새로 만들고 이름표를 새로 붙임) | 각자 **자기 회차의 칸** | 0, 1, 2 |

🐍 파이썬에도 **같은 함정이 있습니다**. `fns = [lambda: i for i in range(3)]`를 만들고 하나씩 호출하면 전부 `2`가 나오죠. 파이썬은 이걸 기본 인자로 값을 복사해 우회하지만(`lambda i=i: i`), JS는 `let`이 언어 차원에서 해결해 줍니다.

💡 **오늘의 교훈**: 클로저는 **값을 복사하는 게 아니라 변수(바인딩)를 참조**합니다. 그래서 그 변수가 나중에 바뀌면 클로저가 보는 값도 같이 바뀝니다. 위 `makeCounter`의 `count`가 호출할 때마다 늘어나던 것도 정확히 같은 원리예요.

### 1-4. 고차함수 복습 — 콜백은 어디에나 있다

1-3에서 본 "나중에 불릴 함수"가 콜백이었죠. Day 1의 `map`/`filter`가 "함수를 인자로 받는 함수"였던 것도 같은 얘기입니다. 비동기의 출발점이라 이름을 확실히 붙여둡니다.

```js
// map에 넘긴 (n) => n * 2 가 바로 콜백
[1, 2, 3].map((n) => n * 2);

// 직접 콜백을 받는 함수 만들기
const repeat = (n, callback) => {
  for (let i = 0; i < n; i++) callback(i);
};
repeat(3, (i) => console.log("반복", i)); // 반복 0, 반복 1, 반복 2
```

🐍 파이썬에서 함수를 인자로 넘기는 것과 똑같습니다. JS는 이게 **훨씬 일상적**이고, 특히 "작업이 끝나면 이 함수를 불러줘" 식의 비동기 콜백으로 계속 나옵니다.

### 1-5. `this`는 "개념만" (로드맵 방침)

로드맵에서 "`this` 바인딩은 깊게 안 판다"고 한 이유를 지금 확인합니다. 결론부터: **화살표 함수만 쓰면 `this` 함정 대부분을 자동으로 피합니다.**

```js
const obj = {
  value: 42,
  // ❌ 일반 함수 콜백: 안쪽 this가 obj를 잃어버림
  brokenMethod() {
    setTimeout(function () {
      console.log("broken:", this.value); // undefined
    }, 10);
  },
  // ✅ 화살표 함수 콜백: 바깥 this(obj)를 그대로 유지
  workingMethod() {
    setTimeout(() => {
      console.log("working:", this.value); // 42
    }, 10);
  },
};

obj.brokenMethod();
obj.workingMethod();
```

🐍 파이썬은 `self`를 **명시적으로** 첫 인자로 받으니 이런 혼란이 없습니다. JS의 `this`는 "누가 어떻게 호출했느냐"에 따라 **암묵적으로** 바뀌는데, 화살표 함수는 이 규칙을 안 따르고 "정의된 곳의 `this`"를 고정합니다.

💡 **지금 외울 것은 딱 하나**: "콜백은 화살표 함수로 쓴다." 왜 그런지의 세부 규칙(`bind`/`call`/`apply`)은 모던 코드에서 거의 안 쓰이니 지금은 넘어갑니다.

### ✅ 세션 1 체크
- [x] `let`/`const`는 블록 스코프, `var`는 함수 스코프임을 이해
- [x] 클로저로 "비공개 상태를 가진 함수" 작성 (카운터 등)
- [x] `var` 루프 함정과 `let`이 고치는 이유를 설명 가능
- [x] 콜백 = "인자로 넘기는 함수"임을 인지
- [x] "콜백은 화살표 함수로" 규칙 체득

---

## 2. 세션 2 (오전) — 비동기 ① 이벤트 루프 · Promise · async/await

> 새 파일 `02-async-basics.js`. **당신에게 가장 익숙하면서도 함정이 있는 세션**입니다. 개념(비동기·이벤트 루프)은 알고 있으니, JS만의 동작과 문법 배선에 집중하세요.

📌 **코드 블록 읽는 법** — 2-1~2-7의 코드는 전부 **개념 설명용 조각**입니다(🐍 표시된 파이썬 블록은 대조용이라 칠 필요 없음). **실제로 `02-async-basics.js`에 쳐서 돌릴 코드는 [2-8의 최종본](#2-8-02-async-basicsjs-최종본--실제로-칠-코드) 하나**뿐이에요. 조각들을 이어붙이려 하지 말고, 먼저 쭉 읽은 뒤 2-8을 한 번에 치세요.

### 2-1. 왜 비동기인가 (30초 복습)

파일 읽기·네트워크 요청 같은 I/O는 시간이 걸립니다. 그 시간 동안 프로그램이 **멈춰서 기다리면(blocking)** 아무 일도 못 합니다. 비동기는 "요청만 걸어두고, 결과가 올 때까지 다른 일을 하다가, 도착하면 이어서 처리"하는 방식입니다. 🐍 `asyncio`로 이미 아는 그 개념 그대로입니다.

### 2-2. 이벤트 루프 멘탈 모델 (🐍 asyncio와 비교)

| | 🐍 Python asyncio | 🟨 JavaScript |
|---|---|---|
| 스레드 | 기본은 싱글, 필요시 멀티스레드/프로세스 가능 | **항상 싱글 스레드, 이벤트 루프 1개** |
| 이벤트 루프 시작 | `asyncio.run(main())`로 **명시적으로** 켬 | **런타임이 항상 켜 둠** (내가 시작 안 함) |
| async 함수 실행 | 반드시 루프 안에서 | 그냥 호출하면 됨 |
| 비동기 잠깐 멈춤 | `await asyncio.sleep(1)` | `await sleep(1000)` (직접 구현, 아래) |
| 병렬 대기 | `await asyncio.gather(a, b)` | `await Promise.all([a, b])` |

⚠️ **가장 중요한 차이**: JS는 **이벤트 루프가 무조건 1개, 무조건 싱글 스레드**입니다. CPU를 오래 잡는 동기 코드(무거운 for 루프 등)를 짜면 **전체가 얼어붙습니다** — 서버라면 다른 모든 요청까지 멈춰요. 파이썬은 그나마 스레드/프로세스로 우회할 여지가 있지만, JS는 "무거운 계산은 비동기로 쪼개거나 밖으로 빼라"가 철칙입니다.

### 2-3. `setTimeout` — 비동기의 가장 단순한 형태

`setTimeout(콜백, 밀리초)`는 "지정 시간 뒤에 콜백을 실행 큐에 넣어줘"입니다.

💡 **콜백 다시 확인** (1-3 ①): 콜백은 **인자로 넘겨져서 나중에 남이 대신 호출하는 함수**입니다. 구분은 **괄호 하나**뿐이에요 — `f()`는 "지금 실행한 결과(값)", `f`는 "함수 자체". 🐍 `print(len("abc"))` vs `cb = len` 의 그 구분입니다. `sorted(xs, key=len)`의 `key=len`도 파이썬 쪽 콜백이고요. 여기서부터 나오는 `setTimeout`·`.then`·`resolve` 인자가 전부 콜백입니다.

```js
console.log("1. 시작");
setTimeout(() => console.log("2. 1초 뒤"), 1000);
console.log("3. 끝");

// 출력 순서:
// 1. 시작
// 3. 끝        ← setTimeout은 기다리지 않고 넘어감 (non-blocking)
// 2. 1초 뒤    ← 1초 후에 실행
```

🐍 파이썬의 `time.sleep(1)`은 **블로킹**(그 줄에서 멈춤)이지만, `setTimeout`은 **논블로킹**(예약만 하고 지나감)입니다. 헷갈리지 마세요.

### 2-4. Promise — "나중에 값이 올 상자" (🐍 Future/awaitable)

Promise는 "지금은 없지만 나중에 성공(resolve) 또는 실패(reject)할 값"을 담는 객체입니다. 🐍 파이썬의 Future/코루틴이 `await` 가능한 것과 같은 자리입니다.

#### ① 용어 정리 — Future · 코루틴 · await

셋을 뭉뚱그리기 쉬운데, 역할이 각각 다릅니다.

| 🐍 Python | 뜻 | 🟨 JS 대응 |
|---|---|---|
| **코루틴** | `async def f()`를 **호출하면 나오는 객체**. 아직 안 돎 — "실행 계획서" | async 함수 호출 결과 = **Promise** |
| **Future** | "나중에 값이 채워질 **빈 상자**" | **Promise** |
| **await** | 상자가 채워질 때까지 **내 함수만 멈추고** 제어권을 이벤트 루프에 반납, 채워지면 이어서 실행 | **await** (동일) |

**`await`가 하는 일은 두 가지**입니다 — 분리해서 기억하세요.
1. **대기**: 그동안 이벤트 루프는 다른 일을 함 (`time.sleep`처럼 전체를 멈추는 게 아님)
2. **포장 벗기기**: `Promise<42>` → `42`

⚠️ **파이썬과의 진짜 차이 — 게으르냐 부지런하냐**: 파이썬 코루틴은 **게으릅니다**(`await` 하기 전엔 한 줄도 안 돎). JS Promise는 **부지런합니다**(만드는 순간 이미 작업 시작, `await`는 결과만 받음).

```js
const p = fetch(url); // ← 여기서 이미 요청이 나감
console.log("다른 일"); // 요청이 날아가는 동안 실행됨
const res = await p; // 결과만 받음
```

```python
# 🐍 여기선 아무 요청도 안 나감 — await 해야 비로소 시작
coro = fetch(url)
```

💡 세션 3의 `Promise.all`이 병렬이 되는 이유가 이겁니다. 배열에 담긴 시점에 이미 다 출발했거든요.

#### ② Promise 직접 만들기 — `new`부터

```js
// Promise 직접 만들기 (보통은 라이브러리가 만들어 주지만, 이해를 위해)
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("데이터 도착!"); // 성공 → resolve로 값 전달
    // reject(new Error("실패")); // 실패 → reject로 에러 전달
  }, 500);
});

// 소비하는 옛날 방식: .then / .catch
promise
  .then((value) => console.log("성공:", value))
  .catch((err) => console.log("실패:", err.message));
```

**`new` = 파이썬의 클래스 인스턴스 생성.** 새 문법이 아니라 `__init__`을 부르는 것뿐입니다.

```python
# 🐍 Python — 클래스를 그냥 호출
e = Exception("실패")
d = datetime.now()
```

```js
// 🟨 JS — 클래스 앞에 new를 반드시 붙임
const e = new Error("실패");
const d = new Date();
const p = new Promise(...);
```

⚠️ 안 붙이면 `TypeError: Promise constructor cannot be invoked without 'new'`가 납니다. 파이썬은 클래스도 함수처럼 그냥 부르지만, **JS는 "이건 인스턴스 생성이다"를 `new`로 명시**합니다.

**생성자가 받는 인자는 함수 하나**(executor)입니다. 그리고 그 함수는 **Promise가 만들어서 넘겨주는 `resolve`/`reject` 두 함수**를 받습니다.

- `resolve`/`reject`는 **내가 정의하는 게 아니라 받아쓰는 것**입니다. 이름은 아무거나 써도 되고(순서로 결정), **호출만 하면 됩니다**.
- executor는 `new` 하는 **즉시 실행**됩니다.
- `resolve("데이터 도착!")`을 부르는 순간 상태가 `pending → fulfilled`로 확정되고 값이 저장됩니다. 한 번 확정되면 두 번째 `resolve`/`reject`는 무시됩니다.
- 즉 **"이 Promise가 언제 끝난 걸로 칠지"를 내가 직접 누르는 스위치**가 `resolve`/`reject`입니다.

🐍 Future를 직접 만들어 채우는 코드와 정확히 대응됩니다.

```python
# 🐍 Python — 빈 상자를 만들고 나중에 채우기
fut = asyncio.get_running_loop().create_future()
loop.call_later(0.5, lambda: fut.set_result("데이터 도착!"))  # ≈ resolve(...)
# fut.set_exception(Exception("실패"))                        # ≈ reject(...)
value = await fut  # "데이터 도착!"
```

**`.then` / `.catch`에 넘기는 것도 전부 콜백**입니다 — "상자가 채워지면 이 함수 좀 불러줘"라는 예약이죠(🐍 `fut.add_done_callback(...)`). `await`는 이 등록을 문법으로 감춘 것뿐이라, 아래 둘은 완전히 같은 일을 합니다.

```js
// 위 .then/.catch와 동일
try {
  const value = await promise;
  console.log("성공:", value);
} catch (err) {
  console.log("실패:", err.message);
}
```

**실행 순서**를 따라가 보세요.

```
1. new Promise(...)   → executor 즉시 실행 → setTimeout 예약만 걸고 통과
2. .then/.catch 등록  → "나중에 불러줘" 예약만 함
3. (동기 코드 전부 끝남)
4. 500ms 후 → resolve("데이터 도착!") → 상자 확정
5. 등록해둔 .then 콜백 실행 → "성공: 데이터 도착!"
```

직접 찍어서 확인해 보세요.

```js
const p = new Promise((resolve) => {
  console.log("executor는 즉시 실행됨"); // ← 이게 먼저 찍히는지 확인
  setTimeout(() => resolve("데이터 도착!"), 500);
});
console.log("동기 코드가 먼저 끝남");
console.log(await p); // 500ms 뒤 "데이터 도착!"
```

💡 **실전 필수 패턴 — `sleep` 만들기**: `asyncio.sleep`에 해당하는 게 JS엔 기본 제공이 안 됩니다. Promise로 직접 만듭니다. 이 한 줄은 통째로 외워두면 두고두고 씁니다.

```js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// 사용: await sleep(1000);  → 🐍 await asyncio.sleep(1)
```

💡 이제 이 한 줄이 읽힙니다: "ms 뒤에 `resolve`를 불러주는 상자". `setTimeout(resolve, ms)`에서 **`resolve`에 괄호가 없죠** — 함수 자체를 콜백으로 넘긴 겁니다. 실패할 일이 없으니 `reject`는 아예 안 받았고요.

### 2-5. 콜백 → Promise → async/await (진화 3단계)

같은 "1초 뒤 인사"를 세 가지 방식으로:

```js
// ① 콜백 지옥 (옛날 방식) — 중첩되면 오른쪽으로 계속 밀림
setTimeout(() => {
  console.log("Kim");
  setTimeout(() => {
    console.log("반가워요");
  }, 500);
}, 500);

// ② Promise 체이닝 — 그나마 평평해짐
sleep(500)
  .then(() => console.log("Kim"))
  .then(() => sleep(500))
  .then(() => console.log("반가워요"));

// ③ async/await — 동기 코드처럼 위→아래로 읽힘 ⭐ 우리가 쓸 방식
async function greet() {
  await sleep(500);
  console.log("Kim");
  await sleep(500);
  console.log("반가워요");
}
greet();
```

🐍 **③번은 파이썬과 거의 판박이**입니다:

```python
# 🐍 Python
async def greet():
    await asyncio.sleep(0.5)
    print("Kim")
    await asyncio.sleep(0.5)
    print("반가워요")
```

차이는 딱 하나 — 파이썬은 `asyncio.run(greet())`로 루프를 켜야 하지만, JS는 `greet()`만 호출하면 됩니다(루프가 이미 돌고 있으니까).

### 2-6. async 함수의 반환값은 항상 Promise

⚠️ `async` 함수는 **무엇을 return하든 그 값을 Promise로 감싸서** 돌려줍니다. 그래서 결과를 쓰려면 다시 `await` 해야 합니다.

```js
async function getNumber() {
  return 42; // 42를 반환하는 것처럼 보이지만...
}

const result = getNumber();
console.log(result); // Promise { 42 }  ⚠️ 숫자가 아니라 Promise!

async function main() {
  const value = await getNumber(); // await 해야 42가 나옴
  console.log(value); // 42
}
main();
```

🐍 파이썬에서 `async def`를 그냥 호출하면 코루틴 객체가 나오고 `await` 해야 실제 값이 나오는 것과 **정확히 같습니다.**

### 2-7. ⚠️ 실행 순서 함정 (마이크로태스크 vs 매크로태스크)

이건 "왜 순서가 이렇지?" 하고 한 번쯤 당황하는 지점이라 미리 봅니다. **Promise(마이크로태스크)가 `setTimeout`(매크로태스크)보다 먼저** 처리됩니다.

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");

// 출력: 1, 4, 3, 2
//  - 1, 4: 동기 코드 먼저
//  - 3: Promise(마이크로태스크)가 다음 순번
//  - 2: setTimeout(매크로태스크)은 그 뒤
```

💡 지금은 "**동기 코드 → Promise → setTimeout** 순서"라는 감만 있으면 충분합니다. 깊은 큐 이론은 나중에 필요할 때.

### 2-8. `02-async-basics.js` 최종본 — ⭐ 실제로 칠 코드

여기까지가 전부 설명이었고, **파일에 실제로 넣을 건 이 하나**입니다. 위 조각들을 순서가 섞이지 않게 다듬고 이어붙인 것이라 그대로 치고 돌리면 됩니다.

```js
// 02-async-basics.js — 세션 2 실습 전체
// 실행: node 02-async-basics.js   (package.json에 "type": "module" 필요)

// 2-4. sleep 헬퍼 — 아래에서 계속 씀 (통째로 외우기)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── 2-3. setTimeout은 논블로킹 ───
console.log("[2-3] 1. 시작");
setTimeout(() => console.log("[2-3] 2. 1초 뒤"), 1000);
console.log("[2-3] 3. 끝");
await sleep(1100); // 위 타이머가 끝나는 걸 보고 다음 절로 넘어감

// ─── 2-4. Promise 직접 만들기 ───
const promise = new Promise((resolve, reject) => {
  console.log("[2-4] executor는 new 하는 즉시 실행됨");
  setTimeout(() => resolve("데이터 도착!"), 500);
  // reject(new Error("실패")); // ← 주석을 풀면 .catch로 감
});

promise
  .then((value) => console.log("[2-4] .then 성공:", value))
  .catch((err) => console.log("[2-4] .catch 실패:", err.message));

console.log("[2-4] 동기 코드가 먼저 끝남");
console.log("[2-4] await 결과:", await promise); // .then과 같은 일

// ─── 2-5. async/await로 순차 실행 ───
async function greet() {
  await sleep(500);
  console.log("[2-5] Kim");
  await sleep(500);
  console.log("[2-5] 반가워요");
}
await greet();

// ─── 2-6. async 함수의 반환값은 항상 Promise ───
async function getNumber() {
  return 42;
}
console.log("[2-6] await 없이:", getNumber()); // Promise { 42 }
console.log("[2-6] await 하면:", await getNumber()); // 42

// ─── 2-7. 실행 순서 함정 ───
console.log("[2-7] 1");
setTimeout(() => console.log("[2-7] 2 (setTimeout)"), 0);
Promise.resolve().then(() => console.log("[2-7] 3 (Promise)"));
console.log("[2-7] 4");
// 출력: 1, 4, 3, 2
```

```bash
node 02-async-basics.js
```

기대 출력 (**소스 순서와 다른 줄**이 오늘의 핵심입니다):

```
[2-3] 1. 시작
[2-3] 3. 끝                          ← ⚠️ 2번보다 먼저 (setTimeout은 논블로킹)
[2-3] 2. 1초 뒤
[2-4] executor는 new 하는 즉시 실행됨   ← ⚠️ new 하는 순간 바로 실행
[2-4] 동기 코드가 먼저 끝남
[2-4] .then 성공: 데이터 도착!
[2-4] await 결과: 데이터 도착!
[2-5] Kim
[2-5] 반가워요
[2-6] await 없이: Promise { 42 }      ← ⚠️ 42가 아니라 Promise
[2-6] await 하면: 42
[2-7] 1
[2-7] 4
[2-7] 3 (Promise)                    ← ⚠️ 마이크로태스크가 먼저
[2-7] 2 (setTimeout)
```

💡 `await sleep(1100)`이 절과 절 사이에 있는 이유: 이게 없으면 세 절의 타이머가 뒤섞여서 출력이 엉킵니다. 실습 편의를 위한 구분선이지, 실무 패턴은 아니에요.

### ✅ 세션 2 체크
- [x] JS는 "항상 싱글 스레드 + 이벤트 루프 1개"임을 이해
- [x] `setTimeout`이 논블로킹(예약 후 통과)임을 확인
- [x] `sleep = (ms) => new Promise(...)` 패턴 작성
- [x] async 함수의 반환값이 Promise라 `await`가 필요함을 이해
- [x] `async/await` 코드가 🐍 asyncio와 거의 같음을 체감

---

## 3. 세션 3 (오후) — 비동기 ② fetch · Promise.all · 에러 처리

> 새 파일 `03-fetch-promise.js`. 이제 **진짜 네트워크 요청**을 보냅니다. Day 6 챗봇이 LLM API를 호출하는 것도 결국 이 `fetch`의 연장입니다.

### 3-1. `fetch` — 표준 HTTP 클라이언트 (🐍 requests/httpx)

Node 24에는 `fetch`가 **기본 내장**(별도 설치 불필요)입니다. `await`로 응답을 받고, `.json()`으로 본문을 파싱합니다.

```js
async function getUser(username) {
  const res = await fetch(`https://api.github.com/users/${username}`);
  const data = await res.json(); // ⚠️ .json()도 비동기라 await 필요
  return data;
}

const user = await getUser("torvalds"); // 최상위 await — 세션 4에서 설명
console.log(user.name, user.public_repos);
```

⚠️ **함정 ①: `await`가 두 번**입니다. `fetch(...)`가 응답 헤더까지 받으면 첫 Promise가 풀리고, 본문을 읽는 `res.json()`이 **또 다른 Promise**입니다. 🐍 파이썬 `requests`는 `r.json()`이 동기라 한 번에 되지만, JS `fetch`는 스트리밍 기반이라 두 단계입니다. 이걸 자꾸 까먹습니다.

### 3-2. ⚠️ 함정 ②: `fetch`는 404·500에서 에러를 안 던진다

이건 파이썬 개발자를 가장 많이 무는 함정입니다. `fetch`는 **네트워크 자체가 실패**해야 reject합니다. 서버가 404나 500을 보내도 "응답은 성공적으로 받았다"고 보고 **정상 통과**시켜요.

```js
async function getUserSafe(username) {
  const res = await fetch(`https://api.github.com/users/${username}`);

  // ✅ 반드시 res.ok(또는 res.status)를 직접 확인해야 함
  if (!res.ok) {
    throw new Error(`GitHub API 오류: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
```

🐍 `requests`는 `raise_for_status()`를 호출해야 에러를 던지죠. `fetch`는 그것조차 없어서 **`res.ok` 체크가 사실상 의무**입니다. `res.ok`는 상태 코드가 200~299면 `true`입니다.

### 3-3. try/catch로 에러 처리

🐍 파이썬 `try/except`와 거의 같습니다. 키워드만 `except` → `catch`.

```js
async function safeMain() {
  try {
    const user = await getUserSafe("이런계정은없음123456789");
    console.log(user.name);
  } catch (err) {
    console.error("문제 발생:", err.message); // 여기로 옴
  } finally {
    console.log("정리 작업 (항상 실행)"); // 🐍 finally 동일
  }
}
safeMain();
```

| JS | 🐍 Python |
|---|---|
| `try { }` | `try:` |
| `catch (err) { }` | `except Exception as err:` |
| `finally { }` | `finally:` |
| `throw new Error("msg")` | `raise Exception("msg")` |
| `err.message` | `str(err)` |

💡 에러 객체는 `new Error("메시지")`로 만들고, 읽을 땐 `.message`로 문자열을 꺼냅니다.

### 3-4. `Promise.all` — 병렬 요청 (🐍 asyncio.gather)

여러 요청을 **동시에** 보내고 전부 기다립니다. 순차로 하면 느리지만, 병렬이면 가장 느린 하나의 시간만 듭니다.

```js
// ❌ 순차 (느림): 하나 끝나야 다음 시작 — 총 시간 = 합
const a = await getUserSafe("torvalds");
const b = await getUserSafe("gvanrossum");

// ✅ 병렬 (빠름): 동시에 쏘고 한꺼번에 기다림 — 총 시간 = 최댓값
const [user1, user2] = await Promise.all([
  getUserSafe("torvalds"),
  getUserSafe("gvanrossum"),
]);
console.log(user1.name, user2.name);
```

🐍 `results = await asyncio.gather(f1(), f2())`와 정확히 대응됩니다. 구조 분해 `const [a, b] = ...`로 결과를 꺼내는 것까지 파이썬 언패킹과 똑같죠.

⚠️ **`Promise.all`은 하나라도 실패하면 전체가 reject**됩니다("all or nothing"). "일부 실패해도 나머지는 받고 싶다"면 `Promise.allSettled`를 쓰세요.

```js
const results = await Promise.allSettled([
  getUserSafe("torvalds"),
  getUserSafe("존재하지않는계정999"),
]);
// results = [
//   { status: "fulfilled", value: {...} },
//   { status: "rejected", reason: Error }
// ]
results.forEach((r) => {
  if (r.status === "fulfilled") console.log("성공:", r.value.name);
  else console.log("실패:", r.reason.message);
});
```

💡 곁다리로 `Promise.race`(가장 먼저 끝난 하나만)도 있습니다 — 타임아웃 구현 등에 씁니다. 지금은 이름만 알아두세요.

### 3-5. (선택) `AbortController` — 요청 취소

사용자가 "취소" 누르거나 타임아웃을 걸 때 진행 중인 `fetch`를 중단합니다. Day 6 스트리밍 챗봇에서 "생성 중단" 버튼의 토대가 됩니다.

```js
const controller = new AbortController();
setTimeout(() => controller.abort(), 2000); // 2초 후 자동 취소

try {
  const res = await fetch("https://api.github.com/users/torvalds", {
    signal: controller.signal,
  });
  console.log(await res.json());
} catch (err) {
  if (err.name === "AbortError") console.log("요청이 취소됨");
  else throw err;
}
```

💡 처음엔 "이런 게 있다"만 알면 됩니다. 실제로는 Day 6에서 SDK가 대신 처리해 줍니다.

### ✅ 세션 3 체크
- [x] `fetch` → `await res.json()` 두 단계 `await` 이해
- [x] `res.ok`로 HTTP 에러를 **직접** 확인 (fetch는 404에 안 던짐)
- [x] `try/catch/finally`로 에러 처리
- [x] `Promise.all`로 병렬 호출 성공
- [x] `Promise.all`(전부 성공)과 `allSettled`(부분 허용) 차이 인지

---

## 4. 세션 4 (오후) — 모듈 & 도구

> 새 파일들: `04-modules/math.js`, `04-modules/main.js`. Day 1에서 넣은 `"type": "module"`의 정체를 오늘 밝힙니다. 코드를 여러 파일로 나누고 합치는 법 — Next.js 프로젝트는 파일 수십 개를 `import`로 엮습니다.

### 4-1. 두 가지 모듈 시스템 — ESM vs CommonJS

JS는 역사적 이유로 모듈 방식이 둘입니다.

| | ES Modules (ESM) ⭐ 우리가 씀 | CommonJS (CJS) 옛날 방식 |
|---|---|---|
| 내보내기 | `export` | `module.exports` |
| 가져오기 | `import` | `require()` |
| 언제 | 모던 JS·Next.js·브라우저 | 오래된 Node 코드·일부 라이브러리 |
| 켜는 법 | `package.json`에 `"type": "module"` | 기본값(아무것도 안 하면 이것) |

🐍 파이썬은 `import` 하나뿐이라 이런 이중성이 없습니다. JS에선 "우리는 ESM을 쓴다"를 `"type": "module"` 한 줄로 선언한 겁니다(Day 1). 그래서 오늘 파일들에서 `import`가 바로 동작합니다.

### 4-2. `export` / `import` — named vs default

`04-modules/math.js`:

```js
// 04-modules/math.js

// ① named export — 이름을 그대로 내보냄 (여러 개 가능)
export const PI = 3.14159;
export const add = (a, b) => a + b;
export const sub = (a, b) => a - b;

// ② default export — 파일당 딱 하나, "이 모듈의 대표"
export default function multiply(a, b) {
  return a * b;
}
```

`04-modules/main.js`:

```js
// 04-modules/main.js

// default는 {} 없이 원하는 이름으로, named는 {}로 정확한 이름을 꺼냄
import multiply, { PI, add, sub } from "./math.js";

console.log(PI); // 3.14159
console.log(add(2, 3)); // 5
console.log(multiply(4, 5)); // 20

// 이름 바꿔서 가져오기 (as)
import { add as plus } from "./math.js";
console.log(plus(10, 20)); // 30
```

실행:

```bash
node 04-modules/main.js
```

🐍 파이썬 대응:

| JS | 🐍 Python |
|---|---|
| `export const add = ...` | (모듈에 그냥 `def add` 정의) |
| `import { add } from "./math.js"` | `from math_mod import add` |
| `import { add as plus }` | `from math_mod import add as plus` |
| `import * as math from "./math.js"` | `import math_mod as math` |
| `export default` | (직접 대응 없음 — JS 고유) |

⚠️ **함정 ①: 확장자 `.js`를 꼭 붙입니다.** 🐍 파이썬은 `from math import add`처럼 확장자를 안 쓰지만, **Node의 ESM은 `./math.js`처럼 확장자를 명시**해야 합니다. `./math`라고만 쓰면 에러납니다. (나중에 Next.js/번들러 환경에선 생략이 허용되지만, 순수 Node 실행에선 필수입니다.)

⚠️ **함정 ②: default는 하나뿐, named는 이름이 정확해야** 합니다. `import { add }`에서 `add`는 오타 없이 export한 이름과 같아야 하고(중괄호 필수), default는 중괄호 없이 아무 이름이나 붙일 수 있습니다.

💡 **전체 모으기**: `import * as math from "./math.js";` 후 `math.add(1, 2)`처럼 씁니다(🐍 `import math as m`).

### 4-3. `import * as` 전체 가져오기 + 최상위 await

```js
import * as math from "./math.js";
console.log(math.add(1, 2), math.PI); // 3 3.14159
```

💡 **최상위 await (top-level await)**: ESM 모듈에서는 함수로 감싸지 않고 파일 최상단에서 바로 `await`를 쓸 수 있습니다. 세션 3에서 `const user = await getUser(...)`를 함수 밖에서 쓸 수 있던 이유가 이거예요.

```js
// ESM 파일 최상단에서 바로 가능 (🐍 파이썬은 asyncio.run으로 감싸야 함)
const data = await fetch("https://api.github.com/users/torvalds").then((r) =>
  r.json()
);
console.log(data.name);
```

🐍 파이썬에선 모듈 최상단에서 `await`를 못 쓰고 `asyncio.run(...)`으로 감싸야 하죠. JS ESM은 이걸 허용해서 스크립트가 더 간결합니다.

### 4-4. (맛보기) CommonJS는 어떻게 생겼나 — 읽을 줄만 알기

옛 라이브러리나 오래된 예제에서 이런 걸 보게 됩니다. **쓰진 않지만 읽을 줄은 알아야** 합니다.

```js
// CommonJS 스타일 (우리는 안 쓰지만 눈에 익혀두기)
const fs = require("fs"); // import fs from "fs" 에 해당
module.exports = { add }; // export 에 해당
```

⚠️ `"type": "module"`을 켠 우리 프로젝트에선 `require`가 기본적으로 안 됩니다. "옛날 코드엔 `require`가 있고, 그건 CommonJS다" 정도만 알면 됩니다.

### 4-5. npm 패키지 설치해서 써 보기

지금까진 내장 기능만 썼습니다. 이제 **외부 패키지**를 설치해 씁니다. 날짜 처리 라이브러리 `date-fns`로 해봅시다 (실습에서 GitHub 계정 생성일을 예쁘게 포맷할 때 씁니다).

```bash
pnpm add date-fns
```

🐍 `pnpm add date-fns` ≈ `uv add python-dateutil`. 설치하면 `package.json`의 `dependencies`에 추가되고 `node_modules/`에 실체가 들어옵니다.

```js
// 패키지에서 함수 가져오기 (상대경로가 아니라 "이름"으로 import)
import { format } from "date-fns";

const now = new Date();
console.log(format(now, "yyyy-MM-dd HH:mm")); // 예: 2026-07-20 14:30
```

💡 **경로의 차이를 보세요**: 내 파일은 `"./math.js"`(상대경로, 확장자 O), 설치한 패키지는 `"date-fns"`(이름만, 확장자 X). 🐍 파이썬에서 내 모듈 `from .utils import x` vs 설치 패키지 `from requests import get`의 구분과 같은 감각입니다.

### ✅ 세션 4 체크
- [x] `export`(named/default)와 `import`로 파일 분리
- [x] 상대경로 import에 **확장자 `.js`** 붙이기
- [x] `import * as`와 `as` 별칭 사용
- [x] `pnpm add`로 외부 패키지 설치 후 import해서 사용
- [x] ESM(`import`)과 CommonJS(`require`)를 구분해서 인지

---

## 5. 통합 실습 — GitHub API 병렬 리포트 ⭐

오늘 배운 걸 한 프로젝트에 모읍니다. **여러 GitHub 사용자 정보를 병렬로 가져와** 리포트로 만듭니다. Day 1의 "모델 리포트"와 이어지는 느낌이되, 이번엔 **실제 네트워크 + 모듈 분리 + 에러 처리**가 들어갑니다.

> GitHub 공개 API는 인증 없이도 사용자 조회가 됩니다(시간당 요청 제한은 있지만 실습엔 충분).

### 5-1. 모듈 분리 — fetch 로직을 라이브러리로

`exercise/github-lib.js`:

```js
// exercise/github-lib.js
// GitHub 사용자 정보를 가져오는 로직 모음 (재사용 가능한 모듈)

// 사용자 한 명을 안전하게 조회 (res.ok 확인 포함)
export async function fetchUser(username) {
  const res = await fetch(`https://api.github.com/users/${username}`);
  if (!res.ok) {
    throw new Error(`'${username}' 조회 실패: ${res.status}`);
  }
  const data = await res.json();

  // 필요한 필드만 추려서 반환 (Day 1의 map/구조 분해 응용)
  return {
    name: data.name ?? data.login, // 이름 없으면 로그인 아이디 (null 병합은 Day 3에서 자세히)
    login: data.login,
    repos: data.public_repos,
    followers: data.followers,
    createdAt: data.created_at,
  };
}

// 여러 명을 병렬로 조회 (Promise.all)
export async function fetchUsers(usernames) {
  return Promise.all(usernames.map((name) => fetchUser(name)));
}
```

### 5-2. 메인 스크립트 — 병렬 호출 + 집계 + 리포트

`exercise/github-report.js`:

```js
// exercise/github-report.js
import { format } from "date-fns";
import { fetchUsers } from "./github-lib.js";

const USERNAMES = ["torvalds", "gvanrossum", "yyx990803"]; // 리누스, 귀도, Evan You

async function main() {
  try {
    // 1) 세 명을 병렬로 동시에 조회 (순차보다 훨씬 빠름)
    const users = await fetchUsers(USERNAMES);

    // 2) 팔로워 많은 순으로 정렬 (Day 1 배열 메서드 복습)
    const ranked = [...users].sort((a, b) => b.followers - a.followers);

    // 3) 리포트 출력
    console.log("=== GitHub 개발자 리포트 ===\n");
    ranked.forEach((u, i) => {
      const joined = format(new Date(u.createdAt), "yyyy년 M월");
      console.log(
        `${i + 1}. ${u.name} (@${u.login})\n` +
          `   팔로워 ${u.followers.toLocaleString()}명 · 공개 저장소 ${u.repos}개 · 가입 ${joined}`
      );
    });

    // 4) 집계 (reduce)
    const totalFollowers = users.reduce((acc, u) => acc + u.followers, 0);
    console.log(`\n총 팔로워 합계: ${totalFollowers.toLocaleString()}명`);
  } catch (err) {
    console.error("리포트 생성 실패:", err.message);
  }
}

main();
```

실행:

```bash
node exercise/github-report.js
```

기대 출력(팔로워 수는 시점에 따라 다름):

```
=== GitHub 개발자 리포트 ===

1. Linus Torvalds (@torvalds)
   팔로워 245,000명 · 공개 저장소 8개 · 가입 2011년 9월
2. Evan You (@yyx990803)
   팔로워 100,000명 · 공개 저장소 200개 · 가입 2012년 3월
3. Guido van Rossum (@gvanrossum)
   팔로워 80,000명 · 공개 저장소 40개 · 가입 2011년 5월

총 팔로워 합계: 425,000명
```

💡 이 스크립트 하나에 오늘의 전부가 들어 있습니다: **모듈 분리(import/export)** · **fetch + res.ok** · **Promise.all 병렬** · **try/catch** · **외부 패키지(date-fns)** · Day 1의 **map/reduce/sort/구조 분해**.

### 🎯 추가 연습 문제 3개 (스스로 풀어보기)

같은 구조로 아래를 구현해보세요. 막히면 힌트를 보고, 그래도 막히면 "Day 2 실습 문제 N번 힌트/풀이 알려줘"라고 물어보세요.

**문제 1.** 존재하지 않는 계정(`"이런계정없음_9x9x"`)을 목록에 섞은 뒤, `Promise.all` 대신 **`Promise.allSettled`**로 바꿔서 "성공한 사람만 리포트, 실패한 사람은 따로 목록"으로 출력하기.
> 힌트: `allSettled` 결과의 `status`로 분기, `filter`로 두 그룹 나누기

**문제 2.** 각 사용자의 **저장소 목록**(`https://api.github.com/users/{login}/repos`)을 추가로 가져와, 사용자별 "가장 별(star) 많은 저장소 1개"를 리포트에 붙이기.
> 힌트: `fetchUser` 안에서 저장소도 fetch → 응답 배열에 `reduce`로 최대 star 찾기

**문제 3.** `sleep` 헬퍼와 `AbortController`를 이용해, "3초 안에 응답 없으면 자동 취소하고 '타임아웃' 출력"을 구현하기.
> 힌트: `setTimeout(() => controller.abort(), 3000)` + `catch`에서 `err.name === "AbortError"` 확인

### 최종 검증

```bash
pnpm lint      # ESLint 경고 0개
pnpm format    # Prettier 포맷 통과
```

---

## 6. ✅ Day 2 완료 체크리스트

아래가 전부 통과하면 Day 3(TypeScript) 준비 완료입니다.

- [ ] 클로저로 "비공개 상태를 가진 함수" 작성 + `var` 루프 함정 설명 가능
- [ ] "콜백은 화살표 함수로" 규칙과 `this`를 피하는 이유 인지
- [ ] `sleep = (ms) => new Promise(...)` 작성, async 함수 반환값이 Promise임을 이해
- [ ] `async/await`로 `fetch` 성공 (`await res.json()` 두 단계 포함)
- [ ] `res.ok`로 HTTP 에러를 직접 확인 (fetch가 404에 안 던짐을 인지)
- [ ] `try/catch/finally`로 에러 처리
- [ ] `Promise.all` 병렬 호출 성공, `allSettled`와의 차이 인지
- [ ] `import`/`export`(named·default)로 파일 분리, 상대경로에 `.js` 확장자
- [ ] `pnpm add`로 외부 패키지 설치 후 사용
- [ ] `github-report.js` 실행 성공 + 추가 문제 3개 시도

---

## 7. 자주 나오는 함정 정리 (⚠️)

| 증상 | 원인 | 해결 |
|---|---|---|
| `fetch` 결과가 `{}`처럼 비어 있음 | `res.json()`을 `await` 안 함 | `const data = await res.json();` |
| 404인데 에러가 안 나고 이상한 값 | fetch는 HTTP 에러를 안 던짐 | `if (!res.ok) throw new Error(...)` |
| async 함수 결과가 `Promise {...}` | 반환값은 항상 Promise | 호출부에서 `await` |
| `var` 루프 콜백이 전부 마지막 값 | var 함수 스코프 + 클로저 참조 | `let`으로 바꾸기 |
| 콜백 안 `this`가 `undefined` | 일반 함수가 `this`를 잃음 | 콜백을 화살표 함수로 |
| `Cannot find module './math'` | ESM은 확장자 필수 | `"./math.js"`로 확장자 붙이기 |
| `require is not defined` | `"type": "module"`인데 CJS 문법 | `import`로 바꾸기 |
| `Promise.all`이 통째로 실패 | 하나만 reject돼도 전체 reject | 부분 허용이 필요하면 `allSettled` |
| 요청이 순차라 느림 | `await`를 하나씩 순서대로 함 | 독립 요청은 `Promise.all`로 묶기 |

---

## 8. 저장소 커밋 & 정리

```bash
# 저장소 루트로 이동
cd ../..

# node_modules가 무시되는지 먼저 확인
git status

# 실습 코드 + 오늘 문서 커밋
git add practice/day2 docs/Day2.md
git commit -m "Day 2: 비동기(async/await, fetch, Promise.all) + 모듈 실습"
git push
```

⚠️ `git status`에 `node_modules/`가 보이면 커밋하지 말고 루트 `.gitignore`에 `node_modules/`가 있는지 먼저 확인하세요(Day 1과 동일).

---

## 9. Day 3 미리보기

Day 2까지 **동적 타입 JavaScript**를 다뤘습니다. 실행하기 전엔 `user.followrs`(오타)가 있는지 알 수 없었죠. Day 3은:

1. **TypeScript** — 🐍 파이썬 타입힌트의 **강화판**입니다. 단, 파이썬 타입힌트는 런타임에 무시되지만 TS는 **컴파일 타임에 강제**해서 오타·타입 실수를 실행 전에 잡습니다.
2. 오늘 짠 `github-lib.js`의 반환 객체에 **타입(interface/type)**을 붙이고, `fetch` 응답을 타입 안전하게 다루는 법.
3. **제네릭**(`<T>`, 🐍 `TypeVar` 대응)과 **유틸리티 타입**(`Partial`/`Pick`/`Omit`), 그리고 말미에 **Zod** 맛보기(런타임 검증) — Day 6 에이전트 도구 스키마에서 재등장합니다.

💡 Day 3 시작할 때 로드맵과 이 문서를 붙이고 **"Day 3 세션 1 상세 자료 만들어줘"**라고 요청하면 이어서 만들어 드립니다. 오늘 만든 `github-report.js`를 Day 3에서 **TS로 재작성**할 예정이니 지우지 마세요.

---

### 부록 — Python ↔ JS 치트시트 (Day 2 범위)

```
# 비동기 기본
async def f(): ...            →  async function f() { ... }
await coro                    →  await promise
asyncio.sleep(1)             →  await sleep(1000)   (sleep 직접 구현)
asyncio.run(main())          →  main()  (JS는 루프가 이미 돎)
asyncio.gather(a, b)         →  await Promise.all([a, b])

# sleep 헬퍼 (통째로 외우기)
                                const sleep = (ms) =>
                                  new Promise((r) => setTimeout(r, ms));

# HTTP 요청
r = requests.get(url)        →  const res = await fetch(url);
r.json()                     →  await res.json()   (await 필요!)
r.raise_for_status()         →  if (!res.ok) throw new Error(...)  (직접 확인)

# 에러 처리
try/except E as e:           →  try { } catch (e) { }
finally:                     →  finally { }
raise Exception("x")         →  throw new Error("x")
str(e)                       →  e.message

# 병렬
await asyncio.gather(*tasks) →  await Promise.all(tasks)
(부분 실패 허용)              →  await Promise.allSettled(tasks)

# 모듈
from mod import add          →  import { add } from "./mod.js"  (.js 필수!)
from mod import add as plus  →  import { add as plus } from "./mod.js"
import mod as m              →  import * as m from "./mod.js"
(설치 패키지)                →  import { format } from "date-fns"  (이름만)

# 클로저
def outer():                 →  function outer() {
    x = 0                    →    let x = 0;
    def inner():             →    return () => {
        nonlocal x           →      x += 1;   (nonlocal 불필요)
        x += 1               →      return x;
        return x             →    };
    return inner             →  }

# 패키지 관리
uv add date-fns 대응         →  pnpm add date-fns
```

수고했어요. 이제 "나중에 도착하는 데이터"와 "파일을 나누고 합치는 법"이 손에 붙었습니다 — Day 3에서 이 모든 것에 **타입이라는 안전벨트**를 채웁니다. 🟨
