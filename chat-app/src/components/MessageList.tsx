import type { RefObject } from "react"; // ← 추가: ref의 "타입"만 가져옴
import type { Message } from "../types";
import MessageItem from "./MessageItem";

interface Props {
  messages: Message[];
  bottomRef: RefObject<HTMLDivElement | null>; // ← 추가: 부모가 만든 ref를 받는다
}

function MessageList({ messages, bottomRef }: Props) {
  return (
    // 이 div = 말풍선들을 담는 스크롤 상자. 클래스 뜻은 아래 표 참고
    <div className="flex flex-col gap-2 p-4 h-96 overflow-y-auto border rounded">
      {/* { } 안은 JS 영역 → 배열을 map으로 "JSX 배열"로 바꾸면 React가 알아서 나열해 그린다 */}

      {messages.length === 0 && (
        <p className="text-gray-400">
          아직 메시지가 없습니다. 아래에 입력해 보세요.
        </p>
      )}

      {messages.map((m) => (
        // key = React가 항목을 구별하는 이름표. 인덱스 말고 고유 id를 쓴다
        <MessageItem key={m.id} message={m} />
      ))}

      {/* 스크롤 목적지 표식. overflow-y-auto 상자 "안"에 있어야 이 상자가 굴러간다 */}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
