import type { Message } from "../types";

interface Props {
  message: Message; // 리액트 컴포넌트는 하나의 인자만 받을수 있어서 감싼다...
}

function MessageItem({ message }: Props) {
  const isUser = message.role === "user"; // 유저 메시지 인지 확인

  return (
    // 바깥 div = 정렬 담당. 내 말풍선은 오른쪽, 상대는 왼쪽
    <div className={isUser ? "text-right" : "text-left"}>
      {" "}
      {/* 사용자 메시지 면 오측 정렬 */}
      <span
        className={
          "inline-block rounded-lg px-3 py-2 " + // ⚠️ 끝의 공백 필수!
          (isUser ? "bg-blue-500 text-white" : "bg-gray-200 text-black")
        }
      >
        {message.text} {/* { } = 여기부터 JS 값 */}
      </span>
    </div>
  );
}

export default MessageItem;
