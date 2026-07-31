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

#### 잠깐 — 위 코드에 `await`가 왜 두 군데나 붙었나

`fetch` 앞에 하나, `getUser` 앞에 하나. 헷갈리기 딱 좋은 지점이라 한 번 짚고 갑니다.
**한 줄 답: 둘 다 Promise(진동벨)를 반환하는 함수라서**입니다. `await`은 **"벨 울릴 때까지 기다렸다가 상자 안의 진짜 값을 꺼내라"**는 뜻이에요.

**① `await fetch(...)` — 응답이 도착할 때까지**

`fetch`는 네트워크 요청이라 결과가 즉시 안 나옵니다. 그래서 `Response` 대신 **진동벨**을 즉시 돌려줘요.

📖 설명용 — `await`을 빼면 무슨 일이 생기나

```js
const res = fetch("https://api.github.com/users/torvalds");
console.log(res);     // Promise { <pending> }  ← Response가 아니라 상자!
console.log(res.ok);  // undefined              ← 상자엔 .ok가 없다
```

`await`을 붙여야 상자가 열리고 `Response` 객체가 나옵니다. 그래야 다음 줄의 `res.ok`, `res.status`를 읽을 수 있어요.

**② `await getUser(...)` — `async` 함수는 무조건 Promise를 반환하니까**

세션 2에서 "함수 앞에 `async`를 붙이면 그 함수는 Promise를 반환한다"고 했죠(2-3). 그게 여기서 그대로 걸립니다. `getUser` 안에서 `return res.json()`으로 **객체를 돌려주는 것처럼 보여도**, 바깥에서 받는 건 언제나 `Promise<객체>`입니다.

📖 설명용

```js
const user = getUser("torvalds");
console.log(user.login);  // undefined  ← user는 객체가 아니라 Promise
```

그래서 `user.login`, `user.public_repos`를 쓰려면 `await`으로 한 번 꺼내야 합니다.

**③ 그럼 `return res.json()`엔 왜 `await`가 없나?**

`res.json()`도 Promise를 반환합니다(본문을 끝까지 받아서 파싱해야 하니까). 그런데 여기선 `await` 없이 그냥 `return`했죠.

**`async` 함수가 Promise를 `return`하면 자동으로 평탄화(flatten)되기 때문**입니다. `Promise<Promise<객체>>`로 두 겹이 되지 않고 `Promise<객체>` 한 겹으로 눌립니다. 그래서 호출부의 `await getUser(...)` **한 번**으로 최종 객체가 나와요.

```js
// 📖 설명용 — 아래 둘은 결과가 같음
return res.json();
return await res.json();
```

💡 다만 **`try/catch` 안에서는 다릅니다.** `return await`이어야 그 에러를 **이 함수의 catch**가 잡아요. 그냥 `return`하면 에러가 호출자에게 넘어가 **호출자의 catch**가 잡습니다. 지금 `getUser`에는 try/catch가 없으니 차이가 없습니다.

**정리 — 값이냐 상자냐**

| 표현 | 손에 쥐는 것 |
|---|---|
| `fetch(url)` | `Promise<Response>` (상자) |
| `await fetch(url)` | `Response` (값) |
| `res.json()` | `Promise<object>` (상자) |
| `await res.json()` | `object` (값) |
| `getUser("torvalds")` | `Promise<object>` (상자) |
| `await getUser("torvalds")` | `object` (값) |

**규칙 한 줄**: `async` 함수 호출 앞, 그리고 Promise를 반환하는 함수 앞에는 `await`. 안 붙이면 값 대신 상자를 받습니다.

⚠️🐍 **`await`은 "시작 버튼"이 아닙니다.** Python 코루틴은 `await`하기 전엔 아예 안 돌지만(lazy), JS는 `fetch(...)`를 호출한 **그 순간 이미 요청이 나갔습니다**(2-2의 두 번째 함정). `await`은 "시작해라"가 아니라 **"이미 달리는 것의 결과를 기다려라"**예요. 바로 다음 3-3의 `Promise.all`이 이 성질을 그대로 이용합니다.

#### 그래서 — 어떤 함수가 Promise를 주는지 어떻게 아나

"`await`을 붙여야 하는 함수"를 알아보는 방법입니다. 실무에서 쓰는 순서대로 넷.

**① 정의에 `async`가 붙어 있으면 100% Promise** — 예외 없습니다. `const getUser = async (...) => {...}` 를 본 순간 확정이에요. 내가 만든 함수는 이걸로 끝납니다.

**② 에디터에 마우스를 올려본다 (가장 실용적)** — VS Code에서 함수 이름 위에 커서를 올리면 반환 타입이 뜹니다.

```
fetch(input: RequestInfo, init?: RequestInit): Promise<Response>
                                              ^^^^^^^^^^^^^^^^^ 이게 보이면 await 대상
```

`Promise<...>`로 감싸여 있으면 상자입니다. 🐍 Python에서 IDE가 `-> Coroutine[...]`을 보여주는 것과 같은 역할이에요. Day 3에서 TypeScript를 붙이면 이 정보가 훨씬 정확해지고, **`await`을 빠뜨리면 아예 컴파일 에러**로 잡아줍니다.

**③ 감각 규칙 — "바깥 세상과 대화하면 비동기"**

| 🟢 동기 (그냥 값) | 🔴 비동기 (Promise) |
|---|---|
| `arr.map()`, `arr.filter()` | `fetch(url)` — 네트워크 |
| `JSON.parse(str)` | `res.json()` — 아직 다 안 온 본문을 읽음 |
| `Math.max(...)` | `fs.promises.readFile()` — 디스크 |
| `str.toUpperCase()` | `wait(1000)` — 타이머 |

기준은 **"결과를 만드는 데 CPU 말고 다른 놈을 기다려야 하나"**입니다. 네트워크·디스크·DB·타이머는 기다림이 있으니 Promise, 순수 계산은 즉시 값이에요.
💡 `res.json()`이 비동기인 게 의외일 수 있는데, `await fetch(...)`가 끝난 시점엔 **헤더만 도착**한 상태라 본문은 아직 흘러들어오는 중이라서 그렇습니다.

**④ 모르겠으면 그냥 찍어본다**

📖 설명용

```js
const x = 어떤함수();
console.log(x);
// Promise { <pending> }  → 상자다. await 필요
// { login: 'torvalds' }  → 값이다. await 불필요
```

⚠️ **함정 — `await`을 빼먹어도 에러가 안 납니다.** `user.login`이 조용히 `undefined`가 될 뿐이에요. "왜 값이 undefined지?"의 범인 1순위가 `await` 누락입니다. 🐍 Python은 `await`을 빼먹으면 `RuntimeWarning: coroutine was never awaited`라도 띄워주는데, JS는 아무 말이 없습니다.

💡 **반대 방향은 안전합니다.** Promise가 아닌 값에 `await`을 붙이는 건 **무해**해요 — 그냥 그 값이 그대로 나옵니다.

```js
const n = await 42;  // 42. 에러 아님
```

그래서 헷갈릴 땐 **붙이는 쪽이 안전**합니다. (다만 `async` 함수 안에서만)

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

#### 잠깐 — 여기서 `n`은 대체 뭔가

선언한 적도 없는 `n`이 갑자기 튀어나와서 당황스러운 지점입니다. 한 줄 답: **`map`에 넘긴 화살표 함수의 매개변수**, 즉 배열 원소가 하나씩 들어오는 자리입니다.

```js
names.map((n) => getUser(n))
//         ↑ 이 자리에 "torvalds" → "gaearon" → "sindresorhus" 가 차례로 들어옴
```

📖 설명용 — `map`이 내부에서 하는 일을 풀어 쓰면

```js
const promises = [];
for (const n of names) {        // n = "torvalds" → "gaearon" → "sindresorhus"
  promises.push(getUser(n));    // getUser("torvalds"), getUser("gaearon"), ...
}
// promises === [Promise, Promise, Promise]
```

**③ 🐍 다리 + JS 설명**: Python의 리스트 컴프리헨션 `[get_user(n) for n in names]`에서 그 `n`과 똑같은 역할입니다. JS 자체 설명으로는 — **`map`은 배열을 돌면서 원소를 하나씩 꺼내 콜백에 인자로 "넣어주고"**, 콜백이 반환한 값을 모아 새 배열을 만듭니다. `n`은 그 "넣어주는 값을 받는 이름"이에요. 2-2에서 `resolve`를 내가 만들지 않고 받아 썼던 것과 같은 구조입니다.

몇 가지만 짚고 갑니다.

- **이름은 아무거나 됩니다.** `n` 대신 `name`, `username`이라 써도 동작은 동일해요. 의미가 드러나는 `(name) => getUser(name)`이 더 읽기 좋습니다.
- **`n`은 그 화살표 함수 안에서만 삽니다.** `map` 바깥에서 `console.log(n)` 하면 `ReferenceError` — 1-1의 스코프 얘기가 그대로 적용됩니다.
- **`getUser(n)`은 Promise를 반환**하므로 `names.map(...)`의 결과는 값 3개가 아니라 **상자 3개짜리 배열**입니다. 그리고 `map`이 도는 순간 요청 3개가 이미 나갔어요(2-2의 두 번째 함정). `Promise.all`은 "이미 달리는 셋"의 결과를 모아줄 뿐입니다.

⚠️ **함정 — `names.map(getUser)`로 줄이지 마세요.** 인자가 하나뿐이니 괄호를 없애고 싶어지는데, `map`은 콜백에 `(원소, 인덱스, 배열)` **3개**를 넘깁니다. 지금 `getUser(username)`은 두 번째 인자를 안 쓰니 우연히 동작하지만, 두 번째 인자를 받는 함수라면 인덱스가 슬쩍 끼어들어 버그가 됩니다. 🐍 Python의 `map(get_user, names)`는 인자를 하나만 넘기니 이 함정이 없어요. **`(n) => getUser(n)`으로 감싸는 습관**이 안전합니다. (대표 사례: `["1","2","3"].map(parseInt)` → `[1, NaN, NaN]`)

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

문법이 한 파일에 몰려 있어서 처음엔 안 읽히는 게 정상입니다. **일단 그대로 쳐서 돌려 보고**, 바로 뒤에 붙은 해부 절에서 낯선 문법을 하나씩 뜯습니다.

### 5-1. 라이브러리 파일 — `github-lib.js`

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

#### 잠깐 — 이 파일의 낯선 문법 4개

**① `export const fetchUser = async (username) => {` — 한 줄에 세 가지가 겹쳐 있음**

```
export   const fetchUser   =   async   (username) => { ... }
  ↑          ↑                   ↑         ↑
내보내기   변수 선언          비동기 함수  매개변수
```

`export`는 **"이 이름을 다른 파일에서 쓸 수 있게 공개한다"**는 표시입니다(4-1의 named export). 나머지는 세션 2에서 본 `async` 화살표 함수 그대로예요.

🐍 Python은 모듈의 최상위 이름이 **자동으로** 공개돼서 `export`라는 게 없죠(`async def fetch_user(username):`이면 끝). JS는 **내보낼 것을 명시**해야 합니다. `export`를 안 붙인 변수는 그 파일 밖에서 아예 안 보여요 — 1-1의 스코프가 파일 단위로 한 번 더 적용되는 셈입니다.

**② `if (!res.ok) throw new Error(...)` — 중괄호 없는 `if`**

JS의 `if`는 **본문이 한 문장이면 `{ }`를 생략**할 수 있습니다. 아래 둘은 완전히 같은 코드예요.

📖 설명용

```js
if (!res.ok) throw new Error(`${username}: ${res.status}`);

// 위 = 아래
if (!res.ok) {
  throw new Error(`${username}: ${res.status}`);
}
```

`!`는 부정입니다(🐍 `not`). `!res.ok` = "응답이 정상(200번대)이 **아니면**". 3-1의 그 함정 — `fetch`는 404에도 에러를 안 내니 직접 던져주는 겁니다.

⚠️ **함정 — JS에서 들여쓰기는 아무 의미가 없습니다.**

```js
if (!res.ok) throw new Error("실패");
  console.log("여기는 항상 실행됨");  // ← 들여썼지만 if 소속이 아님!
```

🐍 Python은 들여쓰기가 곧 블록이라 이런 사고가 안 나죠. JS는 **오직 `{ }`만** 블록을 만듭니다. 그래서 줄이 늘어날 가능성이 있으면 처음부터 중괄호를 쓰는 게 안전해요.

**③ `Promise.allSettled` — 돌려주는 게 사용자가 아니라 "보고서"**

3-3의 `Promise.all`은 하나만 실패해도 전부 터졌습니다. `allSettled`는 **아무도 안 터뜨리고, 각 결과를 봉투에 싸서** 돌려줘요.

📖 설명용 — `allSettled`가 실제로 돌려주는 배열

```js
[
  { status: "fulfilled", value: { login: "torvalds", followers: 200000, ... } },
  { status: "fulfilled", value: { login: "gaearon", ... } },
  { status: "rejected",  reason: Error("존재하지않는유저999: 404") },
]
```

성공 칸엔 `value`, 실패 칸엔 `reason`이 들어 있고 **`status` 문자열로 구분**합니다. 사용자 객체가 한 겹 포장돼 나오니, 포장을 뜯는 다음 줄이 반드시 필요해요.

| | 하나라도 실패하면 | 손에 쥐는 것 |
|---|---|---|
| `Promise.all` | **전체가 reject** | `[user, user, user]` (알맹이) |
| `Promise.allSettled` | 신경 안 쓰고 계속 | `[{status, value}, ..., {status, reason}]` (봉투) |

🐍 `asyncio.gather(*tasks, return_exceptions=True)`가 가장 가깝습니다. 다만 Python은 성공하면 값을, 실패하면 예외 객체를 **같은 자리에 섞어서** 주죠. JS는 항상 `{status, ...}` 봉투로 모양을 통일한다는 게 차이입니다.

**④ `.filter(...).map(...)` — 점을 이어 붙이는 체이닝**

```js
return results
  .filter((r) => r.status === "fulfilled")   // ① 성공한 봉투만 남기고
  .map((r) => r.value);                      // ② 봉투를 뜯어 알맹이만 꺼냄
```

`r`은 **봉투 하나**입니다(result의 r). 3-3에서 본 `n`과 완전히 같은 자리예요 — `filter`/`map`이 배열을 돌면서 요소를 하나씩 넣어주는 매개변수이고, **이름은 내가 아무렇게나 지은 것**입니다.

`filter`가 새 배열을 반환하니 거기에 곧바로 `.map`을 이어 붙일 수 있습니다. 🐍 Python이면 `[r["value"] for r in results if r["status"] == "fulfilled"]` 한 줄로 끝날 일을, JS는 **단계를 점으로 잇습니다.**

⚠️ **`===`는 값과 타입을 함께 보는 엄격 비교**입니다. `==`는 타입을 멋대로 변환해서(`"1" == 1` → `true`) 사고를 냅니다. **JS에서는 항상 `===`**. 🐍 Python의 `==`가 JS의 `===`에 해당한다고 생각하세요.

> ⌨️ **미니 실습** — `github-lib.js`의 `fetchUsers` 안, `return` 바로 위에 한 줄 추가하고 실행
> ```js
> console.log(results);   // 봉투 배열이 실제로 어떻게 생겼는지 눈으로 확인
> ```
> `status`/`value`/`reason`을 확인했으면 지우세요.

### 5-2. 리포트 파일 — `github-report.js`

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

#### 잠깐 — `u`, `i`, `sum`, `a`, `b`는 대체 뭔가

선언한 적도 없는 이름들이 갑자기 튀어나와 당황스러운 지점입니다. 한 줄 답: **전부 콜백 함수의 매개변수**, 즉 배열이 값을 "넣어주는 자리"이고 **이름은 내가 마음대로 지은 것**입니다.

3-3의 `n`, 5-1의 `r`과 완전히 같은 구조예요. 차이는 **배열 메서드가 몇 개를, 어떤 순서로 넣어주느냐**뿐입니다.

| 메서드 | 콜백이 받는 것 (순서 고정) | 이 코드에서 붙인 이름 |
|---|---|---|
| `sort` | (비교할 요소1, 비교할 요소2) | `a`, `b` |
| `reduce` | (누적값, 현재 요소, 인덱스, 배열) | `sum`, `u` |
| `forEach` | (현재 요소, 인덱스, 배열) | `u`, `i` |

⚠️ **이름이 아니라 "위치"가 의미를 결정합니다.** `(u, i)`를 `(i, u)`로 바꿔 쓰면 첫 번째 자리에 오는 사용자 객체가 `i`에 들어가 엉망이 돼요. 반대로 뒤쪽의 안 쓰는 인자는 그냥 안 적으면 됩니다(`forEach((u) => ...)`).

**① `forEach((u, i) => ...)` — 요소와 인덱스**

`u`는 user, `i`는 index에서 딴 관습적인 약자일 뿐입니다. 이렇게 써도 똑같이 돌아가요.

📖 설명용 — 위와 완전히 같은 코드

```js
ranked.forEach((사용자, 순번) =>
  console.log(`${순번 + 1}위 ${사용자.login}`)
);
```

🐍 Python이면 이겁니다.

```python
for i, u in enumerate(ranked):
    print(f"{i + 1}위 {u['login']}")
```

Python은 `for` **문법**이 값을 꺼내 변수에 대입하죠. 반면 JS의 `forEach`는 **"각 요소마다 이 함수를 대신 실행해줘"라고 함수를 통째로 넘기는** 방식입니다. 그래서 값이 대입이 아니라 **함수의 인자로 전달**돼요. 인덱스는 0부터 시작하니 `i + 1`을 해서 사람이 읽는 "1위"로 맞춥니다.

**② `reduce((sum, u) => sum + u.public_repos, 0)` — 누적**

Day 1에서 본 그 `reduce`입니다. 첫 인자 `sum`이 **지금까지 누적된 값**, 둘째 `u`가 **이번 차례의 요소**, 그리고 맨 뒤 `0`이 **누적 시작값**이에요.

📖 설명용 — `reduce`가 내부에서 하는 일

```js
let sum = 0;                      // ← 맨 뒤에 적은 0
for (const u of users) {
  sum = sum + u.public_repos;     // ← 콜백이 반환한 값이 다음 sum이 됨
}
// 최종 sum이 reduce의 결과
```

🐍 `functools.reduce(lambda acc, u: acc + u["public_repos"], users, 0)`와 같습니다.

⚠️ **콜백이 값을 반환하지 않으면 다음 `sum`이 `undefined`가 됩니다.** 지금처럼 중괄호 없는 화살표 함수는 자동 반환이지만, `{ }`로 감쌌다면 `return`을 꼭 붙이세요.

**③ `sort((a, b) => b.followers - a.followers)` — 비교 규칙**

`sort`는 요소를 **둘씩 짝지어** 콜백에 넣고 "누가 앞이냐"를 묻습니다. 반환값이 음수면 `a`가 앞, 양수면 `b`가 앞이에요.

- `a.followers - b.followers` → 오름차순 (작은 게 앞)
- `b.followers - a.followers` → **내림차순** (큰 게 앞) ← 순위표라 이걸 씀

`[...users]`로 복사본을 먼저 만든 건 Day 1의 함정 그대로 — **`sort`는 원본 배열을 직접 뒤집어 버리기** 때문입니다. 아래 `users.length`와 `reduce`는 원래 순서의 배열을 그대로 써야 하죠.

**④ 나머지 자잘한 것들**

- `` `${i + 1}위 ${u.login}` `` — 백틱 문자열 안 `${ }`에는 **식**이 들어갑니다. 🐍 f-string과 같아요.
- `"\n조회 성공..."` — `\n`은 줄바꿈 문자. 앞에 한 줄 띄우고 출력하라는 뜻입니다.
- `users.length` — 배열 길이. 🐍 `len(users)`.
- `main();` — 마지막 줄에서 **직접 호출**해야 실행됩니다. `async` 함수도 정의만으로는 아무 일도 안 일어나요.

> ⌨️ **미니 실습** — `github-report.js` 맨 아래에 붙여 실행 (확인 후 지우기)
> ```js
> // forEach가 콜백에 넘겨주는 3개를 전부 찍어 보기
> ["사과", "바나나"].forEach((element, index, whole) =>
>   console.log("요소:", element, "| 인덱스:", index, "| 전체:", whole)
> );
>
> // ⚠️ 순서를 바꾸면? (일부러 틀린 코드)
> ["사과", "바나나"].forEach((index, element) => console.log(`${index}번: ${element}`));
> ```
> 두 번째가 `사과번: 0`처럼 뒤집혀 나오는 걸 눈으로 보면 "이름이 아니라 순서"가 확실히 박힙니다.

### 5-3. 실행

⌨️ 실행 — `practice/day2/`에서

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

### 5-4. 혼자 해보기 (선택)

⌨️ 문제 — `github-report.js`를 고쳐서

1. (쉬움) 실패한 사용자도 보고 싶습니다. `github-lib.js`의 `fetchUsers`에서 `filter`의 조건을 `"rejected"`로 바꾼 함수를 하나 더 만들어 실패 사유(`r.reason.message`)를 출력하세요.
2. (보통) 팔로워 평균을 출력하세요. (`reduce`로 합 → `users.length`로 나누기, `.toFixed(1)`로 소수점 한 자리)

✅ 정답

```js
// github-lib.js에 추가
export const fetchFailures = async (names) => {
  const results = await Promise.allSettled(names.map((n) => fetchUser(n)));
  return results
    .filter((r) => r.status === "rejected")
    .map((r) => r.reason.message);
};

// github-report.js — main 안에
const avg = users.reduce((sum, u) => sum + u.followers, 0) / users.length;
console.log(`평균 팔로워: ${avg.toFixed(1)}`);
```

⚠️ 1번은 `fetchUsers`와 `fetchFailures`가 각각 `allSettled`를 부르니 **API 요청이 두 배로 나갑니다.** 실무라면 봉투 배열을 한 번만 받아 성공/실패로 갈라 쓰는 게 맞아요 — 지금은 문법 연습이니 넘어갑니다.

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
