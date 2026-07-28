// src/components/ChatPanel.tsx   ← 상태를 가진 클라이언트 컴포넌트
"use client";

import { useState } from "react";
import type { Message } from "@/types";
import { MessageList } from "@/components/MessageList";
import { ChatInput } from "@/components/ChatInput";

type ChatPanelProps = {
  initialMessages?: Message[];
};

export function ChatPanel({ initialMessages = [] }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = async (text: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    // 어시스턴트 메시지를 빈 껍데기로 먼저 추가하고, 스트리밍으로 채워나간다
    const replyId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: replyId, role: "assistant", content: "", createdAt: Date.now() },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok || !res.body) throw new Error(`요청 실패: ${res.status}`);

      // ⭐ Day 2에서 배운 fetch + Day 5 세션 3의 ReadableStream이 만나는 지점
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId ? { ...m, content: m.content + chunk } : m,
          ),
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === replyId ? { ...m, content: `⚠️ ${msg}` } : m,
        ),
      );
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-57px)] max-w-2xl flex-col border-x">
      <MessageList messages={messages} isThinking={isThinking} />
      <ChatInput onSend={handleSend} disabled={isThinking} />
    </div>
  );
}