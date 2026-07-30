const makeCounter = () => {
  let count = 0; // 이 변수를…
  return () => {
    count += 1; // …반환된 함수가 계속 기억하고 증가시킴
    return count;
  };
};

const counter = makeCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3  ← count가 살아남아 누적됨!

// -----------------
// 1-3

const makeGreeter = (greeting) => (name) => `${greeting}, ${name}!`;
const hi = makeGreeter("안녕");
console.log(hi);
console.log(hi("광명")); // 안녕, 광명!
