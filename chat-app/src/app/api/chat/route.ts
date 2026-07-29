// // src/app/api/chat/route.ts
// // ⚠️ Day 6에서 이 파일의 내용이 Vercel AI SDK의 streamText로 교체됩니다.

// export async function POST(req: Request) {
//   const { message } = (await req.json()) as { message?: string };

//   if (!message?.trim()) {
//     return Response.json({ error: "message가 필요합니다" }, { status: 400 });
//   }

//   const reply = `(가짜 응답) "${message}" 라고 하셨군요. 아직 LLM은 연결되지 않았습니다.`;
//   const encoder = new TextEncoder();

//   const stream = new ReadableStream({
//     async start(controller) {
//       for (const char of reply) {
//         controller.enqueue(encoder.encode(char));      // 한 글자씩 내보냄
//         await new Promise((r) => setTimeout(r, 25));   // 타이핑 효과
//       }
//       controller.close();
//     },
//   });

//   return new Response(stream, {
//     headers: { "Content-Type": "text/plain; charset=utf-8" },
//   });
// }

// //-------------------
// // day 6
// // src/app/api/chat/route.ts
// import { anthropic } from "@ai-sdk/anthropic";
// import { convertToModelMessages, streamText, type UIMessage } from "ai";

// // 스트리밍이 길어질 수 있으니 타임아웃을 늘려둔다 (초 단위)
// export const maxDuration = 30;

// export async function POST(req: Request) {
//   const { messages }: { messages: UIMessage[] } = await req.json();

//   const result = streamText({
//     model: anthropic("claude-sonnet-4-6"),
//     system: "당신은 한국어로 간결하고 정확하게 답하는 조수입니다.",
//     messages: await convertToModelMessages(messages),   // ⚠️ v6: await 필요
//   });

//   return result.toUIMessageStreamResponse();
// }

// ------------------

// // day 6 again
// import { anthropic } from "@ai-sdk/anthropic";
// import {
//   convertToModelMessages,
//   stepCountIs,
//   streamText,
//   type UIMessage,
// } from "ai";
// import { chatTools } from "@/lib/tools";


// export const maxDuration = 30;

// const SYSTEM_PROMPT = `당신은 한국어로 답하는 유능한 조수입니다.

// 원칙:
// - 숫자 계산이 필요하면 반드시 calculate 도구를 사용하세요. 암산하지 마세요.
// - 현재 시각이 필요하면 getCurrentTime 도구를 사용하세요. 추측하지 마세요.
// - GitHub 사용자 정보는 getGithubUser 도구로 확인하세요.
// - 도구 결과를 받은 뒤에는 반드시 사용자에게 자연스러운 문장으로 정리해 답하세요.
// - 간결하게 답하세요.`;

// export async function POST(req: Request) {
//   const { messages }: { messages: UIMessage[] } = await req.json();

//   const result = streamText({
//     model: anthropic("claude-sonnet-4-6"),
//     system: SYSTEM_PROMPT,
//     messages: await convertToModelMessages(messages),
//     tools: chatTools,
//     stopWhen: stepCountIs(5),        // ⭐ 도구 호출 라운드 최대 5회
//   });

//   return result.toUIMessageStreamResponse();
// }

//-------------
// 6-4
import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { chatTools } from "@/lib/tools";
import { SYSTEM_PROMPT } from "@/lib/prompts";

export const maxDuration = 30;

// ⬇️ 4-2에서 src/lib/prompts.ts로 옮깁니다. 지금은 그대로 두세요.
// const SYSTEM_PROMPT = `당신은 한국어로 답하는 유능한 조수입니다.

// 원칙:
// - 숫자 계산이 필요하면 반드시 calculate 도구를 사용하세요. 암산하지 마세요.
// - 현재 시각이 필요하면 getCurrentTime 도구를 사용하세요. 추측하지 마세요.
// - GitHub 사용자 정보는 getGithubUser 도구로 확인하세요.
// - 도구 결과를 받은 뒤에는 반드시 사용자에게 자연스러운 문장으로 정리해 답하세요.
// - 간결하게 답하세요.`;

export async function POST(req: Request) {
  try {                                                        // 🆕 ③
    const { messages }: { messages: UIMessage[] } = await req.json();

    // 🆕 ③ 입력 검증 — 스트리밍 시작 전에 걸러낸다
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages가 필요합니다" }, { status: 400 });
    }
    if (messages.length > 50) {
      return Response.json({ error: "대화가 너무 깁니다" }, { status: 400 });
    }

    const result = streamText({
      model: anthropic("claude-sonnet-4-6"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: chatTools,
      stopWhen: stepCountIs(5),
    });

    // 🆕 ② 스트리밍 도중의 에러 — try/catch로는 못 잡는 영역
    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error("[chat] 스트림 에러:", error);
        // ⚠️ 프로덕션에서는 내부 정보를 그대로 노출하지 말 것
        return error instanceof Error ? error.message : "알 수 없는 오류";
      },
    });
  } catch (err) {
    // 🆕 ③ req.json() 파싱 실패 등, 스트리밍이 시작되기 전의 에러만 여기로 온다
    console.error("[chat] 요청 처리 실패:", err);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}