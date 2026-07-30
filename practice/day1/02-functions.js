const square = (n) => n * n;
const greet = (name) => `안녕 ${name}!`;
console.log(square(5));
console.log(greet("광명"));

// =====

const power = (base, exp = 2) => base ** exp;
console.log(power(3));
console.log(power(3, 3));

const sum = (...nums) => nums.reduce((a, b) => a + b, 0);
console.log(sum(1, 2, 3, 4));

const a = [1, 2];
const b = [...a, 3, 4];
console.log(b);

// --------------
// 고차 함수: 함수를 인자로 넘기거나 반환하는 함수. JS에서 매우 흔합니다(특히 세션 4의 배열 메서드). ③ 🐍: Python에서 map(fn, xs)에 함수를 넘기는 것과 같은 개념. JS에선 이게 훨씬 일상적입니다.

const applyTwice = (fn, x) => fn(fn(x));
console.log(applyTwice((n) => n + 3, 3)); // 16

// --------
const toF = (c) => (c * 9) / 5 + 32;
console.log(toF(100)); // 212

const makeMultiplier = (n) => (x) => x * n; // 클로저. 함수를 반환하는 함수
const triple = makeMultiplier(3);
console.log(triple(5));
