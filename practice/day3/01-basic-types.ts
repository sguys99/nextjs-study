const greeting: string = "TypeScript 시작"
console.log(greeting.toUpperCase());

//const oops: number = "이건 숫자가 아닌데?" // 에디터에 빨간줄
//console.log(oops);

// node 01-basic-types.ts    # ✅ 그냥 돌아갑니다! (타입을 지우고 실행)
// pnpm typecheck            # ❌ error TS2322: Type 'string' is not assignable to type 'number'

// 1-5 기본 타입 & 타입 추론
// 원시 타입 — Day 1에서 배운 7종에 어노테이션만 붙는 것

const s: string = "hello";
const n: number = 42;
const b: boolean = true;


// ⭐ 타입 추론: 사실 위 어노테이션은 전부 불필요 — TS가 알아서 압니다
const inferred = "hello"; // 타입: "hello" (리터럴 타입! 아래 참고)
let counter = 0; // 타입: number

// 배열
const nums: number[] = [1, 2, 3]; // 🐍 list[int]
const names: string[] = []; // ⚠️ 빈 배열은 추론 불가 → 어노테이션 필수

// 튜플: 길이와 위치별 타입 고정
const pair: [string, number] = ["accuracy", 0.93]; // 🐍 tuple[str, float]


// 객체 타입
const user: {name: string; age?: number} = {name: "Kim"} // ?는 옵셔널

// -----------------------------------
// 1-6. any vs unknown vs never ⭐ (매우 중요)
// any: 타입 검사 포기 - 동적 타이핑으로 돌아가겠다는 선언
let a: any = "hello";
a.foo.bar.baz; /// ✅ 통과 (그리고 런타임에 폭발) — 그래서 금지

// // unknown: "타입을 모름. 쓰려면 먼저 좁혀라" — 안전한 any
let u: unknown = = JSON.parse('{"x": 1}');
// u.x; // 에러: 좁히기 전에 사용 불가

if (typeof u === "object" && u !== null) {
    // 여기서부터 object 로 좁혀짐
}

// never: "있을 수 없는 값" — 모든 경우를 처리했다는 증명에 쓰임 (세션 3)

