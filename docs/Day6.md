# Day 6 — 프로젝트 ① 스트리밍 챗봇 → 도구를 쓰는 에이전트

> **소요 시간**: 8시간 (90분 학습 + 15분 휴식 × 4세션)
> **선행 조건**: Day 5 완료 (`chat-app`이 돌아가고, `/api/chat`에서 가짜 스트리밍이 나오는 상태). **Anthropic API 키 발급 완료.**
> **목표**: Vercel AI SDK v6로 진짜 LLM 스트리밍 챗봇을 완성하고, **tool calling**으로 에이전트까지 확장한다.
> **핵심 태그**: 🐍 = 파이썬 대비 포인트 · 💡 = 팁 · ⚠️ = 함정

---

## 0. 오늘의 목적 & 시작 전 준비

오늘은 **개념을 배우는 날이 아니라 배선하는 날**입니다.

로드맵에 적어둔 대로, 당신은 프롬프트·토큰·스트리밍·tool calling·에이전트 루프의 **개념을 이미 알고 있습니다.** 파이썬으로 `anthropic` SDK를 써봤다면 더더욱이요. 그러니 오늘 새로 배우는 건 딱 두 가지입니다.

1. **TypeScript/Next.js에서 그걸 어떻게 배선하는가**
2. **AI SDK v6의 관용구** — 특히 UI로 흘려보내는 부분

### 0-1. 시작 전 체크 (5분)

```bash
cd chat-app
cat .env.local        # ANTHROPIC_API_KEY=sk-ant-... 가 있는지
pnpm dev              # 어제 앱이 정상 동작하는지
```

⚠️ 키가 없다면 [console.anthropic.com](https://console.anthropic.com)에서 발급하고 소액 크레딧을 충전하세요. **하루 학습 비용은 보통 $1~3 수준**입니다.

⚠️⚠️ 다시 한 번: `.env.local`의 키에 **`NEXT_PUBLIC_`을 붙이면 안 됩니다.** 오늘 만드는 모든 LLM 호출은 **서버(Route Handler)에서만** 일어납니다.

### 0-2. 오늘의 아키텍처

```
[브라우저]                          [Next.js 서버]              [Anthropic]
ChatPanel.tsx                      app/api/chat/route.ts
  useChat()  ──── POST /api/chat ──▶  streamText({              
     ▲                                  model, messages, tools   ──▶ Claude
     │                                })                         ◀──
     └──── 토큰 스트림 (SSE) ──────────  toUIMessageStreamResponse()
                                          │
                                     [도구 실행]
                                     getCurrentTime / calculate / githubUser
```

### 0-3. 저장소 구조 (오늘 추가분)

```
chat-app/src/
├── app/
│   ├── page.tsx
│   └── api/chat/route.ts        ← ⭐ 오늘 완전히 교체됨
├── components/
│   ├── ChatPanel.tsx            ← ⭐ 오늘 대수술 (useChat 도입)
│   ├── MessageList.tsx          ← parts 모델로 개조
│   ├── MessageItem.tsx          ← parts 모델로 개조
│   ├── ToolCallCard.tsx         ← 🆕 도구 호출 표시
│   └── ChatInput.tsx            ← 거의 그대로
├── lib/
│   └── tools.ts                 ← 🆕 도구 정의 모음
└── scripts/
    └── hello-ai.ts              ← 🆕 SDK 감 잡기용 CLI 스크립트
```

---

## 1. 세션 1 (오전) — AI SDK 개요 & 첫 호출

### 1-1. 설치

```bash
cd chat-app
pnpm add ai @ai-sdk/react @ai-sdk/anthropic zod
pnpm add -D tsx
```

| 패키지 | 역할 | 어디서 씀 |
|---|---|---|
| `ai` | 코어 — `streamText`, `tool`, `Output` 등 | 서버 |
| `@ai-sdk/anthropic` | Claude 프로바이더 | 서버 |
| `@ai-sdk/react` | `useChat` 등 React 훅 | 클라이언트 |
| `zod` | 도구 입력 스키마 | 서버 |
| `tsx` | TS 파일을 바로 실행 (개발용) | CLI 실습 |

🐍 `tsx`는 파이썬의 `python script.py`에 해당합니다. TS를 컴파일 없이 바로 돌려줘요.

#### 잠깐 — `@ai-sdk`가 뭔가요?

`@`로 시작하는 앞부분은 npm의 **스코프(scope)**, 즉 네임스페이스입니다.

```
@ai-sdk / react
└─스코프┘ └패키지┘
```

🐍 파이썬으로 치면 `ai_sdk.react` 같은 묶음 접두사예요. 파이썬엔 공식 문법이 없어서 `google-cloud-storage`, `google-cloud-bigquery`처럼 하이픈으로 흉내 내지만, npm은 이걸 언어 차원에서 지원합니다. 효과는 두 가지:

- **이름 충돌 방지** — `react`는 이미 Meta가 쓰고 있죠. `@ai-sdk/react`는 완전히 다른 패키지입니다.
- **소유권 표시** — `@ai-sdk` 스코프에 게시할 수 있는 건 Vercel 팀뿐입니다.

즉 위 표의 **`ai` + `@ai-sdk/*`가 전부 한 덩어리의 "Vercel AI SDK"**입니다. 코어만 스코프 없는 `ai`인 이유는 초기에 그 이름을 선점했기 때문이고, 이후 확장 패키지들을 `@ai-sdk` 스코프로 정리한 거예요.

⚠️ **`@ai-sdk/anthropic`은 Anthropic이 만든 게 아닙니다.** Vercel이 만든 "Claude를 AI SDK 인터페이스에 꽂는 어댑터"예요. Anthropic 공식 SDK는 `@anthropic-ai/sdk`(🐍 파이썬 `anthropic`에 대응)로 스코프 자체가 다릅니다.

**왜 프레임워크별로 쪼개져 있나?**

```
@ai-sdk/react   ← useChat  (우리가 쓰는 것)
@ai-sdk/vue
@ai-sdk/svelte
@ai-sdk/angular
```

코어 `ai`는 프레임워크에 의존하지 않는 순수 로직만 담고, "상태를 어떻게 관리하고 리렌더링을 언제 트리거할지"는 프레임워크마다 다르니 따로 뺀 구조입니다. 위 표의 "어디서 씀" 칸이 서버/클라이언트로 갈리는 것도 이 때문 — `@ai-sdk/react`만 `"use client"` 쪽에서 import 합니다.

### 1-2. ⚠️ v5 → v6 변경표 — 이걸 모르면 온종일 삽질합니다

인터넷 예제와 블로그의 **절대다수가 아직 v5 기준**입니다. 이름이 바뀐 것들을 먼저 머리에 넣으세요.

| v5 (옛날 예제) | **v6 (우리가 쓰는 것)** |
|---|---|
| `generateObject` / `streamObject` | `generateText` / `streamText` + `Output.object()` |
| 도구의 `parameters:` | **`inputSchema:`** ⭐ |
| 도구 실행 결과 `result` | `output` |
| `maxSteps: 5` | **`stopWhen: stepCountIs(5)`** ⭐ |
| `CoreMessage` | `ModelMessage` |
| `convertToModelMessages(msgs)` (동기) | **`await convertToModelMessages(msgs)`** (비동기) ⭐ |
| `Experimental_Agent` | `ToolLoopAgent` (클래스) |
| 에이전트의 `system:` | `instructions:` |
| `agent.generateText()` | `agent.generate()` |
| `message.content` (문자열) | **`message.parts` (배열)** ⭐⭐ |

💡 **막히면**: `npx @ai-sdk/codemod upgrade`가 v5 코드를 자동 변환해 줍니다. 남의 예제를 가져올 때 유용해요.

### 1-3. AI SDK v6 API 지도

| 함수 | 하는 일 | 🐍 파이썬 대응 |
|---|---|---|
| `generateText` | 완성된 텍스트 한 방에 받기 | `client.messages.create(...)` |
| `streamText` | 토큰을 스트림으로 받기 ⭐ | `with client.messages.stream(...)` |
| `streamText` + `Output.object()` | 구조화된 JSON 받기 | `instructor` / Pydantic 파싱 |
| `embed` / `embedMany` | 임베딩 생성 | Day 7에서 사용 |
| `tool()` | 도구 하나 정의 | 함수 + JSON schema |
| `ToolLoopAgent` | 도구 루프를 갖춘 에이전트 객체 | 직접 짜던 while 루프 |

### 1-4. 첫 호출 — CLI 스크립트로 감 잡기

Next.js 안에서 바로 하지 말고, **먼저 콘솔에서 한 번 돌려보세요.** UI 문제와 SDK 문제를 분리해서 볼 수 있습니다.

```ts
// chat-app/src/scripts/hello-ai.ts
import { config } from "dotenv";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, streamText } from "ai";

// ⚠️ dotenv는 기본적으로 `.env`만 읽는다. Next.js가 쓰는 `.env.local`은 직접 지정해야 한다.
config({ path: ".env.local" });

const model = anthropic("claude-sonnet-4-6");

async function main() {
  // ① 한 방에 받기
  const { text, usage } = await generateText({
    model,
    system: "당신은 간결하게 답하는 조수입니다.",
    prompt: "TypeScript를 파이썬 개발자에게 한 문장으로 설명해줘.",
  });
  console.log("\n[generateText]", text);
  console.log("[usage]", usage);

  // ② 스트리밍으로 받기
  console.log("\n[streamText] ");
  const result = streamText({
    model,
    prompt: "리액트의 useState를 3문장으로 설명해줘.",
  });

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);       // 토큰이 도착하는 대로 출력
  }
  console.log("\n");
}

main();
```

```bash
pnpm add -D dotenv
pnpm tsx src/scripts/hello-ai.ts
```

⚠️ **`.env.local` 함정 — 여기서 대부분 한 번 막힙니다.**

`pnpm dev`로 앱을 띄울 때는 **Next.js가** `.env.local`을 알아서 읽어줍니다. 하지만 `pnpm tsx src/scripts/hello-ai.ts`는 Next.js를 거치지 않는 **맨 Node 프로세스**라 그 규약이 적용되지 않아요. dotenv의 기본 대상은 `.env`뿐이라 `path`를 명시해야 합니다.

⚠️ **dotenv는 파일이 없어도 에러를 내지 않습니다.** 그래서 증상이 "환경변수 미로드"가 아니라 한 단계 뒤인 `LoadAPIKeyError: Anthropic API key is missing`으로 나타납니다. 이 에러를 보면 키를 의심하기 전에 **로딩 경로**를 먼저 확인하세요.

🐍 파이썬으로 치면 Django의 settings 로더를 통해 돌 때와 `python script.py`로 맨몸 실행할 때 설정 로딩 경로가 다른 것과 같은 상황입니다.

💡 성공하면 실행 첫 줄에 `injected env (2) from .env.local` 같은 로그가 뜹니다. 이게 안 보이면 아직 못 읽은 겁니다.

**포인트 3가지:**

1. **`streamText`에는 `await`가 없습니다.** 호출 즉시 `result` 객체가 돌아오고, 실제 데이터는 `result.textStream`으로 흘러나옵니다. 🐍 파이썬의 async generator를 반환하는 함수와 같은 감각이에요.
2. **`for await (const chunk of ...)`** — Day 2에서 배운 `for await` 문법이 여기서 진가를 발휘합니다. 🐍 `async for chunk in stream:` 과 정확히 대응.
3. **`usage`** — 토큰 사용량이 나옵니다. 학습 중 비용 감을 잡으세요.

### 1-5. 비용 감각 (짧게)

- 입력 토큰이 출력 토큰보다 훨씬 쌉니다. 그런데 **대화가 길어질수록 매 요청마다 전체 히스토리를 다시 보냅니다** — 입력 토큰이 누적으로 커져요.
- 학습 중엔 Sonnet 계열이면 충분합니다.
- ⚠️ 오늘 세션 3에서 도구 루프를 만들 때 **`stopWhen`을 안 걸면 모델이 무한히 도구를 호출**할 수 있습니다. 지갑을 지키는 안전장치이니 꼭 넣으세요.

🐍 ML 개발자라면 이미 아는 이야기죠. 여기선 **"JS에서는 이 옵션 이름으로 건다"**만 기억하면 됩니다.

### ✅ 세션 1 체크
- [x] 패키지 설치 완료
- [x] `hello-ai.ts`로 `generateText` 성공
- [x] `for await`로 스트리밍 출력 확인
- [x] v5→v6 변경표에서 `inputSchema` / `stopWhen` / `parts` 세 개는 외움
- [x] `usage`로 토큰 수 확인

---

## 2. 세션 2 (오전) — 스트리밍 채팅 완성

### 2-1. 서버 — `/api/chat/route.ts` 교체

어제 만든 가짜 `ReadableStream`을 통째로 지우고 이걸로 바꿉니다.

```ts
// src/app/api/chat/route.ts
import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

// 스트리밍이 길어질 수 있으니 타임아웃을 늘려둔다 (초 단위)
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: "당신은 한국어로 간결하고 정확하게 답하는 조수입니다.",
    messages: await convertToModelMessages(messages),   // ⚠️ v6: await 필요
  });

  return result.toUIMessageStreamResponse();
}
```

**어제의 30줄이 5줄이 됐습니다.** `ReadableStream`, `TextEncoder`, 청크 인코딩 — 전부 SDK가 처리합니다.

### 2-2. ⭐ `UIMessage` vs `ModelMessage` — 오늘 가장 중요한 개념

v6에는 **메시지 타입이 두 종류**입니다. 이걸 구분 못 하면 계속 타입 에러를 만납니다.

| | `UIMessage` | `ModelMessage` |
|---|---|---|
| 사는 곳 | 브라우저 ↔ 서버 (UI용) | 서버 → LLM (모델용) |
| 구조 | `{ id, role, parts: [...] }` | `{ role, content }` |
| 담는 것 | 텍스트 + 도구 호출 + 도구 결과 + 메타데이터 | 모델이 이해하는 최소한의 형태 |
| 변환 | — | `await convertToModelMessages(uiMessages)` |

```
브라우저 ──UIMessage[]──▶ route.ts ──convertToModelMessages──▶ ModelMessage[] ──▶ Claude
브라우저 ◀──UIMessage 스트림──  toUIMessageStreamResponse()  ◀──────────────────
```

⚠️ **요청 본문을 모델에 그대로 넘기면 안 됩니다.** `UIMessage`에는 UI 전용 정보(메타데이터, 도구 표시 상태 등)가 섞여 있어요. 반드시 `convertToModelMessages`를 통과시키세요. 🐍 파이썬으로 치면 **Pydantic의 요청 스키마와 도메인 모델을 분리하는 것**과 같은 이유입니다.

### 2-3. ⭐ `parts` 모델 — v5에서 가장 크게 바뀐 것

v5에서는 메시지가 `message.content`라는 **문자열 하나**였습니다. v6에서는 **`message.parts` 배열**입니다.

```ts
// UIMessage 하나의 실제 모습
{
  id: "msg_123",
  role: "assistant",
  parts: [
    { type: "text", text: "서울 날씨를 확인해볼게요." },
    { type: "tool-getWeather", state: "output-available",
      input: { city: "서울" }, output: { temp: 22 } },
    { type: "text", text: "현재 22도입니다." },
  ]
}
```

**왜 배열인가?** 에이전트의 답변은 "텍스트 → 도구 호출 → 도구 결과 → 다시 텍스트"처럼 **여러 조각이 순서대로 이어지기** 때문입니다. 문자열 하나로는 표현할 수 없죠.

🐍 Anthropic 파이썬 SDK의 `content` 블록 리스트(`TextBlock`, `ToolUseBlock`, `ToolResultBlock`)와 **정확히 같은 발상**입니다. 이미 아는 구조예요.

주요 `part.type`:

| type | 의미 |
|---|---|
| `"text"` | 일반 텍스트 (`part.text`) |
| `"reasoning"` | 모델의 사고 과정 (설정 시) |
| `"tool-{도구이름}"` | 특정 도구의 호출/결과 |
| `"dynamic-tool"` | 런타임에 정해지는 도구 (MCP 등) |
| `"file"`, `"source-url"` | 파일·출처 |

### 2-4. 클라이언트 — `useChat`으로 갈아끼우기

어제 손으로 짠 `getReader()` 루프를 통째로 지웁니다.

```tsx
// src/components/ChatPanel.tsx
"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageList } from "@/components/MessageList";
import { ChatInput } from "@/components/ChatInput";

export function ChatPanel() {
  const { messages, sendMessage, status, stop, error, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <div className="mx-auto flex h-[calc(100vh-57px)] max-w-2xl flex-col border-x">
      <MessageList messages={messages} status={status} />

      {error && (
        <div className="flex items-center gap-2 border-t bg-red-50 px-4 py-2 text-sm text-red-700">
          <span>문제가 발생했습니다.</span>
          <button onClick={() => regenerate()} className="underline">
            다시 시도
          </button>
        </div>
      )}

      <ChatInput
        onSend={(text) => sendMessage({ text })}
        onStop={stop}
        disabled={isBusy}
        isStreaming={isBusy}
      />
    </div>
  );
}
```

`useChat`이 돌려주는 것들:

| 이름 | 설명 |
|---|---|
| `messages` | `UIMessage[]` — 화면에 그릴 전체 대화 |
| `sendMessage({ text })` | 메시지 전송 (히스토리 관리는 훅이 알아서) |
| `status` | `"ready"` \| `"submitted"` \| `"streaming"` \| `"error"` |
| `stop()` | 진행 중인 스트리밍 중단 (⭐ 어제의 `AbortController`가 이것) |
| `error` | 에러 객체 |
| `regenerate()` | 마지막 응답 재생성 |

⚠️ **v6에는 `input`, `handleInputChange`, `handleSubmit`이 없습니다.** v5 예제에는 있어요. v6에서는 **입력창 상태는 당신이 `useState`로 직접 관리**하고, 보낼 때만 `sendMessage`를 호출합니다. 어제 만든 `ChatInput`이 이미 그렇게 되어 있죠 — 그대로 쓰면 됩니다.

### 2-5. `MessageList` / `MessageItem`을 parts 모델로 개조

```tsx
// src/components/MessageList.tsx
"use client";

import type { UIMessage } from "ai";
import { MessageItem } from "@/components/MessageItem";
import { useAutoScroll } from "@/hooks/useAutoScroll";

type MessageListProps = {
  messages: UIMessage[];
  status: string;
};

export function MessageList({ messages, status }: MessageListProps) {
  // Day 4에서 만든 훅을 그대로 재사용. 스트리밍 중에도 따라가도록 길이 합산.
  const totalParts = messages.reduce((sum, m) => sum + m.parts.length, 0);
  const bottomRef = useAutoScroll(messages.length + totalParts);

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {messages.length === 0 && (
        <p className="pt-10 text-center text-sm text-gray-400">
          메시지를 입력해 대화를 시작하세요.
        </p>
      )}

      {messages.map((m) => (
        <MessageItem key={m.id} message={m} />
      ))}

      {status === "submitted" && (
        <p className="text-sm text-gray-400">…생각 중</p>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
```

```tsx
// src/components/MessageItem.tsx
import type { UIMessage } from "ai";

type MessageItemProps = { message: UIMessage };

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] space-y-2 rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
          isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return <span key={i}>{part.text}</span>;
          }
          return null; // 도구 파트는 세션 3에서 처리
        })}
      </div>
    </div>
  );
}
```

⚠️ **`key={i}` (인덱스)를 여기서 쓴 이유**: Day 4에서 "인덱스를 key로 쓰지 말라"고 배웠죠. 예외가 있습니다 — **목록의 순서가 절대 바뀌지 않고 중간 삽입·삭제가 없을 때**는 괜찮습니다. `parts`는 뒤에만 추가되는 append-only 배열이라 안전해요.

**동작 확인**: `pnpm dev` → 메시지를 보내면 **진짜 Claude의 답변이 한 글자씩** 흘러나옵니다. 🎉

### 2-6. `ChatInput`에 중단 버튼 추가

어제 만든 `ChatInput`에 "스트리밍 중에는 전송 대신 중단 버튼"을 붙입니다. **파일 전체**는 이렇게 됩니다.

```tsx
// src/components/ChatInput.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatInputProps = {
  onSend: (text: string) => void;
  onStop?: () => void;      // 🆕 스트리밍 중단
  disabled?: boolean;       // 입력/전송 잠금
  isStreaming?: boolean;    // 🆕 true면 전송 버튼 대신 중단 버튼
};

export function ChatInput({
  onSend,
  onStop,                   // 🆕 ⚠️ 타입에만 추가하고 여기서 빼먹기 쉽다
  disabled = false,
  isStreaming = false,      // 🆕
}: ChatInputProps) {
  const [text, setText] = useState("");
  const canSend = text.trim() !== "" && !disabled;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };

  // ⚠️ 한글 IME 함정: 조합 중 Enter는 "글자 확정"이지 "전송"이 아니다.
  //    keydown에서 막아야 form의 암묵적 submit까지 함께 취소된다.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.nativeEvent.isComposing) {
      e.preventDefault();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요"
        className="flex-1"
        disabled={disabled}
      />

      {/* 🆕 스트리밍 상태에 따라 버튼이 갈린다 */}
      {isStreaming ? (
        <Button type="button" variant="outline" onClick={onStop}>
          중단
        </Button>
      ) : (
        <Button type="submit" disabled={!canSend}>
          전송
        </Button>
      )}
    </form>
  );
}
```

**어제 대비 바뀐 곳은 3군데뿐입니다:**

| 위치 | 변경 |
|---|---|
| `ChatInputProps` | `onStop?`, `isStreaming?` 추가 |
| 함수 시그니처 | 구조분해에 `onStop`, `isStreaming = false` 추가 ⭐ **가장 자주 빠뜨리는 곳** |
| 버튼 | `<Button type="submit">` 하나 → `isStreaming` 삼항으로 두 갈래 |

⚠️ **props 타입에만 추가하고 구조분해에서 빼먹으면** 타입 에러 없이 조용히 안 됩니다. 컴포넌트 안에서 `onStop`이라는 값이 아예 존재하지 않는 상태가 되거든요.

🐍 파이썬으로 치면 타입힌트와 실제 시그니처가 어긋난 상황입니다.

```python
# 타입(=props 타입)엔 있는데
def chat_input(on_send, on_stop=None, disabled=False, is_streaming=False): ...
# 정작 함수는 이렇게 써놓은 것
def chat_input(on_send, disabled=False): ...
```

**설계 포인트 3가지:**

1. ⚠️ **중단 버튼에 `type="button"`이 필수**입니다. HTML `<button>`의 기본값이 `type="submit"`이라 생략하면 중단 버튼이 폼을 제출해 버립니다. React가 아니라 HTML의 기본 동작이에요.
2. **`onStop`이 옵셔널인데 `onClick={onStop}`에 그대로 넘겨도 되나?** 됩니다. `undefined`를 `onClick`에 주면 React가 핸들러를 아예 안 붙여요. 🐍 파이썬에서 `None`을 콜백 자리에 넣으면 호출 시점에 터지는 것과 다른 지점입니다.
3. **`disabled`와 `isStreaming`은 지금 둘 다 `isBusy`로 같은 값**입니다. 그래도 prop을 나눈 건 의미가 달라서예요 — `disabled`는 "입력을 막을까", `isStreaming`은 "버튼을 어떤 모양으로 그릴까". 나중에 "스트리밍 중에도 다음 질문은 미리 타이핑" 하게 바꾸려면 `disabled`만 떼면 됩니다.

⚠️ **한글 IME 함정 재확인**: Day 4에서 배운 `e.nativeEvent.isComposing` 처리가 여전히 필요합니다. 위 코드처럼 `onKeyDown`에서 `preventDefault()`하면 form의 암묵적 제출(implicit submission)까지 함께 막힙니다.

### ✅ 세션 2 체크
- [x] `/api/chat`이 `streamText` + `toUIMessageStreamResponse`로 교체됨
- [x] 토큰이 실시간 스트리밍되는 챗봇 동작 ⭐(로드맵 필수)
- [x] `UIMessage`와 `ModelMessage`의 차이 설명 가능 ⭐
- [x] `message.parts` 배열을 순회해 렌더링
- [x] `stop()`으로 스트리밍 중단 확인
- [x] `status`로 로딩 상태 표시

---

## 3. 세션 3 (오후) — 에이전트 = tool calling

### 3-1. "에이전트"의 정의를 코드로

에이전트라는 말이 마케팅 용어처럼 남용되지만, AI SDK에서는 **아주 구체적인 루프**를 가리킵니다.

```
1. 모델에게 [메시지 + 사용 가능한 도구 목록]을 보낸다
2. 모델이 답한다:
     (a) 텍스트로 답 → 끝
     (b) "이 도구를 이 인자로 호출해줘" → 3번으로
3. 우리 코드가 도구를 실제로 실행한다
4. 결과를 대화에 추가하고 다시 1번으로  (= 한 "스텝")
5. stopWhen 조건을 만족하면 종료
```

🐍 파이썬으로 `anthropic` SDK를 쓸 때 직접 짜던 `while True:` 루프가 바로 이겁니다. **AI SDK v6에서는 그 루프를 `stopWhen` 한 줄로 대신합니다.**

⚠️ **v6의 기본 동작 주의**: `streamText`에 `tools`만 주고 `stopWhen`을 안 주면, 모델이 도구를 호출한 뒤 **그 결과를 보고 다시 답하지 않고 멈출 수 있습니다.** 그러면 화면에 도구 결과만 뜨고 최종 답변이 안 나와요. **`stopWhen: stepCountIs(5)`를 반드시 넣으세요.**

### 3-2. 도구 정의 — `tool()` + Zod

Day 3 말미에 맛본 Zod가 여기서 본무대에 섭니다. 코드를 치기 전에 **Zod가 여기서 정확히 무슨 일을 하는지** 먼저 잡고 갑시다. 이걸 대충 넘어가면 "도구가 호출은 되는데 인자가 이상하다" 류의 버그에서 하루를 씁니다.

#### 왜 하필 Zod인가 — 여기서 스키마는 3가지 일을 한다

Day 3에서 Zod는 **런타임 검증기**였습니다. 도구 정의에서는 역할이 하나 더, 그것도 가장 중요한 게 붙습니다 — 스키마가 **모델에게 보내는 계약서**가 됩니다.

```
        z.object({ ... })
              │
  ①  JSON Schema로 변환되어 도구 목록에 실려 Claude에게 전송
     → 모델은 이걸 읽고 "무슨 인자를 어떤 모양으로 줄지" 결정한다
              │
  ②  모델이 만들어 보낸 JSON 인자를 런타임 검증
     → 모양이 다르면 execute를 실행하지 않고 막는다
              │
  ③  execute의 인자 타입을 컴파일 타임에 추론
     → ({ timeZone }) 의 timeZone이 string으로 자동 타이핑
```

🐍 파이썬 `anthropic` SDK로 도구를 쓸 때를 떠올려 보세요. `input_schema`에 JSON Schema 딕셔너리를 **손으로** 적고, 모델이 준 `tool_use.input`을 다시 손으로 pydantic 모델에 넣어 검증하고, 타입힌트는 또 따로 썼죠. 같은 정보를 세 번 적는 구조입니다. Zod는 **한 번 쓴 스키마 하나**로 셋을 전부 처리합니다.

⚠️ 결론: 도구 스키마는 **"검증만 통과하면 되는" 스키마가 아닙니다.** 모델이 읽는 문서이기도 해요. **필드 이름·설명·타입 선택이 곧 프롬프트**입니다.

#### 도구 스키마에 실제로 쓰는 Zod 문법 — 이것만 알면 충분

| Zod | 뜻 | 🐍 pydantic |
|---|---|---|
| `z.string()` / `z.number()` / `z.boolean()` | 기본 타입 | `str` / `float` / `bool` |
| `z.number().int()` | 정수 | `int` |
| `z.string().optional()` | 없어도 됨 (`required`에서 빠짐) | `str \| None = None` |
| `z.string().default("Asia/Seoul")` | 없으면 기본값이 주입됨 | `str = "Asia/Seoul"` |
| `z.enum(["a", "b"])` ⭐ | 닫힌 선택지 | `Literal["a", "b"]` |
| `z.array(z.string())` | 배열 | `list[str]` |
| `z.object({ ... })` | 중첩 객체 | 중첩 `BaseModel` |
| `z.number().min(0).max(10)` | 범위 제약 | `Field(ge=0, le=10)` |
| `.describe("...")` ⭐ | 필드 설명 | `Field(description="...")` |
| `z.object({})` | 인자가 없는 도구 | 파라미터 없는 함수 |

💡 도구 입력은 **평평하고 단순할수록 좋습니다.** union·재귀·깊은 중첩은 모델을 헷갈리게 하고 JSON Schema 자체도 커집니다(= 매 요청 입력 토큰).

#### `.describe()`가 실제로 하는 일 — 눈으로 확인하기

Zod 4에는 변환 결과를 직접 볼 수 있는 함수가 있습니다. 아무 스크립트에서나 한 번 찍어보세요.

```ts
import { z } from "zod";

const schema = z.object({
  expression: z.string().describe("계산할 수식 (예: '(12+5)*3')"),
  precision: z.number().int().min(0).max(10).optional().describe("반올림할 소수점 자리수"),
});

console.log(JSON.stringify(z.toJSONSchema(schema), null, 2));
```

```json
{
  "type": "object",
  "properties": {
    "expression": { "type": "string", "description": "계산할 수식 (예: '(12+5)*3')" },
    "precision": { "type": "integer", "minimum": 0, "maximum": 10,
                   "description": "반올림할 소수점 자리수" }
  },
  "required": ["expression"],
  "additionalProperties": false
}
```

**이 JSON이 통째로 Claude에게 전송됩니다.** `.describe()`가 없으면 모델은 `expression`이라는 이름 하나만 보고 값을 지어내야 해요. 주석이 아니라 **프롬프트의 일부**입니다.

💡 도구가 이상한 인자로 호출될 때 **가장 먼저 할 일이 `z.toJSONSchema()`를 찍어보는 것**입니다. "모델이 실제로 뭘 봤는가"를 확인할 수 있는 유일한 방법이에요.

#### ⚠️ `.optional()` vs `.default()` — 가장 자주 헷갈리는 지점

둘 다 "필수 아님"이지만, **누가 기본값을 채우느냐**가 다릅니다.

```ts
// (A) .optional() — 모델이 안 보내면 undefined가 그대로 들어온다
inputSchema: z.object({ timeZone: z.string().optional() }),
execute: async ({ timeZone = "Asia/Seoul" }) => { ... },
//                          └── JS 구조분해 기본값으로 내가 채워야 함
//                              안 채우면 undefined가 그대로 흘러가 런타임 버그

// (B) .default() — Zod가 파싱 단계에서 채워준다
inputSchema: z.object({ timeZone: z.string().default("Asia/Seoul") }),
execute: async ({ timeZone }) => { ... },
//                  └── 타입이 string (string | undefined 아님). 항상 값이 있다
```

🐍 pydantic의 `tz: str | None = None`(호출부에서 `or "Asia/Seoul"` 처리) vs `tz: str = "Asia/Seoul"`의 차이와 정확히 같습니다.

💡 **기본값이 정해져 있다면 `.default()`가 낫습니다.** 기본값이 스키마 한 곳에만 존재하고, `execute`에서 `undefined` 분기를 신경 쓸 필요가 없어요. 아래 `getCurrentTime`은 학습용으로 (A) 방식을 씁니다 — 두 방식 다 손에 익혀두세요.

⚠️ **필수 필드를 남발하지 마세요.** `required`가 많을수록 모델이 값을 **지어낼** 확률이 올라갑니다. 정말 없으면 실행이 불가능한 것만 필수로 두세요.

#### ⭐ `z.enum()` — 선택지가 정해져 있으면 무조건 이것

```ts
// ❌ 모델이 "celsius", "C", "섭씨", "Celcius" 중 아무거나 보낸다
unit: z.string().describe("celsius 또는 fahrenheit"),

// ✅ JSON Schema의 enum으로 나가서 선택지가 강제된다
unit: z.enum(["celsius", "fahrenheit"]).default("celsius"),
```

🐍 `Literal["celsius", "fahrenheit"]`입니다. **스키마로 막을 수 있는 것을 프롬프트로 부탁하지 마세요.** 도구 인자가 흔들리는 문제의 절반은 `z.string()`을 써야 할 자리가 아닌 곳에 써서 생깁니다.

#### 타입 추론 — `execute`의 인자는 공짜로 타입이 붙는다

```ts
inputSchema: z.object({ username: z.string() }),
execute: async ({ username }) => { ... },   // username: string  ← 아무것도 안 썼는데 타입이 있다
```

`tool()`은 제네릭 함수라, `inputSchema`에서 `execute` 인자의 타입을 뽑아냅니다. Day 3에서 배운 `z.infer`가 안에서 돌고 있는 거예요. 에디터에서 `username`에 마우스를 올려 `string`이 뜨는지 확인해 보세요. `{ usrname }`처럼 오타를 내면 즉시 빨간 줄이 뜹니다.

⚠️ `inputSchema`를 고치면 `execute`가 곧바로 타입 에러를 냅니다. **이건 버그가 아니라 기능입니다** — 스키마와 구현이 어긋난 채로 배포되는 걸 막아줘요.

#### ⚠️ JSON Schema로 변환할 수 없는 타입은 쓰면 안 된다

도구 입력은 결국 **모델이 텍스트로 생성하는 JSON**입니다. JSON에 없는 개념은 스키마에 넣을 수 없어요.

| 쓰면 안 되는 것 | 이유 | 대신 |
|---|---|---|
| `z.date()` | JSON에 날짜 타입이 없음 | `z.string().describe("ISO 8601, 예: 2026-07-29")` |
| `z.bigint()`, `z.symbol()`, `z.map()`, `z.set()` | JSON으로 표현 불가 | `z.number()` / `z.array()` / `z.record()` |
| `z.function()` | 직렬화 불가 | — |
| `.transform()` | 변환 결과가 스키마에 안 드러남 | `execute` 안에서 변환 |
| `.refine()` | 커스텀 검증은 JSON Schema에 표현 안 됨 | 아래 💡 참고 |

⚠️ Zod 4는 표현 불가능한 타입을 만나면 **변환 시점에 에러를 던집니다.** 도구를 추가한 뒤 갑자기 라우트 전체가 죽으면 여기를 의심하세요.

💡 `.refine()`은 **써도 되지만 모델에게는 보이지 않고**, 실행 직전 검증만 합니다. 모델이 그 제약을 알게 하려면 `.describe()`에 같은 내용을 글로도 적어야 해요.

#### 검증에 실패하면 무슨 일이 일어나나

모델이 스키마에 안 맞는 인자를 보내면(예: `expression`을 숫자로) → Zod가 거부 → **`execute`는 아예 실행되지 않고** 그 도구 파트가 `output-error` 상태가 됩니다. 3-4에서 이 상태를 UI에 직접 그릴 거예요.

🐍 pydantic이 `ValidationError`를 던져 함수 본문 진입 자체를 막는 것과 같습니다. 그러니 **`execute` 안에서는 인자가 이미 검증됐다고 믿어도 됩니다** — `typeof x === "string"` 같은 방어 코드를 다시 쓰지 마세요.

⚠️ 단, Zod가 보장하는 건 **모양(shape)**이지 **의미**가 아닙니다. 아래 `calculate`의 화이트리스트 정규식이 그 예 — `z.string()`을 통과했다는 건 "문자열이다"라는 뜻일 뿐, "안전한 수식이다"가 아닙니다. **보안 검증은 여전히 `execute` 안에서** 해야 합니다.

#### 이제 코드

```ts
// src/lib/tools.ts
import { tool } from "ai";
import { z } from "zod";

/** ① 현재 시각 — 가장 단순한 도구 (LLM이 모르는 정보) */
export const getCurrentTime = tool({
  description:
    "현재 날짜와 시각을 알려준다. 사용자가 '지금', '오늘', '며칠' 등을 물으면 사용한다.",
  inputSchema: z.object({
    timeZone: z
      .string()
      .optional()
      .describe("IANA 타임존 (예: Asia/Seoul). 생략하면 Asia/Seoul"),
  }),
  execute: async ({ timeZone = "Asia/Seoul" }) => {
    const now = new Date();
    return {
      timeZone,
      iso: now.toISOString(),
      local: now.toLocaleString("ko-KR", { timeZone }),
    };
  },
});

/** ② 계산기 — LLM이 자주 틀리는 일을 코드에 맡긴다 */
export const calculate = tool({
  description:
    "사칙연산 수식을 정확히 계산한다. 숫자 계산이 필요하면 반드시 이 도구를 쓴다.",
  inputSchema: z.object({
    expression: z
      .string()
      .describe("계산할 수식. 숫자와 + - * / ( ) . 만 포함 (예: '(12+5)*3')"),
  }),
  execute: async ({ expression }) => {
    // ⚠️ 보안: 화이트리스트 검증 후에만 계산한다
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
      return { error: "허용되지 않은 문자가 포함되어 있습니다." };
    }
    try {
      const value = Function(`"use strict"; return (${expression});`)();
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return { error: "계산 결과가 유효하지 않습니다." };
      }
      return { expression, value };
    } catch {
      return { error: "수식을 해석할 수 없습니다." };
    }
  },
});

/** ③ GitHub 사용자 조회 — Day 2에서 짠 fetch가 도구로 재등장 */
export const getGithubUser = tool({
  description:
    "GitHub 사용자의 공개 프로필 정보를 조회한다. 사용자명(username)이 주어졌을 때 사용한다.",
  inputSchema: z.object({
    username: z.string().describe("GitHub 사용자명 (예: torvalds)"),
  }),
  execute: async ({ username }) => {
    const res = await fetch(`https://api.github.com/users/${username}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) {
      return { error: `조회 실패 (HTTP ${res.status})`, username };
    }
    const u = await res.json();
    // ⚠️ 필요한 필드만 골라 반환 — 응답 전체를 넘기면 토큰이 폭증한다
    return {
      login: u.login,
      name: u.name,
      bio: u.bio,
      followers: u.followers,
      publicRepos: u.public_repos,
      createdAt: u.created_at,
    };
  },
});

export const chatTools = { getCurrentTime, calculate, getGithubUser };
```

**도구 설계에서 중요한 것 4가지:**

1. ⭐ **`description`은 모델을 위한 것**입니다. 코드 리뷰어용 주석처럼 쓰지 마세요. **"언제 이 도구를 써야 하는가"**를 적어야 모델이 제대로 고릅니다. 도구가 안 불리면 90%는 설명이 부실한 탓이에요.
2. **`.describe()`는 모든 필드에 답니다.** 위에서 본 대로 JSON Schema의 `description`이 되어 모델에게 그대로 전달됩니다. 예시 값(`(예: torvalds)`)을 하나 넣어주면 정확도가 눈에 띄게 올라가요.
3. **반환값은 작게.** API 응답 전체를 넘기면 그게 전부 입력 토큰이 됩니다.
4. **에러를 던지지 말고 반환하세요.** `{ error: "..." }`를 돌려주면 모델이 그걸 읽고 사과하거나 다시 시도합니다. `throw`하면 루프 전체가 죽어요.

💡 위 세 도구를 보며 앞의 Zod 설명과 대조해 보세요 — `getCurrentTime`은 `.optional()` + JS 기본값, `calculate`는 스키마 통과 후 `execute` 안에서 **보안 검증**, `getGithubUser`는 `.describe()`에 **예시 값**을 넣은 케이스입니다.

### 3-3. 도구를 route에 연결

```ts
// src/app/api/chat/route.ts
import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { chatTools } from "@/lib/tools";

export const maxDuration = 30;

const SYSTEM_PROMPT = `당신은 한국어로 답하는 유능한 조수입니다.

원칙:
- 숫자 계산이 필요하면 반드시 calculate 도구를 사용하세요. 암산하지 마세요.
- 현재 시각이 필요하면 getCurrentTime 도구를 사용하세요. 추측하지 마세요.
- GitHub 사용자 정보는 getGithubUser 도구로 확인하세요.
- 도구 결과를 받은 뒤에는 반드시 사용자에게 자연스러운 문장으로 정리해 답하세요.
- 간결하게 답하세요.`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: chatTools,
    stopWhen: stepCountIs(5),        // ⭐ 도구 호출 라운드 최대 5회
  });

  return result.toUIMessageStreamResponse();
}
```

**테스트 질문 3개:**

| 질문 | 기대 동작 |
|---|---|
| "지금 몇 시야?" | `getCurrentTime` 호출 → 시각 답변 |
| "(1234 * 5678) + 91011 은?" | `calculate` 호출 → 정확한 값 |
| "torvalds의 팔로워 수와, 그 수의 절반은?" | `getGithubUser` → `calculate` **연속 2회** ⭐ |

세 번째 질문이 핵심입니다. **도구 결과를 보고 다시 다른 도구를 부르는 것** — 이게 "에이전트 루프"가 돈다는 증거예요.

### 3-4. 도구 호출을 UI에 렌더링

지금은 화면에 아무 표시가 없습니다(`MessageItem`에서 `null`을 반환했죠). 도구 파트를 그려봅시다.

```tsx
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
```

`MessageItem`은 **파일 전체**가 이렇게 됩니다. 세션 2 버전(2-5)에서 바뀐 곳은 `import` 한 줄과 `map` 안의 도구 파트 분기뿐입니다.

```tsx
// src/components/MessageItem.tsx
import type { UIMessage } from "ai";
import { ToolCallCard } from "@/components/ToolCallCard";   // 🆕

type MessageItemProps = { message: UIMessage };

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] space-y-2 rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
          isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return <span key={i}>{part.text}</span>;
          }

          // 🆕 "tool-calculate" 처럼 도구 이름이 타입에 붙어서 온다
          if (part.type.startsWith("tool-")) {
            const p = part as unknown as {
              type: string;
              state: string;
              input?: unknown;
              output?: unknown;
              errorText?: string;
            };
            return (
              <ToolCallCard
                key={i}
                toolName={p.type.slice("tool-".length)}
                state={p.state}
                input={p.input}
                output={p.output}
                errorText={p.errorText}
              />
            );
          }

          return null;   // reasoning·file 등 아직 안 그리는 파트
        })}
      </div>
    </div>
  );
}
```

| 위치 | 세션 2 대비 변경 |
|---|---|
| import | `ToolCallCard` 추가 |
| `map` 안 | `part.type.startsWith("tool-")` 분기 추가 |
| 마지막 `return null` | 주석만 수정 (`// 도구 파트는 세션 3에서 처리` → 삭제) |

**도구 파트의 `state` 진행 순서:**

```
input-streaming  →  input-available  →  output-available
   (인자 생성 중)      (실행 시작)         (결과 도착)
                                     ↘  output-error
```

💡 **이 4단계를 UI에서 직접 보는 것이 오늘의 하이라이트**입니다. "모델이 뭘 하고 있는지"가 눈에 보이면 에이전트가 블랙박스가 아니게 돼요.

⚠️ **위 코드의 `as unknown as {...}`는 응급 처치입니다.** 왜 필요했고 어떻게 없애는지는 바로 다음 3-5에서 다룹니다. 시간이 빠듯하면 이대로 두고 세션 4로 넘어가도 됩니다.

### 3-5. ⭐ (심화) `as unknown as`를 없애기 — 타입 안전한 도구 파트

Day 3에서 배운 **narrowing + 제네릭 + `z.infer`**가 한자리에 모여 실전에서 돌아가는 지점입니다. TS를 배운 보람을 느끼는 곳이니 여유가 있으면 꼭 해보세요.

#### 왜 캐스팅이 필요했나 — 기본 `UIMessage`는 도구를 모른다

SDK의 실제 정의를 보면 답이 나옵니다.

```ts
interface UIMessage<
  METADATA   = unknown,
  DATA_PARTS extends UIDataTypes = UIDataTypes,
  TOOLS      extends UITools     = UITools      // ← 기본값 = Record<string, {input: unknown, output: unknown}>
> {
  id: string;
  role: "system" | "user" | "assistant";
  metadata?: METADATA;
  parts: UIMessagePart<DATA_PARTS, TOOLS>[];
}
```

제네릭 3칸을 안 채우고 그냥 `UIMessage`라고 쓰면 `TOOLS`가 기본값으로 들어갑니다. TS 입장에서 도구 파트는 **"이름은 아무 문자열이고 input/output은 `unknown`"**이 되는 거예요. 그러니 `p.input`을 읽으려면 캐스팅밖에 방법이 없었던 겁니다.

🐍 파이썬으로 치면 `dict[str, Any]`를 받아 쓰는 상황입니다. 값이야 잘 들어 있지만 타입 체커가 도와줄 게 하나도 없죠.

#### 한 줄 뜯어보기

```ts
// src/app/api/chat/route.ts 에 추가
import type { InferUITools, UIMessage } from "ai";
import { chatTools } from "@/lib/tools";

export type ChatUIMessage = UIMessage<never, never, InferUITools<typeof chatTools>>;
//                                     ①     ②     ③        ④
```

| 자리 | 의미 |
|---|---|
| ① `never` (METADATA) | 커스텀 메타데이터(응답 시간·모델명 등)를 **안 쓴다**는 선언 |
| ② `never` (DATA_PARTS) | 커스텀 데이터 파트(`type: "data-xxx"`)를 **안 쓴다**는 선언 |
| ③ `InferUITools<...>` | 도구 뭉치에서 input/output 타입만 뽑아 재구성 |
| ④ `typeof chatTools` | **값**에서 **타입**을 꺼내오는 연산자 ⭐ |

**④ `typeof` — 타입 자리에서 쓰는 `typeof`는 완전히 다른 물건입니다.**

```ts
const chatTools = { getCurrentTime, calculate, getGithubUser };   // 값 (런타임 객체)

type T = typeof chatTools;    // 타입 자리에서 쓰면 → 그 값의 타입
// { getCurrentTime: Tool<{timeZone?: string}, {...}>, calculate: Tool<...>, ... }
```

🐍 파이썬의 `type(chatTools)`는 런타임에 `dict`를 돌려주는 **함수 호출**이지만, TS 타입 자리의 `typeof`는 **컴파일 타임 연산자**입니다. 이름만 같아요. 덕분에 타입을 손으로 적을 필요가 없습니다 — `lib/tools.ts`에 도구를 하나 추가하면 타입이 저절로 따라옵니다.

**③ `InferUITools` — 타입 레벨의 dict comprehension**

```ts
type InferUITools<TOOLS> = {
  [NAME in keyof TOOLS & string]: {
    input:  InferToolInput<TOOLS[NAME]>;    // inputSchema(Zod)에서 추론
    output: InferToolOutput<TOOLS[NAME]>;   // execute의 반환값에서 추론
  }
};
```

결과는 이렇게 됩니다.

```ts
{
  getCurrentTime: { input: { timeZone?: string },   output: { timeZone: string; iso: string; local: string } },
  calculate:      { input: { expression: string },  output: { error: string } | { expression: string; value: number } },
  getGithubUser:  { input: { username: string },    output: { error: string; username: string } | { login: string; ... } },
}
```

⭐ **손으로 적은 게 한 글자도 없습니다.** `input`은 3-2에서 쓴 Zod 스키마에서, `output`은 `execute`의 **return 문**에서 자동으로 뽑혀 나왔어요. `calculate`의 output이 유니온인 것도 정확합니다 — 화이트리스트에 걸리면 `{ error }`, 통과하면 `{ expression, value }`를 반환했으니까요.

🐍 파이썬으로 치면 `{name: infer(tool) for name, tool in TOOLS.items()}`를 **타입에 대해** 한 셈입니다. 파이썬 타입힌트로는 표현할 수 없는 종류의 연산이에요.

#### 그래서 뭐가 좋아지나 — 판별 유니온이 생긴다

이 매핑을 받은 도구 파트 타입이 이렇게 펼쳐집니다.

```ts
| { type: "tool-getCurrentTime"; state: ...; input: { timeZone?: string }; output: ... }
| { type: "tool-calculate";      state: ...; input: { expression: string }; output: ... }
| { type: "tool-getGithubUser";  state: ...; input: { username: string };  output: ... }
```

Day 3의 **판별 유니온(discriminated union) narrowing**이 그대로 먹힙니다.

```tsx
// src/components/MessageItem.tsx
import type { ChatUIMessage } from "@/app/api/chat/route";

type MessageItemProps = { message: ChatUIMessage };   // UIMessage 대신 이걸로

// ... map 안에서
if (part.type === "tool-calculate") {
  part.input.expression;      // ✅ string — 캐스팅 없이
  part.input.expresion;       // ❌ 오타에 즉시 빨간 줄

  if (part.state === "output-available") {
    part.output;              // ✅ { error } | { expression, value } 로 좁혀짐
  }
  // state가 "input-streaming"인 분기에서 part.output을 읽으면 → 컴파일 에러
}
```

⭐ **`state`로 한 번 더 좁혀진다는 게 진짜 포인트입니다.** SDK는 `state: "input-streaming"`인 경우 `output?: never`로 선언해 뒀어요. 즉 **아직 도착하지 않은 결과를 실수로 읽는 코드는 아예 컴파일되지 않습니다.** 위에서 그린 state 4단계 다이어그램이 주석이 아니라 **타입으로 강제되는** 거예요.

🐍 pydantic의 discriminated union(`Field(discriminator="type")`)과 같은 발상인데, 파이썬은 런타임에 검증하고 TS는 **에디터에서 즉시** 알려준다는 차이가 있습니다.

#### 배선 순서 (4단계)

| 순서 | 파일 | 할 일 |
|---|---|---|
| 1 | `api/chat/route.ts` | `export type ChatUIMessage = ...` 추가 + 요청 본문을 `{ messages: ChatUIMessage[] }`로 |
| 2 | `ChatPanel.tsx` | `useChat<ChatUIMessage>({ ... })` |
| 3 | `MessageList.tsx` / `MessageItem.tsx` | props 타입 `UIMessage` → `ChatUIMessage` |
| 4 | `MessageItem.tsx` | `as unknown as {...}` 삭제 |

💡 **Route Handler에서 타입을 export해도 안전한가?** 안전합니다. `import type` / `export type`은 컴파일 시 **완전히 사라져서** 서버 코드가 클라이언트 번들에 실려 가지 않아요. 🐍 파이썬의 `if TYPE_CHECKING:` 블록과 같은 발상입니다.

⚠️ 단, **값**을 import하면 진짜로 딸려 갑니다. `import { chatTools } from "@/lib/tools"`를 클라이언트 컴포넌트에서 하면 API 키를 쓰는 코드까지 브라우저로 갈 수 있어요. 반드시 `import type`으로 쓰세요.

#### 💡 중간 옵션 — 캐스팅만 없애기

전면 타이핑이 부담스러우면 SDK가 제공하는 **타입 가드**만 써도 됩니다.

```tsx
import { isToolUIPart, getToolName } from "ai";

if (isToolUIPart(part)) {
  return (
    <ToolCallCard
      key={i}
      toolName={getToolName(part)}   // "tool-" 문자열 slice 안 해도 됨
      state={part.state}
      input={part.input}
      output={"output" in part ? part.output : undefined}
    />
  );
}
```

`part.type.startsWith("tool-")` + `slice("tool-".length)`라는 **문자열 조작**보다 안전하고, `ChatUIMessage`까지 안 가도 바로 적용됩니다. 🐍 `isinstance()` 체크가 타입 체커에게도 인정받는 것과 같아요 — Day 3에서 배운 **타입 가드 함수(`x is T`)**의 실물입니다.

### ✅ 세션 3 체크
- [ ] Zod 스키마 도구 1개 이상 호출 성공 ⭐(로드맵 필수)
- [ ] 도구 호출 → 결과 → 최종 답변 루프 확인 ⭐(로드맵 필수)
- [ ] 도구 2개가 연속으로 호출되는 질문 성공
- [ ] `stopWhen: stepCountIs(5)`의 역할 설명 가능
- [ ] 도구 호출이 UI에 표시됨 (state 4단계)
- [ ] (심화) `ChatUIMessage`로 `as unknown as` 캐스팅 제거 — `typeof` + `InferUITools`가 뭘 하는지 설명 가능

---

## 4. 세션 4 (오후) — 다듬기

### 4-0. 이 세션을 읽는 법 ⭐

세션 4는 **고칠 것과 그냥 읽을 것이 섞여 있습니다.** 헷갈리지 않게 모든 코드 블록에 표기를 답니다.

| 표기 | 뜻 |
|---|---|
| 🔧 **적용** | **실제로 파일을 고치세요.** 코드 블록 첫 줄 주석이 대상 파일 경로입니다 |
| 🧪 **실험** | 잠깐 돌려보고 **원래대로 되돌립니다.** 저장소에 남기지 않아요 |
| 👀 **읽기** | 개념 설명용. **타이핑하지 마세요.** "이런 게 있다"만 알면 됩니다 |

💡 세션 1~3에는 이 표기가 없습니다. 거기 나온 코드는 (명시적으로 "선택"이라고 적힌 3-5를 빼면) **전부 적용 대상**이었어요.

**세션 4에서 실제로 손대는 파일은 3개뿐입니다:**

| 파일 | 무엇을 | 절 |
|---|---|---|
| `src/app/api/chat/route.ts` | 에러 처리 3층 + 프롬프트 import로 교체 | 4-1, 4-2 |
| `src/lib/prompts.ts` 🆕 | 시스템 프롬프트를 여기로 분리 | 4-2 |
| `src/components/MessageList.tsx` | 로딩 표시 개선 (선택) | 4-5 |

나머지(4-3 `ToolLoopAgent`, 4-4 점검표)는 **고치는 게 아니라 확인·학습용**입니다.

### 4-1. 🔧 에러 처리 — 3층으로 막는다

**왜 3층인가?** 에러가 발생하는 **시점**이 다르고, 시점마다 잡을 수 있는 방법이 다르기 때문입니다.

| 층 | 언제 터지나 | 잡는 법 | 상태 |
|---|---|---|---|
| ① 도구 안 | `execute` 실행 중 (GitHub 404 등) | `throw` 대신 `{ error }` **반환** | ✅ 3-2에서 완료 |
| ② 스트림 중 | **응답이 시작된 뒤** (API 키 오류, 토큰 초과) | `toUIMessageStreamResponse({ onError })` | 🔧 지금 추가 |
| ③ 요청 처리 | 스트리밍 **시작 전** (JSON 파싱 실패, 잘못된 입력) | `try/catch` + 입력 검증 | 🔧 지금 추가 |

⚠️ **②와 ③이 왜 따로 필요한지가 핵심입니다.** `streamText`에는 `await`가 없죠(1-4 포인트 1). 호출 즉시 `result`가 반환되고 `return`까지 끝난 **뒤에** 실제 토큰이 흘러나옵니다. 그러니 **`try/catch`는 스트리밍 도중의 에러를 절대 잡을 수 없어요.** 이미 함수를 빠져나간 뒤니까요.

🐍 파이썬에서 제너레이터 함수를 호출하는 것만으로는 본문이 실행되지 않는 것과 같습니다. `try/catch`가 감싼 건 "제너레이터를 만드는 부분"이지 "돌리는 부분"이 아니에요.

```python
def gen():
    raise ValueError("여기서 터짐")
    yield 1

try:
    g = gen()          # ← 여기선 안 터진다 (streamText 호출에 해당)
except ValueError:
    print("못 잡음")   # ← 실행되지 않음
for x in g:            # ← 여기서 터진다 (스트리밍에 해당) = onError의 자리
    ...
```

🔧 **적용** — `route.ts` **파일 전체**입니다. 3-3에서 만든 것에서 `try/catch`·검증·`onError` 세 군데가 추가됐습니다.

```ts
// src/app/api/chat/route.ts
import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { chatTools } from "@/lib/tools";

export const maxDuration = 30;

// ⬇️ 4-2에서 src/lib/prompts.ts로 옮깁니다. 지금은 그대로 두세요.
const SYSTEM_PROMPT = `당신은 한국어로 답하는 유능한 조수입니다.

원칙:
- 숫자 계산이 필요하면 반드시 calculate 도구를 사용하세요. 암산하지 마세요.
- 현재 시각이 필요하면 getCurrentTime 도구를 사용하세요. 추측하지 마세요.
- GitHub 사용자 정보는 getGithubUser 도구로 확인하세요.
- 도구 결과를 받은 뒤에는 반드시 사용자에게 자연스러운 문장으로 정리해 답하세요.
- 간결하게 답하세요.`;

export async function POST(req: Request) {
  try {                                                        // 🆕 ③
    const { messages }: { messages: UIMessage[] } = await req.json();

    // 🆕 ③ 입력 검증 — 스트리밍 시작 전에 걸러낸다
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages가 필요합니다" }, { status: 400 });
    }
    if (messages.length > 50) {
      return Response.json({ error: "대화가 너무 깁니다" }, { status: 400 });
    }

    const result = streamText({
      model: anthropic("claude-sonnet-4-6"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools: chatTools,
      stopWhen: stepCountIs(5),
    });

    // 🆕 ② 스트리밍 도중의 에러 — try/catch로는 못 잡는 영역
    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error("[chat] 스트림 에러:", error);
        // ⚠️ 프로덕션에서는 내부 정보를 그대로 노출하지 말 것
        return error instanceof Error ? error.message : "알 수 없는 오류";
      },
    });
  } catch (err) {
    // 🆕 ③ req.json() 파싱 실패 등, 스트리밍이 시작되기 전의 에러만 여기로 온다
    console.error("[chat] 요청 처리 실패:", err);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}
```

⚠️ **`onError`의 기본 동작**: 아무것도 안 주면 AI SDK는 클라이언트에 `"An error occurred."`만 보냅니다. 내부 정보 유출을 막는 **의도된 기본값**이에요. 위처럼 덮어쓰는 건 **개발 편의**를 위한 것이니, 배포 전에는 고정 문자열로 되돌리는 걸 잊지 마세요.

클라이언트 쪽은 손댈 게 없습니다 — 2-4의 `ChatPanel`에서 이미 `error` + `regenerate()`로 배선해 뒀어요.

🧪 **실험 — 의도적으로 에러 내보기** (끝나면 원복)

| 실험 | 방법 | 어느 층이 잡나 |
|---|---|---|
| API 키 오류 | `.env.local`의 키 끝에 `X`를 붙이고 서버 재시작 → 메시지 전송 | ② `onError` — 빨간 배너 + "다시 시도" |
| 잘못된 요청 | 터미널에서 `curl -X POST localhost:3000/api/chat -d '{}' -H 'Content-Type: application/json'` | ③ 검증 → `400 {"error":"messages가 필요합니다"}` |
| 도구 실패 | "존재하지않는사용자123456의 GitHub 정보 알려줘" | ① `{ error }` 반환 → 모델이 "찾을 수 없다"고 설명 |

💡 세 실험의 **화면 반응이 전부 다릅니다.** ①은 대화가 자연스럽게 이어지고, ②는 빨간 배너, ③은 아예 요청이 거부돼요. 이 차이를 눈으로 보는 게 이 절의 목적입니다.

### 4-2. 🔧 시스템 프롬프트 분리 & 튜닝

프롬프트를 라우트 파일에 박아두면 Day 7에서 RAG 지시문이 붙을 때 지저분해집니다. **먼저 파일로 빼고, 그다음 튜닝합니다.**

🔧 **적용 ①** — 새 파일을 만듭니다.

```ts
// src/lib/prompts.ts  🆕
export const SYSTEM_PROMPT = `당신은 한국어로 답하는 유능한 조수입니다.

원칙:
- 숫자 계산이 필요하면 반드시 calculate 도구를 사용하세요. 암산하지 마세요.
- 현재 시각이 필요하면 getCurrentTime 도구를 사용하세요. 추측하지 마세요.
- GitHub 사용자 정보는 getGithubUser 도구로 확인하세요.
- 도구 결과를 받은 뒤에는 반드시 사용자에게 자연스러운 문장으로 정리해 답하세요.
- 모르는 것은 모른다고 답하세요. 지어내지 마세요.
- 답변은 3문장 이내로 간결하게 하세요.`;
```

🔧 **적용 ②** — `route.ts`에서 **두 줄만** 바꿉니다.

```ts
// src/app/api/chat/route.ts
import { chatTools } from "@/lib/tools";
import { SYSTEM_PROMPT } from "@/lib/prompts";   // 🆕 추가

// const SYSTEM_PROMPT = `...`;                  // ❌ 이 상수 정의 블록은 삭제
```

`streamText`의 `system: SYSTEM_PROMPT`는 **그대로 둡니다.** 이름이 같으니 손댈 게 없어요.

🐍 파이썬으로 치면 `settings.py`에 상수를 모으는 것과 똑같습니다. `export const`는 `SYSTEM_PROMPT = "..."`를 모듈 최상단에 두는 것에 해당해요.

#### 이제 튜닝 — 문장 하나가 동작을 바꾼다

🧪 **실험** — 위 프롬프트에서 한 줄씩 지워보고 질문을 던져보세요.

| 지운 줄 | 던질 질문 | 관찰되는 변화 |
|---|---|---|
| `숫자 계산이 필요하면 반드시 calculate…` | "1234 × 5678은?" | 도구를 안 부르고 **암산으로 틀린 답**을 낼 확률이 오름 |
| `도구 결과를 받은 뒤에는 반드시…` | "지금 몇 시야?" | 도구 카드만 뜨고 **최종 문장이 없거나** JSON을 그대로 읊음 |
| `모르는 것은 모른다고…` | "2030년 한국 대통령이 누구야?" | 자신 있게 **지어냄** |
| `3문장 이내로 간결하게` | 아무 질문 | 답이 길어져 실험 1회당 대기 시간·토큰이 늘어남 |

⭐ **도구가 안 불리는 문제의 해법은 두 군데뿐입니다** — 시스템 프롬프트의 사용 조건, 그리고 3-2의 도구 `description`. 코드를 고칠 일이 아니에요.

💡 **왜 "간결하게"가 학습에 중요한가**: 답이 짧으면 실험 사이클이 빨라지고 출력 토큰(=비용)이 줄어듭니다. 오늘처럼 같은 질문을 수십 번 던지는 날엔 체감이 커요.

⚠️ 실험이 끝나면 **원래 프롬프트로 되돌려 두세요.** Day 7이 이 파일을 이어받습니다.

### 4-3. 👀 `ToolLoopAgent` — 읽고 넘어가는 절

⚠️ **결론부터: 오늘 `route.ts`는 `streamText` 그대로 둡니다.** 아래 코드는 "v6에 이런 것도 있다"를 알아두는 용도예요. **적용하지 마세요.** 굳이 손을 대고 싶으면 아래 🧪 스크립트만 따로 돌려보면 됩니다.

v6는 "모델 + 도구 + 루프 설정"을 **재사용 가능한 객체**로 묶는 방법을 제공합니다.

👀 **읽기**

```ts
// src/lib/agent.ts  ← 만들지 않아도 됩니다
import { anthropic } from "@ai-sdk/anthropic";
import { ToolLoopAgent, stepCountIs } from "ai";
import { chatTools } from "@/lib/tools";
import { SYSTEM_PROMPT } from "@/lib/prompts";

export const chatAgent = new ToolLoopAgent({
  model: anthropic("claude-sonnet-4-6"),
  instructions: SYSTEM_PROMPT,      // ⚠️ v6에서는 system이 아니라 instructions
  tools: chatTools,
  stopWhen: stepCountIs(5),         // 기본값은 stepCountIs(20)
});
```

지금 쓰는 `streamText` 호출과 **인자가 사실상 같습니다.** 차이는 "매 요청마다 인자를 늘어놓느냐 / 한 번 만들어 재사용하느냐"뿐이에요.

| | `streamText` (오늘 방식) | `ToolLoopAgent` |
|---|---|---|
| 설정 위치 | 호출할 때마다 인자로 | 객체 생성 시 한 번 |
| system | `system:` | `instructions:` ⚠️ |
| 실행 | `streamText({...})` | `agent.generate()` / `agent.stream()` |
| 유리한 상황 | 요청마다 도구·프롬프트가 달라질 때 | 같은 설정을 여러 곳에서 재사용, 에이전트 여러 개 조합 |

🐍 파이썬으로 치면 `requests.post(url, headers=..., auth=...)`를 매번 쓰는 것과 `session = requests.Session()`에 설정을 담아 재사용하는 것의 차이입니다.

🧪 **실험 (선택)** — 정 궁금하면 CLI로만 맛보세요. 앱은 건드리지 않습니다.

```ts
// src/scripts/agent-test.ts
import { config } from "dotenv";
import { anthropic } from "@ai-sdk/anthropic";
import { ToolLoopAgent, stepCountIs } from "ai";
import { chatTools } from "@/lib/tools";

config({ path: ".env.local" });   // ⚠️ 1-4의 함정 — `.env`가 아니라 `.env.local`

const chatAgent = new ToolLoopAgent({
  model: anthropic("claude-sonnet-4-6"),
  instructions: "당신은 한국어로 간결하게 답하는 조수입니다.",
  tools: chatTools,
  stopWhen: stepCountIs(5),
});

const result = await chatAgent.generate({
  prompt: "torvalds의 팔로워 수를 조회하고, 그 절반이 얼마인지 알려줘.",
});
console.log(result.text);
console.log("스텝 수:", result.steps.length);   // ⭐ 2가 나오면 도구 2개가 연쇄된 것
```

```bash
pnpm tsx src/scripts/agent-test.ts
```

💡 **`steps.length`가 이 실험의 알맹이입니다.** 3-3의 세 번째 테스트 질문(`getGithubUser` → `calculate`)이 실제로 몇 번 루프를 돌았는지 **숫자로** 확인할 수 있어요. UI의 도구 카드로 보던 걸 콘솔에서 세는 셈입니다.

💡 **왜 오늘 안 바꾸나**: 루프가 눈에 보이는 편이 학습에 낫고, Day 7의 RAG 도구도 지금의 `tools: chatTools` 자리에 그대로 붙습니다. `ToolLoopAgent`는 에이전트를 여러 개 만들어 조합할 때 진가가 나와요.

### 4-4. 👀 안전장치 점검 (⚠️ 지갑 보호)

**고치는 절이 아니라 확인하는 절입니다.** 지금까지 친 코드에 이미 다 들어 있어요. 파일을 열어 눈으로 확인하고 체크하세요.

| 안전장치 | 어디에 있나 | 없으면 무슨 일이 |
|---|---|---|
| `stopWhen: stepCountIs(5)` | `route.ts`의 `streamText` | 모델이 도구를 **무한 호출** — 요청 하나로 요금 폭주 |
| `messages.length > 50` 검증 | `route.ts`의 `try` 블록 | 히스토리 전체가 매 요청 입력 토큰 (1-5) |
| 도구 반환값 크기 | `lib/tools.ts`의 `getGithubUser` — 필드 6개만 선별 | API 응답 전체(수십 KB)가 **다음 요청의 입력 토큰**이 됨 |
| `maxDuration = 30` | `route.ts` 최상단 | 함수가 매달린 채 실행 시간 과금 |
| 도구 안 무한 재귀/fetch | `lib/tools.ts`의 각 `execute` | 서버가 멈추고, 외부 API에서 차단당함 |

🧪 **실측해보기** — 실제로 토큰이 얼마나 나가는지 숫자로 확인하려면 `streamText`에 콜백을 하나 붙입니다. 확인이 끝나면 지우세요.

```ts
// src/app/api/chat/route.ts 의 streamText 안에 임시로 추가
const result = streamText({
  // ... 기존 옵션 그대로 ...
  onFinish: ({ usage, steps }) => {
    console.log(`[chat] 스텝 ${steps.length}회, 토큰`, usage);
  },
});
```

터미널에 이런 게 찍힙니다.

```
[chat] 스텝 2회, 토큰 { inputTokens: 1893, outputTokens: 142, totalTokens: 2035 }
```

⭐ **대화를 이어가며 같은 로그를 계속 보세요.** `outputTokens`는 그대로인데 `inputTokens`만 계속 불어납니다 — 1-5에서 말한 "매 요청마다 전체 히스토리를 다시 보낸다"의 실물이에요. 도구 결과도 히스토리에 쌓이니, **도구 반환값을 작게 유지하라**는 3-2의 조언이 왜 나왔는지 여기서 체감됩니다.

### 4-5. 🔧 (선택) 로딩 UI 다듬기

`status === "submitted"`(요청은 보냈는데 첫 토큰이 아직)와 `"streaming"`(토큰 도착 중)은 사용자 입장에서 체감이 완전히 다릅니다. 전자를 좀 더 살아 있게 표시해 봅시다.

🔧 **적용** — 2-5에서 만든 `MessageList.tsx`의 **"…생각 중" 한 줄만** 교체합니다.

```tsx
// src/components/MessageList.tsx 의 이 부분을
{status === "submitted" && (
  <p className="text-sm text-gray-400">…생각 중</p>
)}
```

```tsx
// ⬇️ 이렇게 바꿉니다 (점 3개가 시차를 두고 통통 튐)
{status === "submitted" && (
  <div className="flex gap-1 px-1">
    {[0, 150, 300].map((d) => (
      <span
        key={d}
        className="h-2 w-2 animate-bounce rounded-full bg-gray-300"
        style={{ animationDelay: `${d}ms` }}
      />
    ))}
  </div>
)}
```

파일의 나머지는 그대로입니다. `import` 추가도 없어요.

💡 **`[0, 150, 300].map(...)`을 쓴 이유**: `<span>`을 세 번 복사해 붙이는 대신 배열을 순회해 만듭니다. Day 4의 리스트 렌더링이 "데이터 목록"이 아니라 **"반복되는 UI"**에도 쓰이는 예예요. 🐍 파이썬의 리스트 컴프리헨션과 같은 감각입니다.

⚠️ `animationDelay`는 Tailwind 클래스로 표현하기 번거로워서 `style` prop을 씁니다. **CSS는 최소화하되, 이런 동적 값은 인라인이 정답**입니다. 🐍 JS의 `style` 객체는 `animation-delay`가 아니라 **`animationDelay`(camelCase)** 라는 점에 주의하세요.

### ✅ 세션 4 체크
- [ ] `route.ts`에 `try/catch` + 입력 검증 + `onError` 3층이 들어감 ⭐(로드맵 필수)
- [ ] 🧪 에러 실험 3종의 화면 반응 차이를 확인 (①대화 계속 / ②빨간 배너 / ③400)
- [ ] `src/lib/prompts.ts`로 프롬프트 분리 + `route.ts`에서 import
- [ ] 프롬프트 한 줄을 지웠을 때 동작이 바뀌는 것을 관찰
- [ ] 4-4 안전장치 5개를 **파일에서 눈으로** 확인
- [ ] (선택) `onFinish` 로그로 `inputTokens`가 대화마다 누적되는 것 확인
- [ ] `pnpm build` 성공

---

## 5. 추가 연습 문제 (여유 있으면)

**① 도구 하나 더 만들기**
`getWeather` 도구를 만들어 보세요. [Open-Meteo](https://open-meteo.com)는 API 키 없이 씁니다. 위경도가 필요하니 "도시명 → 위경도" 도구와 2단계로 나눠 보면 에이전트 루프가 더 잘 보입니다.

**② 구조화된 출력 (`Output.object`)**
`generateText` + `Output.object({ schema })`로 "회의록 텍스트 → `{ 참석자, 결정사항[], 액션아이템[] }`" 파싱을 만들어 보세요. 🐍 `instructor` + Pydantic으로 하던 그것입니다.

**③ 타입 안전한 도구 파트**
세션 3의 `InferUITools`를 실제로 적용해서 `as unknown as`를 없애 보세요. `part.type === "tool-calculate"`로 좁혔을 때 `part.output.value`가 자동완성되면 성공입니다.

---

## 6. ✅ Day 6 완료 체크리스트

- [ ] `ai` / `@ai-sdk/react` / `@ai-sdk/anthropic` / `zod` 설치
- [ ] CLI 스크립트로 `generateText` / `streamText` 확인
- [ ] **토큰이 실시간 스트리밍되는 챗봇 동작** ⭐(로드맵 필수)
- [ ] `UIMessage` vs `ModelMessage` 구분 설명 가능
- [ ] `message.parts` 배열 렌더링
- [ ] **Zod 스키마 도구 1개 이상 호출 성공** ⭐(로드맵 필수)
- [ ] **도구 호출 → 결과 → 최종 답변 루프 확인** ⭐(로드맵 필수)
- [ ] 도구 2개 연속 호출 성공
- [ ] 도구 호출 상태가 UI에 표시됨
- [ ] **에러 케이스 1개 처리** ⭐(로드맵 필수)
- [ ] `stop()` 중단 동작
- [ ] `pnpm build` 성공

---

## 7. 자주 나오는 함정 정리 (⚠️)

| 증상 | 원인 | 해결 |
|---|---|---|
| `parameters is not a valid option` | v5 문법 사용 | 도구에서 `inputSchema:` 사용 |
| `maxSteps is not a valid option` | v5 문법 | `stopWhen: stepCountIs(N)` |
| `messages` 타입 에러 | `convertToModelMessages`를 안 거침 | `await convertToModelMessages(messages)` |
| `convertToModelMessages` 결과가 Promise라 에러 | v6에서 비동기로 바뀜 | `await` 추가 |
| `message.content`가 undefined | v6는 `parts` 배열 | `message.parts.map(...)` |
| `useChat`의 `input`/`handleSubmit`이 없음 | v6에서 제거됨 | `useState` + `sendMessage({ text })` |
| 도구가 절대 호출 안 됨 | `description`이 부실 | "언제 쓰는지"를 설명에 명시 |
| 도구 인자 값이 매번 제각각 | 닫힌 선택지에 `z.string()`을 씀 | `z.enum([...])`로 강제 |
| `execute` 안에서 값이 `undefined` | `.optional()`인데 기본값을 안 채움 | 구조분해 기본값 또는 `.default()` |
| 도구 추가 후 라우트 전체가 죽음 | `z.date()` 등 JSON Schema 변환 불가 타입 | `z.string()` + `.describe()`로 형식 명시 |
| 모델이 제약을 무시함 | `.refine()`은 모델에게 안 보임 | `.describe()`에도 제약을 글로 명시 |
| 도구 결과만 나오고 최종 답변이 없음 | `stopWhen` 미설정 | `stopWhen: stepCountIs(5)` |
| 도구 호출이 무한 반복 | 종료 조건 없음 / 도구가 계속 실패 | `stopWhen` + 도구 에러를 반환값으로 |
| 401 Unauthorized | 키 오타 / `.env.local` 미로드 | 키 확인 후 `pnpm dev` 재시작 |
| CLI 스크립트에서 `LoadAPIKeyError: API key is missing` | `dotenv/config`는 `.env`만 읽음 | `config({ path: ".env.local" })`로 경로 명시 |
| 키가 브라우저에 노출 | 클라이언트에서 SDK 직접 호출 | 반드시 Route Handler(서버)에서만 |
| 스트리밍이 안 되고 한 번에 옴 | `generateText`를 씀 | `streamText` + `toUIMessageStreamResponse` |
| 토큰 비용이 갑자기 큼 | 도구 반환값이 거대 / 히스토리 누적 | 필요 필드만 반환, 대화 길이 제한 |
| 배포 후 스트리밍이 끊김 | 함수 실행 시간 초과 | `export const maxDuration = 30` |
| 한글 입력 중 Enter로 전송됨 | IME 조합 | `e.nativeEvent.isComposing` 체크 |
| `429 rate limit` | 요청 과다 | 잠시 대기, 재시도 로직 |

---

## 8. 저장소 커밋 & 정리

```bash
cd ..
git status              # ⚠️ .env.local 이 목록에 없어야 함
git add chat-app docs/Day6.md
git commit -m "Day 6: AI SDK v6 스트리밍 챗봇 + tool calling 에이전트"
git push
```

⚠️ 커밋 전에 **소스 코드에 API 키를 하드코딩한 곳이 없는지** 검색하세요.

```bash
grep -rn "sk-ant" chat-app/src   # 아무것도 안 나와야 정상
```

---

## 9. Day 7 미리보기

내일은 에이전트에게 **"우리 문서를 읽는 능력"**을 줍니다.

1. **인덱싱 파이프라인** — 문서 로드 → 청킹 → `embedMany`로 임베딩 → JSON 파일로 저장
2. **검색** — 코사인 유사도를 **직접 TS로 구현**해 top-k 검색. 🐍 numpy로 하던 `dot / (norm*norm)`을 손으로.
3. ⭐ **RAG를 "도구"로 노출** — 오늘 만든 `chatTools`에 `searchKnowledgeBase`가 하나 더 추가됩니다. 에이전트가 **필요할 때 스스로 지식베이스를 검색**하게 되는 거죠. 오늘 배선을 잘 해뒀다면 내일은 도구 하나 추가하는 일에 가깝습니다.
4. **출처 표시 UI** — 오늘 만든 `ToolCallCard`가 citation 표시로 발전합니다.
5. **Vercel 배포 + 7일 회고**

**오늘 밤 준비할 것** (5분):
- [ ] RAG에 넣을 문서 몇 개 준비 (마크다운 3~10개면 충분). 💡 **당신이 지금까지 만든 `docs/Day0.md ~ Day6.md`가 완벽한 재료입니다** — "이 학습 자료에 대해 답하는 챗봇"이 되는 거죠.
- [ ] 임베딩 프로바이더 결정 (내일 문서 세션 1에서 안내: Voyage AI 또는 OpenAI). ⚠️ **Anthropic은 임베딩 API를 제공하지 않습니다.**

---

### 부록 A — Python(anthropic SDK) ↔ TypeScript(AI SDK v6) 치트시트

```
# 기본 호출
client.messages.create(...)              →  await generateText({ model, prompt })
with client.messages.stream(...) as s:   →  const r = streamText({ model, prompt })
    for text in s.text_stream:           →  for await (const c of r.textStream)

# 시스템 프롬프트 / 메시지
system="..."                             →  system: "..."
messages=[{"role":"user","content":...}] →  messages: await convertToModelMessages(uiMessages)

# 도구
tools=[{"name","description","input_schema"}]  →  tools: { name: tool({ description, inputSchema }) }
pydantic BaseModel → input_schema        →  zod z.object({...})  (자동 JSON Schema 변환)
Field(description="...")                 →  z.string().describe("...")
Literal["a", "b"]                        →  z.enum(["a", "b"])
str | None = None                        →  z.string().optional()
str = "Asia/Seoul"                       →  z.string().default("Asia/Seoul")
Field(ge=0, le=10)                       →  z.number().min(0).max(10)
model_json_schema()  (스키마 확인)        →  z.toJSONSchema(schema)
while True: 직접 루프                     →  stopWhen: stepCountIs(5)
tool_use / tool_result 블록               →  part.type === "tool-이름", state 4단계

# 구조화 출력
instructor + Pydantic                    →  generateText + Output.object({ schema })

# 응답 구조
response.content  (블록 리스트)           →  message.parts  (파트 배열)
TextBlock                                →  { type: "text", text }
ToolUseBlock                             →  { type: "tool-X", state: "input-available", input }
ToolResultBlock                          →  { type: "tool-X", state: "output-available", output }
usage.input_tokens                       →  usage (result.usage)
```

### 부록 B — 도구가 호출되지 않을 때 점검 순서

```
1. description에 "언제 쓰는지"가 적혀 있나?          ← 90%가 여기
2. 시스템 프롬프트에 "반드시 도구를 쓰라"고 했나?
3. tools 객체를 streamText에 실제로 넘겼나?
4. 파라미터 이름이 자연스러운가? (x1, p → city, expression)
5. 질문이 정말 그 도구가 필요한 질문인가?
6. 서버 콘솔에 도구 실행 로그를 찍어 확인
```

### 부록 C — `status` 값과 UI 대응

| `status` | 의미 | 권장 UI |
|---|---|---|
| `"ready"` | 대기 중 | 전송 버튼 활성 |
| `"submitted"` | 요청 전송, 첫 토큰 대기 | "생각 중…" 애니메이션 |
| `"streaming"` | 토큰 수신 중 | 중단 버튼 표시 |
| `"error"` | 실패 | 에러 배너 + 재시도 |

---

수고했어요. 오늘 만든 건 장난감이 아니라 **진짜 에이전트의 최소 완성형**입니다 — 모델이 스스로 도구를 고르고, 결과를 보고, 다시 판단하죠. 내일은 여기에 **당신의 지식**을 먹입니다. 🧠
