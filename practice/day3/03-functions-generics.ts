
// 인자: number, 반환: number
const square = (n: number): number => n * n;

// async 함수의 반환은 Promise<T>
const getName = async (id: number): Promise<string> => {
  return `user-${id}`;
};

// ------
// 3-2. 제네릭 <T> — "타입을 인자로 받기"
const last = <T>(arr: T[]): T=> arr[arr.length -1];
console.log(last([10, 20, 30]));
console.log(last(["x", "y"]));

//------- 연습 문제

// 1
const wrapInArray = <T>(x: T): T[] => [x];
console.log(wrapInArray(5));    // [5]
console.log(wrapInArray("a"));  // ["a"]

// 2
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; w: number; h: number }
  | { kind: "triangle"; base: number; height: number };

const area = (s: Shape): number => {
  if (s.kind === "circle") return Math.PI * s.radius ** 2;
  if (s.kind === "rect") return s.w * s.h;
  return (s.base * s.height) / 2;
};