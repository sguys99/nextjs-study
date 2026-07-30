// map: 각 원소를 변환 🐍 [x*2 for x in xs] 또는 map(fn, xs).
const nums = [1, 2, 3];
const doubled = nums.map((n) => n * 2); // [2, 4, 6]
console.log(doubled);

// filter: 조건에 맞는 것만 남김 🐍 [x for x in xs if cond].
const evens = nums.filter((n) => n % 2 === 0); // [2]
console.log(evens);

// reduce: 하나의 값으로 접기/ 누적
const total = nums.reduce((acc, n) => acc + n, 0); // 6 , acc=누적값, n=현재원소, 0=초깃값
console.log(total);

// find: 조건에 맞는 첫 원소 / some, every - 존재/ 전체 검사
nums.find((n) => n > 1); // 2  (첫 번째)
nums.some((n) => n > 2); // true  (하나라도 있나? 🐍 any())
nums.every((n) => n > 0); // true  (전부 그런가? 🐍 all())

// 실습
const scores = [88, 92, 45, 70, 99];
const passed = scores.filter((s) => s >= 60);
const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
console.log("합격:", passed); // 합격: [ 88, 92, 70, 99 ]
console.log("평균:", avg); // 평균: 78.8

// 4-2 메서드 체이닝
const result = [1, 2, 3, 4, 5].filter((n) => n > 2).map((n) => n * 10);
console.log(result); // [ 30, 40, 50 ]

//4-3. 객체 (딕셔너리와 비슷하지만…)
//쉬운 설명: { 키: 값 } 형태. 🐍 Python 딕셔너리와 비슷하지만 키에 따옴표를 보통 안 붙이고 값 접근을 obj.key(점)로 많이 합니다.
const user = { name: "광명", age: 30 };
console.log(user.name); // "광명"  (점 접근)
console.log(user["age"]); // 30      (대괄호 접근도 가능)
user.job = "ML"; // 속성 추가

console.log(user);

//4-4. 구조 분해 할당 (destructuring)
//React·Next.js 코드가 이걸 엄청나게 씁니다. 지금 익혀두면 나중이 편해요. ② 쉬운 설명: 배열/객체에서 값을 한 번에 여러 변수로 꺼내기. ③ 🐍: Python의 언패킹 a, b = [1, 2]나 name = d["name"]을 한 방에 하는 것.
// 배열 구조 분해
const [first, second] = [10, 20];
console.log(first, second); // 10 20

// 객체 구조 분해 (키 이름으로 꺼냄)
const user2 = { name: "광명", age: 30 };
const { name, age } = user2;
console.log(name, age); // 광명 30

// 연습문제
const products = [
  { name: "A", price: 1000 },
  { name: "B", price: 3000 },
  { name: "C", price: 500 },
];

// 1
const names = products.filter((p) => p.price >= 1000).map((p) => p.name);
console.log(names); // [ 'A', 'B' ]

// 2
const totalPrice = products.reduce((sum, p) => sum + p.price, 0);
console.log(totalPrice); // 4500
