const name = "광명";
console.log("hi", name);

//---------
const city = "서울";
let count = 0;
count = count + 1;
console.log(city, count);

//------
console.log(0.1 + 0.2); // 0.30000000000000004
console.log(typeof 42); // "number"
console.log(typeof "hi"); // "string"
console.log(typeof true); // "boolean"

// -------
if ([]) console.log("빈 배열도 참!"); // 빈배열을 true
if ("") console.log("안 나옴"); // 빈 문자열은 false, null, undefined, NaN 도...

//------
// 템플릿 리터럴
const model = "GPT";
const acc = 0.97;
console.log(`모델 ${model}의 정확도는 ${acc * 100}%`);

//-----
// 1
const price = 12000;
const qty = 3;
console.log(`총액: ${price * qty}원`); // 총액: 36000원

// 2 (셋 다 false! === 는 타입까지 보므로)
console.log(0 === false); // false (number vs boolean)
console.log("" === false); // false (string vs boolean)
console.log(null === undefined); // false (서로 다른 타입)
