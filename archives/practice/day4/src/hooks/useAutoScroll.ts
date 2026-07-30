import { useEffect, useRef } from "react";

/** 지정한 값이 바뀔 때마다 반환된 ref가 붙은 요소로 스크롤한다. */
export function useAutoScroll(trigger: number) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [trigger]);

  return bottomRef;
}