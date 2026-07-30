import type { Message } from "../types";

type MessageItemProps = {
    message: Message;
};

export function MessageItem({message}: MessageItemProps) {
    const isUser = message.role === "user";

    return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
          isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {message.content}
      </div>
    </div>        
    );
}