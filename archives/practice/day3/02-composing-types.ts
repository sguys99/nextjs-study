// type vs interface — 데이터 모델 정의
// 객체의 모양을 정의하는 방법은 두가지가 있음

// 방법 1: interface
interface User {
    id: number;
    name: string;
    email?: string; // 옵셔널 프로퍼티
}

// 방법 2: type alias
type Product = {
    id: number;
    title: string;
    price: number;
};

const u: User = { id: 1, name: "Kim" };
const p: Product = { id: 1, title: "GPU", price: 999 };

// ----------------------------------------------------------
// 2-2. 유니온 | · 인터섹션 & · 리터럴 유니온 ⭐
// 유니온: 여러 타입 중 하나 (🐍 Union[int, str] / int | str)

type Id = number | string;

// 리터럴 유니온: enum의 모던 대체재 (🐍 Literal["small", "medium", "large"])
type ModelSize = "small" | "medium" | "large";

const size: ModelSize = "medium"; // ok
// const bad: ModelSize = "huge";  // ❌ 에러 + 에디터가 자동완성까지 해줌

// 인터섹션: 두 모양을 합침 (믹스인 느낌)
type Timestamped = { createdAt: string };
type Post = { title: string } & Timestamped; // title과 createdAt 둘 다 필요

// discriminated union (구별된 유니온) 맛보기 — 세션 3의 narrowing과 한 세트인 TS 실무의 심장:
type TrainResult =
  | { status: "success"; accuracy: number }
  | { status: "failed"; reason: string };
// status라는 공통 "태그" 필드로 어느 쪽인지 구별 → 세션 3에서 분기 처리

// -----------------------------------------------------------
// 2-3 옵셔널 3형제 ?, ?. , ??
interface Config {
    name: string;
    timeout?: number; // 없어도 된다. ① ?  : 이 프로퍼티는 없어도 됨 (타입: number | undefined)
}

const cfg: Config = {name: "exp1"};

// ?. 옵셔널 체이닝 - null/ undefined 이면 멈추고 undefined 반환
console.log(cfg.timeout?.toFixed(1)); // 에러 안남

// ??: nullish 병합 - 왼쪽이 null/ undefined 일때만 오른쪽 사용
const timeout = cfg.timeout ?? 3000; // 3000


// const retries = 0;
// console.log(retries || 3); // 3   ⚠️ 0이 falsy라서 기본값으로 덮임! (버그)
// console.log(retries ?? 3); // 0   ✅ 0은 유효한 값이므로 유지

// ---------------------------------------------------
// 2-4. strict 모드가 주는 null 안전 ; 다시 볼것

// tsconfig에서 strict: true를 켰기 때문에 (그 안의 strictNullChecks) 동작?

let title: string = "hello";
// title = null;               // ❌ 에러: string에 null 못 넣음

let subtitle: string | null = null; // null 가능성을 타입에 명시해야 함
// subtitle.toUpperCase();     // ❌ 에러: "null일 수도 있는데?"

if (subtitle !== null) {
  subtitle.toUpperCase(); // ✅ 체크 후엔 통과 (narrowing!)
}