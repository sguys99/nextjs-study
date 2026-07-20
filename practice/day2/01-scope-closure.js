// 1-1. 스코프
// let/ const는 블록 스코프임. {} 안에서 선언하면 그 밖에서는 안보임

{
    const secret = 42;
    console.log(secret); // 42
}

// console.log(secret);  // ❌ ReferenceError: secret is not defined

for (let i = 0; i < 3; i++) {
  // i는 이 블록 안에서만 유효
}
// console.log(i);  // ❌ 파이썬과 달리 여기선 i가 없음

// var는 함수 스코프라 블록을 무시하고 함수 전체로 세어 나감 -> var을 안쓰는 이유가 이것

// ---------------------------------------------------
// 1-2. 클로저: 함수가 정의된 위치의 바깥 변수를 계속 붙잡고 있는 현상???

function makeCounter() {
    let count = 0;
    return () => {
        count += 1; // 자동으로 함수 밖의 변수를 잡음
        
        return count;
    }
}

const counter = makeCounter();

console.log(counter(), counter(), counter()) // 1, 2, 3
// 클로저 = "비공개 상태" counter는 makeCounter 밖에서 접근 못함. 
// 반환된 함수만 만질수 있음. js에 캡슐화를 만드는 고전적 방식

// 클로저로 "설정을 담은 함수 공장" 만들기 (Day 1의 makeMultiplier 확장판)
const makeGreeter = (greeting) => (name) => `${greeting}, ${name}!`;
// // 위 한 줄과 완전히 동일한 코드
// const makeGreeter = (greeting) => {
//   return (name) => {
//     return `${greeting}, ${name}!`;
//   };
// };

const hello = makeGreeter("Hello"); // hello는 함수임. name을 인자로 받는 함수
console.log(hello); // 함수임
console.log(hello("Kim")); // 이제 실행. "Hello, Kim!"

// 두번 호출을 한줄로 붙여서 쓸수도 있음
console.log(makeGreeter("안녕")("Kim")); 

// 아래에서 hello, annyeong는 별개의 함수임
const hi = makeGreeter("Hello");
const annyeong = makeGreeter("안녕");
console.log(hi("Kim")); // "Hello, Kim!"
console.log(annyeong("Kim")); // "안녕, Kim!"

// -----------------------------------------------
// 1-3. 1-3. ⚠️ 클로저 + 루프의 고전 함정 (var vs let)
// let을 쓰면 반복마다 새로운 j가 생김

// ✅ let — 반복마다 "새로운 j"가 생겨서 각자 붙잡음
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log("let:", j), 0);
}
// 출력: let: 0  let: 1  let: 2

//------------------------------------------------
// 1-4. 고차함수 복습 — 콜백은 어디에나 있다
// 콜백: 나중에 불릴 함수, 앞에서 map, filter와 같이 함수를 인자로 받는 함수
// 비동기의 출발점

// map에 넘긴 (n) => n * 2 가 바로 콜백
[1, 2, 3].map((n) => n * 2)

// 직접 콜백을 받는 함수 만들기
const repeat = (n, callback) => {
    for (let i = 0; i < n; i++) callback(i);
};

repeat(3, (i) => console.log("반복", i));


// 1-5. this는 "개념만" (로드맵 방침)
