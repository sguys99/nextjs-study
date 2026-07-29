// src/components/ChatInput.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatInputProps = {
  onSend: (text: string) => void;
  onStop?: () => void;      // 🆕 스트리밍 중단
  disabled?: boolean;       // 입력/전송 잠금
  isStreaming?: boolean;    // 🆕 true면 전송 버튼 대신 중단 버튼
};

export function ChatInput({
  onSend,
  onStop,                   // 🆕 ⚠️ 타입에만 추가하고 여기서 빼먹기 쉽다
  disabled = false,
  isStreaming = false,      // 🆕
}: ChatInputProps) {
  const [text, setText] = useState("");
  const canSend = text.trim() !== "" && !disabled;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };

  // ⚠️ 한글 IME 함정: 조합 중 Enter는 "글자 확정"이지 "전송"이 아니다.
  //    keydown에서 막아야 form의 암묵적 submit까지 함께 취소된다.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.nativeEvent.isComposing) {
      e.preventDefault();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요"
        className="flex-1"
        disabled={disabled}
      />

      {/* 🆕 스트리밍 상태에 따라 버튼이 갈린다 */}
      {isStreaming ? (
        <Button type="button" variant="outline" onClick={onStop}>
          중단
        </Button>
      ) : (
        <Button type="submit" disabled={!canSend}>
          전송
        </Button>
      )}
    </form>
  );
}