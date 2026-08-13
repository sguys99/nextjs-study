"use client";

import { useState } from "react";
import type { Message } from "@/types";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useAutoScroll } from "../hooks/useAutoScroll";

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]); // 제네릭 타입 인자와 초기값
  const bottomRef = useAutoScroll(messages); // 메시지가 늘어나면 대화창 아래로 자동 스크롤, bottomRef는 어디가 맨 아래인지 표시

  const handleSend = (text: string) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);

    // 아직은 가짜 응답 (Day 6에서 /api/chat 스트리밍으로 교체)
    const botMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      text: `"${text}" 라고 하셨네요! (Day 6에서 진짜 AI로)`,
    };
    setMessages((prev) => [...prev, botMsg]);
  };

  return (
    <div>
      {/* bottomRef를 넘겨서, 스크롤되는 상자 "안"에 표식을 놓게 한다 */}
      <MessageList messages={messages} bottomRef={bottomRef} />
      <ChatInput onSend={handleSend} />
    </div>
  );
}
