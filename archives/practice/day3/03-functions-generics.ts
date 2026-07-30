// 3-1. 함수 타이핑
// 기본형: 매개변수와 반환 타입
function score(correct: number, total: number): nuber {
    return correct/ total;
}

// 화살표 함수 : Day 1 convection에 타입만 추가
const label = (acc: number): string => (acc >= 0.9 ? "strong": "weak");

// 반환 없음 void (파이썬의 None과 유사)
const log = (msg: string): void => console.log(msg);

// 함수 자체의 타입 (파이썬의 Callable)
type Labeler = (acc: number) => string;
const labeler: Labeler = (acc) => (acc >= 0.9 ? "S" : "A"); // 매개변수 타입 자동 추론!

// 기본값 · 옵셔널 · rest 타이핑
function report(name: string, digits = 3, ...tags: string[]): string{
    return `${name} (${digits}자리) [${tags.join(", ")}]`;
}

// 반환 타입은 생략해도 추론되지만, 외부에 노출되는 함수(export하는 것)는 명시하는 습관을 권합니다 — 구현을 바꿨을 때 "반환 타입이 의도치 않게 바뀌는" 사고를 컴파일러가 잡아줍니다.

// 오버로드
// function parse(input: string): number;
// function parse(input: string[]): number[];
// function parse(input: string | string[]): number | number[] {
//   return Array.isArray(input) ? input.map(Number) : Number(input);
// }

// -----------------------------------------------
// 3-2. 제네릭 <T> 어떤 타입을 받되, 들어온 타입과 나가는 타입의 관계를 유지

// 🐍 def first[T](arr: list[T]) -> T | None:   (Python 3.12 문법)
function first<T>(arr: T[]): T | undefined {
    return arr[0];
}

const n = first([1, 2, 3]); // T = number로 추론 → n: number | undefined
const s = first(["a", "b"]); // T = string으로 추론 → s: string | undefined
// 호출할 때 타입을 적을 필요 없음 — 인자에서 자동 추론!

// 제약(constraint): T가 최소한 갖춰야 할 모양 (🐍 TypeVar bound)
function longest<T extends {length: number}>(a: T, b: T): T {
    return a.length >= b.length ? a : b;
}
longest("hello", "hi"); // ✅ string은 length가 있음
longest([1, 2], [3]); // ✅ 배열도 length가 있음
// longest(10, 20);      // ❌ number엔 length 없음

// 제네릭 타입: 컨테이너의 타입 매개변수
interface ApiResponse<T> {
    ok: boolean;
    data: T;
}
const res1: ApiResponse<number[]> = {ok: true, data: [1, 2, 3]};

// ---------------------------------------------------------------
// Narrowing (타입 좁히기) 유니온 타입은 "여러 가능성"입니다. 분기문을 통과할 때마다 TS가 가능성을 좁혀주는 것이 narrowing이고, TS 코드의 절반은 이 패턴입니다.

// ① typeof — 원시 타입 좁히기 (🐍 isinstance(x, str))
function format(id: number | string): string{
    if (typeof id === "string"){
        return id.toUpperCase(); // 여기서 id는 string
    }
    return id.toFixed(0); // 여기서 id는 numver (else 없이 좁혀짐)
}

// ② in — 프로퍼티 존재로 좁히기
type Cat = { meow: () => void };
type Dog = { bark: () => void };
function speak(pet: Cat | Dog) {
    if ("meow" in pet) pet.meow();
    else pet.bark();
}

// ③ 커스텀 타입 가드 — "x is 타입" 반환 (🐍 TypeGuard[User]): 다시 볼것
interface User {
  name: string;
}
function isUser(x: unknown): x is User {
  return typeof x === "object" && x !== null && "name" in x;
}


// ---------------------
// 에제 세션 2의 예제를 완성해보자.

type TrainResult =
  | { status: "success"; accuracy: number }
  | { status: "failed"; reason: string }
  | { status: "pending" };

function summarize (r: TrainResult): string{
  switch (r.status) {
    case "success":
      return `정확도 ${(r.accuracy * 100).toFixed(1)}%`; // r에 accuracy만 존재
    case "failed":
      return `실패: ${r.reason}`; // r에 reason만 존재
    case "pending":
      return "학습 중...";
    default: {
      // 모든 case를 처리했다면 여기 도달 불가 → r의 타입은 never
      const _exhaustive: never = r;
      return _exhaustive;
    }
}
}