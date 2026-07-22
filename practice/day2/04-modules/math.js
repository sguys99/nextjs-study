// 04-modules/math.js
// ① named export — 이름을 그대로 내보냄 (여러 개 가능)

export const PI = 3.14159;
export const add = (a, b) => a + b;
export const sub = (a, b) => a - b;

// ② default export — 파일당 딱 하나, "이 모듈의 대표"
export default function multiply(a, b) {
    return a * b;
}
