import { useState, useEffect } from "react";

function EffectDemo() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((prev) => prev + 1);   // 함수형 업데이트!
    }, 1000);

    return () => clearInterval(id);      // 클린업: 타이머 정리
  }, []);                                // 처음 한 번만 타이머 시작

  return <p>경과: {seconds}초</p>;
}

export default EffectDemo;