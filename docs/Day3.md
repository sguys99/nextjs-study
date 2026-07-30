# Day 3 — TypeScript: 파이썬 타입힌트의 강화판

> **소요 시간**: 약 8시간 (90분 × 4세션). 타입은 이미 아는 개념이라 오늘은 좀 수월합니다.
> **선행 조건**: Day 2 완료 (`async/await`·`fetch`·`import/export` 사용, `practice/day2/exercise/`의 GitHub 스크립트 보관).
> **오늘의 목표**: TS 타입 시스템을 "컴파일 타임에 강제되는 파이썬 타입힌트"로 흡수하고, Day 2의 GitHub 리포트를 **타입 안전한 TS 3모듈**로 재작성한다.
>
> **태그 범례**: `🐍` Python 대비 · `💡` 팁 · `⚠️` 함정 · `🎯` 배경 · `📖` 설명용(읽기만) · `⌨️` 실습(직접 치기) · `✅` 완성본

---

## 0. 오늘 어떻게 진행되나 (2분)

이미 `def f(x: int) -> str:`를 쓰시죠. 오늘은 "타입이 뭔지"가 아니라 **두 가지 차이를 체화**하는 날이에요.

1. 🐍 Python 타입힌트는 **런타임에 무시**되고 mypy는 선택이지만 **TS는 생태계 전체가 타입 검사를 전제**로 돕니다. 에디터가 실시간으로 잡고, `tsc`가 강제하고, Next.js가 빌드 때 검사해요.
2. 그런데 역설적으로 **TS 타입도 실행될 때는 지워집니다**(타입 소거). 실제로 도는 건 결국 JS예요. 이게 오늘 마지막에 Zod가 나오는 이유이고, Day 6~9에서 계속 만날 주제입니다.

한 줄 멘탈 모델: **"TS = mypy가 필수이고 훨씬 강력한 Python. 단, 타입은 컴파일 타임에만 존재한다."**

### 0-1. 오늘 만들 폴더 구조

```
practice/
├── day2/ ...                    ← GitHub 스크립트 원본 (오늘 이식)
└── day3/                        ← 오늘
    ├── package.json
    ├── tsconfig.json            ← 오늘의 새 등장인물
    ├── eslint.config.js / .prettierrc / .vscode/  (Day1에서 복사)
    ├── 01-basic-types.ts
    ├── 02-composing-types.ts
    ├── 03-functions-generics.ts
    ├── 04-utility-zod.ts
    └── exercise/
        ├── types.ts             ← 데이터 모양 정의
        ├── api.ts               ← fetch + 검증
        └── report.ts            ← 가공 + 출력
```

### 0-2. 시작 준비

⌨️ 실습 — 저장소 루트에서

```bash
mkdir -p practice/day3/.vscode
cd practice/day3
cp ../day1/eslint.config.js .
cp ../day1/.prettierrc .
cp ../day1/.vscode/settings.json .vscode/
pnpm init
pnpm add -D typescript tsx
```

- `typescript` = 타입 검사기(`tsc`)를 제공. 🐍 mypy에 해당.
- `tsx` = `.ts` 파일을 **바로 실행**해주는 도구. 🐍 `python script.py`처럼 `tsx script.ts`.

⌨️ 실습 — `practice/day3/package.json`에 `"type": "module"`과 스크립트 추가

```json
{
  "name": "day3",
  "type": "module",
  "scripts": {
    "check": "tsc --noEmit"
  }
}
```

⌨️ 실습 — `practice/day3/tsconfig.json` 새 파일

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  }
}
```

💡 `"strict": true`가 핵심입니다. 🐍 mypy의 `--strict`와 같아요. 처음엔 깐깐해 보여도 이 엄격함 덕에 버그를 미리 잡습니다.

---

## 1. 세션 1 (오전) — TS의 정체 · 실행 흐름 · 기초 타입

### 🎯 배경 — TS는 왜 마이크로소프트가 만들었나

JS로 큰 프로젝트를 짜다 보면 "이 함수에 뭘 넣어야 하지?", "이 객체에 무슨 필드가 있지?"를 알 방법이 없어 유지보수가 지옥이 됩니다(값에 타입 정보가 없으니까). 2012년 MS가 이 문제를 풀려고 **"JS에 타입을 얹은" TypeScript**를 만들었어요.

- TS는 JS의 **상위 집합**입니다. 즉 **모든 JS는 이미 유효한 TS**예요. 여기에 타입 표기(`: number`)만 얹었을 뿐이에요.
- 브라우저·Node는 TS를 직접 못 읽습니다. 그래서 TS는 **JS로 변환(컴파일)된 뒤** 실행됩니다. 이 과정에서 타입은 사라져요(타입 소거).
- 🐍 Python 힌트와 결정적 차이: Python은 힌트가 있어도 mypy를 안 돌리면 그만이지만 **TS 세계는 타입 검사가 기본 관문**입니다.

### 1-2. 두 가지 실행 방식 — "돌리기" vs "검사하기" (중요)

Python에서 `python script.py`(실행)와 `mypy script.py`(검사)가 다르듯, TS도 둘로 나뉩니다.

⌨️ 실습 — `01-basic-types.ts` 새 파일

```ts
const message: string = "hello TS";
console.log(message.toUpperCase());
```

⌨️ 실습 — 두 명령을 각각 실행

```bash
pnpm exec tsx 01-basic-types.ts   # ① 실행 (결과 출력)
pnpm run check                    # ② 타입 검사만 (tsc --noEmit)
```

⚠️ **중요한 함정**: `tsx`는 **타입 에러가 있어도 그냥 실행**합니다(타입을 무시하고 JS로 바꿔 돌림). **진짜 타입 검사는 `tsc --noEmit`(= `pnpm run check`)이 합니다.** 그래서 "실행은 되는데 타입은 틀린" 상태가 가능해요. 🐍 "코드는 도는데 mypy는 빨간불"인 상황과 똑같습니다. **오늘부터 수시로 `pnpm run check`를 돌리세요.**

### 1-3. 기초 타입

**② 쉬운 설명**: 변수·인자 뒤에 `: 타입`을 붙입니다. 🐍 `x: int`와 문법이 거의 같아요.

📖 설명용

```ts
const count: number = 42;
const name: string = "광명";
const active: boolean = true;
const scores: number[] = [88, 92, 70];       // 숫자 배열 (🐍 list[int])
const pair: [string, number] = ["acc", 0.9]; // 튜플 (🐍 tuple[str, float])
```

💡 **타입 추론**: 사실 `const count = 42`만 써도 TS가 알아서 `number`로 추론합니다. **명백할 땐 타입을 생략**하고, 함수 인자·반환처럼 애매한 곳에만 명시하는 게 관례예요.

### 1-4. `any` vs `unknown` vs `never` (TS의 핵심 구분)

**① 왜 중요**: 초보가 `any`를 남발하면 TS를 쓰는 의미가 사라집니다. 이 셋의 구분이 TS 실력의 8할이에요.

| 타입 | 뜻 | 🐍 느낌 |
|------|-----|---------|
| `any` | "검사 포기" — 아무거나 허용 (⚠️ 위험) | 타입힌트를 아예 안 단 것 |
| `unknown` | "뭔지 모름 — **쓰기 전에 확인 강제**" (✅ 안전) | (대응 없음, 매우 유용) |
| `never` | "절대 값이 없음" (에러/무한루프 반환 등) | `NoReturn` |

📖 설명용 — `unknown`이 왜 안전한가

```ts
let a: any = "hi";
a.foo.bar;              // 통과됨 (any는 검사 포기 → 런타임 폭발 위험)

let b: unknown = "hi";
// b.toUpperCase();     // ❌ TS 에러: 먼저 뭔지 확인하라고 강제
if (typeof b === "string") {
  b.toUpperCase();      // ✅ 여기선 string으로 좁혀졌으니 OK
}
```

⚠️ **규칙**: 타입을 모르겠으면 `any` 말고 **`unknown`**을 쓰고, 쓰기 전에 확인(narrowing)하세요. `fetch` 응답(`res.json()`)이 사실 `any`/`unknown` 계열이라, 오늘 실습에서 이걸 다룹니다.

> ⌨️ **미니 실습** — `01-basic-types.ts`
> ```ts
> const describe = (value: unknown): string => {
>   if (typeof value === "number") return `숫자 ${value}`;
>   if (typeof value === "string") return `문자열 "${value}"`;
>   return "알 수 없음";
> };
> console.log(describe(42));      // 숫자 42
> console.log(describe("hi"));    // 문자열 "hi"
> console.log(describe(true));    // 알 수 없음
> ```

### ✅ 세션 1 체크
- [ ] `tsx`(실행)와 `tsc --noEmit`(검사)의 차이를 안다
- [ ] `any`를 피하고 `unknown` + 확인을 쓸 줄 안다

---

## 2. 세션 2 (오전) — 타입 구성

`02-composing-types.ts`에 작성합니다.

### 2-1. `interface` vs `type` — 데이터 모양 정의

**② 쉬운 설명**: 객체의 "모양"에 이름을 붙이는 두 방법. 🐍 `TypedDict`나 `dataclass`로 데이터 구조를 정의하는 것과 비슷해요.

⌨️ 실습 — `02-composing-types.ts`

```ts
interface User {
  login: string;
  followers: number;
  bio: string | null;      // null일 수도 있음
}

// type으로도 거의 같은 걸 표현
type Point = {
  x: number;
  y: number;
};

const u: User = { login: "torvalds", followers: 100, bio: null };
console.log(u.login);
```

💡 **언제 뭘?** 실무 관례: **객체 모양엔 `interface`, 그 외(유니온·별칭 등)엔 `type`**. 헷갈리면 둘 중 아무거나 써도 대부분 문제없어요. Day 4부터는 React 관례를 따라 `interface`를 주로 씁니다.

### 2-2. 유니온 `|`, 인터섹션 `&`, 리터럴 타입

**① 왜 중요**: "이 값은 A 또는 B" 같은 표현이 API·상태 관리에서 계속 나옵니다.
**② 쉬운 설명**:
- 유니온 `A | B`: A 또는 B (🐍 `int | str`)
- 리터럴 타입: 특정 값만 허용 (`"loading" | "done"`)
- 인터섹션 `A & B`: A이면서 동시에 B (합침)

📖 설명용

```ts
type Status = "idle" | "loading" | "success" | "error"; // 이 4개만 허용
let s: Status = "loading";
// s = "wrong";   // ❌ 에러: 4개 중에 없음

type Id = string | number;   // 유니온

type WithTimestamp = { createdAt: number };
type Post = { title: string } & WithTimestamp;  // 인터섹션 (합침)
const p: Post = { title: "안녕", createdAt: 123 };
```

💡 **리터럴 유니온**(`Status`)이 특히 쓸모가 큽니다. 🐍 Python의 `Literal["idle", "loading"]`이나 Enum에 해당하는데, 훨씬 자연스럽게 씁니다. Day 4~6에서 "로딩 상태" 관리에 계속 등장해요.

### 2-3. 옵셔널 `?`, 옵셔널 체이닝 `?.`, null 병합 `??`

**② 쉬운 설명**:
- `?`: 있어도 되고 없어도 되는 속성 (🐍 `Optional`/기본값 없는 필드)
- `?.`: 앞이 `null`/`undefined`면 에러 대신 `undefined` 반환
- `??`: 왼쪽이 `null`/`undefined`면 오른쪽 값 사용

> ⌨️ **미니 실습** — `02-composing-types.ts`
> ```ts
> interface Profile {
>   name: string;
>   nickname?: string;      // 옵셔널 (없을 수 있음)
> }
> const printName = (p: Profile) => {
>   // nickname이 없으면 name으로 대체
>   console.log(p.nickname ?? p.name);
> };
> printName({ name: "광명" });                    // 광명
> printName({ name: "광명", nickname: "KM" });    // KM
> ```

⚠️ **`??` vs `||` 함정**: `||`는 falsy(0, "", false 포함) 전부를 걸러내지만 `??`는 **오직 `null`/`undefined`만** 봅니다. `count ?? 10`은 `count`가 `0`이어도 `0`을 씁니다(`count || 10`은 `0`을 10으로 덮어씀). 숫자 기본값을 다룰 때 이 차이 때문에 버그가 납니다.

---

## 3. 세션 3 (오후) — 함수 타이핑 · 제네릭 · narrowing

`03-functions-generics.ts`에 작성합니다.

### 3-1. 함수 타이핑

**② 쉬운 설명**: 인자와 반환에 타입을 붙입니다. 🐍 `def f(x: int) -> str`와 거의 동일.

📖 설명용

```ts
// 인자: number, 반환: number
const square = (n: number): number => n * n;

// async 함수의 반환은 Promise<T>
const getName = async (id: number): Promise<string> => {
  return `user-${id}`;
};
```

💡 반환 타입은 추론되므로 생략해도 되지만 **공개 함수엔 명시**하면 실수를 빨리 잡습니다.

### 3-2. 제네릭 `<T>` — "타입을 인자로 받기"

**① 왜 있나**: "어떤 타입이 오든 그대로 되돌려주는" 함수를 타입 안전하게 만들고 싶을 때. 🐍 `TypeVar`와 정확히 같은 개념입니다.
**② 쉬운 설명**: `<T>`는 "호출할 때 정해지는 타입 자리표"예요.

📖 설명용 — 제네릭 없이 vs 있이

```ts
// ❌ any를 쓰면 타입 정보가 사라짐
const firstBad = (arr: any[]): any => arr[0];

// ✅ 제네릭: 넣은 타입이 그대로 반환됨
const first = <T>(arr: T[]): T => arr[0];

const n = first([1, 2, 3]);        // n은 number로 추론
const s = first(["a", "b"]);       // s는 string으로 추론
```

**③ 🐍**: `def first(arr: list[T]) -> T`와 판박이입니다. TS에선 이걸 훨씬 자주 써요 — 특히 Day 4 `useState<Message[]>`처럼 "이 상태는 Message 배열"을 제네릭으로 알려줍니다.

> ⌨️ **미니 실습** — `03-functions-generics.ts`
> ```ts
> const last = <T>(arr: T[]): T => arr[arr.length - 1];
> console.log(last([10, 20, 30]));   // 30 (number)
> console.log(last(["x", "y"]));     // "y" (string)
> ```

### 3-3. narrowing (타입 좁히기)

**① 왜 중요**: 유니온(`string | number`)이나 `unknown`은 **쓰기 전에 "지금 뭔지" 좁혀야** 합니다.
**② 방법 3가지**:
- `typeof x === "string"` — 원시 타입 확인
- `"prop" in obj` — 속성 존재 확인
- 커스텀 타입 가드 `(x): x is Foo => ...`

📖 설명용

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; w: number; h: number };

const area = (s: Shape): number => {
  // kind로 좁히면 각 분기에서 정확한 필드만 접근 가능
  if (s.kind === "circle") return Math.PI * s.radius ** 2;
  return s.w * s.h;
};
```

💡 이 "**태그된 유니온**(각 객체에 `kind` 같은 구분 필드)" 패턴은 실무에서 자주 쓰입니다. 🐍 `match`문으로 dataclass를 분기하는 것과 비슷한 감각이에요.

### ✅ 세션 3 연습문제

⌨️ 문제 — `03-functions-generics.ts`
1. (보통) 제네릭 함수 `pluck<T, K>`... 은 어려우니 살짝 쉽게: 제네릭 `wrapInArray<T>(x: T): T[]`를 만들어 `wrapInArray(5)` → `[5]`(number[]), `wrapInArray("a")` → `["a"]`.
2. (보통) 위 `Shape`에 `{ kind: "triangle"; base: number; height: number }`를 추가하고, `area`가 삼각형도 계산하게 하라(`base * height / 2`).

✅ 정답

```ts
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
```

---

## 4. 세션 4 (오후) — 유틸리티 타입 & Zod

`04-utility-zod.ts`에 작성합니다.

### 4-1. 유틸리티 타입 — 기존 타입을 변형

**② 쉬운 설명**: 이미 있는 타입에서 새 타입을 뽑아내는 내장 도구들.

| 유틸리티 | 뜻 | 예 |
|----------|-----|-----|
| `Partial<T>` | 모든 필드를 옵셔널로 | 수정용 부분 객체 |
| `Required<T>` | 모든 필드를 필수로 | |
| `Pick<T, K>` | 일부 필드만 골라 | `Pick<User, "login">` |
| `Omit<T, K>` | 일부 필드만 빼고 | `Omit<User, "bio">` |
| `Record<K, V>` | 키-값 맵 타입 | `Record<string, number>` |
| `ReturnType<F>` | 함수의 반환 타입 | |

📖 설명용

```ts
interface User {
  login: string;
  followers: number;
  bio: string | null;
}

type UserPreview = Pick<User, "login" | "followers">; // login, followers만
type UserUpdate = Partial<User>;                       // 전부 옵셔널 (수정용)
```

💡 🐍 Python에서 `TypedDict`를 매번 새로 정의하던 걸, TS는 **기존 타입에서 파생**시켜 중복을 없앱니다. 실무에서 아주 많이 써요.

### 4-2. Zod — "타입이 런타임에 사라지는" 문제의 해결책 ⭐

**① 왜 필요**: 세션 1에서 말했듯 **TS 타입은 실행 시 사라집니다.** 그래서 `fetch`로 받은 외부 데이터가 "정말 내가 기대한 모양인지"를 TS는 **런타임에 보장하지 못해요.** 서버가 이상한 걸 보내면 그대로 통과됩니다.
**② 쉬운 설명**: **Zod는 "런타임에도 살아있는 타입 검사기"**입니다. 스키마를 정의하면 ① 실제 값을 검증하고 ② TS 타입까지 자동으로 뽑아줍니다.
**③ 🐍**: **pydantic과 정확히 같은 역할**입니다. `BaseModel`로 검증 + 타입을 얻는 것과 판박이예요.

⌨️ 실습 — 먼저 설치

```bash
pnpm add zod
```

⌨️ 실습 — `04-utility-zod.ts`

```ts
import { z } from "zod";

// 스키마 정의 (🐍 pydantic BaseModel)
const UserSchema = z.object({
  login: z.string(),
  followers: z.number(),
  bio: z.string().nullable(),   // string 또는 null
});

// 스키마에서 TS 타입을 자동 추출 ⭐
type User = z.infer<typeof UserSchema>;

// 런타임 검증: 맞으면 타입 붙은 값, 틀리면 에러 throw
const raw: unknown = { login: "torvalds", followers: 100, bio: null };
const user: User = UserSchema.parse(raw);
console.log(user.login, user.followers);
```

💡 **핵심**: `z.infer<typeof UserSchema>`로 **스키마 하나에서 타입과 검증을 동시에** 얻습니다. 타입을 따로, 검증을 따로 관리할 필요가 없어요.
⚠️ 검증에 실패하면 `.parse`는 에러를 던집니다. 던지지 않고 결과를 받고 싶으면 `.safeParse`(성공/실패를 객체로 반환)를 쓰세요.

> ⌨️ **미니 실습** — `bio`에 숫자를 넣어(`bio: 42`) `parse`해 보고, Zod가 어떤 에러를 던지는지 확인해 보세요.

---

## 5. 종합 실습 — GitHub 리포트를 타입 안전 TS 3모듈로 ⭐

Day 2의 `github-report.js`를 **types / api / report** 3개 파일로 나눠 TS로 재작성합니다. Zod로 API 응답을 런타임 검증까지 해요.

⌨️ 실습 — `practice/day3/exercise/types.ts`

```ts
import { z } from "zod";

// GitHub 사용자 응답 중 우리가 쓸 필드만 스키마로
export const GitHubUserSchema = z.object({
  login: z.string(),
  followers: z.number(),
  public_repos: z.number(),
});

// 스키마에서 타입 추출
export type GitHubUser = z.infer<typeof GitHubUserSchema>;
```

⌨️ 실습 — `practice/day3/exercise/api.ts`

```ts
import { GitHubUserSchema, type GitHubUser } from "./types";

// 한 명 조회 + Zod 검증
export const fetchUser = async (username: string): Promise<GitHubUser> => {
  const res = await fetch(`https://api.github.com/users/${username}`);
  if (!res.ok) throw new Error(`${username}: ${res.status}`);
  const raw: unknown = await res.json();     // res.json()은 unknown 취급
  return GitHubUserSchema.parse(raw);        // 검증 통과해야 GitHubUser로
};

// 여러 명 병렬 조회 (실패는 제외)
export const fetchUsers = async (names: string[]): Promise<GitHubUser[]> => {
  const results = await Promise.allSettled(names.map((n) => fetchUser(n)));
  return results
    .filter((r): r is PromiseFulfilledResult<GitHubUser> => r.status === "fulfilled")
    .map((r) => r.value);
};
```

💡 `filter((r): r is PromiseFulfilledResult<GitHubUser> => ...)`가 세션 3의 **커스텀 타입 가드**입니다. 이 표기 덕분에 `.map((r) => r.value)`에서 `r.value`가 정확한 타입으로 좁혀져요.

⌨️ 실습 — `practice/day3/exercise/report.ts`

```ts
import { fetchUsers } from "./api";
import type { GitHubUser } from "./types";

const rank = (users: GitHubUser[]): GitHubUser[] =>
  [...users].sort((a, b) => b.followers - a.followers);

const main = async () => {
  const names = ["torvalds", "gaearon", "sindresorhus", "존재하지않는유저999"];
  const users = await fetchUsers(names);

  console.log("=== 팔로워 순위 ===");
  rank(users).forEach((u, i) =>
    console.log(`${i + 1}위 ${u.login}: 팔로워 ${u.followers}, 저장소 ${u.public_repos}`)
  );

  const totalRepos = users.reduce((sum, u) => sum + u.public_repos, 0);
  console.log(`\n성공 ${users.length}/${names.length}, 저장소 총합 ${totalRepos}`);
};

main();
```

⌨️ 실행 + 타입 검사

```bash
pnpm exec tsx exercise/report.ts   # 실행
pnpm run check                     # 타입 에러 0개인지 확인 ⭐
```

✅ 기대: Day 2와 같은 리포트가 출력되고 `pnpm run check`가 **에러 0개**. 이제 이 스크립트는 "API 응답 모양이 바뀌면 Zod가 런타임에 잡고, 코드가 틀리면 tsc가 컴파일 타임에 잡는" 이중 안전망을 갖췄습니다.

💡 **import 경로에 `.ts`/`.js`가 없죠?** Day 2에서는 Node ESM이라 `.js`가 필수였는데, 지금은 TS + `moduleResolution: "Bundler"` 설정이라 **확장자를 생략**합니다. Next.js도 이 방식이에요. (순수 Node ESM ↔ TS 도구 환경의 차이)

---

## 6. 디버깅 실습 — 타입 에러 읽고 고치기

⌨️ 실습 — `practice/day3/debug.ts`에 입력하고 `pnpm exec tsc --noEmit debug.ts` 또는 에디터에서 빨간 줄 확인

```ts
interface Product {
  name: string;
  price: number;
}

const products: Product[] = [
  { name: "A", price: 1000 },
  { name: "B", price: "3000" },   // 여기 뭔가 이상
];

const total = products.reduce((sum, p) => sum + p.price, 0);
console.log(total);
```

에디터가 빨간 줄을 긋습니다. **에러 메시지를 읽고 고쳐 보세요.**

<details><summary>정답 보기</summary>

에러: `Type 'string' is not assignable to type 'number'.` — `"3000"`이 문자열이라 `price: number`와 안 맞습니다. `tsx`로 그냥 돌리면 `sum + "3000"`이 **문자열 이어붙이기**로 동작해 `"01000..."` 같은 엉뚱한 결과가 나올 수 있어요. TS가 이걸 컴파일 타임에 막아줬어요.

✅ 수정: `price: 3000` (따옴표 제거)

교훈: **TS 에러는 "런타임 버그를 미리 보여주는 예언"**입니다. 🐍 mypy가 "이거 나중에 터진다"고 알려주는 것과 같아요.
</details>

---

## 7. 🎯 TS 에러 읽는 법

TS 에러는 길지만 **첫 문장이 핵심**입니다.

| 에러 패턴 | 뜻 | 해결 |
|-----------|-----|------|
| `Type 'X' is not assignable to type 'Y'` | X를 Y 자리에 넣을 수 없음 | 값의 타입을 Y에 맞추기 |
| `Property 'x' does not exist on type 'Y'` | Y에 x 필드가 없음 | 오타·타입 정의 확인, narrowing |
| `Object is possibly 'null'/'undefined'` | null일 수 있는데 그냥 접근 | `?.` / `??` / narrowing |
| `Argument of type ... is not assignable to parameter` | 함수 인자 타입 불일치 | 인자 타입 맞추기 |

💡 `unknown`/유니온에서 "does not exist" 에러가 뜨면, 대부분 **narrowing이 빠진 탓**입니다.

---

## 8. ✅ Day 3 최종 체크리스트

- [ ] `tsx`(실행)와 `tsc --noEmit`(검사)를 구분해 쓴다
- [ ] `any` 대신 `unknown` + narrowing을 쓴다
- [ ] `interface`/`type`으로 데이터 모양 정의
- [ ] 유니온·리터럴 타입, `?`·`?.`·`??`(그리고 `??` vs `||` 함정)
- [ ] 제네릭 `<T>` 함수 작성
- [ ] narrowing 3가지(typeof, in, 커스텀 가드) 중 2개 이상 사용
- [ ] 유틸리티 타입(`Pick`/`Partial` 등) 1개 이상
- [ ] Zod 스키마 + `z.infer`로 타입 추출 + `.parse` 검증
- [ ] `report.ts` 동작 + `pnpm run check` 에러 0개

---

## 9. git 커밋

⌨️ 실습 — 저장소 루트에서

```bash
git add .
git commit -m "Day 3: TypeScript(제네릭·narrowing·유틸리티·Zod) + GitHub 리포트 TS 이관"
```

---

## 10. Day 4 미리보기

내일부터 **React**입니다. 오늘 배운 TS가 곧바로 재료가 돼요.

- 선언형 UI: "상태를 바꾸면 화면이 따라온다"
- `useState<Message[]>` — 오늘의 **제네릭**이 여기서 등장
- props를 `interface`로 타이핑
- 불변 업데이트 — Day 1의 객체 전개(`{...old}`)가 필수로 재등장
- ⭐ **채팅 UI 껍데기**를 만들기 시작 (Day 5~9 프로젝트의 시작점)

💡 시작할 때 로드맵을 붙이고 **"Day 4 상세 자료 만들어줘"**라고 요청하세요.

---

## 부록 — Python ↔ TS 치트시트 (Day 3분)

| 개념 | 🐍 Python(+mypy) | 🟨 TypeScript |
|------|------------------|---------------|
| 변수 타입 | `x: int = 3` | `const x: number = 3;` |
| 함수 타입 | `def f(x: int) -> str` | `(x: number): string =>` |
| async 반환 | `-> Awaitable[str]` | `Promise<string>` |
| 리스트 | `list[int]` | `number[]` |
| 튜플 | `tuple[str, int]` | `[string, number]` |
| 옵셔널 | `Optional[str]` / `str \| None` | `string \| undefined` / `?` |
| 유니온 | `int \| str` | `number \| string` |
| 리터럴 | `Literal["a","b"]` | `"a" \| "b"` |
| 제네릭 | `TypeVar("T")`, `list[T]` | `<T>`, `T[]` |
| "검사 포기" | 힌트 안 달기 | `any` (⚠️ 지양) |
| "모름, 확인 강제" | (대응 없음) | `unknown` |
| 런타임 검증 | pydantic `BaseModel` | Zod `z.object` |
| 타입 검사 실행 | `mypy file.py` | `tsc --noEmit` |

기초 3일(JS·비동기·TS)을 마쳤습니다. 이제 진짜 재미있는 React로 갑니다. 🟨
