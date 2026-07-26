import type { Message } from "../types";
import { MessageItem } from "./MessageItem";
import { useAutoScroll } from "../hooks/useAutoScroll";

type MessageListProps = {
  messages: Message[];
  isThinking: boolean;
};

export function MessageList({ messages, isThinking }: MessageListProps) {
  const bottomRef = useAutoScroll(messages.length + (isThinking ? 1 : 0));

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

      {isThinking && <p className="text-sm text-gray-400">…입력 중</p>}

      {/* 스크롤 목적지 앵커 */}
      <div ref={bottomRef} />
    </div>
  );
}
