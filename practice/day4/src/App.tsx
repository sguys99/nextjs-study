// import JsxDemo from "./playground/JsxDemo";
// import StateDemo from "./playground/StateDemo";
// import EffectDemo from "./playground/EffectDemo";

// function App() {
//   return (
//     <div className="p-8">
//       <JsxDemo />
//       <StateDemo />
//       <EffectDemo />
//     </div>
//   );
// }

// export default App;

// 4-6

import { useState } from "react";
import type { Message } from "./types";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import { useAutoScroll } from "./hooks/useAutoScroll";

function App() {
  const [messages, setMessages] = useState<Message[]>([]);   // 제네릭!
  const bottomRef = useAutoScroll(messages);                 // 메시지 변할 때 스크롤

  const handleSend = (text: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text,
    };
    // 불변 업데이트 + 함수형 업데이트 (Day 1 + §2)
    setMessages((prev) => [...prev, userMsg]);  

    // (가짜) 봇 응답 — Day 6에서 진짜 LLM으로 교체
    const botMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: `"${text}" 라고 하셨네요! (아직 진짜 AI는 아니에요)`,
    };
    setMessages((prev) => [...prev, botMsg]);
  };
  
  
  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-xl font-bold mb-4">내 채팅 앱</h1>
      {/* 스크롤 목표 지점(빈 div)은 MessageList 안, 스크롤 상자 내부에 있습니다 (§4-5) */}
      <MessageList messages={messages} bottomRef={bottomRef} />
      <ChatInput onSend={handleSend} />
    </div>
  );
}

export default App;  