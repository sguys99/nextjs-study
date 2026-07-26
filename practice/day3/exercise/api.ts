// exercise/api.ts
// Day 2의 fetch 헬퍼가 제네릭으로 진화

export async function fetchJson<T>(url: string): Promise<T>{
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) {
    // Day 2에서 배운 것: fetch는 404/500에 throw하지 않는다 — 직접 확인!
    throw new Error(`HTTP ${res.status}: ${url}`);
  }
  return (await res.json()) as T;
}