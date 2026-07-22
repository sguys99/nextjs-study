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

