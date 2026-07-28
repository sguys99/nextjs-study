// src/app/page.tsx   ← 서버 컴포넌트
import { ChatPanel } from "@/components/ChatPanel";
import type { Message } from "@/types";

// 나중에 DB에서 읽어올 자리. 지금은 서버에서 만든 인사말 하나.
// Date.now()는 비순수 함수라 컴포넌트 본문(render) 안에서 호출할 수 없다.
// 모듈 스코프는 렌더가 아니므로 여기서 한 번만 평가된다.
const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "안녕하세요! 무엇을 도와드릴까요?",
    createdAt: Date.now(),
  },
];

export default async function Home() {
  return <ChatPanel initialMessages={INITIAL_MESSAGES} />;
}