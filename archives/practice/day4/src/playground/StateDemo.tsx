// props — 컴포넌트의 입력 인자 (TS로 타이핑)
// props는 부모가 자식에게 내려주는 읽기 전용 데이터입니다. 
// Day 3의 type이 여기서 즉시 실전 투입됩니다.

type RunCardProps = {
  label: string;
  accuracy: number;
  highlight?: boolean; // 옵셔널 (Day 3 세션 2)
};

export function RunCard({ label, accuracy, highlight=false}: RunCardProps){
    return (
    <div className={`rounded-lg border p-3 ${highlight ? "bg-yellow-50" : ""}`}>
      <span className="font-medium">{label}</span>{" "}
      <span>{(accuracy * 100).toFixed(1)}%</span>
    </div>
    );
}

// 부모에서 사용
<RunCard label="resnet" accuracy={0.93} highlight />

// ------------------------------
// 2-2. useState — 재실행을 넘어 살아남는 값

import {useState} from "react"

export function Counter() {
    const [count, setCount] = useState(0);

  return (
    <div className="p-4">
      <p>count: {count}</p>
      <button
        className="rounded bg-blue-600 px-3 py-1 text-white"
        onClick={() => setCount(count + 1)}
      >
        +1
      </button>
    </div>
  );    
}

// TS 타이핑: 초깃값에서 자동 추론되지만, 빈 배열/null로 시작할 땐 제네릭을 명시해야 합니다. 
// const [count, setCount] = useState(0);                  // number로 추론
// const [text, setText] = useState("");                   // string으로 추론
// const [messages, setMessages] = useState<Message[]>([]); // ⭐ 명시 필요
// const [user, setUser] = useState<User | null>(null);     // ⭐ 명시 필요

// 상태는 스냅셧이다.

// const handleClick = () => {
//   setCount(count + 1);
//   console.log(count); // ⚠️ 여전히 옛날 값! (0을 눌렀다면 0)
// };

//count는 이번 렌더에 고정된 상수입니다. setCount는 "다음 렌더 때 이 값으로 시작해줘"라는 예약일 뿐, 
// 현재 실행 중인 함수의 count를 바꾸지 않습니다.

// setCount(count + 1);
// setCount(count + 1); // ⚠️ 결과: +1 (둘 다 같은 스냅샷을 봄)

// setCount((c) => c + 1);
// setCount((c) => c + 1); // ✅ 결과: +2 (직전 결과를 받아서 계산)

// 💡 실전 규칙: 이전 값을 기반으로 갱신할 땐 항상 set(prev => ...) 형태를 쓰세요. 오늘 채팅 실습의 setMessages((prev) => [...prev, msg])가 정확히 이 이유입니다.

//-------------------------------
// 2-3. 이벤트 핸들링 & 제어 컴포넌트(controlled input)
export function NameForm() {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // ⚠️ 없으면 페이지가 새로고침됩니다
    alert(`제출: ${text}`);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4">
      <input
        className="rounded border px-2 py-1"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit">전송</button>
    </form>
  );
}

// 핸들러는 함수 자체를 넘겨야함
//<button onClick={handleClick}>   {/* ✅ 함수 참조 */}
//<button onClick={() => save(id)}> {/* ✅ 인자 필요하면 화살표로 감싸기 */}
//<button onClick={handleClick()}>  ❌ 렌더 즉시 실행되고 반환값이 등록됨


//--------------------------------------
// 2.4 불변 업데이트
// ❌ 화면이 안 바뀜
// messages.push(newMessage);
// setMessages(messages);

// // ✅ 새 배열을 만들어서 넘김
// setMessages([...messages, newMessage]);
// setMessages((prev) => [...prev, newMessage]); // ⭐ 권장형

// 2.5 상태 끌어 올리기

