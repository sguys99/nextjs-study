// 04-modules/main.js

// default는 {} 없이 원하는 이름으로, named는 {}로 정확한 이름을 꺼냄

import multiply, {PI, add, sub} from "./math.js";

console.log(PI);
console.log(add(2, 3));
console.log(multiply(4, 5));

// 이름 바꿔서 가져오기 as
import {add as plus} from "./math.js";
console.log(plus(10, 2)); 

// 4-3. import * as 전체 가져오기 + 최상위 await

import * as math from "./math.js"

console.log(math.add(1, 2), math.PI)

// 최상위 await: esm???

const data = await fetch("https://api.github.com/users/torvalds").then((r) =>
  r.json()
);
console.log(data.name)

// 4-5 npm 패키지 설치해서 써 보기
// pnpm add date-fns

// 패키지 함수 가져오기
// package.json의 dependencies에 추가되고 node_modules/에 실체가 들어옵니다.
import {format} from "date-fns";

const now = new Date();
console.log(format(now, "yyyy-MM-dd HH:mm")); // 예: 2026-07-20 14:30