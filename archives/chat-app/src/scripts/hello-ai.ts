// chat-app/src/scripts/hello-ai.ts
import { config } from "dotenv";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, streamText } from "ai";

// ⚠️ dotenv는 기본적으로 `.env`만 읽는다. Next.js가 쓰는 `.env.local`은 직접 지정해야 한다.
config({ path: ".env.local" });

const model = anthropic("claude-sonnet-4-6");

async function main() {
  // ① 한 방에 받기
  const { text, usage } = await generateText({
    model,
    system: "당신은 간결하게 답하는 조수입니다.",
    prompt: "TypeScript를 파이썬 개발자에게 한 문장으로 설명해줘.",
  });
  console.log("\n[generateText]", text);
  console.log("[usage]", usage);

  // ② 스트리밍으로 받기
  console.log("\n[streamText] ");
  const result = streamText({
    model,
    prompt: "리액트의 useState를 3문장으로 설명해줘.",
  });

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);       // 토큰이 도착하는 대로 출력
  }
  console.log("\n");
}

main();