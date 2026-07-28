// src/components/ClientBox.tsx
"use client";
import { useState } from "react";

export function ClientBox() {
  console.log("🌐 브라우저에서 실행됨:", new Date().toISOString());
  const [n, setN] = useState(0);

  return (
    <button
      onClick={() => setN(n + 1)}
      className="rounded-lg border px-3 py-1 text-sm"
    >
      클릭 수: {n}
    </button>
  );
}