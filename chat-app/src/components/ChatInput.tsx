//"use client"
//import { useState } from "react";
// import { Button } from "@base-ui/react";
// import { Input } from "@base-ui/react";



interface Props {
  onSend: (text: string) => void;   // 부모가 내려준 "다 되면 이걸 불러" 함수 (콜백)
}

// function ChatInput({onSend}: Props){
//     const [text, setText] = useState("");

//     const submit = () => {
//         const trimmed = text.trim();
//         if (!trimmed) return; // 빈입력 무시
//         onSend(trimmed);  // 부모에게 넘김 — 여기서 내 일은 끝
//         setText("") // 전송 후 입력창 비우기
//     };

//     return (
//     <div className="flex gap-2 mt-2">
//       <input
//         className="flex-1 border rounded px-3 py-2"
//         value={text}                                  // ① 보여줄 값은 state에서 온다
//         onChange={(e) => setText(e.target.value)}     // ② 글자가 바뀌면 state를 갱신
//         onKeyDown={(e) => {
//           // ⚠️ 한글 조합 중(isComposing)의 Enter는 "글자 확정"용이라 무시해야 한다
//           if (e.key === "Enter" && !e.nativeEvent.isComposing) {
//             submit();
//           }
//         }}
//         placeholder="메시지를 입력하세요"
//       />
//       {/* onClick={submit} — 괄호 없이! 괄호를 붙이면 렌더 중에 즉시 실행된다 */}
//       <button className="border rounded px-4 py-2" onClick={submit}>
//         전송
//       </button>
//     </div>        
//     )
// }

// export default ChatInput;

// // 키 입력 → onChange 발동 → setText("한") → 리렌더 → value="한" → 화면에 "한"

// 4-3. shadcn/ui 도입 (Day 4에서 미룬 것)

// chat-app/src/components/ChatInput.tsx
// "use client" 없음 — 부모 ChatPanel이 이미 검문소라 자동 전파됩니다 (4-2-1 참고)
import { useState } from "react";
import { Button } from "@/components/ui/button"; // shadcn이 생성해 준 "내 코드"
import { Input } from "@/components/ui/input";   // = src/components/ui/input.tsx

interface Props {
  onSend: (text: string) => void; // 부모가 내려준 "다 되면 이걸 불러" 함수 (콜백)
}

export default function ChatInput({ onSend }: Props) {
  const [text, setText] = useState("");

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return; // 빈 입력 무시
    onSend(trimmed);      // 부모에게 넘김 — 여기서 내 일은 끝
    setText("");          // 전송 후 입력창 비우기
  };

  return (
    <div className="flex gap-2 mt-2">
      <Input
        className="flex-1"                        // 배치만 내가 지정, 외형은 Input에 맡김
        value={text}                              // ① 보여줄 값은 state에서 온다
        onChange={(e) => setText(e.target.value)} // ② 글자가 바뀌면 state를 갱신
        onKeyDown={(e) => {
          // ⚠️ 한글 조합 중(isComposing)의 Enter는 "글자 확정"용이라 무시해야 한다
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            submit(); // 위에 정의됨
          }
        }}
        placeholder="메시지를 입력하세요"
      />
      {/* onClick={submit} — 괄호 없이! 괄호를 붙이면 렌더 중에 즉시 실행된다 */}
      <Button onClick={submit}>전송</Button>
    </div>
  );
}