import { useState } from "react";

// function StateDemo() {
//   // useState(0) → [0, ƒ] 를 반환. 두 칸을 구조 분해로 꺼내 이름을 붙인다
//   // count / setCount 는 React가 정한 이름이 아니라 내가 지은 이름
//   const [count, setCount] = useState(0);   // 0 = 첫 렌더에서만 쓰이는 초깃값

//   return (
//     <div>
//       <p>카운트: {count}</p>
//       <button
//         className="border px-3 py-1 rounded"
//         onClick={() => setCount(count + 1)}
//       >
//         +1 {/* 버튼에 표시되는 글자. 여기 주석은 이 형태여야 함 — §1-2 ⑤ */}
//       </button>
//     </div>
//   );
// }

// 연습문제

function StateDemo() {
  const [text, setText] = useState("");
  return (
    <div>
      <input
        className="border px-2 py-1"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <p>입력: {text}</p>
    </div>
  );
}

export default StateDemo;
