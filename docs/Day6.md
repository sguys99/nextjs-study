# Day 6 — 스트리밍 챗봇 (Vercel AI SDK): 가짜 봇이 진짜 AI로

> **소요 시간**: 약 8시간 (90분 × 4세션).
> **선행 조건**: Day 5 완료 (`chat-app`이 돌아가고 `/api/chat` stub이 있는 상태). **⚠️ Anthropic API 키 발급 완료.**
> **오늘의 목표**: Day 5의 가짜 봇을 **진짜 LLM 스트리밍**으로 바꾸고, `useChat`으로 실시간 토큰 UI를 만든 뒤, Zod로 **기본 tool calling**까지 구현한다.
>
> **태그 범례**: `🐍` Python 대비 · `💡` 팁 · `⚠️` 함정 · `🎯` 배경 · `📖` 설명용(읽기만) · `⌨️` 실습(직접 치기) · `✅` 완성본

> ⚠️ **버전 주의**: AI SDK는 버전마다 API가 크게 바뀌는 라이브러리입니다. 이 문서는 **AI SDK v6** 기준이에요. 코드가 안 되면 반드시 공식 문서 [ai-sdk.dev](https://ai-sdk.dev)에서 **현재 버전 예제**를 확인하세요. (특히 `useChat` 반환값·`tool()` 필드·모델 ID)

---

## 0. 오늘의 큰 그림 (5분)

오늘은 **개념을 배우는 날이 아니라 배선하는 날**입니다. 프롬프트·토큰·스트리밍·tool calling 개념은 이미 아니까, 새로 배우는 건 딱 두 가지예요.

1. **TS/Next.js에서 그걸 어떻게 배선하는가**
2. **AI SDK v6의 관용구** — 특히 UI로 토큰을 흘려보내는 부분

### 🎯 배경 — AI SDK가 대체 뭘 대신 해주나

LLM 스트리밍을 맨손으로 만들면 이렇게 귀찮습니다:

- 서버: Anthropic이 보내는 **SSE(Server-Sent Events) 스트림**을 받아서 청크를 이어 붙이고 도구 호출/결과/텍스트를 구분해 다시 클라이언트로 흘려보내야 함.
- 클라이언트: 그 스트림을 `ReadableStream`으로 읽어 토큰을 하나씩 화면에 붙이고 도구 호출 상태를 관리해야 함.

**Vercel AI SDK v6**가 이걸 전부 대신합니다. 서버는 `streamText(...).toUIMessageStreamResponse()` 한 줄, 클라이언트는 `useChat()` 훅 하나로 끝나요. 🐍 Python에서 `anthropic` SDK가 HTTP·SSE를 감춰주는 것과 같은 역할인데, **여기선 UI까지 이어주는 부분**이 핵심입니다.

### 0-1. 시작 전 준비 — API 키 (5분)

⚠️ [console.anthropic.com](https://console.anthropic.com)에서 키를 발급하고 **소액 크레딧**을 충전하세요. **하루 학습 비용은 보통 $1~3** 수준입니다.

⌨️ 실습 — `chat-app/.env.local` (Day 5에서 만든 파일에 실제 키 입력)

```bash
ANTHROPIC_API_KEY=sk-ant-여기에_실제_키
```

⚠️⚠️ **절대 `NEXT_PUBLIC_`을 붙이지 마세요**(Day 5 §3-3). 오늘의 모든 LLM 호출은 **서버(Route Handler)에서만** 일어납니다. 키가 브라우저로 새면 도용됩니다.

### 0-2. 오늘의 아키텍처

```
[브라우저]                        [Next.js 서버]                 [Anthropic]
ChatPanel.tsx                    app/api/chat/route.ts
  useChat() ── POST /api/chat ──▶  streamText({ model,
     ▲                              messages, tools }) ─────────▶ Claude
     │                            .toUIMessageStreamResponse()  ◀──
     └──── 토큰 스트림(SSE) ─────────────┘
                                    [도구 실행]
                                    getCurrentTime / calculate / githubUser
```

### 0-3. 오늘 바뀌는 파일

```
chat-app/src/
├── app/api/chat/route.ts     ← ⭐ stub을 진짜 LLM으로 완전 교체
├── components/
│   ├── ChatPanel.tsx         ← ⭐ useChat 도입 (대수술)
│   ├── MessageList.tsx       ← parts 모델로 개조
│   ├── MessageItem.tsx       ← parts 모델로 개조
│   ├── ToolCallCard.tsx      ← 🆕 도구 호출 표시
│   └── ChatInput.tsx         ← 거의 그대로 (IME 처리 유지)
└── lib/tools.ts              ← 🆕 도구 정의 모음
```

### 0-4. 설치

⌨️ 실습 — `chat-app/`에서

```bash
pnpm add ai @ai-sdk/react @ai-sdk/anthropic zod
```

- `ai` = AI SDK 코어(`streamText`, `tool` 등)
- `@ai-sdk/react` = `useChat` 훅
- `@ai-sdk/anthropic` = Claude 프로바이더
- `zod` = 도구 입력 스키마 (Day 3에서 배운 그것!)

---

## 1. 세션 1 (오전) — AI SDK 개요 & 연결 확인

### 1-1. 세 가지 핵심 함수

| 함수 | 언제 | 반환 |
|------|------|------|
| `generateText` | 한 번에 전체 답 (스트리밍 X) | 완성된 텍스트 |
| `streamText` | **토큰을 실시간 스트리밍** (챗봇용) | 스트림 |
| `generateObject` | **구조화된 JSON**을 Zod 스키마로 | 타입 붙은 객체 |

오늘 챗봇엔 `streamText`를 씁니다. 먼저 키가 잘 붙었는지 `generateText`로 확인해요.

### 1-2. 연결 확인 — 첫 LLM 호출

⌨️ 실습 — `chat-app/src/app/api/hello-llm/route.ts` 새 파일 (연결 확인용, 나중에 삭제 가능)

```ts
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export async function GET() {
  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-5"), // ⚠️ 모델 ID는 자주 바뀜(아래 주의)
    prompt: "한 문장으로 자기소개 해줘.",
  });
  return Response.json({ text });
}
```

⌨️ 실행 — 개발 서버(`pnpm dev`) 켠 뒤 브라우저로 `http://localhost:3000/api/hello-llm` 접속

→ Claude의 답이 JSON으로 나오면 **키·프로바이더 연결 성공**입니다. 🎉

⚠️ **모델 ID 주의**: `claude-sonnet-4-5`는 예시입니다. 모델 이름은 버전이 자주 올라가니, 에러(`model not found` 등)가 나면 **AI SDK Anthropic provider 문서 또는 Anthropic 콘솔에서 현재 Sonnet 모델 ID**를 확인해 바꾸세요.
💡 왜 Sonnet? 학습용 챗봇은 **속도·비용**이 중요합니다. Sonnet 계열이 균형이 좋아요.

---

## 2. 세션 2 (오전) — 스트리밍 채팅 완성

이제 `/api/chat` stub을 진짜로 바꾸고 클라이언트를 `useChat`으로 교체합니다.

### 2-1. 서버 — `streamText`

⌨️ 실습 — `chat-app/src/app/api/chat/route.ts` **덮어쓰기** (Day 5 stub 교체)

```ts
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, type UIMessage } from "ai";

export const maxDuration = 30; // 스트리밍이 길어질 수 있으니 여유

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    system: "너는 친절한 한국어 학습 도우미야. 간결하게 답해.",
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

💡 **세 줄만 이해하면 됩니다.**
- `convertToModelMessages(messages)`: `useChat`이 보내는 **UI 메시지**(화면용, `parts` 포함)를 **모델용 메시지**로 변환. UI용과 모델용을 분리하는 게 v6의 설계예요. (v6에서 `await` 필요)
- `system`: 시스템 프롬프트. 🐍 Anthropic SDK의 `system`과 동일.
- `toUIMessageStreamResponse()`: 스트림을 `useChat`이 알아먹는 SSE 형식으로 변환. **이 한 줄이 서버-클라이언트를 잇습니다.**

### 2-2. 클라이언트 — `useChat`으로 대수술

Day 5의 `ChatPanel`은 `useState`로 메시지를 직접 관리하고 가짜 봇을 넣었죠. 이제 **`useChat`이 메시지·요청·스트리밍을 전부 관리**합니다.

**⚠️ 큰 변화 — 메시지 구조가 `parts`로 바뀜**: `useChat`의 메시지는 우리가 Day 4에서 만든 `{id, role, text}`가 아니라, **`{id, role, parts[]}`** 구조입니다. 한 메시지가 여러 조각(텍스트, 도구 호출 등)으로 이뤄져요. 그래서 `message.text`가 아니라 **`message.parts`를 순회**해 렌더합니다.

⌨️ 실습 — `chat-app/src/components/ChatPanel.tsx` **덮어쓰기**

```tsx
"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useAutoScroll } from "../hooks/useAutoScroll";

export default function ChatPanel() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");        // 입력은 우리가 관리(useChat은 안 함)
  const bottomRef = useAutoScroll(messages);

  const handleSend = (text: string) => {
    sendMessage({ text });                        // 새 유저 메시지 전송
  };

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <div>
      <MessageList messages={messages} />
      <div ref={bottomRef} />
      {isBusy && <p className="text-sm text-gray-400">답변 생성 중…</p>}
      <ChatInput onSend={handleSend} disabled={isBusy} input={input} setInput={setInput} />
    </div>
  );
}
```

💡 `status`는 요청 상태예요: `"ready"`(대기) / `"submitted"`(보냄) / `"streaming"`(토큰 흐르는 중) / `"error"`. 이걸로 "생성 중…"을 표시하고 입력을 비활성화합니다.
⚠️ `messages`는 **`useChat`이 소유**합니다. 직접 수정하지 마세요(읽기 전용). 새 메시지는 `sendMessage`로만.

### 2-3. `MessageList` / `MessageItem`을 parts 모델로

⌨️ 실습 — `chat-app/src/components/MessageList.tsx` **덮어쓰기**

```tsx
import type { UIMessage } from "ai";
import MessageItem from "./MessageItem";

interface Props {
  messages: UIMessage[];
}

export default function MessageList({ messages }: Props) {
  return (
    <div className="flex flex-col gap-2 p-4 h-96 overflow-y-auto border rounded">
      {messages.map((m) => (
        <MessageItem key={m.id} message={m} />
      ))}
    </div>
  );
}
```

⌨️ 실습 — `chat-app/src/components/MessageItem.tsx` **덮어쓰기**

```tsx
import type { UIMessage } from "ai";
import ToolCallCard from "./ToolCallCard";

interface Props {
  message: UIMessage;
}

export default function MessageItem({ message }: Props) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "text-right" : "text-left"}>
      <div
        className={
          "inline-block rounded-lg px-3 py-2 max-w-[80%] " +
          (isUser ? "bg-blue-500 text-white" : "bg-gray-100 text-black")
        }
      >
        {/* 한 메시지가 여러 part로 구성됨 */}
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return <span key={i} className="whitespace-pre-wrap">{part.text}</span>;
          }
          // 도구 관련 part는 타입이 "tool-..."로 시작 (세션 3에서 채움)
          if (part.type.startsWith("tool-")) {
            return <ToolCallCard key={i} part={part} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}
```

⌨️ 실습 — `chat-app/src/components/ToolCallCard.tsx` 새 파일 (지금은 최소, 세션 3에서 의미 생김)

```tsx
interface Props {
  part: { type: string; state?: string; input?: unknown; output?: unknown };
}

export default function ToolCallCard({ part }: Props) {
  const toolName = part.type.replace("tool-", "");
  return (
    <div className="my-1 text-xs bg-amber-50 border border-amber-200 rounded p-2 text-left">
      🔧 <b>{toolName}</b> ({part.state ?? "?"})
      {part.output != null && (
        <pre className="mt-1 overflow-x-auto">{JSON.stringify(part.output, null, 2)}</pre>
      )}
    </div>
  );
}
```

### 2-4. `ChatInput`에 `disabled`·`input` props 추가

⌨️ 실습 — `chat-app/src/components/ChatInput.tsx` **부분 수정** (IME 처리는 유지, props만 확장)

```tsx
"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  input: string;
  setInput: (v: string) => void;
}

export default function ChatInput({ onSend, disabled, input, setInput }: Props) {
  const submit = () => {
    const t = input.trim();
    if (!t || disabled) return;
    onSend(t);
    setInput("");
  };
  return (
    <div className="flex gap-2 mt-2">
      <Input
        value={input}
        disabled={disabled}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) submit();
        }}
        placeholder="메시지를 입력하세요"
      />
      <Button onClick={submit} disabled={disabled}>전송</Button>
    </div>
  );
}
```

⌨️ 실행 — `pnpm dev` 후 채팅해 보세요. **Claude의 답이 토큰 단위로 실시간 흐르면 오늘의 1차 목표 달성!** 🎉

⚠️ 이제 우리가 Day 4에 만든 `types.ts`의 `Message` 타입은 안 씁니다(`useChat`의 `UIMessage`가 대체). 남겨둬도 무방하지만 혼동되면 지워도 됩니다.

### ✅ 세션 2 체크
- [ ] `/api/hello-llm`으로 키 연결 확인
- [ ] 토큰이 실시간 스트리밍되는 챗봇 동작
- [ ] `message.parts`를 순회해 렌더하는 이유 이해

---

## 3. 세션 3 (오후) — tool calling (에이전트의 씨앗)

**tool calling이란**: 모델이 "이 질문엔 도구가 필요해"라고 판단하면, 우리가 준 도구를 호출하고 → 결과를 관찰하고 → 다시 답을 이어가는 것. 🐍 개념은 이미 아시죠. 오늘은 **AI SDK식 배선**입니다.

### 3-1. 도구 정의 — Zod 스키마로

**쉬운 설명**: `tool({ description, inputSchema, execute })`. `description`은 **모델이 언제 이 도구를 쓸지 판단하는 근거**, `inputSchema`는 입력 모양(Zod), `execute`는 실제 실행 함수.

⌨️ 실습 — `chat-app/src/lib/tools.ts` 새 파일

```ts
import { tool } from "ai";
import { z } from "zod";

export const tools = {
  // 1) 현재 시각 — 입력 없음
  getCurrentTime: tool({
    description: "현재 날짜와 시각이 필요할 때 호출한다.",
    inputSchema: z.object({}),
    execute: async () => ({ now: new Date().toString() }),
  }),

  // 2) 안전한 사칙연산 (eval 대신 명시적 연산)
  calculate: tool({
    description: "두 수의 사칙연산이 필요할 때 호출한다.",
    inputSchema: z.object({
      a: z.number(),
      b: z.number(),
      op: z.enum(["+", "-", "*", "/"]),
    }),
    execute: async ({ a, b, op }) => {
      const table = { "+": a + b, "-": a - b, "*": a * b, "/": b === 0 ? NaN : a / b };
      return { result: table[op] };
    },
  }),

  // 3) GitHub 사용자 조회 — Day 2/3의 fetch 재등장!
  githubUser: tool({
    description: "특정 GitHub 사용자의 공개 정보(팔로워·저장소 수)가 필요할 때 호출한다.",
    inputSchema: z.object({ username: z.string() }),
    execute: async ({ username }) => {
      const res = await fetch(`https://api.github.com/users/${username}`);
      if (!res.ok) return { error: `조회 실패: ${res.status}` };
      const u = await res.json();
      return { login: u.login, followers: u.followers, public_repos: u.public_repos };
    },
  }),
};
```

💡 **`description`을 잘 쓰는 게 핵심**입니다. "무엇을 하는 함수인가"(기계 설명)가 아니라 **"언제 불러야 하는가"**(트리거 조건)로 쓰세요. 모델은 이 문장을 보고 도구 사용을 결정합니다.
💡 Day 3의 Zod가 여기서 실전 투입됐어요. `inputSchema`가 곧 모델이 채워야 할 인자 명세입니다.

### 3-2. 서버에 도구 연결 + 다단계 스텝

⌨️ 실습 — `chat-app/src/app/api/chat/route.ts` **부분 수정** (tools·stopWhen 추가)

```ts
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { tools } from "@/lib/tools";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    system: "너는 친절한 한국어 도우미야. 필요하면 도구를 사용해 정확히 답해.",
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5), // ⚠️ 다단계 루프의 상한 (필수!)
  });

  return result.toUIMessageStreamResponse();
}
```

⚠️⚠️ **`stopWhen`이 없으면 무한 루프 위험**: 도구를 주면 모델이 "도구 호출 → 결과 → 또 호출 → …"을 반복할 수 있습니다. `stopWhen: stepCountIs(5)`는 **한 답변당 도구 호출 라운드를 최대 5회로 제한**해요. 이게 없으면 모델이 잘못 돌 때 비용이 무한정 나갑니다. **도구를 쓰는 `streamText`엔 항상 `stopWhen`을 거세요.**
💡 다단계 스텝: 채팅은 5, 자율 에이전트는 10~20, "도구 한 번 쓰고 바로 답"은 1이 적당합니다.

### 3-3. 확인 — 도구가 도는지

⌨️ 실행 — `pnpm dev` 후 이렇게 물어보세요:
- "지금 몇 시야?" → `getCurrentTime` 호출
- "1234 곱하기 5678은?" → `calculate` 호출
- "torvalds의 GitHub 팔로워 수 알려줘" → `githubUser` 호출

`MessageItem`이 `tool-...` part를 만나 `ToolCallCard`(🔧 노란 카드)를 보여주고 이어서 모델이 그 결과를 보고 최종 답을 냅니다. **도구 호출 → 결과 → 최종 답변 루프**가 눈에 보이면 성공! 🎉

💡 이게 사실상 "에이전트"의 씨앗입니다. **Day 9에서 이 루프를 LangGraph의 상태 그래프로 다시 지어**, 왜 프레임워크가 필요한지 대조합니다. 오늘은 "AI SDK식으로도 도구 루프가 된다"를 몸으로 확인해 두면 돼요.

### ✅ 세션 3 체크
- [ ] Zod `inputSchema` 도구 3개 정의
- [ ] `stopWhen: stepCountIs(5)`의 필요성 이해
- [ ] 질문에 따라 알맞은 도구가 호출되고 결과가 UI에 표시됨

---

## 4. 세션 4 (오후) — 다듬기

### 4-1. 에러 처리

`useChat`은 에러가 나면 `status`가 `"error"`가 되고 멈춥니다. 사용자에게 알리고 재시도 버튼을 줍시다.

⌨️ 실습 — `ChatPanel.tsx` **부분 수정** — `error`·`regenerate` 활용

```tsx
const { messages, sendMessage, status, error, regenerate } = useChat();
// ...
{status === "error" && (
  <div className="text-sm text-red-500">
    오류가 발생했어요: {error?.message}
    <button className="underline ml-2" onClick={() => regenerate()}>
      다시 시도
    </button>
  </div>
)}
```

💡 `regenerate()`는 마지막 요청을 다시 보냅니다. `stop()`은 스트리밍을 중단해요(긴 답변 취소용). 이 둘도 `useChat`이 줍니다.

### 4-2. 시스템 프롬프트 튜닝

⌨️ 실습 — `route.ts`의 `system`을 다듬어 보세요. 예: 말투·역할·도구 사용 지침. 도구가 있을 땐 **"실제로 가진 도구만 언급하라"**를 넣으면 환각(없는 기능 주장)이 줄어듭니다.

### 4-3. (선택) 사용량/비용 로깅

⌨️ 실습 — `streamText`에 `onFinish` 추가로 토큰 사용량을 서버 콘솔에 남기기

```ts
const result = streamText({
  // ...기존 옵션...
  onFinish: ({ usage }) => {
    console.log("토큰 사용량:", usage); // 입력/출력 토큰
  },
});
```

💡 청구·비용 추적은 **스트림 청크가 아니라 `onFinish`의 `usage`**로 하세요(정확함).

---

## 5. 디버깅 실습 — "왜 도구가 한 번 돌고 답을 안 하지?"

⌨️ 상황 — `route.ts`에서 `stopWhen`을 **빼고** 도구 질문을 하면(또는 반대로 도구가 결과만 내고 최종 답을 안 하면), 이상하게 동작합니다. 무엇을 점검할까요?

<details><summary>정답 보기</summary>

**두 가지 흔한 원인:**
1. **`stopWhen` 누락/과소**: `stopWhen`이 없으면 v6는 **단일 스텝만** 실행해서 "도구 호출"까지만 하고 그 결과로 **최종 답을 생성하는 다음 스텝을 안 밟습니다.** → 도구 카드만 뜨고 답이 없음. `stopWhen: stepCountIs(5)`를 넣으면 "도구 호출 → 결과 → 최종 답" 스텝이 이어집니다.
2. **`convertToModelMessages` 누락**: `messages`를 그대로 넘기면 형식이 안 맞아 에러가 나거나 엉뚱하게 동작합니다. 반드시 `await convertToModelMessages(messages)`로 변환하세요.

교훈: **도구를 쓰면 `stopWhen`은 선택이 아니라 필수.** "도구만 돌고 답이 없다"의 90%는 여기입니다.
</details>

---

## 6. 🎯 오늘 만난 에러 읽는 법

| 메시지 | 뜻 | 해결 |
|--------|-----|------|
| `ANTHROPIC_API_KEY is missing` / `401` | 키 미설정·오타 | `.env.local` 확인, 서버 재시작 |
| `model not found` / `404` (모델) | 모델 ID가 옛것/오타 | 현재 Sonnet ID로 교체 |
| `Cannot read properties of undefined (reading 'map')` (message.parts) | 구버전 메시지 구조 가정 | v6는 `message.parts`. `message.content`(구버전) 아님 |
| 도구 카드만 뜨고 답 없음 | `stopWhen` 누락 | `stopWhen: stepCountIs(5)` |
| `429` | 요청 과다 | 잠시 후 재시도, 크레딧 확인 |

💡 서버 에러는 **터미널(`pnpm dev` 콘솔)**, 클라이언트 에러는 **브라우저 DevTools 콘솔**에 뜹니다. 둘 다 보세요.

---

## 7. ✅ Day 6 최종 체크리스트

- [ ] `/api/hello-llm`으로 키·프로바이더 연결 확인
- [ ] `streamText` + `convertToModelMessages` + `toUIMessageStreamResponse` 이해
- [ ] `useChat`의 `messages`/`parts`/`sendMessage`/`status` 사용
- [ ] 실시간 토큰 스트리밍 챗봇 동작
- [ ] Zod `inputSchema` 도구 3개 + `stopWhen: stepCountIs(5)`
- [ ] 도구 호출 → 결과 → 최종 답변 루프를 UI에서 확인
- [ ] 에러 상태 + `regenerate()` 처리
- [ ] 디버깅 실습에서 "stopWhen 누락" 증상 이해

---

## 8. git 커밋

⌨️ 실습 — `chat-app/`에서

```bash
git add .
git commit -m "Day 6: AI SDK v6 스트리밍 챗봇 + tool calling(getCurrentTime/calculate/githubUser)"
```

⚠️ `.env.local`이 커밋에 포함되지 않았는지 확인하세요(`.gitignore`에 있어야 함).

---

## 9. Day 7 미리보기

내일은 **RAG의 원리를 직접 구현**합니다. 프레임워크 없이 손으로 짜서 개념을 눈으로 봐요.

- 문서 청킹 → 임베딩(`embedMany`) → JS 배열에 저장 → JSON 영속화
- **코사인 유사도를 직접 구현**해 top-k 검색 (🐍 numpy dot/norm을 TS로)
- Day 8에서 이걸 LangChain.js로 교체해 "라이브러리가 뭘 대신 해주나" 대조

💡 시작할 때 로드맵을 붙이고 **"Day 7 상세 자료 만들어줘"**라고 요청하세요.

---

## 부록 — Python(anthropic) ↔ AI SDK v6 치트시트

| 개념 | 🐍 Python(anthropic SDK) | 🟨 AI SDK v6 |
|------|--------------------------|--------------|
| 프로바이더/모델 | `Anthropic()`, `model="..."` | `anthropic("claude-sonnet-...")` |
| 한 번에 생성 | `messages.create(...)` | `generateText({...})` |
| 스트리밍 | `messages.stream(...)` | `streamText({...})` |
| 구조화 출력 | (수동 파싱) | `generateObject({ schema })` |
| 시스템 프롬프트 | `system=...` | `system: "..."` |
| 도구 정의 | `tools=[{...}]` | `tool({ description, inputSchema, execute })` |
| 도구 스키마 | JSON Schema/pydantic | Zod `z.object` |
| 다단계 루프 | 직접 while 루프 | `stopWhen: stepCountIs(N)` |
| UI 연결 | (직접 배선) | `useChat()` + `toUIMessageStreamResponse()` |

가짜 봇이 진짜 AI가 됐습니다. 내일은 여기에 "문서를 아는 능력"(RAG)을 더합니다. 🟨
