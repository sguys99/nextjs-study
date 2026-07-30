// 2-3. setTimeout : 비동기의 가장 단순한 형태
// setTimeout(콜백, 밀리초)는 "지정 시간 뒤에 콜백을 실행 큐에 넣어줘"입니다.

console.log("1. 시작");
setTimeout(() => console.log("2. 1초뒤"), 1000);
console.log("3. 끝");

// 1. 시작
// 3. 끝
// 2. 1초뒤

// 파이썬의 time.sleep(1)은 블로킹(그 줄에서 멈춤)이지만, setTimeout은 논블로킹(예약만 하고 지나감)입니다.

// 2-4. Promise — "나중에 값이 올 상자" (🐍 Future/awaitable)
// Promise는 "지금은 없지만 나중에 성공(resolve) 또는 실패(reject)할 값"을 담는 객체입니다. 🐍 파이썬의 Future/코루틴이 await 가능한 것과 같은 자리입니다.

const p = new Promise((resolve) => {
  console.log("executor는 즉시 실행됨"); // ← 이게 먼저 찍히는지 확인
  setTimeout(() => resolve("데이터 도착!"), 500);
});
console.log("동기 코드가 먼저 끝남");
console.log(await p); // 500ms 뒤 "데이터 도착!"


//--------------------------------
// 2-5 콜백 → Promise → async/await (진화 3단계)
// ① 콜백 지옥 (옛날 방식) — 중첩되면 오른쪽으로 계속 밀림

setTimeout(() =>{
    console.log("Kim");
    setTimeout(() => {
        console.log("반가워요");
    }, 500);
}, 500);

// ② Promise 체이닝 — 그나마 평평해짐
// js에는 없어서 sleep 정의 해야함
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

// -------------------------------------------------
// 실행 순서 함정 (마이크로태스크 vs 매크로태스크)
//Promise(마이크로태스크)가 setTimeout(매크로태스크)보다 먼저 처리됩니다.

console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");

// 출력: 1, 4, 3, 2
//  - 1, 4: 동기 코드 먼저
//  - 3: Promise(마이크로태스크)가 다음 순번
//  - 2: setTimeout(매크로태스크)은 그 뒤