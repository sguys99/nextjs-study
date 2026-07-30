// 
// -------------------------

"use client";

import type { UIMessage } from "ai";
import { MessageItem } from "@/components/MessageItem";
import { useAutoScroll } from "@/hooks/useAutoScroll";

type MessageListProps = {
  messages: UIMessage[];
  status: string;
};

export function MessageList({ messages, status }: MessageListProps) {
  // Day 4에서 만든 훅을 그대로 재사용. 스트리밍 중에도 따라가도록 길이 합산.
  const totalParts = messages.reduce((sum, m) => sum + m.parts.length, 0);
  const bottomRef = useAutoScroll(messages.length + totalParts);

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.length === 0 && (
        <p className="pt-10 text-center text-sm text-gray-400">
          메시지를 입력해 대화를 시작하세요.
        </p>
      )}

      {messages.map((m) => (
        <MessageItem key={m.id} message={m} />
      ))}

      {status === "submitted" && (
        <p className="text-sm text-gray-400">…생각 중</p>
      )}

      <div ref={bottomRef} />
    </div>
  );
}