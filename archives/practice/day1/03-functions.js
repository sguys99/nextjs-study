// 3-1. 함수 정의 세가지 방식

// 1. 선언문
function add(a, b) {
  return a + b;
}

// 2. 함수 표현식 : 변수에 함수를 담음
const sub = function (a, b) {
  return a - b;
};

// 3. 화살표 함수: 모던 js 기본
const mul = (a, b) => a * b;

console.log(add(2, 3), sub(5, 2), mul(4, 3));

// ----------------------
// 3-2. 화살표 함수 자세히 : lambda 확장판

// 인자 1개: 괄호 생략 가능
const square = (x) => x * x;

// 본문이 한줄이 면 return 생략(암묵적 변환)
const double = (x) => x * 2;

// 본문이 여러 줄이면 { }와 return 필요
const describe = (x) => {
  const label = x > 0 ? "양수" : "음수 또는 0";
  return `${x}는 ${label}`;
};

// 객체를 반환할 땐 () 로 감싸기 ⚠️ (안 그러면 {}를 코드블록으로 오해)
const toObj = (x) => ({ value: x });

console.log(square(5), double(5));
console.log(describe(3));
console.log(toObj(7));

// ----------------------
// 3-3. 기본 값, rest, spread

// 기본 값 매개변수, 파이썬과 동일
const greet = (name = "world") => `Hello, ${name}!`;
console.log(greet());
console.log(greet("Kim"));

// rest: 나머지 인자를 배열로 모음 (파이썬의 *args)
const sum = (...nums) => nums.reduce((acc, n) => acc + n, 0);
console.log(sum(1, 2, 3, 4)); // 10

// spread: 배열을 개별 인자로 펼침 (파이썬의 *arr)
const numbers = [5, 1, 8, 3];
console.log(Math.max(...numbers)); // 8

//---------------------------------------
// 3-4. 고차 함수 감 잡기
// 함수를 인자로 받거나 리턴하는 함수: 다음 세션의 map, filter 등

// 함수를 인자로 받기
const applyTwice = (fn, x) => fn(fn(x));
console.log(applyTwice((n) => n + 3, 10)); // 16

// 함수를 리턴하기(클로저 맛보기..)
const makeMultiplier = (factor) => (x) => x * factor;
const triple = makeMultiplier(3);
console.log(triple(10)); // 30

// 파이썬의 functiontoools, 데코레이트와 유사
