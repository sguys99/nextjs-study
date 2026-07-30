import { useState } from "react";
import type { Message } from "./types";
import { MessageList } from "./components/MessageList";
import { ChatInput } from "./components/ChatInput";

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = (text: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    // ⭐ Day 6에서 이 setTimeout이 진짜 LLM 스트리밍 호출로 바뀝니다
    setTimeout(() => {
      const reply: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `(가짜 응답) "${text}" 라고 하셨군요.`,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
      setIsThinking(false);
    }, 700);
  };

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col border-x">
      <header className="border-b p-4 font-semibold">Day 4 Chat</header>
      <MessageList messages={messages} isThinking={isThinking} />
      <ChatInput onSend={handleSend} disabled={isThinking} />
    </div>
  );
}

export default App;