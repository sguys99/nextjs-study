# Day 2 — 비동기 + 모듈 + JavaScript 심화

> **소요 시간**: 약 8시간 (90분 학습 + 15분 휴식 × 4세션). 오늘은 개념이 무거우니 미니 실습을 꼭 손으로.
> **선행 조건**: Day 1 완료 (`map`/`filter`/`reduce`·화살표 함수·구조 분해 체화, 린팅 환경).
> **오늘의 목표**: JS의 **비동기 모델**(이벤트 루프·Promise·async/await)과 **모듈 시스템**(import/export)을 익힌다. 이 둘은 **Next.js의 토대**다 — 서버에서 `async/await`로 데이터를 가져오고 파일을 `import`로 배선하는 게 Day 5부터 매 순간 나온다.
>
> **태그 범례**: `🐍` Python 대비 · `💡` 팁 · `⚠️` 함정 · `🎯` 배경 · `📖` 설명용(읽기만) · `⌨️` 실습(직접 치기) · `✅` 완성본

---

## 0. 오늘 어떻게 진행되나 (2분)

Day 1은 **"위에서 아래로, 순서대로" 도는 JS**였습니다. 오늘은 실행 흐름이 **시간 축으로 늘어나는** 세계로 들어갑니다. "지금은 값이 없고 나중에 도착하는" 데이터를 다루는 법 — 이게 비동기예요.

이미 `asyncio`로 이 개념은 알고 계시죠. 오늘의 진짜 목표는 "비동기 이해"가 아니라 **"Python async 습관을 JS async 습관으로 번역하고, JS만의 함정을 피하는 것"**입니다. 키워드(`async`/`await`)가 같아서 오히려 방심하기 쉬워요. **이벤트 루프·`fetch`의 에러 처리·모듈 확장자**에 Python과 다른 지뢰가 있습니다.

### 0-1. 오늘 만들 폴더 구조

```
practice/
├── day1/                       (어제 것)
└── day2/                       ← 오늘
    ├── package.json            ("type": "module" 포함)
    ├── eslint.config.js        (Day1에서 복사)
    ├── .prettierrc             (복사)
    ├── .vscode/settings.json   (복사)
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

### 0-2. 시작 준비 — Day 1 설정 재활용

⌨️ 실습 — 저장소 루트에서

```bash
mkdir -p practice/day2/.vscode
cd practice/day2
cp ../day1/eslint.config.js .
cp ../day1/.prettierrc .
cp ../day1/.vscode/settings.json .vscode/
pnpm init
```

그리고 `package.json`을 열어 **`"type": "module"`을 추가**하세요. (정체는 세션 4에서 밝힙니다. 지금은 "최신 `import`/`export`를 쓰겠다는 선언"으로만 알아두세요.)

⌨️ 실습 — `practice/day2/package.json` 수정

```json
{
  "name": "day2",
  "version": "1.0.0",
  "type": "module"
}
```

---

## 1. 세션 1 (오전) — 스코프·클로저

### 🎯 배경 — 왜 클로저를 굳이 배우나

클로저는 Python에도 있지만 자주 쓰진 않죠. **JS에서는 클로저가 사방에 있습니다.** 특히 Day 4의 React 훅(`useState`, `useEffect`)이 **클로저 위에서 돌아갑니다.** 오늘 클로저를 확실히 잡으면 Day 4의 "왜 이 값이 옛날 값이지?" 같은 미스터리가 안 생깁니다. 사실 Day 1의 `makeMultiplier`가 이미 클로저였습니다 — 오늘 그 정체를 밝힙니다.

### 1-1. 스코프 — 변수가 보이는 범위

**① 왜 중요**: 변수가 "어디서 보이고 안 보이는지"를 알아야 클로저를 이해합니다.
**② 쉬운 설명**: `let`/`const`는 **블록 스코프**입니다. `{ }` 중괄호 밖에서는 안 보여요.
**③ 🐍 다리 + JS 설명**: Python 함수는 함수 스코프죠(`for` 안에서 만든 변수가 밖에서도 보임). **JS의 `let`/`const`는 `for`·`if`의 `{ }`까지 스코프가 좁습니다.** 이 편이 더 안전해요.

📖 설명용 — 블록 스코프

```js
{
  const inside = 1;
}
// console.log(inside); // ❌ ReferenceError: inside is not defined
```

⚠️ **함정 — 옛 `var`는 블록 스코프가 아님**: `var`는 함수 스코프라 `{ }`를 뚫고 새어 나옵니다. 이게 옛날 JS 버그의 큰 원인이었어요. 그래서 **우리는 `var`를 안 씁니다.** (Day 1에서 약속했죠)

> ⌨️ **미니 실습** — `01-scope-closure.js`, 실행 `node 01-scope-closure.js`
> ```js
> for (let i = 0; i < 3; i++) {
>   // i는 이 블록 안에서만 삼
> }
> // console.log(i); // 여기서 i를 찍으면 에러가 나는지 확인해 보세요
> console.log("스코프 확인 완료");
> ```

### 1-2. 클로저 — "함수가 태어난 환경을 기억한다"

**① 왜 있나**: 함수가 자기 바깥의 변수를 계속 "품고" 있어야 할 때가 많습니다(예: 카운터, 설정을 고정한 함수).
**② 쉬운 설명**: **함수를 반환할 때, 그 함수는 자기가 만들어진 곳의 변수들을 기억한 채로 나갑니다.** 그 "기억 보따리"가 클로저예요.
**③ 🐍 다리 + JS 설명**: Python에서 함수 안에 함수를 정의해 반환하면 바깥 변수를 기억하죠(`nonlocal`). JS도 똑같지만, **JS에서는 이 패턴을 훨씬 자주** 씁니다.
**④ 최소 예제**

📖 설명용

```js
const makeCounter = () => {
  let count = 0;             // 이 변수를…
  return () => {
    count += 1;              // …반환된 함수가 계속 기억하고 증가시킴
    return count;
  };
};
```

> ⌨️ **미니 실습** — `01-scope-closure.js`
> ```js
> const makeCounter = () => {
>   let count = 0;
>   return () => {
>     count += 1;
>     return count;
>   };
> };
> const counter = makeCounter();
> console.log(counter()); // 1
> console.log(counter()); // 2
> console.log(counter()); // 3  ← count가 살아남아 누적됨!
> ```
> 💡 `counter`를 하나 더 만들면(`const c2 = makeCounter()`) 그 안엔 **자기만의 count**가 따로 생깁니다. 각 클로저는 독립적이에요.

**⑤ ⚠️ 함정 미리보기**: Day 4에서 "이벤트 핸들러가 오래된 값을 기억하는" 버그를 만나면, 대부분 클로저가 옛 변수를 붙잡고 있어서입니다. 오늘 "함수는 태어난 환경을 기억한다"만 확실히 새겨두세요.

### 1-3. `this`는 "개념만" (그리고 왜 화살표 함수인가)

**② 쉬운 설명**: `this`는 "지금 이 함수를 누가 불렀나"에 따라 값이 **바뀌는** 특수 변수입니다. 규칙이 복잡하고 함정이 많아요.
**💡 결론만**: **화살표 함수는 자기만의 `this`를 만들지 않고 바깥 것을 그대로 씁니다.** 덕분에 현대 JS는 화살표 함수를 기본으로 써서 `this` 문제를 아예 회피합니다.
🐍 Python의 `self`는 항상 명시적 첫 인자라 헷갈릴 일이 없죠. JS의 `this`는 암묵적이라 위험합니다. **오늘은 "화살표 함수 쓰면 this 걱정 없다"만 기억**하고 넘어갑니다. (깊이 안 팜 — 로드맵 방침)

### ✅ 세션 1 연습문제

⌨️ 문제 — `01-scope-closure.js`
1. (보통) `makeGreeter(greeting)`을 만들어라. `greeting`("안녕" 등)을 기억했다가, 이름을 받으면 `"안녕, 광명!"`을 반환한다. `const hi = makeGreeter("안녕"); hi("광명")` → `"안녕, 광명!"`

✅ 정답

```js
const makeGreeter = (greeting) => (name) => `${greeting}, ${name}!`;
const hi = makeGreeter("안녕");
console.log(hi("광명")); // 안녕, 광명!
```

💡 `greeting`을 기억한 채 나온 안쪽 함수가 클로저입니다. Day 1의 `makeMultiplier`와 똑같은 패턴이에요.

---

## 2. 세션 2 (오전) — 비동기 ①: 이벤트 루프와 Promise

### 🎯 배경 — JS는 왜 싱글 스레드인데 안 멈추나

JS는 **스레드가 하나**입니다. 그런데 파일 다운로드나 API 호출처럼 오래 걸리는 일을 "기다리는 동안" 화면이 멈추면 안 되죠(브라우저가 얼어버림). 그래서 JS는 이렇게 합니다:

- 오래 걸리는 일은 **"맡겨두고"**(예: "네트워크야, 다 되면 알려줘") 일단 다음 코드로 넘어갑니다.
- 그 일이 끝나면, 그 결과 처리 코드를 **대기열(queue)**에 넣고, 지금 할 일이 없을 때 꺼내서 실행합니다.
- 이 "맡기고-나중에 처리" 관리자가 **이벤트 루프**예요.

🐍 **asyncio와 같고도 다릅니다.** Python asyncio도 단일 스레드 이벤트 루프죠 — 개념이 같습니다. 차이: JS는 **이벤트 루프가 항상, 저절로 하나 돌고 있습니다**(`asyncio.run()`처럼 직접 켤 필요 없음). 그냥 비동기 코드를 쓰면 알아서 이 위에서 돕니다.

### 2-1. 감 잡기 — `setTimeout`으로 "나중에 실행" 보기

**② 쉬운 설명**: `setTimeout(fn, ms)`은 "ms 밀리초 뒤에 fn을 실행해줘"라고 맡기는 함수입니다.

> ⌨️ **미니 실습** — `02-async-basics.js`, 실행 `node 02-async-basics.js`
> ```js
> console.log("1");
> setTimeout(() => console.log("2 (나중에)"), 0);
> console.log("3");
> // 출력 순서: 1, 3, 2 (나중에)
> ```
> ⚠️ **0밀리초인데 왜 마지막?** `setTimeout`은 "맡겨두는" 일이라 **지금 줄에 있는 동기 코드(1, 3)를 다 끝낸 뒤** 대기열에서 꺼내 실행합니다. 이게 이벤트 루프의 핵심 감각이에요.

### 2-2. Promise — "나중에 도착할 값"을 담는 상자

**① 왜 있나**: `fetch("...")`를 부르면 서버 응답이 **지금 당장은 없습니다**. 0.3초쯤 뒤에 와요. 그런데 스레드가 하나라 "올 때까지 멈춰 서서 기다리기"를 하면 브라우저가 통째로 업니다. 그래서 JS는 **값 대신 "값 받으러 오는 표"를 즉시 줍니다.** 그 표가 Promise예요. (옛날엔 "다 되면 이 함수 불러줘"라고 콜백을 넘겼는데, 중첩하다 지옥이 됐습니다 — 콜백 지옥. Promise는 그걸 정리한 방식입니다.)

**② 쉬운 설명 — 카페 진동벨**:

| ☕ 카페 | 🟨 JS |
|---|---|
| 커피를 주문함 | `wait(1000)` / `fetch(url)` 호출 |
| 커피 대신 **진동벨**을 받음 | **Promise 객체**를 받음 (값이 아님!) |
| 자리에 앉아 딴 일 함 | 다음 줄 코드가 그냥 실행됨 |
| 벨이 울림 📳 | `resolve(커피)` — 성공(fulfilled) 상태로 전환 |
| "재료 떨어졌어요" | `reject(에러)` — 실패(rejected) 상태로 전환 |
| 벨 울리면 가서 받겠다고 예약 | `.then((커피) => ...)` |
| 벨 울릴 때까지 그 자리에서 대기 | `await` |

핵심은 **Promise가 값이 아니라 "값이 도착할 자리"**라는 겁니다. 상태는 셋 중 하나예요: `pending`(대기) → `fulfilled`(성공) 또는 `rejected`(실패). 한 번 성공/실패로 바뀌면 **다시는 안 바뀝니다.**

> ⌨️ **미니 실습** — `02-async-basics.js`, 상자 안이 비어 있는 걸 눈으로 확인
> ```js
> const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
>
> const p = wait(1000);
> console.log(p);                          // Promise { <pending> }  ← 아직 안 익음
> setTimeout(() => console.log(p), 1500);  // Promise { undefined }  ← 다 익음(fulfilled)
> ```

**③ 🐍 다리 + JS 설명**: Python의 `asyncio.Future`가 정확히 같은 물건입니다. `fut.set_result(값)` ↔ `resolve(값)`, `fut.set_exception(e)` ↔ `reject(e)`.

```python
fut = loop.create_future()
loop.call_later(1, fut.set_result, None)   # 1초 뒤 값 채워 넣기
await fut
```

JS 자체 설명으로는 — "성공하면 이 값, 실패하면 이 에러를 담기로 예약된 객체"입니다. 그리고 **JS에서는 `fetch`를 비롯한 거의 모든 비동기 API가 이 객체를 반환**합니다.

**④ 최소 예제 — 문제의 그 한 줄 해부**

📖 설명용 — Promise 직접 만들기 (실무에선 직접 만들 일이 드묾, 이해용)

```js
const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));
```

압축이 심해 안 읽히는 게 정상입니다. 풀어 쓰면 이겁니다.

📖 설명용 — 똑같은 코드, 압축 해제 버전

```js
const wait = (ms) => {
  const promise = new Promise((resolve) => {
    // ↑ resolve는 내가 만든 게 아니라 JS가 만들어서 넣어준 함수.
    //   "이제 성공이야!"라고 선언하는 스위치.

    // 이 안에는 "언제 성공으로 칠 건지"만 적는다.
    setTimeout(() => {
      resolve(); // ← 이 순간 promise가 pending → fulfilled 로 바뀜
    }, ms);
  });

  return promise; // 스위치는 아직 안 눌렸지만, 상자는 지금 즉시 반환
};
```

세 가지만 잡으면 끝납니다.

1. **`new Promise(...)`에 넘기는 함수는 "성공 조건 설명서"**입니다. JS가 이 함수를 *즉시* 한 번 실행해요.
2. **`resolve`는 정의한 적 없는데 어디서 왔나?** → JS 엔진이 만들어서 인자로 **넣어줍니다.** Day 1의 `arr.map((x) => ...)`에서 `x`를 내가 안 만들었듯, `resolve`도 받아 쓰는 겁니다.
3. **`setTimeout(resolve, ms)`** 는 `setTimeout(() => resolve(), ms)`의 축약입니다. `resolve` 뒤에 괄호가 없죠? **지금 부르는 게 아니라 "ms 뒤에 이걸 불러줘"라고 함수 자체를 건네는** 겁니다. 🐍 Python `call_later(1, resolve)`와 같아요 — `resolve()`가 아니라 `resolve`.

**⑤ ⚠️ 함정 두 가지**

⚠️ **하나 — `resolve`를 안 부르면 영원히 멈춥니다.**

> ⌨️ **미니 실습** — `02-async-basics.js` (확인 후 `Ctrl+C`로 종료)
> ```js
> const neverResolve = () =>
>   new Promise(() => {
>     console.log("상자는 만들어짐"); // 이건 즉시 출력됨
>     // resolve를 부르지 않음!
>   });
>
> const test = async () => {
>   console.log("기다린다");
>   await neverResolve();
>   console.log("이 줄은 영원히 실행 안 됨"); // ← 도달 불가
> };
> test();
> ```
> 진동벨이 영원히 안 울립니다. **에러도 없이 조용히 멈춰요** — 그래서 더 무섭습니다.

⚠️🐍 **둘 — Promise는 만드는 순간 이미 시작합니다 (Python과 반대!).**

Python 코루틴은 게으릅니다. `asyncio.sleep(1)`을 호출만 하고 `await`을 안 하면 타이머가 **시작조차 안 해요.** JS Promise는 정반대 — **만들어지는 순간 이미 일이 돌아갑니다.** `await`은 "시작해라"가 아니라 **"이미 돌고 있는 거, 결과 나올 때까지 대기"**입니다.

> ⌨️ **미니 실습** — `02-async-basics.js`, 코드 모양은 거의 같은데 시간이 2배 차이납니다
> ```js
> const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
>
> const sequential = async () => {
>   const t = Date.now();
>   await wait(1000); // 여기서 타이머 시작 → 1초
>   await wait(1000); // 끝난 뒤에야 시작 → 또 1초
>   console.log("순차:", Date.now() - t, "ms"); // 약 2000
> };
>
> const concurrent = async () => {
>   const t = Date.now();
>   const a = wait(1000); // ← 타이머 즉시 시작
>   const b = wait(1000); // ← 이것도 즉시 시작 (둘이 나란히 돎)
>   await a;
>   await b;
>   console.log("동시:", Date.now() - t, "ms"); // 약 1000!
> };
>
> sequential();
> concurrent();
> ```
> 💡 "Promise를 변수에 담아두면 이미 달리기 시작한 상태"라는 이 감각이 세션 3의 `Promise.all`로 그대로 이어집니다.

💡 **정리 — 오늘 가져갈 세 줄**
1. Promise = 나중에 값이 채워질 **상자**(진동벨). 값 자체가 아니다
2. `resolve(값)`를 부르는 순간 상자가 열린다 — 안 부르면 영원히 대기
3. Promise는 **만드는 즉시 실행**된다 (🐍 Python 코루틴과 반대)

그리고 **실무에서 `new Promise`를 직접 쓸 일은 거의 없습니다.** `fetch`·DB 조회·파일 읽기가 전부 이미 Promise를 반환해요. 직접 만드는 건 "JS에 `sleep`이 없어서 손수 만드는" `wait` 같은 예외뿐입니다.

### 2-3. `async` / `await` — Promise를 동기처럼 읽기

**① 왜 있나**: Promise를 `.then().then()`으로 이어붙이면 다시 읽기 어려워집니다. `async/await`는 **비동기 코드를 "위에서 아래로" 읽히게** 만들어요.
**② 쉬운 설명**:
- 함수 앞에 `async`를 붙이면 그 함수는 Promise를 반환합니다.
- `await`는 "이 Promise가 값을 줄 때까지 여기서 기다렸다가 다음 줄로"를 뜻합니다.
**③ 🐍**: **키워드가 Python과 똑같습니다.** `async def` → `async () =>`, `await` → `await`. 거의 그대로 번역돼요.

📖 설명용 — 같은 일을 두 방식으로

```js
// (A) .then 체이닝
wait(500).then(() => console.log("0.5초 지남"));

// (B) async/await (더 읽기 쉬움)
const run = async () => {
  await wait(500);
  console.log("0.5초 지남");
};
```

> ⌨️ **미니 실습** — `02-async-basics.js`
> ```js
> const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
>
> const run = async () => {
>   console.log("시작");
>   await wait(1000);          // 1초 기다림
>   console.log("1초 뒤");
> };
> run();
> ```
> 실행하면 "시작" 출력 후 1초 뒤 "1초 뒤"가 나옵니다.

⚠️ **함정 — `await`는 `async` 함수 안에서만**: 아무 데서나 `await`를 쓰면 에러입니다(최상위 예외는 Day 5에서). 지금은 "await는 async 함수 안에서"로 기억하세요.

### ✅ 세션 2 연습문제

⌨️ 문제 — `02-async-basics.js`
1. (보통) `async` 함수 `countdown`을 만들어라. 3, 2, 1을 **1초 간격**으로 출력하고 마지막에 "발사!"를 출력한다. (`wait`와 `for` 루프 사용)

✅ 정답

```js
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const countdown = async () => {
  for (let n = 3; n >= 1; n--) {
    console.log(n);
    await wait(1000);
  }
  console.log("발사!");
};
countdown();
```

💡 `for` 루프 안에서 `await`가 매번 1초씩 기다립니다. 🐍 Python `asyncio.sleep`을 `for` 안에서 `await`하는 것과 똑같아요.

---

## 3. 세션 3 (오후) — 비동기 ②: fetch로 진짜 API 호출

`03-fetch-promise.js`에 작성합니다. 이제 실제 인터넷에서 데이터를 가져옵니다.

### 3-1. `fetch` 기본

**② 쉬운 설명**: `fetch(url)`은 웹 요청을 보내고 **응답(Response)을 담은 Promise**를 반환합니다. 응답 본문을 JSON으로 읽으려면 `.json()`을 또 `await`해야 해요.
**③ 🐍**: Python `requests.get(url)`에 해당하지만, **두 단계**입니다: ① 응답 받기(`await fetch`) → ② 본문 파싱(`await res.json()`).

📖 설명용 — 기본 형태

```js
const res = await fetch("https://api.github.com/users/torvalds");
const data = await res.json();
console.log(data.login, data.public_repos);
```

⚠️⚠️ **가장 중요한 함정 — fetch는 404/500에도 에러를 안 냅니다**: 서버가 "없음(404)"이나 "서버 에러(500)"를 줘도 `fetch`는 **정상 완료**로 칩니다. 네트워크 자체가 끊긴 경우에만 reject해요. **`res.ok`(200번대인지)는 직접 확인**해야 합니다.
🐍 Python `requests`에서 `raise_for_status()`를 안 부르면 예외가 안 나죠. 딱 그 상황이에요.

### 3-2. 에러 처리 — try/catch + res.ok

> ⌨️ **미니 실습** — `03-fetch-promise.js`, 실행 `node 03-fetch-promise.js`
> ```js
> const getUser = async (username) => {
>   const res = await fetch(`https://api.github.com/users/${username}`);
>   if (!res.ok) {
>     throw new Error(`요청 실패: ${res.status}`); // 404 등을 직접 에러로
>   }
>   return res.json();
> };
>
> const main = async () => {
>   try {
>     const user = await getUser("torvalds");
>     console.log(`${user.login}: 공개 저장소 ${user.public_repos}개`);
>   } catch (err) {
>     console.error("에러:", err.message);
>   }
> };
> main();
> ```
> 💡 `username`을 `"이런사용자없음123456"`으로 바꿔 실행하면 `catch`가 잡는지 확인해 보세요.

⚠️ **`throw`와 `catch`**: 🐍 `raise`가 `throw`, `except`가 `catch`입니다. `err.message`로 메시지를 꺼내요.

### 3-3. 병렬 처리 — `Promise.all`

**① 왜 있나**: 사용자 3명을 조회할 때, 하나씩 `await`하면 순차라 느립니다. **동시에 쏘고 다 모으면** 빨라요.
**② 쉬운 설명**: `Promise.all([p1, p2, p3])`은 여러 Promise를 **동시에** 기다렸다가 **결과 배열**을 줍니다.
**③ 🐍**: `asyncio.gather(*tasks)`와 정확히 같은 개념입니다.

> ⌨️ **미니 실습** — `03-fetch-promise.js` (위 `getUser` 재사용)
> ```js
> const compare = async () => {
>   const names = ["torvalds", "gaearon", "sindresorhus"];
>   const users = await Promise.all(names.map((n) => getUser(n)));
>   users.forEach((u) => console.log(`${u.login}: ${u.followers} 팔로워`));
> };
> compare();
> ```
> 💡 `names.map((n) => getUser(n))`는 **Promise들의 배열**을 만들고 `Promise.all`이 그걸 병렬로 기다립니다. Day 1의 `map`이 여기서 이렇게 쓰여요.

⚠️ **`Promise.all`의 성질**: 하나라도 실패(reject)하면 **전체가 실패**합니다. "실패해도 나머지는 받고 싶다"면 `Promise.allSettled`를 씁니다(각각 성공/실패 상태를 배열로 줌).

### 3-4. (선택) `AbortController`로 요청 취소

시간이 남으면만. `fetch`에 `signal`을 넘겨 도중에 취소할 수 있습니다. 지금은 "그런 게 있다" 정도로 넘어가도 됩니다. (Day 6 스트리밍에서 다시 등장)

### ✅ 세션 3 연습문제

⌨️ 문제 — `03-fetch-promise.js`
1. (보통) `getUser`를 이용해, 사용자 배열을 병렬 조회한 뒤 **팔로워 수 내림차순**으로 정렬해 이름을 출력하라. (`Promise.all` + `sort`)

✅ 정답

```js
const rankByFollowers = async (names) => {
  const users = await Promise.all(names.map((n) => getUser(n)));
  const ranked = [...users].sort((a, b) => b.followers - a.followers);
  ranked.forEach((u, i) =>
    console.log(`${i + 1}위 ${u.login} (${u.followers})`)
  );
};
rankByFollowers(["torvalds", "gaearon", "sindresorhus"]);
```

💡 Day 1의 `sort` 함정(원본 변경 → `[...users]`로 복사, 숫자는 비교 함수)이 그대로 재등장했어요.

---

## 4. 세션 4 (오후) — 모듈 시스템 (import / export)

`04-modules/` 폴더에 작성합니다. 지금까지 한 파일에 다 넣었지만 실제 앱은 **파일을 나누고 `import`로 연결**합니다.

### 🎯 배경 — 왜 모듈 방식이 두 개(ESM vs CommonJS)나 있나

Node는 초창기에 자체 모듈 방식인 **CommonJS**(`require`/`module.exports`)를 만들어 썼습니다. 그런데 나중에 JS 표준이 **ES Modules(ESM)**(`import`/`export`)로 정해졌어요. 지금 Node엔 **둘이 공존**합니다.

- 🐍 이건 Python엔 없는 혼란이에요(Python은 `import` 하나). JS는 역사적 사정으로 두 방식을 떠안았습니다.
- **우리는 표준인 ESM(`import`/`export`)만 씁니다.** Next.js도 ESM이에요. `package.json`의 `"type": "module"`이 바로 "이 프로젝트는 ESM을 쓴다"는 선언이었습니다(세션 0에서 넣은 그것!).

### 4-1. export / import — named vs default

**② 쉬운 설명**: 다른 파일에서 쓰라고 **내보내고(export)**, 쓸 파일에서 **가져옵니다(import)**.
- **named export**: 이름을 붙여 여러 개 내보내기 → `import { a, b } from ...`
- **default export**: 파일당 하나의 "대표" → `import 아무이름 from ...`

⌨️ 실습 — `04-modules/math.js` 새 파일

```js
// named export: 여러 개를 이름으로 내보냄
export const add = (a, b) => a + b;
export const multiply = (a, b) => a * b;

// default export: 파일의 "대표" 하나
export default function describe() {
  return "간단한 수학 모듈";
}
```

⌨️ 실습 — `04-modules/main.js` 새 파일

```js
// named는 { } 로, default는 이름 자유롭게
import describe, { add, multiply } from "./math.js";

console.log(describe());       // 간단한 수학 모듈
console.log(add(2, 3));        // 5
console.log(multiply(4, 5));   // 20
```

⌨️ 실행

```bash
node 04-modules/main.js
```

⚠️⚠️ **JS 특유의 함정 — 상대경로에 확장자 `.js`가 필요**: `import ... from "./math.js"`처럼 **`.js`를 꼭 붙여야** 합니다. 🐍 Python은 `from math import add`처럼 확장자를 안 쓰죠. Node ESM에서는 확장자를 빼먹으면 `ERR_MODULE_NOT_FOUND` 에러가 납니다. (Next.js/TS 환경에서는 설정으로 생략되기도 하는데, 순수 Node ESM에서는 필수)

> ⌨️ **미니 실습** — `math.js`에 `subtract`를 추가로 named export하고, `main.js`에서 import해 `subtract(10, 3)` → 7을 출력해 보세요.

### 4-2. npm 패키지 설치해 써 보기

**② 쉬운 설명**: 남이 만든 패키지도 `import`로 똑같이 씁니다. 작고 유명한 `nanoid`(짧은 랜덤 ID 생성기)로 감을 잡아요.

⌨️ 실습 — `practice/day2/`에서

```bash
pnpm add nanoid
```

⌨️ 실습 — `04-modules/main.js`에 추가

```js
import { nanoid } from "nanoid";
console.log("생성된 ID:", nanoid()); // 예: "V1StGXR8_Z5jdHi6B-myT"
```

💡 `node_modules`에서 오는 패키지는 **경로 없이 이름만**(`"nanoid"`), 내가 만든 파일은 **상대경로+확장자**(`"./math.js"`)로 import합니다. 이 구분을 몸에 익히세요.

---

## 5. 종합 실습 — GitHub 병렬 리포트 (모듈 분리) ⭐

오늘 배운 걸 전부 씁니다: **모듈 분리 + async/await + fetch + Promise.all + Day 1의 map/filter/reduce**.

⌨️ 실습 — `practice/day2/exercise/github-lib.js` 새 파일

```js
// GitHub 사용자 한 명을 조회 (에러 처리 포함)
export const fetchUser = async (username) => {
  const res = await fetch(`https://api.github.com/users/${username}`);
  if (!res.ok) throw new Error(`${username}: ${res.status}`);
  return res.json();
};

// 여러 명을 병렬 조회 (실패는 건너뛰고 성공한 것만)
export const fetchUsers = async (names) => {
  const results = await Promise.allSettled(names.map((n) => fetchUser(n)));
  return results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);
};
```

⌨️ 실습 — `practice/day2/exercise/github-report.js` 새 파일

```js
import { fetchUsers } from "./github-lib.js";

const names = ["torvalds", "gaearon", "sindresorhus", "존재하지않는유저999"];

const main = async () => {
  const users = await fetchUsers(names);

  const ranked = [...users].sort((a, b) => b.followers - a.followers);
  const totalRepos = users.reduce((sum, u) => sum + u.public_repos, 0);

  console.log("=== 팔로워 순위 ===");
  ranked.forEach((u, i) =>
    console.log(`${i + 1}위 ${u.login}: 팔로워 ${u.followers}, 저장소 ${u.public_repos}`)
  );
  console.log(`\n조회 성공: ${users.length}/${names.length}명`);
  console.log(`공개 저장소 총합: ${totalRepos}`);
};

main();
```

⌨️ 실행

```bash
node exercise/github-report.js
```

✅ 기대 출력 (팔로워 수는 실제 값이라 매번 다를 수 있음)

```
=== 팔로워 순위 ===
1위 torvalds: 팔로워 ...
2위 ...
3위 ...

조회 성공: 3/4명   ← 존재하지 않는 유저는 allSettled 덕에 조용히 제외됨
공개 저장소 총합: ...
```

💡 `Promise.allSettled` + `filter`로 **"일부 실패해도 나머지는 산다"**를 구현했어요. 실무 API 호출에서 매우 흔한 패턴입니다.

---

## 6. 디버깅 실습 — 흔한 async 버그 2종

⌨️ 실습 — `practice/day2/debug.js`에 입력하고 실행

```js
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 목표: 각 작업을 1초 간격으로 순서대로 처리
const tasks = ["A", "B", "C"];

tasks.forEach(async (t) => {
  await wait(1000);
  console.log("완료:", t);
});

console.log("모든 작업 시작함");
```

실행하면 "모든 작업 시작함"이 먼저 나오고 1초 뒤 A·B·C가 **거의 동시에** 쏟아집니다. "1초 간격 순서대로"가 안 돼요. **왜일까요?**

<details><summary>정답 보기</summary>

**`forEach`는 `async` 콜백을 기다려주지 않습니다.** `forEach`는 각 콜백을 그냥 호출하고 넘어가버려서 세 개의 `await wait(1000)`가 **동시에** 시작됩니다. 순서·간격을 지키려면 `for...of` 루프에서 `await`하세요.

✅ 수정

```js
const run = async () => {
  for (const t of tasks) {
    await wait(1000);
    console.log("완료:", t);   // 이제 1초 간격 A → B → C
  }
};
run();
```

교훈: **반복 안에서 순서대로 `await`하려면 `forEach`가 아니라 `for...of`**. (반대로 "동시에 다 쏘고 싶다"면 `Promise.all(tasks.map(...))`)
</details>

---

## 7. 🎯 오늘 만난 에러 읽는 법

| 에러 | 뜻 | 해결 |
|------|-----|------|
| `SyntaxError: await is only valid in async functions` | `async` 없는 곳에서 `await` 사용 | 그 함수에 `async` 붙이기 |
| `ERR_MODULE_NOT_FOUND` | import 경로/확장자 문제 | 상대경로에 `.js` 붙였는지, `"type":"module"` 있는지 확인 |
| `TypeError: Failed to fetch` / `fetch failed` | 네트워크 실패·잘못된 URL | URL 확인, 인터넷 연결 확인 |
| `TypeError: Cannot read properties of undefined` | 응답에서 없는 필드 접근 | `res.ok` 체크했는지, 필드 이름 맞는지 확인 |
| `Reduce of empty array...` | (Day 1 복습) reduce 초깃값 | `reduce(..., 0)` |

---

## 8. ✅ Day 2 최종 체크리스트

- [ ] 클로저를 만들어 상태가 누적되는 걸 확인 (`makeCounter`)
- [ ] "화살표 함수 쓰면 `this` 걱정 없다" 이해
- [ ] `async/await`로 `wait`/`countdown` 동작
- [ ] `fetch` + `res.ok` 체크 + try/catch 에러 처리
- [ ] `Promise.all`(병렬)과 `Promise.allSettled`(실패 허용) 차이 설명 가능
- [ ] `import`/`export` (named + default), 상대경로 `.js` 확장자 함정 이해
- [ ] npm 패키지(`nanoid`) 설치해 import
- [ ] `github-report.js` 동작 (일부 실패해도 나머지 출력)
- [ ] 디버깅 실습에서 `forEach`+async 버그를 `for...of`로 고침

---

## 9. git 커밋

⌨️ 실습 — 저장소 루트에서

```bash
git add .
git commit -m "Day 2: 비동기(Promise/async·await)·fetch·모듈(ESM) 실습"
```

---

## 10. Day 3 미리보기

내일은 **TypeScript**입니다. 오늘 만든 `github-lib.js`를 TS로 다시 써서 **API 응답에 타입**을 붙여요.

- 기초 타입, `any`/`unknown`/`never`
- `interface` vs `type`, 유니온·narrowing
- **제네릭 `<T>`** (🐍 `TypeVar`)
- **Zod** 맛보기 (런타임 검증 — Day 6 에이전트 도구 스키마에서 재등장)

💡 시작할 때 로드맵을 붙이고 **"Day 3 상세 자료 만들어줘"**라고 요청하세요.

---

## 부록 — Python ↔ JS 치트시트 (Day 2분)

| 개념 | 🐍 Python | 🟨 JavaScript |
|------|-----------|---------------|
| 비동기 함수 | `async def f():` | `const f = async () => {}` |
| 대기 | `await coro` | `await promise` |
| 잠깐 멈춤 | `await asyncio.sleep(1)` | `await wait(1000)` (직접 구현) |
| 병렬 실행 | `asyncio.gather(*ts)` | `Promise.all([...])` |
| 병렬(실패 허용) | `gather(..., return_exceptions=True)` | `Promise.allSettled([...])` |
| HTTP 요청 | `requests.get(url)` | `await fetch(url)` (+ `await res.json()`) |
| 상태코드 체크 | `res.raise_for_status()` | `if (!res.ok) throw ...` |
| 예외 발생 | `raise Error(...)` | `throw new Error(...)` |
| 예외 처리 | `try/except` | `try/catch` |
| 모듈 내보내기 | (자동) | `export const` / `export default` |
| 모듈 가져오기 | `from m import a` | `import { a } from "./m.js"` |
| 외부 패키지 | `import requests` | `import { x } from "pkg"` |

오늘 비동기의 큰 산을 넘었습니다. 내일 TS는 오히려 편할 거예요 — 타입은 이미 아는 개념이니까요. 🟨
