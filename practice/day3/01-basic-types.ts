const message: string = "hello TS";
console.log(message.toUpperCase());

//--------------
const describe = (value: unknown): string => {
  if (typeof value === "number") return `숫자 ${value}`;
  if (typeof value === "string") return `문자열 "${value}"`;
  return "알 수 없음";
};

console.log(describe(42));      // 숫자 42
console.log(describe("hi"));    // 문자열 "hi"
console.log(describe(true));    // 알 수 없음