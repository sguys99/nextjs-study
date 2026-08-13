import { useEffect, useRef } from "react";

// dep가 바뀔 때마다, ref가 가리키는 요소가 보이도록 스크롤한다
export function useAutoScroll(dep: unknown) {
  // <HTMLDivElement> = "이 상자엔 div 하나가 들어온다"는 타입 (제네릭, Day 3)
  // 초깃값 null = 아직 화면에 안 붙어서 가리킬 게 없음
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // ?. = current가 null이면 조용히 넘어감 (옵셔널 체이닝, Day 3)
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [dep]);   // dep가 "이전과 다른 값"이 되면 다시 실행

  return ref;   // 쓰는 쪽이 이 ref를 원하는 요소에 붙인다
}

// 확장자가 .tsx가 아니라 .ts 인 이유: 이 파일엔 JSX(<div> 같은 태그)가 한 줄도 없기 때문