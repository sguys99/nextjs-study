// named export: 이름을 붙여 여러 개 내보내기 → import { a, b } from ...
// default export: 파일당 하나의 "대표" → import 아무이름 from ...
// 4-1

// named export : 여러개를 이름으로 보냄
export const add = (a, b) => a + b;
export const multiply = (a, b) => a * b;

// default exprot : 파일의 대표 하나
export default function describe() {
    return "간단한 수학 모듈";
}

