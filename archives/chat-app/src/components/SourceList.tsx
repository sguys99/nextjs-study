// src/components/SourceList.tsx
export type SourceItem = {
  source: string;
  heading: string;
  score: number;
  text: string;
};

export function SourceList({ results }: { results: SourceItem[] }) {
  if (results.length === 0) {
    return <p className="text-xs text-gray-400">관련 문서를 찾지 못했습니다.</p>;
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500">📚 참고한 자료</p>
      {results.map((r, i) => (
        <details
          key={i}
          className="rounded border border-gray-200 bg-white/70 px-2 py-1 text-xs"
        >
          <summary className="cursor-pointer text-gray-700">
            {r.source} <span className="text-gray-400">›</span> {r.heading}
            <span className="ml-2 text-gray-400">{r.score.toFixed(2)}</span>
          </summary>
          <p className="mt-1 whitespace-pre-wrap text-gray-500">
            {r.text.slice(0, 400)}…
          </p>
        </details>
      ))}
    </div>
  );
}