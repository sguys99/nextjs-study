// named는 { } 로, default는 이름 자유롭게
import des, {add, multiply} from "./math.js";

console.log(des());
console.log(add(2, 3));
console.log(multiply(4, 5));

// 4-2

import { nanoid } from "nanoid";
console.log("생성된 ID:", nanoid()); // 예: "V1StGXR8_Z5jdHi6B-myT"