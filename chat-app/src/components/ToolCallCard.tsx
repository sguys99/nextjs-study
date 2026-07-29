// src/components/ToolCallCard.tsx
type ToolCallCardProps = {
  toolName: string;
  state: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

const LABELS: Record<string, string> = {
  getCurrentTime: "🕐 시각 조회",
  calculate: "🧮 계산",
  getGithubUser: "🐙 GitHub 조회",
};

export function ToolCallCard({
  toolName,
  state,
  input,
  output,
  errorText,
}: ToolCallCardProps) {
  const label = LABELS[toolName] ?? `🔧 ${toolName}`;

  return (
    <div className="rounded-lg border border-gray-200 bg-white/60 p-2 text-xs">
      <div className="flex items-center gap-2 font-medium text-gray-700">
        <span>{label}</span>
        {(state === "input-streaming" || state === "input-available") && (
          <span className="text-gray-400">실행 중…</span>
        )}
        {state === "output-available" && <span className="text-green-600">완료</span>}
        {state === "output-error" && <span className="text-red-600">실패</span>}
      </div>

      {input != null && (
        <pre className="mt-1 overflow-x-auto text-gray-500">
          입력: {JSON.stringify(input)}
        </pre>
      )}
      {output != null && (
        <pre className="mt-1 overflow-x-auto text-gray-500">
          결과: {JSON.stringify(output)}
        </pre>
      )}
      {errorText && <p className="mt-1 text-red-600">{errorText}</p>}
    </div>
  );
}