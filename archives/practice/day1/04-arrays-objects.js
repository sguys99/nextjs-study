// 4-1. 배열 메서드
// 파이썬은 리스트 컴피리헨션이 유명, JS는 메서드 체이닝 사용

const nums = [1, 2, 3, 4, 5];

// map: 각 요소 변환 (파이썬 [n*2 for n in nums])
console.log(nums.map((n) => n * 2)); // [2, 4, 6, 8, 10]

// filter: 조건 통과만 (파이썬 [n for n in nums if n%2===0])
console.log(nums.filter((n) => n % 2 === 0)); // [2, 4]

// reduce: 하나로 접기 (파이썬 sum() / functools.reduce)
console.log(nums.reduce((acc, n) => acc + n, 0)); // 15  (0은 초깃값)

// find: 조건 맞는 첫 요소 (파이썬 next(n for n in nums if n>3))
console.log(nums.find((n) => n > 3)); // 4

// some / every: 하나라도 / 전부 (파이썬 any() / all())
console.log(nums.some((n) => n > 4)); // true
console.log(nums.every((n) => n > 0)); // true

// forEach: 순회, 반환값 없음, 파이썬 for 루프
nums.forEach((n) => console.log(n));

// 메서드 체이님: 파이썬 컴프리핸션 한줄을 js는 이렇게...

// 🐍 파이썬: [n*n for n in nums if n % 2 === 0]  → 짝수만 제곱
// 🟨 JS:
const result = nums.filter((n) => n % 2 === 0).map((n) => n * n);
console.log(result); // [4, 16]
// 처음엔 컴프리헨션보다 장황해 보이지만, 체이닝은 읽는 순서 = 실행 순서라 복잡해질수록 오히려 명확합니다. filter → map → reduce를 물 흐르듯 이어보세요.

//------------------------------------
// 4-2. 객체 리터럴 & 구조 분해 할당
// JS의 객체({})는 파이썬의 딕셔너리에 가깝습니다(단, 키가 문자열이고 점 표기법 .으로 접근).

const user = { name: "Kim", age: 30, city: "Seoul" };

// 접근은 점으로
console.log(user.name);
console.log(user["age"]); // 대괄호도 가능

// 구조 분해 할당: 매우 자주 활용
const { name, age } = user;
console.log(name, age);

// 이름 바꾸기 + 기본값
const { city, country = "KR" } = user;
console.log(city, country); // "Seoul" "KR"

// 배열도 구조 분해 (파이썬 튜플 언패킹)
const [first, second] = [10, 20];
console.log(first, second); // 10 20
// 배열 구조 분해 const [a, b] = arr는 파이썬 a, b = arr와 똑같습니다.

// -----------------------------------------
// 4-3. 전개 연산자(Spread)로 복사/ 병합
// 객체 병합 (파이썬 {**base, "c": 3})
const base = { a: 1, b: 2 };
const extended = { ...base, c: 3 }; // { a: 1, b: 2, c: 3 }

// 객체 일부 덮어쓰기 (불변 업데이트 — React에서 핵심 패턴)
const updated = { ...user, age: 31 }; // age만 바꾼 새 객체
console.log(updated); // { name: "Kim", age: 31, city: "Seoul" }

// 배열 병합/복사 (파이썬 [*a, *b])
const a = [1, 2];
const b = [3, 4];
console.log([...a, ...b]); // [1, 2, 3, 4]
