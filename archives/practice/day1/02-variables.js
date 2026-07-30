const PI = 3.14; // 재할당 불가
let count = 0; // 제할당 가능
count = 1;

// const는 재 할당 금지이지 불변은 아님. 객체/ 배열의 일부는 바꿀수 있다

const arr = [1, 2];
arr.push(3);
console.log(arr);
// arr = [9] 와 같이 재할당은 안됨

// 원시 타입 7종
const s = "hello";
const n = 42;
const b = true;
const u = undefined;
const nul = null;
const big = 9007199254740993n; // bigint (뒤에 n)
const sym = Symbol("id"); // symbol (거의 안 씀)

console.log(typeof s, typeof n, typeof b);
// 파이썬은 int, float이 구분되어 있으나 js의 number는 하나

console.log(10 / 3);
console.log(Math.floor(10 / 3));
console.log(10 % 3);
console.log(2 ** 10);

// null vs undefined: 파이썬은 None 하나지만 js는 비어있음을 나타내는 값이 두개임
let un; // 선언만 하고 값을 안넣음, undefined
let nu = null; // 명시적으로 비었다고 지정

console.log(un);
console.log(nu);
console.log(typeof un); // undefined
console.log(typeof nu); // 유명한 버그 "object", 고쳐지지 못함

// 2-4 템플릿 리터럴 & 문자열 메서드
const name = "Kim";
const age = 30;

// 템플릿 리터럴 (백틱 ` `) — 파이썬 f-string에 해당
const msg = `${name}님은 ${age}살, 내년엔 ${age + 1}살`;
console.log(msg);

// 문자열 메서드
console.log("  hi  ".trim()); // "hi"       (파이썬 .strip())
console.log("a,b,c".split(",")); // ["a","b","c"]  (파이썬과 동일)
console.log("hello".toUpperCase()); // "HELLO"    (파이썬 .upper())
console.log("hello".includes("ell")); // true      (파이썬 "ell" in "hello")
console.log("hello".replace("l", "L")); // "heLlo"  ⚠️ 첫 번째만 바뀜

// 2-5. == vs ===, truthy/falsy

// ==는 타입을 맞춰서 비교(암묵적 변환), ===는 타입까지 엄격 비교
console.log(0 == "0"); //true
console.log(0 === "0");
console.log(null == undefined); // true
console.log(null === undefined); // false

// 실무에서는 ===, !==를 쓸 것!!

// falsy (거짓 취급): false, 0, "", null, undefined, NaN, 0n
// 그 외 전부 truthy
if ("hello") console.log("문자열은 truthy");
if (0) console.log("안 나옴");

// 파이썬과 다른점: 빈 배열/ 객체는 true임
if ([]) console.log("빈 배열도 truthy!"); // ✅ 출력됨
if ({}) console.log("빈 객체도 truthy!"); // ✅ 출력됨

// 🐍 파이썬: if []: 와 if {}: 는 False (빈 컨테이너는 falsy)
// JS에서 "비었나?"를 확인하려면:
const emptyArr = [];
if (emptyArr.length === 0) console.log("배열이 비었음"); // 이렇게 명시적으로
