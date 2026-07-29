// 

// ---------------------

// src/components/MessageItem.tsx
// import type { UIMessage } from "ai";

// type MessageItemProps = { message: UIMessage };

// export function MessageItem({ message }: MessageItemProps) {
//   const isUser = message.role === "user";

//   return (
//     <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
//       <div
//         className={`max-w-[80%] space-y-2 rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
//           isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
//         }`}
//       >
//         {message.parts.map((part, i) => {
//           if (part.type === "text") {
//             return <span key={i}>{part.text}</span>;
//           }
//           return null; // 도구 파트는 세션 3에서 처리
//         })}
//       </div>
//     </div>
//   );
// }

// ---------
// day 6

// src/components/MessageItem.tsx
import type { UIMessage } from "ai";
import { ToolCallCard } from "@/components/ToolCallCard";   // 🆕

type MessageItemProps = { message: UIMessage };

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] space-y-2 rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
          isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return <span key={i}>{part.text}</span>;
          }

          // 🆕 "tool-calculate" 처럼 도구 이름이 타입에 붙어서 온다
          if (part.type.startsWith("tool-")) {
            const p = part as unknown as {
              type: string;
              state: string;
              input?: unknown;
              output?: unknown;
              errorText?: string;
            };
            return (
              <ToolCallCard
                key={i}
                toolName={p.type.slice("tool-".length)}
                state={p.state}
                input={p.input}
                output={p.output}
                errorText={p.errorText}
              />
            );
          }

          return null;   // reasoning·file 등 아직 안 그리는 파트
        })}
      </div>
    </div>
  );
}