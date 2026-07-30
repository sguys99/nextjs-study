// // 

// // ---------------------

// // src/components/MessageItem.tsx
// // import type { UIMessage } from "ai";

// // type MessageItemProps = { message: UIMessage };

// // export function MessageItem({ message }: MessageItemProps) {
// //   const isUser = message.role === "user";

// //   return (
// //     <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
// //       <div
// //         className={`max-w-[80%] space-y-2 rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
// //           isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
// //         }`}
// //       >
// //         {message.parts.map((part, i) => {
// //           if (part.type === "text") {
// //             return <span key={i}>{part.text}</span>;
// //           }
// //           return null; // 도구 파트는 세션 3에서 처리
// //         })}
// //       </div>
// //     </div>
// //   );
// // }

// // ---------
// // day 6

// // src/components/MessageItem.tsx
// import type { UIMessage } from "ai";
// import { ToolCallCard } from "@/components/ToolCallCard";
// import { SourceList, type SourceItem } from "@/components/SourceList";   // 🆕 day7

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

//           // 🆕 day7: RAG 검색 도구만 ToolCallCard 대신 출처 목록으로 표시
//           if (part.type === "tool-searchKnowledgeBase") {
//             const p = part as unknown as {
//               state: string;
//               output?: { found: boolean; results: SourceItem[] };
//             };

//             if (p.state !== "output-available") {
//               return (
//                 <p key={i} className="text-xs text-gray-400">
//                   📚 학습 자료를 검색하는 중…
//                 </p>
//               );
//             }
//             return <SourceList key={i} results={p.output?.results ?? []} />;
//           }

//           // "tool-calculate" 처럼 도구 이름이 타입에 붙어서 온다
//           if (part.type.startsWith("tool-")) {
//             const p = part as unknown as {
//               type: string;
//               state: string;
//               input?: unknown;
//               output?: unknown;
//               errorText?: string;
//             };
//             return (
//               <ToolCallCard
//                 key={i}
//                 toolName={p.type.slice("tool-".length)}
//                 state={p.state}
//                 input={p.input}
//                 output={p.output}
//                 errorText={p.errorText}
//               />
//             );
//           }

//           return null;   // reasoning·file 등 아직 안 그리는 파트
//         })}
//       </div>
//     </div>
//   );
// }

// -------------
// 7-3
// src/components/MessageItem.tsx
import type { UIMessage } from "ai";
import { ToolCallCard } from "@/components/ToolCallCard";
import { SourceList, type SourceItem } from "@/components/SourceList";   // 🆕

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

          // 🆕 RAG 검색 도구만 ToolCallCard 대신 출처 목록으로
          if (part.type === "tool-searchKnowledgeBase") {
            const p = part as unknown as {
              state: string;
              output?: { found: boolean; results: SourceItem[] };
            };

            if (p.state !== "output-available") {
              return (
                <p key={i} className="text-xs text-gray-400">
                  📚 학습 자료를 검색하는 중…
                </p>
              );
            }
            return <SourceList key={i} results={p.output?.results ?? []} />;
          }

          // 나머지 도구는 기존 ToolCallCard로 (Day 6 그대로)
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

          return null;
        })}
      </div>
    </div>
  );
}