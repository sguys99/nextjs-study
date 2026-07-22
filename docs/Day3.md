# Day 3 — TypeScript: 파이썬 타입힌트의 강화판

> **소요 시간**: 8시간 (90분 학습 + 15분 휴식 × 4세션)
> **선행 조건**: Day 2 완료 (`async/await` + `fetch` + `import/export` 사용 가능, `practice/day2/exercise/github-report.js` 보관 중)
> **목표**: TS 타입 시스템을 "컴파일 타임에 강제되는 파이썬 타입힌트"로 흡수하고, Day 2의 GitHub 리포트 스크립트를 타입 안전한 TS로 재작성한다.
> **핵심 태그**: 🐍 = 파이썬 대비 포인트 · 💡 = 팁 · ⚠️ = 함정

---

## 0. 오늘의 목적 & 큰 그림

당신은 이미 파이썬 타입힌트를 씁니다. `def f(x: int) -> str:` 같은 코드요. 그래서 오늘은 "타입이 뭔지"를 배우는 날이 아니라, **두 가지 차이를 체화하는 날**입니다.

1. 🐍 파이썬 타입힌트는 **런타임에 무시**되고 mypy는 선택사항이지만, TS는 생태계 전체가 **타입 검사를 전제**로 돌아갑니다. 에디터가 실시간으로 잡고, `tsc`가 강제하고, Next.js가 빌드 시 검사합니다.
2. 그런데 역설적으로 — TS 타입도 **런타임에는 지워집니다**(type erasure). 실행되는 건 결국 JS예요. 이 사실이 오늘 마지막 세션(Zod)의 존재 이유이자, Day 6~7에서 계속 만날 주제입니다.

오늘의 멘탈 모델 한 줄:

> **"TS = mypy가 필수이고 훨씬 강력한 파이썬" + "단, 타입은 컴파일 타임에만 존재한다"**

### 0-1. 저장소 구조 (오늘 추가분)

```
nextjs-study/
├── docs/
│   └── Day3.md                  ← 지금 이 문서
└── practice/
    ├── day1/ ...
    ├── day2/ ...                ← github-report.js가 여기 있음 (오늘 이식할 원본)
    └── day3/                    ← 오늘 새로 만듦
        ├── package.json
        ├── tsconfig.json        ← 오늘의 새 등장인물
        ├── eslint.config.js
        ├── .prettierrc
        ├── .vscode/settings.json
        ├── 01-basic-types.ts
        ├── 02-composing-types.ts
        ├── 03-functions-generics.ts
        ├── 04-utility-zod.ts
        └── exercise/
            ├── types.ts
            ├── api.ts
            └── report.ts        ← Day 2 github-report의 TS 진화형
```

### 0-2. 시작 전 준비 (1분)

```bash
# 저장소 루트에서
mkdir -p practice/day3
cd practice/day3
```

---

## 1. 세션 1 (오전) — TS의 정체 · 컴파일 흐름 · 기초 타입

### 1-1. TS는 정확히 무엇인가 — mypy와의 대비

| | 🐍 Python + mypy | 🟨 TypeScript |
|---|---|---|
| 타입 표기 | `x: int` (문법에 내장) | `x: number` (문법에 내장) |
| 런타임 동작 | 힌트 **무시**하고 실행 | 타입을 **지우고** 실행 (결과는 같음!) |
| 검사 주체 | mypy (선택, 팀마다 안 쓰기도) | `tsc` + 에디터 (사실상 필수, 생태계 표준) |
| 검사 강도 | 점진적, 느슨한 편 | `strict` 모드 기준 훨씬 촘촘 |
| 타입 표현력 | 제한적 (유틸리티 타입 빈약) | 유니온·리터럴·유틸리티 타입 등 **타입 연산** 가능 |
| 라이브러리 타입 | stub 파일(있으면 다행) | npm 패키지 대부분 타입 내장 or `@types/*` |

💡 핵심 통찰: 파이썬에서 타입힌트는 "문서"에 가깝지만, TS에서 타입은 **개발 경험 그 자체**입니다. 자동완성, 리팩터링, 버그 검출이 전부 타입 위에서 돕니다. Next.js를 TS로 쓰는 이유예요.

### 1-2. 실행과 검사는 분리되어 있다 ⭐ (오늘의 가장 중요한 멘탈 모델)

TS 코드가 돌아가는 경로는 **두 갈래**입니다.

```
        ┌── ① 실행:  node file.ts     (Node 24가 타입을 "벗겨내고" 그냥 실행 — 검사 안 함!)
file.ts ┤
        └── ② 검사:  tsc --noEmit     (타입만 검사 — 실행 안 함)
```

🐍 정확히 파이썬과 같은 구조입니다: `python file.py`(힌트 무시하고 실행) + `mypy file.py`(검사만). 다른 점은 JS 생태계에서는 ②를 안 돌리는 프로젝트가 거의 없다는 것.

⚠️ **함정 예고**: `node file.ts`가 성공했다고 타입이 맞는 게 아닙니다. Node는 타입을 **검사 없이 지우기만** 합니다. 검증은 항상 `tsc --noEmit`(또는 에디터의 빨간 줄)이 담당합니다. 아래 1-4에서 직접 체험합니다.

💡 예전에는 `tsc`로 `.js`를 생성하거나 `tsx` 같은 실행기를 깔아야 했지만, **Node 24는 `.ts`를 바로 실행**할 수 있습니다(type stripping). Next.js 프로젝트에서는 어차피 Next.js가 알아서 처리하므로, `.js` 생성 흐름은 오늘 다루지 않습니다.

### 1-3. 설치 & 배선

```bash
pnpm init
```

`package.json`을 수정합니다:

```json
{
  "name": "day3",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

의존성 설치 (전부 개발용 `-D`):

```bash
pnpm add -D typescript @types/node eslint @eslint/js typescript-eslint eslint-config-prettier globals prettier
```

| 패키지 | 역할 | 🐍 대응 |
|---|---|---|
| `typescript` | `tsc` 컴파일러/검사기 | mypy |
| `@types/node` | Node 내장 API(`process` 등)의 타입 정의 | stub 패키지 (`types-requests` 같은) |
| `typescript-eslint` | ESLint가 TS를 이해하게 하는 어댑터 | ruff의 플러그인쯤 |

**`tsconfig.json`** (≈ mypy 설정 + 컴파일 옵션)을 프로젝트 루트에 만드세요:

```jsonc
{
  "compilerOptions": {
    "target": "esnext",                  // 최신 JS 문법 기준으로 해석
    "module": "nodenext",                // Node의 ESM 규칙(확장자 포함 import)을 따름
    "strict": true,                      // ⭐ 엄격 모드 전부 ON (null 검사 포함) — 항상 켭니다
    "noEmit": true,                      // .js 파일 생성 안 함 (검사만) — 실행은 node가 직접
    "allowImportingTsExtensions": true,  // import "./x.ts" 허용 (node 직접 실행과 짝)
    "verbatimModuleSyntax": true,        // 타입 전용 import는 "import type"으로 강제
    "erasableSyntaxOnly": true,          // node가 못 지우는 문법(enum 등) 금지 — 아래 1-6
    "skipLibCheck": true                 // 라이브러리 내부 타입 검사 생략 (속도)
  }
}
```

💡 옵션이 많아 보이지만 철학은 하나입니다: **"검사는 tsc, 실행은 node, 타입은 완전히 지워질 수 있는 문법만 쓴다."** Day 5에서 `create-next-app`이 만들어주는 tsconfig도 이 철학의 변형입니다.

**ESLint 설정** — Day 1의 것을 TS 인식 버전으로 교체합니다 (`eslint.config.js`):

```js
// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended, // TS 권장 규칙 (any 사용 경고 등)
  prettierConfig,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": "off", // JS용 규칙은 끄고
      "@typescript-eslint/no-unused-vars": "warn", // TS용 규칙으로 대체
    },
  }
);
```

`.prettierrc`와 `.vscode/settings.json`은 **Day 1의 것을 그대로 복사**하면 됩니다 (Prettier는 TS를 기본 지원).

```bash
cp ../day1/.prettierrc .
mkdir -p .vscode && cp ../day1/.vscode/settings.json .vscode/
```

### 1-4. 첫 실행 — 그리고 "실행≠검사" 직접 체험 ⭐

`01-basic-types.ts`:

```ts
// 01-basic-types.ts
const greeting: string = "TypeScript 시작";
console.log(greeting.toUpperCase());

const oops: number = "이건 숫자가 아닌데?"; // ← 에디터에 빨간 줄이 떠야 정상
console.log(oops);
```

실행해 보세요:

```bash
node 01-basic-types.ts    # ✅ 그냥 돌아갑니다! (타입을 지우고 실행)
pnpm typecheck            # ❌ error TS2322: Type 'string' is not assignable to type 'number'
```

**이 대비가 오늘의 핵심 체험입니다.** node는 통과시켰지만 tsc는 잡았죠. 에디터(Error Lens)에도 같은 에러가 실시간으로 떠야 합니다. 안 뜨면 `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server".

확인했으면 `oops` 줄은 지우세요.

### 1-5. 기본 타입 & 타입 추론

```ts
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

// 객체 타입 (인라인)
const user: { name: string; age?: number } = { name: "Kim" }; // ?는 옵셔널
```

💡 **추론에 맡기는 게 기본, 어노테이션은 필요한 곳만.** 파이썬에서 모든 변수에 힌트를 안 달듯이, TS도 ① 함수 시그니처 ② 빈 배열/객체 ③ 외부 데이터 입구 — 이 세 곳에만 명시하면 충분합니다.

🐍 **리터럴 타입**: `const inferred = "hello"`의 타입은 `string`이 아니라 `"hello"`입니다. `const`는 재할당이 없으니 값 자체가 타입이 돼요. 파이썬 `Literal["hello"]`에 해당하며, 세션 2의 유니온과 결합하면 강력해집니다.

### 1-6. `any` vs `unknown` vs `never` ⭐ (매우 중요)

```ts
// any: 타입 검사 포기 — "동적 타이핑으로 돌아가겠다"는 선언
let a: any = "hello";
a.foo.bar.baz; // ✅ 통과 (그리고 런타임에 폭발) — 그래서 금지

// unknown: "타입을 모름. 쓰려면 먼저 좁혀라" — 안전한 any
let u: unknown = JSON.parse('{"x": 1}');
// u.x;                           // ❌ 에러: 좁히기 전엔 사용 불가
if (typeof u === "object" && u !== null) {
  // 여기서부터 u는 object로 좁혀짐 (세션 3에서 자세히)
}

// never: "있을 수 없는 값" — 모든 경우를 처리했다는 증명에 쓰임 (세션 3)
```

| | 의미 | 🐍 대응 | 언제 |
|---|---|---|---|
| `any` | 검사 끔 | `Any` | **안 씀** (ESLint가 경고) |
| `unknown` | 모름 → 좁혀서 사용 | `object`에 가까움 | 외부 데이터 입구 (`res.json()` 등) |
| `never` | 불가능한 값 | `Never` / `NoReturn` | exhaustive 검사, 절대 return 안 하는 함수 |

💡 실무 감각: **외부에서 들어오는 데이터는 `unknown`으로 받고 좁힌다(또는 세션 4의 Zod로 검증한다).** `any`가 코드에 보이면 "타입 시스템에 구멍이 뚫렸다"고 생각하세요.

⚠️ **`enum`은 안 씁니다.** 로드맵에 언급되지만 두 가지 이유로 건너뜁니다: ① 모던 TS는 리터럴 유니온(`type Status = "pending" | "done"`)을 선호하고, ② `enum`은 "지워질 수 없는" 문법이라 Node 직접 실행이 안 됩니다(우리 tsconfig의 `erasableSyntaxOnly`가 막아줌). 유니온이 더 가볍고 JS 결과물과 1:1이에요.

### ✅ 세션 1 체크
- [ ] `pnpm typecheck` / `pnpm lint`가 돌아감
- [ ] `node file.ts` 직접 실행 성공
- [ ] "node는 검사 안 하고, tsc가 검사한다"를 직접 체험함
- [ ] `any`/`unknown`/`never` 차이를 말로 설명 가능
- [ ] 어노테이션이 필요한 3곳(함수 시그니처·빈 배열·외부 데이터)을 앎

---

## 2. 세션 2 (오전) — 타입 구성: interface · union · optional

> 새 파일 `02-composing-types.ts`. 여기서부터가 "파이썬 타입힌트에 없는" TS의 진짜 무기입니다.

### 2-1. `type` vs `interface` — 데이터 모델 정의

객체의 "모양"을 정의하는 방법이 둘 있습니다.

```ts
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
```

🐍 파이썬 대응 감각:

| 🐍 Python | 🟨 TS | 비고 |
|---|---|---|
| `TypedDict` | `interface` / `type` | 가장 가까운 대응 — "딕셔너리의 모양" |
| `dataclass` | (해당 없음) | TS 타입은 **데이터를 만들지 않음** — 모양 선언만 |
| `Protocol` | `interface` | 구조적 타이핑(덕 타이핑)이라는 점도 동일 |

**어느 걸 쓰나? 실무 규칙:**
- 객체 모양 → 둘 다 가능. **팀/프로젝트에서 하나로 통일**하는 게 중요 (React 진영은 `type`파와 `interface`파가 공존, 우리는 앞으로 데이터 모델에 `interface`, 나머지에 `type`을 씁니다)
- 유니온·튜플·함수 타입·타입 조합 → **`type`만 가능**
- 선언 병합(같은 이름 interface가 합쳐지는 기능)이 필요할 때 → `interface` (라이브러리 확장에서나 쓰임, 지금은 몰라도 됨)

💡 TS 타입은 **런타임에 아무것도 만들지 않습니다.** `interface User`는 클래스도 딕셔너리도 아니고, 컴파일 타임의 "모양 검사 규칙"일 뿐입니다. `dataclass`처럼 인스턴스를 만들어주지 않아요. 이 차이가 세션 4(Zod)로 이어집니다.

### 2-2. 유니온 `|` · 인터섹션 `&` · 리터럴 유니온 ⭐

```ts
// 유니온: 여러 타입 중 하나 (🐍 Union[int, str] / int | str)
type Id = number | string;

// 리터럴 유니온: enum의 모던 대체재 (🐍 Literal["small", "medium", "large"])
type ModelSize = "small" | "medium" | "large";

const size: ModelSize = "medium"; // ✅
// const bad: ModelSize = "huge";  // ❌ 에러 + 에디터가 자동완성까지 해줌

// 인터섹션: 두 모양을 합침 (믹스인 느낌)
type Timestamped = { createdAt: string };
type Post = { title: string } & Timestamped; // title과 createdAt 둘 다 필요
```

💡 리터럴 유니온은 TS에서 **압도적으로 자주** 쓰는 패턴입니다. 함수 옵션, 상태값, API 파라미터 전부 이걸로 표현해요. 오타를 컴파일 타임에 잡고, 에디터 자동완성이 따라옵니다.

**discriminated union (구별된 유니온) 맛보기** — 세션 3의 narrowing과 한 세트인 TS 실무의 심장:

```ts
type TrainResult =
  | { status: "success"; accuracy: number }
  | { status: "failed"; reason: string };
// status라는 공통 "태그" 필드로 어느 쪽인지 구별 → 세션 3에서 분기 처리
```

🐍 파이썬으로 치면 `Union[Success, Failure]`에 `match` 문을 쓰는 패턴인데, TS는 이게 언어의 중심 관용구입니다.

### 2-3. 옵셔널 3형제: `?` · `?.` · `??`

생김새가 비슷하지만 역할이 다른 세 문법입니다.

```ts
interface Config {
  name: string;
  timeout?: number; // ① ?  : 이 프로퍼티는 없어도 됨 (타입: number | undefined)
}

const cfg: Config = { name: "exp1" };

// ② ?. : 옵셔널 체이닝 — null/undefined면 거기서 멈추고 undefined 반환
console.log(cfg.timeout?.toFixed(1)); // undefined (에러 안 남)

// ③ ?? : nullish 병합 — 왼쪽이 null/undefined일 때만 오른쪽 사용
const timeout = cfg.timeout ?? 3000; // 3000
```

🐍 대응:

| 🟨 TS | 🐍 Python |
|---|---|
| `timeout?: number` | `timeout: NotRequired[int]` (TypedDict) |
| `obj?.attr?.method()` | 딱 맞는 문법 없음 (`getattr` 체인 or try/except) |
| `x ?? default` | `x if x is not None else default` |

⚠️ **`??` vs `||` — Day 1 truthy/falsy 함정의 재림.** `||`는 falsy 전부(0, `""`, false 포함)를 걸러내지만, `??`는 **null/undefined만** 걸러냅니다:

```ts
const retries = 0;
console.log(retries || 3); // 3   ⚠️ 0이 falsy라서 기본값으로 덮임! (버그)
console.log(retries ?? 3); // 0   ✅ 0은 유효한 값이므로 유지
```

**철칙: 기본값 처리엔 `??`.** `||`는 "정말 falsy 전부를 거르고 싶을 때"만.

### 2-4. `strict` 모드가 주는 null 안전

tsconfig에서 `strict: true`를 켰기 때문에 (그 안의 `strictNullChecks`가) 이런 일이 벌어집니다:

```ts
let title: string = "hello";
// title = null;               // ❌ 에러: string에 null 못 넣음

let subtitle: string | null = null; // null 가능성을 타입에 명시해야 함
// subtitle.toUpperCase();     // ❌ 에러: "null일 수도 있는데?"

if (subtitle !== null) {
  subtitle.toUpperCase(); // ✅ 체크 후엔 통과 (narrowing!)
}
```

🐍 `Optional[str]`(= `str | None`)과 개념이 같지만, mypy 없이도 **컴파일러가 "null 체크했니?"를 항상 강제**한다는 점이 다릅니다. NullPointerException류 버그가 원천 차단돼요. `find()`처럼 "못 찾을 수도 있는" API의 반환 타입에 `| undefined`가 붙어 있는 이유이기도 합니다:

```ts
const nums = [1, 2, 3];
const found = nums.find((n) => n > 10); // 타입: number | undefined
console.log(found?.toFixed(1) ?? "없음"); // ?.와 ??가 실전에서 만나는 순간
```

### ✅ 세션 2 체크
- [ ] `interface`/`type`으로 데이터 모델 정의
- [ ] 리터럴 유니온으로 "enum 대체" 작성
- [ ] `?` `?.` `??` 세 문법의 역할 구분
- [ ] `??`와 `||`의 차이(0 함정)를 설명 가능
- [ ] `string | null` 타입을 체크 없이 쓰면 에러 나는 걸 확인

---

## 3. 세션 3 (오후) — 함수 · 제네릭 · Narrowing

> 새 파일 `03-functions-generics.ts`. 파이썬 3.12의 `def f[T](...)` 문법을 써봤다면 제네릭은 금방 익숙해집니다.

### 3-1. 함수 타이핑

```ts
// 기본형: 매개변수와 반환 타입
function score(correct: number, total: number): number {
  return correct / total;
}

// 화살표 함수 (Day 1 습관 그대로 + 타입만 추가)
const label = (acc: number): string => (acc >= 0.9 ? "strong" : "weak");

// 반환 없음: void (🐍 -> None)
const log = (msg: string): void => console.log(msg);

// 함수 자체의 타입 (🐍 Callable[[float], str])
type Labeler = (acc: number) => string;
const labeler: Labeler = (acc) => (acc >= 0.9 ? "S" : "A"); // 매개변수 타입 자동 추론!

// 기본값 · 옵셔널 · rest 타이핑
function report(name: string, digits = 3, ...tags: string[]): string {
  return `${name} (${digits}자리) [${tags.join(", ")}]`;
}
```

💡 **반환 타입은 생략해도 추론되지만**, 외부에 노출되는 함수(export하는 것)는 명시하는 습관을 권합니다 — 구현을 바꿨을 때 "반환 타입이 의도치 않게 바뀌는" 사고를 컴파일러가 잡아줍니다.

**오버로드는 맛보기만** (🐍 `@overload`와 동일 개념 — "인자 조합에 따라 반환 타입이 다르다"를 표현):

```ts
function parse(input: string): number;
function parse(input: string[]): number[];
function parse(input: string | string[]): number | number[] {
  return Array.isArray(input) ? input.map(Number) : Number(input);
}
```

실무에서 직접 쓸 일은 드물고, 라이브러리 타입 정의에서 만나면 "아 그거구나" 하면 됩니다.

### 3-2. 제네릭 `<T>` ⭐ (🐍 TypeVar의 편한 버전)

"어떤 타입이든 받되, **들어온 타입과 나가는 타입의 관계**를 유지한다"가 제네릭입니다.

```ts
// 🐍 def first[T](arr: list[T]) -> T | None:   (Python 3.12 문법)
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const n = first([1, 2, 3]); // T = number로 추론 → n: number | undefined
const s = first(["a", "b"]); // T = string으로 추론 → s: string | undefined
// 호출할 때 타입을 적을 필요 없음 — 인자에서 자동 추론!

// 제약(constraint): T가 최소한 갖춰야 할 모양 (🐍 TypeVar bound)
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
longest("hello", "hi"); // ✅ string은 length가 있음
longest([1, 2], [3]); // ✅ 배열도 length가 있음
// longest(10, 20);      // ❌ number엔 length 없음

// 제네릭 타입: 컨테이너의 타입 매개변수 (🐍 Generic[T] 클래스)
interface ApiResponse<T> {
  ok: boolean;
  data: T;
}
const res1: ApiResponse<number[]> = { ok: true, data: [1, 2, 3] };
```

🐍 대응표:

| 🐍 Python | 🟨 TS |
|---|---|
| `def f[T](x: T) -> T` | `function f<T>(x: T): T` |
| `TypeVar("T", bound=Sized)` | `<T extends { length: number }>` |
| `class Box(Generic[T])` | `interface Box<T>` |
| `list[T]` | `T[]` |

💡 Day 1에서 배운 `map`/`filter`가 전부 제네릭이었습니다: `Array<T>.map<U>(fn: (item: T) => U): U[]`. 지금까지 자동완성이 정확했던 이유예요.

### 3-3. Narrowing (타입 좁히기) ⭐⭐ — TS 실무의 심장

유니온 타입은 "여러 가능성"입니다. **분기문을 통과할 때마다 TS가 가능성을 좁혀주는** 것이 narrowing이고, TS 코드의 절반은 이 패턴입니다.

```ts
// ① typeof — 원시 타입 좁히기 (🐍 isinstance(x, str))
function format(id: number | string): string {
  if (typeof id === "string") {
    return id.toUpperCase(); // 여기서 id는 string
  }
  return id.toFixed(0); // 여기서 id는 number (else 없이도 좁혀짐!)
}

// ② in — 프로퍼티 존재로 좁히기
type Cat = { meow: () => void };
type Dog = { bark: () => void };
function speak(pet: Cat | Dog) {
  if ("meow" in pet) pet.meow();
  else pet.bark();
}

// ③ 커스텀 타입 가드 — "x is 타입" 반환 (🐍 TypeGuard[User])
interface User {
  name: string;
}
function isUser(x: unknown): x is User {
  return typeof x === "object" && x !== null && "name" in x;
}
```

**discriminated union + exhaustive check** — 세션 2의 예제를 완성합니다:

```ts
type TrainResult =
  | { status: "success"; accuracy: number }
  | { status: "failed"; reason: string }
  | { status: "pending" };

function summarize(r: TrainResult): string {
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
```

🐍 파이썬의 `match` + `assert_never()`와 정확히 같은 패턴입니다. 위력은 이겁니다: 나중에 `status: "cancelled"`를 유니온에 추가하면, **이 switch가 컴파일 에러를 냅니다** ("cancelled가 never에 할당 안 됨"). 처리 안 한 케이스를 컴파일러가 찾아주는 거예요. Day 6에서 AI SDK의 message-parts를 렌더링할 때 이 패턴을 그대로 씁니다.

### ✅ 세션 3 체크
- [ ] 함수 시그니처(매개변수·반환) 타이핑
- [ ] 제네릭 함수 작성 + 호출 시 타입 자동 추론 확인
- [ ] `extends`로 제네릭 제약 걸기
- [ ] `typeof` narrowing으로 유니온 분기
- [ ] discriminated union + `never` exhaustive check 작성

---

## 4. 세션 4 (오후) — 유틸리티 타입 · 비동기 타이핑 · Zod

> 새 파일 `04-utility-zod.ts`. 파이썬 타입힌트엔 없는 "타입을 계산하는" 세계입니다.

### 4-1. `keyof`와 `typeof` (타입 레벨) — 짧게

```ts
const config = { model: "sonnet", temperature: 0.7, maxTokens: 1024 };

type Config = typeof config; // 값에서 타입을 추출 (런타임 typeof와 다른, 타입 자리의 typeof)
type ConfigKey = keyof Config; // "model" | "temperature" | "maxTokens"
```

💡 "이미 있는 값/타입에서 파생시킨다"는 감각만 잡으면 됩니다. 아래 유틸리티 타입들이 전부 이 원리 위에 있어요.

### 4-2. 유틸리티 타입 — 타입을 변형하는 내장 함수들

파이썬이라면 TypedDict를 하나 더 정의해야 할 일을, TS는 **기존 타입을 변형**해서 해결합니다.

```ts
interface Experiment {
  id: number;
  name: string;
  accuracy: number;
  tags: string[];
}
```

| 유틸리티 | 결과 | 쓰임새 |
|---|---|---|
| `Partial<Experiment>` | 모든 필드가 옵셔널 | 부분 업데이트 함수의 인자 |
| `Required<T>` | 모든 필드가 필수 | Partial의 반대 |
| `Pick<Experiment, "id" \| "name">` | 두 필드만 남김 | 요약/목록용 타입 |
| `Omit<Experiment, "tags">` | tags만 제거 | "이것만 빼고" |
| `Record<string, number>` | 🐍 `dict[str, float]` | 매핑 타입 |
| `Readonly<T>` | 모든 필드 수정 금지 | 불변 데이터 |
| `ReturnType<typeof fn>` | 함수의 반환 타입 추출 | 라이브러리 함수 반환 재사용 |

실전 예 — **Partial을 이용한 부분 업데이트** (Day 1의 불변 업데이트 패턴과 결합):

```ts
function updateExperiment(exp: Experiment, patch: Partial<Experiment>): Experiment {
  return { ...exp, ...patch }; // 스프레드 병합 — 바뀐 필드만 덮어씀
}

const exp: Experiment = { id: 1, name: "baseline", accuracy: 0.81, tags: [] };
const better = updateExperiment(exp, { accuracy: 0.93 }); // name 등은 그대로
```

💡 이 `Partial` + 스프레드 조합은 React 상태 업데이트와 API PATCH 처리의 표준 패턴입니다. Day 4에서 재회합니다.

### 4-3. 비동기 타이핑 — `Promise<T>`

```ts
// async 함수의 반환 타입은 항상 Promise<T> (🐍 Coroutine이지만 표기는 Awaitable[T] 감각)
async function fetchAccuracy(runId: string): Promise<number> {
  await new Promise((r) => setTimeout(r, 100)); // Day 2의 sleep
  return 0.93;
}

const acc = await fetchAccuracy("run-1"); // await하면 Promise가 벗겨져서 number

// Promise.all은 튜플 타입을 정확히 유지해줌
const [a, b] = await Promise.all([fetchAccuracy("r1"), Promise.resolve("done")]);
// a: number, b: string — 위치별 타입이 살아있음!
```

**그런데 `fetch`는?** Day 2에서 쓴 `res.json()`의 반환 타입은 `Promise<any>`입니다. TS가 서버 응답 내용을 알 리 없으니까요. 여기가 오늘의 마지막 관문입니다:

```ts
const res = await fetch("https://api.github.com/users/vercel");
const data = await res.json(); // data: any ⚠️ 타입 시스템의 구멍!

// 임시방편: 타입 단언(assertion) — "내가 보증할게" (🐍 cast(T, x))
interface GitHubUser {
  login: string;
  followers: number;
}
const user = (await res.json()) as GitHubUser; // 검증 없이 믿는 것 ⚠️
```

⚠️ `as`는 **검사가 아니라 선언**입니다. 서버가 다른 모양을 보내면 그대로 런타임 버그가 됩니다. 컴파일 타임 타입은 런타임을 지켜주지 못해요(0장의 type erasure). 그래서 —

### 4-4. Zod 맛보기 ⭐ — "TS의 pydantic"

**Zod = 런타임에 실재하는 스키마 + 거기서 추론되는 컴파일 타임 타입.** ML 개발자인 당신에게 가장 쉬운 소개는 이겁니다: **Zod는 pydantic입니다.**

```bash
pnpm add zod
```

```ts
import { z } from "zod";

// 1) 스키마 정의 (🐍 class GitHubUser(BaseModel): ...)
const GitHubUserSchema = z.object({
  login: z.string(),
  name: z.string().nullable(), // 🐍 str | None
  followers: z.number(),
  public_repos: z.number(),
});

// 2) 타입은 스키마에서 "추론" — 타입을 두 번 안 씀! (Single Source of Truth)
type GitHubUser = z.infer<typeof GitHubUserSchema>;

// 3) 런타임 검증 (🐍 GitHubUser.model_validate(data))
const res = await fetch("https://api.github.com/users/vercel");
const user = GitHubUserSchema.parse(await res.json()); // 모양이 다르면 ZodError를 던짐
console.log(user.login, user.followers); // user: GitHubUser — any가 사라짐!

// 던지는 게 싫으면: safeParse → discriminated union 반환 (세션 3 패턴!)
const result = GitHubUserSchema.safeParse({ login: 123 }); // 일부러 틀린 데이터
if (result.success) {
  console.log(result.data.login); // 여기선 data 존재
} else {
  console.log(result.error.issues); // 여기선 error 존재 — narrowing이 작동
}
```

🐍 pydantic 대응표:

| 🐍 pydantic | 🟨 Zod |
|---|---|
| `class User(BaseModel): ...` | `const UserSchema = z.object({...})` |
| `User.model_validate(data)` | `UserSchema.parse(data)` |
| `ValidationError` | `ZodError` |
| 클래스가 곧 타입 | `type User = z.infer<typeof UserSchema>` |
| `str \| None` | `z.string().nullable()` |
| `Field(ge=0, le=1)` | `z.number().min(0).max(1)` |

💡 **왜 지금 배우나**: Day 6에서 에이전트 도구(tool)의 입력 스키마를 Zod로 정의합니다 — LLM이 도구를 올바른 인자로 호출했는지 **런타임에 검증**해야 하니까요. 오늘은 `z.object` / `parse` / `safeParse` / `z.infer` 네 가지만 손에 붙이면 충분합니다.

### ✅ 세션 4 체크
- [ ] `Partial`/`Pick`/`Omit`/`Record` 중 3개 이상 사용
- [ ] `Promise<T>` 반환 타입의 async 함수 작성
- [ ] `as` 단언이 왜 위험한지 설명 가능
- [ ] Zod 스키마 정의 → `parse` → `z.infer`로 타입 추출
- [ ] `safeParse` 결과를 narrowing으로 분기

---

## 5. 통합 실습 — GitHub 리포트를 TypeScript로 이식 ⭐

Day 2의 `github-report.js`를 **타입 안전한 TS 모듈 3개**로 재구성합니다. 오늘 배운 것 전부(interface, 제네릭, narrowing, `Promise<T>`, 유틸리티)가 들어갑니다.

### 5-1. `exercise/types.ts` — 데이터 모델

```ts
// exercise/types.ts
// GitHub API 응답 중 "우리가 쓰는 필드만" 타이핑

export interface GitHubUser {
  login: string;
  name: string | null; // 이름 미설정 유저가 있음
  public_repos: number;
  followers: number;
  created_at: string; // ISO 날짜 문자열
}

export interface GitHubRepo {
  name: string;
  stargazers_count: number;
  language: string | null; // 언어 감지 안 된 저장소가 있음
  updated_at: string;
}
```

💡 **전체 응답을 다 타이핑할 필요 없습니다.** TS는 구조적 타이핑이라, 실제 응답에 필드가 더 있어도 "선언한 필드가 맞는 모양으로 존재하는가"만 봅니다. 쓰는 것만 선언하는 게 실무 관행이에요.

### 5-2. `exercise/api.ts` — 제네릭 fetch 헬퍼

```ts
// exercise/api.ts
// Day 2의 fetch 헬퍼가 제네릭으로 진화

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) {
    // Day 2에서 배운 것: fetch는 404/500에 throw하지 않는다 — 직접 확인!
    throw new Error(`HTTP ${res.status}: ${url}`);
  }
  return (await res.json()) as T;
}
```

⚠️ `as T`는 "호출자가 준 타입을 믿겠다"는 뜻으로, **검증이 아닙니다.** 학습 단계에선 이걸로 충분하지만, 진짜 안전하게 만드는 건 아래 도전 과제(Zod 버전)에서 합니다.

### 5-3. `exercise/report.ts` — 메인 리포트

```ts
// exercise/report.ts
import { fetchJson } from "./api.ts";
import type { GitHubUser, GitHubRepo } from "./types.ts";

const USERNAME = "vercel";

// 제네릭 유틸: score 기준 상위 k개 (⭐ Day 7 RAG의 top-k 검색이 정확히 이 함수)
function topK<T>(items: T[], k: number, score: (item: T) => number): T[] {
  return [...items].sort((a, b) => score(b) - score(a)).slice(0, k);
}

async function main(): Promise<void> {
  // 병렬 호출 — Promise.all이 [GitHubUser, GitHubRepo[]] 튜플 타입을 유지
  const [user, repos] = await Promise.all([
    fetchJson<GitHubUser>(`https://api.github.com/users/${USERNAME}`),
    fetchJson<GitHubRepo[]>(
      `https://api.github.com/users/${USERNAME}/repos?per_page=100`
    ),
  ]);

  // 스타 상위 3개
  const top3 = topK(repos, 3, (r) => r.stargazers_count);

  // 총 스타 수 (reduce의 acc/r 타입이 전부 추론됨)
  const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0);

  // 사용 언어 목록 — 커스텀 타입 가드로 null 제거 (세션 3의 narrowing 실전!)
  const languages = [
    ...new Set(
      repos.map((r) => r.language).filter((l): l is string => l !== null)
    ),
  ];

  console.log(`=== ${user.name ?? user.login} 리포트 ===`); // ?? 실전 사용
  console.log(`팔로워: ${user.followers.toLocaleString()}명`);
  console.log(`공개 저장소: ${user.public_repos}개 / 총 ⭐ ${totalStars.toLocaleString()}`);
  console.log(`주요 언어: ${languages.slice(0, 5).join(", ")}`);
  console.log("스타 Top 3:");
  for (const r of top3) {
    console.log(`  - ${r.name} (⭐ ${r.stargazers_count.toLocaleString()})`);
  }
}

main().catch((err: unknown) => {
  // catch의 err는 unknown — narrowing으로 안전하게 처리 (세션 1의 unknown 실전!)
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
```

실행 & 검증:

```bash
node exercise/report.ts   # 리포트 출력
pnpm typecheck            # 타입 에러 0개
pnpm lint                 # ESLint 경고 0개
```

⚠️ **import 확장자 주의**: Day 2에서 상대경로 import에 `.js`가 필수라고 배웠죠. **node로 `.ts`를 직접 실행할 때는 `.ts`를 씁니다** (tsconfig의 `allowImportingTsExtensions`가 이를 허용). Day 5부터의 Next.js 환경에서는 번들러가 처리하므로 확장자를 생략합니다 — 환경마다 규칙이 다른 게 혼란스럽지만, "Node 직접 실행 = 확장자 필수"만 기억하세요.

💡 `import type { ... }`을 쓴 이유: tsconfig의 `verbatimModuleSyntax` 때문에 **타입만 가져올 때는 `import type`으로 명시**해야 합니다. 런타임에 완전히 지워지는 import임을 코드에 드러내는 것 — type erasure 멘탈 모델의 문법적 표현입니다.

### 🎯 추가 연습 문제 3개 (스스로 풀어보기)

**문제 1.** `Pick<GitHubUser, "login" | "followers">` 타입의 요약 객체를 반환하는 `summarizeUser(user: GitHubUser)` 함수를 작성하세요.
> 힌트: 반환 타입에 Pick을 직접 쓰면 됩니다. 구조 분해로 꺼내서 새 객체로.

**문제 2.** 예외를 던지지 않는 `safeFetchJson`을 만드세요. 반환 타입은 discriminated union:
> `type FetchResult<T> = { ok: true; data: T } | { ok: false; error: string }`
> 호출부에서 `if (result.ok)`로 narrowing해서 분기하세요. (Zod의 safeParse와 같은 설계입니다)

**문제 3.** `types.ts`의 interface를 지우고, Zod 스키마(`GitHubUserSchema`, `GitHubRepoSchema`)로 대체하세요. 타입은 `z.infer`로 추출하고, `fetchJson`이 `as T` 대신 스키마로 `parse`하도록 개선하세요.
> 힌트: `fetchJson<T>(url, schema: z.ZodType<T>)` 시그니처로 스키마를 인자로 받으면 제네릭과 검증이 결합됩니다.

막히면 "Day 3 실습 문제 N번 힌트/풀이 알려줘"라고 물어보세요.

---

## 6. ✅ Day 3 완료 체크리스트

- [ ] `practice/day3/`에 `tsconfig.json` 포함 설정 완비, `pnpm typecheck`/`lint`/`format` 동작
- [ ] "node는 실행만, tsc는 검사만"을 직접 체험하고 설명 가능
- [ ] `any` 대신 `unknown` + narrowing을 쓰는 이유 설명 가능
- [ ] `interface`/`type`으로 데이터 모델 정의
- [ ] 리터럴 유니온 + discriminated union + `never` exhaustive check 작성
- [ ] 제네릭 함수(`topK` 등) 작성, `extends` 제약 사용
- [ ] `?` / `?.` / `??` 구분, `??` vs `||` 함정 인지
- [ ] `Partial`/`Pick`/`Omit` 등 유틸리티 타입 사용
- [ ] Zod로 스키마 정의 → `parse`/`safeParse` → `z.infer`
- [ ] `report.ts` 실행 성공 + `tsc --noEmit` 에러 0개 + 추가 문제 3개 시도

---

## 7. 자주 나오는 함정 정리 (⚠️)

| 증상 | 원인 | 해결 |
|---|---|---|
| 타입이 틀렸는데 `node`로는 잘 돌아감 | node는 타입을 지울 뿐 검사 안 함 | `pnpm typecheck` 습관화, 에디터 빨간 줄 신뢰 |
| `enum` 쓰니 node 실행 에러 | enum은 지워질 수 없는 문법 | 리터럴 유니온으로 대체 (`"a" \| "b"`) |
| import 에러 (`Cannot find module './x'`) | 확장자 누락 | node 직접 실행 시 `./x.ts`로 명시 |
| `res.json()` 결과가 전부 `any` | fetch는 응답 모양을 모름 | 제네릭 헬퍼 + (제대로 하려면) Zod 검증 |
| 기본값 처리했는데 0이 사라짐 | `\|\|`가 0을 falsy로 거름 | `??` 사용 |
| `Object is possibly 'null'` 에러 | strict 모드의 null 검사 | narrowing(`if (x !== null)`) 또는 `?.` — `!` 단언은 최후의 수단 |
| `interface`로 유니온이 안 만들어짐 | interface는 객체 모양 전용 | `type`으로 정의 |
| `process`/`console`에 타입 에러 | Node 타입 정의 없음 | `pnpm add -D @types/node` |
| 타입만 import했는데 lint/컴파일 경고 | `verbatimModuleSyntax` | `import type { ... }` 사용 |
| 에디터 타입 검사가 이상함 | TS 서버 캐시 꼬임 | "TypeScript: Restart TS Server" 실행 |

---

## 8. 저장소 커밋 & 정리

```bash
# 저장소 루트로 이동
cd ../..

git status   # node_modules/ 안 보이는지 확인
git add practice/day3 docs/Day3.md
git commit -m "Day 3: TypeScript 타입 시스템 + GitHub 리포트 TS 이식"
git push
```

---

## 9. Day 4 미리보기

문법의 3부작(JS → 비동기/모듈 → TS)이 끝났습니다. Day 4부터는 **React** — 오늘 배운 것들이 즉시 실전 투입됩니다:

1. **props 타이핑** — 컴포넌트의 입력을 `interface`/`type`으로 정의 (오늘 세션 2가 그대로)
2. **`useState<T>`** — 상태에 제네릭으로 타입을 거는 법 (오늘 세션 3)
3. **불변 업데이트** — `{ ...state, field: value }` 패턴이 상태 관리의 심장 (Day 1 + 오늘의 Partial)
4. ⭐ **채팅 UI 프로젝트 시작** — 7일 여정의 최종 산출물이 될 앱의 첫 삽을 뜹니다

가장 큰 사고 전환("상태의 함수로서의 UI")이 기다리는 날이니, 오늘 밤은 푹 쉬세요. Day 4 시작할 때 로드맵과 이 문서를 붙이고 **"Day 4 세션 1 상세 자료 만들어줘"**라고 요청하면 이어서 만들어 드립니다.

---

### 부록 — Python typing ↔ TypeScript 치트시트 (Day 3 범위)

```
# 기본
x: int                        →  x: number
x: str | None                 →  x: string | null
list[int]                     →  number[]
tuple[str, int]               →  [string, number]
dict[str, float]              →  Record<string, number>
Literal["a", "b"]             →  "a" | "b"
A | B                         →  A | B          (동일!)

# 특수 타입
Any                           →  any            (금지)
object (대략)                 →  unknown        (좁혀서 사용)
Never / NoReturn              →  never
None 반환                     →  void

# 함수
Callable[[int], str]          →  (x: number) => string
def f[T](x: T) -> T           →  function f<T>(x: T): T
TypeVar(bound=Sized)          →  <T extends { length: number }>
@overload                     →  오버로드 시그니처 나열
Awaitable[T] (감각상)         →  Promise<T>

# 데이터 모델
TypedDict                     →  interface / type
NotRequired[int]              →  field?: number
cast(T, x)                    →  x as T          (검증 아님 ⚠️)

# narrowing
isinstance(x, str)            →  typeof x === "string"
isinstance(x, Dog)            →  x instanceof Dog / "bark" in x
TypeGuard[User]               →  x is User
match + assert_never          →  switch + never exhaustive check

# 런타임 검증
pydantic BaseModel            →  zod z.object({...})
Model.model_validate(data)    →  Schema.parse(data)
ValidationError               →  ZodError
클래스 = 타입                 →  type T = z.infer<typeof Schema>
```

수고했어요. 이제 코드에 안전벨트가 채워졌습니다 — Day 4에서 이 타입들 위에 React UI를 올립니다. 🟨
