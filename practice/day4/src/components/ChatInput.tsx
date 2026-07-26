import { useState } from "react";

type ChatInputProps = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [text, setText] = useState("");
  const canSend = text.trim() !== "" && !disabled;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
      <input
        className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="메시지를 입력하세요"
      />
      <button
        type="submit"
        disabled={!canSend}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        전송
      </button>
    </form>
  );
}