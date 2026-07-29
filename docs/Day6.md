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

```tsx
// src/components/ChatInput.tsx (변경 부분만)
type ChatInputProps = {
  onSend: (text: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
};

// ... 안쪽 버튼 부분
{isStreaming ? (
  <Button type="button" variant="outline" onClick={onStop}>
    중단
  </Button>
) : (
  <Button type="submit" disabled={!canSend}>
    전송
  </Button>
)}
```

⚠️ **한글 IME 함정 재확인**: Day 4에서 배운 `e.nativeEvent.isComposing` 처리가 여전히 필요합니다. 엔터로 전송하는 코드가 있다면 확인하세요.

### ✅ 세션 2 체크
- [ ] `/api/chat`이 `streamText` + `toUIMessageStreamResponse`로 교체됨
- [ ] 토큰이 실시간 스트리밍되는 챗봇 동작 ⭐(로드맵 필수)
- [ ] `UIMessage`와 `ModelMessage`의 차이 설명 가능 ⭐
- [ ] `message.parts` 배열을 순회해 렌더링
- [ ] `stop()`으로 스트리밍 중단 확인
- [ ] `status`로 로딩 상태 표시

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

Day 3 말미에 맛본 Zod가 여기서 본무대에 섭니다.

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
2. **`.describe()`로 각 필드에도 설명을 답니다.** Zod 스키마가 그대로 JSON Schema로 변환되어 모델에게 전달됩니다. 🐍 Pydantic의 `Field(description=...)`와 동일한 역할.
3. **반환값은 작게.** API 응답 전체를 넘기면 그게 전부 입력 토큰이 됩니다.
4. **에러를 던지지 말고 반환하세요.** `{ error: "..." }`를 돌려주면 모델이 그걸 읽고 사과하거나 다시 시도합니다. `throw`하면 루프 전체가 죽어요.

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

```tsx
// src/components/MessageItem.tsx (parts 렌더링 부분 교체)
{message.parts.map((part, i) => {
  if (part.type === "text") {
    return <span key={i}>{part.text}</span>;
  }

  // "tool-calculate" 처럼 도구 이름이 타입에 붙어서 온다
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

  return null;
})}
```

**도구 파트의 `state` 진행 순서:**

```
input-streaming  →  input-available  →  output-available
   (인자 생성 중)      (실행 시작)         (결과 도착)
                                     ↘  output-error
```

💡 **이 4단계를 UI에서 직접 보는 것이 오늘의 하이라이트**입니다. "모델이 뭘 하고 있는지"가 눈에 보이면 에이전트가 블랙박스가 아니게 돼요.

⚠️ **타입 안전성에 대해**: 위 코드에서 `as unknown as {...}`로 캐스팅했습니다. 제대로 하려면 서버에서 메시지 타입을 정의해 클라이언트와 공유합니다.

```ts
// route.ts에서
import type { InferUITools, UIMessage } from "ai";
export type ChatUIMessage = UIMessage<never, never, InferUITools<typeof chatTools>>;

// 클라이언트에서
const { messages } = useChat<ChatUIMessage>({ ... });
// → part.type === "tool-calculate" 로 좁히면 input/output 타입이 자동으로 추론됨
```

💡 Day 3의 **narrowing + 제네릭**이 실전에서 쓰이는 자리입니다. 시간이 빠듯하면 캐스팅으로 넘어가고, 여유가 있으면 꼭 해보세요 — TS를 배운 보람을 느끼는 지점이에요.

### ✅ 세션 3 체크
- [ ] Zod 스키마 도구 1개 이상 호출 성공 ⭐(로드맵 필수)
- [ ] 도구 호출 → 결과 → 최종 답변 루프 확인 ⭐(로드맵 필수)
- [ ] 도구 2개가 연속으로 호출되는 질문 성공
- [ ] `stopWhen: stepCountIs(5)`의 역할 설명 가능
- [ ] 도구 호출이 UI에 표시됨 (state 4단계)

---

## 4. 세션 4 (오후) — 다듬기

### 4-1. 에러 처리 — 3층으로 막는다

**① 도구 안에서**: 이미 했습니다. `throw` 대신 `{ error }` 반환.

**② 스트림에서**: 기본적으로 에러 메시지는 클라이언트에 노출되지 않습니다(보안). 개발 중엔 보고 싶죠.

```ts
return result.toUIMessageStreamResponse({
  onError: (error) => {
    console.error("[chat] 스트림 에러:", error);
    // 프로덕션에서는 내부 정보를 그대로 노출하지 말 것
    return error instanceof Error ? error.message : "알 수 없는 오류";
  },
});
```

**③ 라우트 전체에서**:

```ts
export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages가 필요합니다" }, { status: 400 });
    }
    if (messages.length > 50) {
      return Response.json({ error: "대화가 너무 깁니다" }, { status: 400 });
    }

    const result = streamText({ /* ... */ });
    return result.toUIMessageStreamResponse({ onError: (e) => String(e) });
  } catch (err) {
    console.error("[chat] 요청 처리 실패:", err);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}
```

클라이언트 쪽은 이미 `error` + `regenerate()`로 배선해 뒀습니다.

**의도적으로 에러 만들어보기**: `.env.local`의 키를 잠깐 망가뜨리고 메시지를 보내보세요. 빨간 배너와 "다시 시도" 버튼이 뜨면 성공입니다.

### 4-2. 시스템 프롬프트 튜닝

세션 3의 `SYSTEM_PROMPT`를 다듬어 보세요. 효과가 큰 항목들:

- **도구 사용 조건을 명시** — "계산은 반드시 도구로" 같은 문장 하나로 정확도가 크게 오릅니다
- **도구 결과 후 반드시 요약하라** — 안 그러면 결과 JSON만 던지고 끝내는 경우가 있습니다
- **모르면 모른다고 하라** — 환각 억제
- **답변 길이 지시** — 학습 중엔 짧은 답이 반복 실험에 유리합니다

💡 프롬프트를 코드에 흩뿌리지 말고 `src/lib/prompts.ts`로 모아두세요. Day 7에서 RAG 지시문이 추가됩니다.

### 4-3. (선택) `ToolLoopAgent`로 리팩터링

v6는 "모델 + 도구 + 루프 설정"을 **재사용 가능한 객체**로 묶는 방법을 제공합니다.

```ts
// src/lib/agent.ts
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

CLI 스크립트에서 바로 써볼 수 있습니다.

```ts
// src/scripts/agent-test.ts
import "dotenv/config";
import { chatAgent } from "@/lib/agent";

const result = await chatAgent.generate({
  prompt: "torvalds의 팔로워 수를 조회하고, 그 절반이 얼마인지 알려줘.",
});
console.log(result.text);
console.log("스텝 수:", result.steps.length);
```

💡 **오늘은 `streamText` 방식을 그대로 두는 것을 권합니다.** 루프가 눈에 보이는 편이 학습에 낫고, Day 7의 RAG 도구도 같은 자리에 붙습니다. `ToolLoopAgent`는 "여러 에이전트를 만들어 조합할 때" 진가가 나와요. 관심 있으면 AI SDK 문서의 Agents 섹션을 보세요.

### 4-4. 안전장치 점검 (⚠️ 지갑 보호)

- [ ] `stopWhen: stepCountIs(5)` 설정됨
- [ ] 대화 길이 상한(예: 50개) 검증
- [ ] 도구가 반환하는 데이터 크기가 작음
- [ ] `maxDuration` 설정됨
- [ ] 도구 안에서 무한 재귀/무한 fetch가 없음

### 4-5. (선택) 로딩 UI 다듬기

`status === "submitted"`(요청 보냄, 아직 첫 토큰 전)와 `"streaming"`(토큰 도착 중)을 구분해서 표시하면 체감 반응성이 좋아집니다. 점 3개가 통통 튀는 애니메이션 정도면 충분해요.

```tsx
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

### ✅ 세션 4 체크
- [ ] 에러 케이스 1개 처리 ⭐(로드맵 필수)
- [ ] 시스템 프롬프트를 별도 파일로 분리하고 튜닝
- [ ] 안전장치 5개 점검 완료
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
