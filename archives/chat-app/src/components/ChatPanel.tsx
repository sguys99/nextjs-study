// 

// ---------------

// src/components/ChatPanel.tsx
"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageList } from "@/components/MessageList";
import { ChatInput } from "@/components/ChatInput";

export function ChatPanel() {
  const { messages, sendMessage, status, stop, error, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <div className="mx-auto flex h-[calc(100vh-57px)] max-w-2xl flex-col border-x">
      <MessageList messages={messages} status={status} />

      {error && (
        <div className="flex items-center gap-2 border-t bg-red-50 px-4 py-2 text-sm text-red-700">
          <span>문제가 발생했습니다.</span>
          <button onClick={() => regenerate()} className="underline">
            다시 시도
          </button>
        </div>
      )}

      <ChatInput
        onSend={(text) => sendMessage({ text })}
        onStop={stop}
        disabled={isBusy}
        isStreaming={isBusy}
      />
    </div>
  );
}