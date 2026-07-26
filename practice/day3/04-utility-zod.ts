// 4-1. keyof와 typeof (타입 레벨) — 짧게

const config = { model: "sonnet", temperature: 0.7, maxTokens: 1024 };

type Config = typeof config; // 값에서 타입을 추출
type ConfigKey = keyof Config; // "model" | "temperature" | "maxTokens"

// 4-2. 유틸리티 타입 — 타입을 변형하는 내장 함수들
interface Experiment {
  id: number;
  name: string;
  accuracy: number;
  tags: string[];
}

function updateExperiment(exp: Experiment, patch: Partial<Experiment>): Experiment {
  return { ...exp, ...patch }; // 스프레드 병합 — 바뀐 필드만 덮어씀
}

const exp: Experiment = { id: 1, name: "baseline", accuracy: 0.81, tags: [] };
const better = updateExperiment(exp, { accuracy: 0.93 }); // name 등은 그대로

console.log(better);

//-------------------------------
// 4-3. 비동기 타이핑 — Promise<T>

// async 함수의 반환 타입은 항상 Promise<T> (🐍 Coroutine이지만 표기는 Awaitable[T] 감각)??

async function fetchAccuracy(runId: string): Promise<number> {
    await new Promise((r) => setTimeout(r, 100))
    return 0.93;
}

const acc = await fetchAccuracy("run-1"); // await하면 Promise가 벗겨져서 number
console.log(acc)

//--------------------------------
// 그런데 fetch는? Day 2에서 쓴 res.json()의 반환 타입은 Promise<any>입니다. TS가 서버 응답 내용을 알 리 없으니까요. 여기가 오늘의 마지막 관문입니다:
const res = await fetch("https://api.github.com/users/vercel");
const data = await res.json(); // data: any ⚠️ 타입 시스템의 구멍!

// 임시방편: 타입 단언(assertion)
interface GitHubUser {
  login: string;
  followers: number;
}
// const user = (await res.json()) as GitHubUser; // 검증 없이 믿는 것 ⚠️
// console.log(user);
// 런타임 버그 발생
// node:internal/deps/undici/undici:7035
//         return Promise.reject(new TypeError("Body is unusable: Body has already been read"));
//                               ^

// TypeError: Body is unusable: Body has already been read
//     at consumeBody (node:internal/deps/undici/undici:7035:31)
//     at _Response.json (node:internal/deps/undici/undici:6986:18)
//     at file:///Users/sguys99/Desktop/project/nextjs-study/practice/day3/04-utility-zod.ts:48:25
//     at process.processTicksAndRejections (node:internal/process/task_queues:104:5)

// Node.js v24.18.0

// as는 검사가 아니라 선언입니다. 서버가 다른 모양을 보내면 그대로 런타임 버그가 됩니다. 컴파일 타임 타입은 런타임을 지켜주지 못해요(0장의 type erasure). 그래서 —

// 그래서

// -------------------------
// Zod 맛보기 : TS의 pydantic

// Zod = 런타임에 실재하는 스키마 + 거기서 추론되는 컴파일 타임 타입. ML 개발자인 당신에게 가장 쉬운 소개는 이겁니다: Zod는 pydantic입니다.

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
const res2 = await fetch("https://api.github.com/users/vercel");
const user = GitHubUserSchema.parse(await res2.json()); // 모양이 다르면 ZodError를 던짐
console.log(user.login, user.followers);// user: GitHubUser — any가 사라짐!

// 던지는 게 싫으면: safeParse → discriminated union 반환 (세션 3 패턴!)
const result = GitHubUserSchema.safeParse({ login: 123 }); // 일부러 틀린 데이터
if (result.success) {
  console.log(result.data.login); // 여기선 data 존재
} else {
  console.log(result.error.issues); // 여기선 error 존재 — narrowing이 작동
}