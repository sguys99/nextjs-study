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

//-------------------
// day 6
// src/app/api/chat/route.ts
import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

// 스트리밍이 길어질 수 있으니 타임아웃을 늘려둔다 (초 단위)
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: "당신은 한국어로 간결하고 정확하게 답하는 조수입니다.",
    messages: await convertToModelMessages(messages),   // ⚠️ v6: await 필요
  });

  return result.toUIMessageStreamResponse();
}

