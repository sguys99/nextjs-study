# Day 9 — LangGraph.js 에이전트 + 통합 + 배포 (피날레)

> **소요 시간**: 약 8시간 (90분 × 4세션). 9일의 마지막 날입니다.
> **선행 조건**: Day 8 완료 (LangChain RAG + `getRetriever()`, 도구 쓰는 챗봇 동작).
> **오늘의 목표**: Day 6의 "AI SDK식 도구 루프"를 **LangGraph.js 상태 그래프**로 다시 짓고, Day 8의 리트리버를 **에이전트의 검색 도구**로 통합한다. 그리고 배포하고, 9일을 회고한다.
>
> **태그 범례**: `🐍` Python 대비 · `💡` 팁 · `⚠️` 함정 · `🎯` 배경 · `📖` 설명용(읽기만) · `⌨️` 실습(직접 치기) · `✅` 완성본

> ⚠️ **버전 주의**: LangGraph.js도 API가 진화합니다. 이 문서는 `@langchain/langgraph` 기준입니다. 막히면 [langchain-ai.github.io/langgraphjs](https://langchain-ai.github.io/langgraphjs)의 현재 예제를 확인하세요.

---

## 0. 오늘의 큰 그림 (5분)

Day 6에서 이미 "도구를 쓰는 에이전트"를 만들었죠(AI SDK의 `stopWhen: stepCountIs`). 오늘은 **똑같은 걸 LangGraph로** 다시 짓습니다. 목적은 "더 잘"이 아니라 **"에이전트 = 그래프"라는 실무 표준 사고를 익히는 것**이에요.

### 🎯 배경 — 왜 그래프 모델인가 (2026 에이전트 지형)

단순 체인은 **프롬프트 → LLM → 출력**으로 끝나지만, 실제 에이전트는 **재시도·분기·도구 반복·사람 승인·멀티 에이전트**가 필요합니다. 이걸 코드 if문으로 관리하면 금세 지옥이 돼요.

**LangGraph는 이 흐름을 그래프로 명시**합니다:
- **노드(Node)** = 하는 일 (LLM 호출, 도구 실행) — 🐍 함수
- **엣지(Edge)** = 다음에 뭐할지 (조건부 분기 포함)
- **상태(State)** = 그래프가 들고 다니는 데이터 (대화 메시지 등) — 🐍 dataclass

2026년 기준 LangGraph.js는 **프로덕션 안정 + Python판과 기능 동등**(StateGraph·조건부 엣지·체크포인팅·스트리밍·HITL)이고, Klarna·Replit·Uber 등이 실사용합니다. 🐍 **Python LangGraph를 써봤다면 개념이 그대로** 옮겨와요.

### 🎯 Day 6(AI SDK) ↔ 오늘(LangGraph) 대조

| | Day 6 (AI SDK) | 오늘 (LangGraph) |
|---|---|---|
| 도구 루프 | `stopWhen: stepCountIs(5)` (암묵적) | **그래프로 명시**: agent 노드 ↔ tools 노드 순환 |
| 흐름 제어 | SDK 내부 | **내가 노드·엣지로 직접** |
| 확장(분기·승인·멀티) | 어려움 | **그래프에 노드/엣지 추가** |

💡 오늘의 통찰: **"AI SDK는 도구 루프를 감춰주고, LangGraph는 그 루프를 눈에 보이는 그래프로 꺼내준다."** 복잡한 에이전트일수록 후자가 유리합니다. (Day 7→8의 "직접구현 vs 프레임워크"와 같은 결의 배움)

### 0-1. 설치

⌨️ 실습 — `chat-app/`에서

```bash
pnpm add @langchain/langgraph @langchain/anthropic
# @langchain/core는 Day 8에서 이미 설치됨
```

---

## 1. 세션 1 (오전) — 도구를 LangChain 형식으로 이식

Day 6 도구(`getCurrentTime`/`calculate`/`githubUser`)와 Day 8 검색을 **LangChain 도구 형식**으로 옮깁니다.

### 1-1. ⚠️ AI SDK 도구 vs LangChain 도구 (API가 다름)

| | Day 6 (AI SDK) | 오늘 (LangChain) |
|---|---|---|
| 정의 | `tool({ description, inputSchema, execute })` | `tool(fn, { name, description, schema })` |
| 스키마 필드 | `inputSchema` | `schema` |
| 실행 함수 | `execute` 옵션 | **첫 번째 인자** |

💡 개념은 같지만 API가 다릅니다. "같은 것을 다른 라이브러리가 다르게 표현"하는 좋은 예예요.

⌨️ 실습 — `chat-app/src/lib/agent-tools.ts` 새 파일

```ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getRetriever } from "./rag-langchain"; // Day 8의 리트리버!

const getCurrentTime = tool(
  async () => new Date().toString(),
  {
    name: "getCurrentTime",
    description: "현재 날짜와 시각이 필요할 때 호출한다.",
    schema: z.object({}),
  }
);

const calculate = tool(
  async ({ a, b, op }) => {
    const table: Record<string, number> = {
      "+": a + b, "-": a - b, "*": a * b, "/": b === 0 ? NaN : a / b,
    };
    return String(table[op]);
  },
  {
    name: "calculate",
    description: "두 수의 사칙연산이 필요할 때 호출한다.",
    schema: z.object({ a: z.number(), b: z.number(), op: z.enum(["+", "-", "*", "/"]) }),
  }
);

const githubUser = tool(
  async ({ username }) => {
    const res = await fetch(`https://api.github.com/users/${username}`);
    if (!res.ok) return `조회 실패: ${res.status}`;
    const u = await res.json();
    return JSON.stringify({ login: u.login, followers: u.followers, public_repos: u.public_repos });
  },
  {
    name: "githubUser",
    description: "특정 GitHub 사용자의 공개 정보가 필요할 때 호출한다.",
    schema: z.object({ username: z.string() }),
  }
);

// ⭐ Day 8의 리트리버를 도구로 — RAG가 에이전트에 통합되는 지점
const searchKnowledgeBase = tool(
  async ({ query }) => {
    const retriever = await getRetriever(4);
    const docs = await retriever.invoke(query); // Document[]
    return docs.map((d) => `[출처: ${d.metadata.source}]\n${d.pageContent}`).join("\n\n---\n\n");
  },
  {
    name: "searchKnowledgeBase",
    description: "사용자의 학습 자료(Day0~8)에 대한 질문에 답할 때 호출한다. 반드시 출처를 밝힐 것.",
    schema: z.object({ query: z.string() }),
  }
);

export const agentTools = [getCurrentTime, calculate, githubUser, searchKnowledgeBase];
```

💡 `retriever.invoke(query)`가 Day 8의 `asRetriever()`를 실제로 부르는 곳입니다. **RAG(Day 7·8) → 에이전트 도구(오늘)로 완전히 합쳐졌어요.**
⚠️ LangChain 도구 함수는 **문자열(또는 문자열화된 결과)**을 반환하는 게 안전합니다. 그래서 객체는 `JSON.stringify`로 감쌌어요.

---

## 2. 세션 2 (오전) — StateGraph로 ReAct 에이전트 짓기 ⭐

오늘의 핵심입니다. 도구 루프를 **그래프로 명시**합니다.

### 2-1. 그래프의 모양

```
START ──▶ agent(LLM 추론) ──[도구 호출 있나?]──▶ tools(도구 실행) ──┐
              ▲                     │ 없으면                          │
              └─────────────────────┴──────────────▶ END             │
              └───────────────(있으면 다시 추론)◀────────────────────┘
```

이게 바로 **ReAct 루프**(추론 ↔ 행동)입니다. Day 6에서 `stopWhen`이 안에서 감춰 돌리던 걸, 오늘은 **노드와 조건부 엣지로 직접** 그립니다.

### 2-2. 그래프 코드

⌨️ 실습 — `chat-app/src/lib/agent.ts` 새 파일

```ts
import { StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { agentTools } from "./agent-tools";

// 1) 모델에 도구를 바인딩 (모델이 "이 도구들 쓸 수 있음"을 앎)
const model = new ChatAnthropic({
  model: "claude-sonnet-4-5", // ⚠️ 현재 모델 ID로 (버전 확인)
  temperature: 0,
}).bindTools(agentTools);

// 2) 도구 실행 노드 (프리빌트)
const toolNode = new ToolNode(agentTools);

// 3) "다음에 뭘 할까?" — 조건부 엣지의 판단 함수
function shouldContinue(state: typeof MessagesAnnotation.State) {
  const last = state.messages[state.messages.length - 1];
  // 마지막 메시지에 도구 호출이 있으면 → tools 노드로, 없으면 → 끝
  if ("tool_calls" in last && Array.isArray(last.tool_calls) && last.tool_calls.length > 0) {
    return "tools";
  }
  return END;
}

// 4) LLM 추론 노드
async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await model.invoke(state.messages);
  return { messages: [response] }; // MessagesAnnotation이 자동으로 이어붙임(append)
}

// 5) 그래프 조립 (싱글턴)
let compiled: ReturnType<typeof buildGraph> | null = null;

function buildGraph() {
  return new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")                      // 시작 → 추론
    .addConditionalEdges("agent", shouldContinue, ["tools", END]) // 추론 후 분기
    .addEdge("tools", "agent")                    // 도구 실행 후 → 다시 추론
    .compile();
}

export function getAgent() {
  if (!compiled) compiled = buildGraph();
  return compiled;
}
```

💡 **핵심 5조각**을 읽으세요: 모델+도구 바인딩 / 도구 노드 / 조건부 판단(`shouldContinue`) / 추론 노드(`callModel`) / 그래프 조립. `MessagesAnnotation`은 "메시지 배열을 상태로 들고 다니며 자동으로 이어붙이는" 프리빌트 상태예요.
🐍 `shouldContinue`가 Python LangGraph의 조건부 엣지 함수와 판박이입니다.

### 2-3. 먼저 UI 없이 콘솔에서 확인 (이해가 목적)

⌨️ 실습 — `chat-app/scripts/try-agent.ts` 새 파일

```ts
import "dotenv/config"; // .env.local의 키 로드용 (없으면 아래 주의 참고)
import { getAgent } from "../src/lib/agent";

async function main() {
  const agent = getAgent();
  const result = await agent.invoke({
    messages: [{ role: "user", content: "Day 4에서 useState 스냅샷이 뭐라고 했어? 출처도 알려줘." }],
  });
  // 마지막 메시지가 최종 답변
  const last = result.messages[result.messages.length - 1];
  console.log(last.content);
}
main();
```

⌨️ 실행

```bash
pnpm exec tsx scripts/try-agent.ts
```

→ 에이전트가 **추론 → `searchKnowledgeBase` 호출 → 결과 관찰 → 출처를 밝힌 최종 답변**을 내면, LangGraph 루프가 도는 겁니다. 🎉
⚠️ `.env.local` 키가 안 읽히면, 스크립트 실행 시 환경변수를 직접 주입하세요: `ANTHROPIC_API_KEY=... pnpm exec tsx scripts/try-agent.ts` (Next.js 밖 순수 스크립트라 `.env.local` 자동 로드가 안 될 수 있음).

💡 **UI 없이 먼저 콘솔에서** 그래프를 돌려본 이유: 스트리밍·화면 배선과 **에이전트 로직을 분리**해서, 그래프 자체를 또렷이 이해하기 위해서예요.

### 💡 지름길 — `createReactAgent` (참고)

사실 위 그래프는 아주 흔한 패턴이라, LangGraph가 **프리빌트**로 제공합니다.

📖 설명용 — 같은 걸 한 줄로 (읽기만)

```ts
import { createReactAgent } from "@langchain/langgraph/prebuilt";
const agent = createReactAgent({ llm: model, tools: agentTools });
```

**하지만 오늘 우리는 손으로 그래프를 짰습니다.** 이유는 Day 7과 같아요 — **직접 짜봐야 `createReactAgent` 안에서 무슨 일이 일어나는지 보이기 때문**입니다. 커스텀 분기·멀티 에이전트·HITL이 필요해지면 결국 StateGraph를 직접 다뤄야 하고요.

### ✅ 세션 2 체크
- [ ] StateGraph의 노드/조건부 엣지/상태를 설명 가능
- [ ] `shouldContinue`가 ReAct 루프의 "계속할까?"임을 이해
- [ ] 콘솔에서 에이전트가 도구를 쓰고 답하는 걸 확인
- [ ] Day 6 `stopWhen`과 오늘 그래프의 차이를 말할 수 있음

---

## 3. 세션 3 (오후) — Next.js에 스트리밍으로 붙이기

이제 그래프를 채팅 UI에 연결합니다. LangGraph 스트림을 **SSE로 흘려** 클라이언트가 토큰을 받게 해요. (Day 2의 스트림·`fetch` 지식이 여기서 쓰입니다.)

### 3-1. 에이전트 라우트

⌨️ 실습 — `chat-app/src/app/api/agent/route.ts` 새 파일

```ts
import { getAgent } from "@/lib/agent";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: { role: string; content: string }[] } = await req.json();
  const agent = getAgent();

  // streamMode "messages": 토큰 단위 메시지 청크를 흘림
  const stream = await agent.stream({ messages }, { streamMode: "messages" });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const [chunk] of stream) {
          // 텍스트 토큰만 흘려보냄(도구 호출 청크는 content가 비어있음)
          const text = typeof chunk?.content === "string" ? chunk.content : "";
          if (text) controller.enqueue(encoder.encode(text));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

💡 `agent.stream(..., { streamMode: "messages" })`는 `[메시지청크, 메타]` 튜플을 순회합니다. 우리는 **텍스트 토큰**(`chunk.content`)만 골라 SSE로 흘려요. (도구 실행 과정도 스트림에 오지만, 오늘은 최종 답 텍스트만 화면에 씁니다.)

### 3-2. 클라이언트 — 스트림 읽는 최소 훅

`useChat`(AI SDK 전용)을 대신할, 우리 SSE를 읽는 작은 훅을 만듭니다.

⌨️ 실습 — `chat-app/src/hooks/useAgentChat.ts` 새 파일

```ts
"use client";
import { useState } from "react";

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export function useAgentChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);

  const send = async (text: string) => {
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text };
    const botId = crypto.randomUUID();
    setMessages((prev) => [...prev, userMsg, { id: botId, role: "assistant", text: "" }]);
    setBusy(true);

    // 모델에 보낼 히스토리 (role/content 형태)
    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.text }));

    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });

    // 스트림을 조각조각 읽어 마지막 assistant 메시지에 이어붙임 (Day 2 스트림!)
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      setMessages((prev) =>
        prev.map((m) => (m.id === botId ? { ...m, text: m.text + chunk } : m))
      );
    }
    setBusy(false);
  };

  return { messages, send, busy };
}
```

### 3-3. 에이전트용 채팅 화면

⌨️ 실습 — `chat-app/src/components/AgentPanel.tsx` 새 파일

```tsx
"use client";
import { useState } from "react";
import { useAgentChat } from "../hooks/useAgentChat";
import ChatInput from "./ChatInput";
import { useAutoScroll } from "../hooks/useAutoScroll";

export default function AgentPanel() {
  const { messages, send, busy } = useAgentChat();
  const [input, setInput] = useState("");
  const bottomRef = useAutoScroll(messages);

  return (
    <div>
      <div className="flex flex-col gap-2 p-4 h-96 overflow-y-auto border rounded">
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
            <span className={"inline-block rounded-lg px-3 py-2 max-w-[80%] " +
              (m.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100")}>
              {m.text || "…"}
            </span>
          </div>
        ))}
      </div>
      <div ref={bottomRef} />
      {busy && <p className="text-sm text-gray-400">에이전트 작동 중…</p>}
      <ChatInput onSend={send} disabled={busy} input={input} setInput={setInput} />
    </div>
  );
}
```

⌨️ 실습 — `src/app/page.tsx`에서 `AgentPanel`을 쓰도록 교체 (또는 `/agent` 페이지 신설)

```tsx
import AgentPanel from "@/components/AgentPanel";

export default function HomePage() {
  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-xl font-bold mb-4">LangGraph 에이전트</h1>
      <AgentPanel />
    </main>
  );
}
```

⌨️ 실행 — `pnpm dev` 후 "Day 3에서 제네릭을 뭐라고 설명했어?"라고 물어보세요. **LangGraph 에이전트가 검색 도구를 쓰고, 답이 토큰 단위로 흐르면 통합 완성**입니다! 🎉

💡 이제 앱에 두 백엔드가 공존합니다: `/api/chat`(AI SDK, Day 6~8)와 `/api/agent`(LangGraph, 오늘). **같은 UI로 둘을 바꿔 써보며** "SDK식 vs 그래프식"을 직접 비교해 보세요.
📖 참고: 프로덕션에선 이 수동 SSE 대신 **LangGraph의 React SDK(`useStream`)**나 검증된 어댑터를 쓰기도 합니다. 오늘은 원리를 보려고 직접 짰어요.

### ✅ 세션 3 체크
- [ ] `/api/agent`가 LangGraph 스트림을 SSE로 흘림
- [ ] 커스텀 훅으로 토큰을 읽어 화면에 이어붙임
- [ ] 에이전트가 RAG 도구를 써서 출처 있는 답을 스트리밍

---

## 4. 세션 4 (오후) — (선택) 심화 · 배포 · 회고

### 4-1. (선택) 체크포인팅 — 대화 상태 유지

LangGraph는 **체크포인터**로 스레드별 대화 상태를 저장할 수 있습니다(다음 요청에서 이어감). 🐍 Python LangGraph의 `MemorySaver`와 동일.

📖 설명용 — 감만 잡기 (읽기만)

```ts
import { MemorySaver } from "@langchain/langgraph";
const checkpointer = new MemorySaver();
// buildGraph().compile({ checkpointer }) 후, invoke 시 configurable.thread_id로 스레드 지정
```

💡 시간이 없으면 건너뛰세요. "그래프에 메모리를 붙일 수 있다"만 알아두면 됩니다.

### 4-2. (선택) 관측 — LangSmith

`LANGCHAIN_TRACING_V2=true` + `LANGCHAIN_API_KEY`를 설정하면, 에이전트의 **모든 스텝(어떤 도구를 왜 호출했는지)**이 LangSmith에 자동 기록됩니다. "에이전트가 왜 그렇게 했지?" 디버깅에 필수예요. (계정 필요, 선택)

### 4-3. 배포 — Vercel

⌨️ 실습 — 가장 간단한 방법: GitHub에 푸시 후 [vercel.com](https://vercel.com)에서 저장소 연결. 또는 CLI:

```bash
pnpm dlx vercel
```

⚠️ **환경 변수**: Vercel 대시보드(Settings → Environment Variables)에 `ANTHROPIC_API_KEY`를 등록하세요. `.env.local`은 배포에 안 올라갑니다.

⚠️⚠️ **로컬 임베딩의 배포 함정 (중요)**: Day 7~8에서 쓴 `@huggingface/transformers`(로컬 임베딩)는 **네이티브 모듈 + 큰 용량** 때문에 Vercel **서버리스 함수에서 잘 안 돕니다**(번들 크기·콜드스타트 한계). 배포 시 선택지:
- **(a) 임베딩을 API로 교체**: RAG 부분만 OpenAI/Voyage 등 **호스팅 임베딩**으로 바꿔 배포 (LangChain은 임베딩 한 줄 교체로 가능 — Day 8 §4-3의 "인터페이스 동일" 원리).
- **(b) RAG 없이 배포**: 도구 중 `searchKnowledgeBase`만 빼고 에이전트 배포.
- **(c) 다른 런타임**: 임베딩을 별도 서버/컨테이너로 분리.

💡 이건 **서버리스의 현실적 제약**을 배우는 좋은 기회예요. 로컬 학습엔 로컬 임베딩이 최고지만, 배포엔 호스팅 임베딩이 편합니다. 배포가 오늘 목표가 아니면 **로컬에서 도는 것으로 충분**합니다.

### 4-4. 🎉 9일 회고

당신이 9일 동안 만든 것:

- **Day 0~3**: JS·비동기·모듈·TypeScript 기초 (Python에서 번역)
- **Day 4~5**: React 선언형 UI + Next.js(서버/클라이언트) 위에 채팅 UI
- **Day 6**: Vercel AI SDK로 스트리밍 챗봇 + 도구 호출
- **Day 7**: RAG를 **손으로** 구현 (임베딩·코사인·검색)
- **Day 8**: 같은 RAG를 **LangChain.js**로 교체 (프레임워크 대조)
- **Day 9**: 도구 루프를 **LangGraph 상태 그래프**로 재구성 + RAG 통합 + 스트리밍 + 배포

무엇보다, **"직접 구현 → 프레임워크"**를 두 번(RAG·에이전트) 경험하며 **프레임워크 내부가 안 보이는 블랙박스가 아니게** 됐습니다. 이게 이 커리큘럼의 진짜 목표였어요.

### 4-5. 다음 학습 방향 (참고)

- **에이전트 심화**: LangGraph 멀티 에이전트, HITL(도구 승인), 체크포인팅 영속화
- **RAG 심화**: 하이브리드 검색, 리랭킹, pgvector 등 프로덕션 벡터DB
- **관측/평가**: LangSmith, eval 파이프라인
- **상태/인증/DB**: TanStack Query, Auth.js, Drizzle + Postgres
- **테스트**: Vitest, Playwright

---

## 5. 🎯 오늘 만난 에러 읽는 법

| 메시지 | 뜻 | 해결 |
|--------|-----|------|
| `Cannot find module '@langchain/langgraph/prebuilt'` | 경로/버전 | 설치 확인, 현재 문서의 경로 확인 |
| `model.bindTools is not a function` | 모델 인스턴스 문제 | `new ChatAnthropic(...)` 인스턴스에 `.bindTools` |
| 무한 루프 / 스텝 폭주 | 조건부 엣지가 END로 못 감 | `shouldContinue`가 도구 없을 때 `END` 반환하는지 |
| 배포 후 임베딩 에러 | 서버리스에서 로컬 모델 실패 | §4-3의 (a)~(c) 참고 |
| 스트림이 안 흐름 | streamMode/content 처리 | `streamMode: "messages"`, `chunk.content` 확인 |

---

## 6. ✅ Day 9 최종 체크리스트

- [ ] Day 6/8 도구를 LangChain 형식(`tool(fn, { name, schema })`)으로 이식
- [ ] Day 8 리트리버를 에이전트 도구로 통합 (RAG 완전 통합)
- [ ] `StateGraph` + `ToolNode` + 조건부 엣지로 ReAct 루프 구성
- [ ] 콘솔 스크립트로 에이전트 동작 확인
- [ ] `/api/agent`로 LangGraph 응답을 SSE 스트리밍
- [ ] 커스텀 훅으로 UI에 토큰 스트리밍
- [ ] "AI SDK 도구 루프 vs LangGraph 그래프" 차이 설명 가능
- [ ] (선택) 배포 + 임베딩 서버리스 제약 이해

---

## 7. git 커밋 (마지막!)

⌨️ 실습 — `chat-app/`에서

```bash
git add .
git commit -m "Day 9: LangGraph.js 에이전트 + RAG 통합 + 스트리밍 + 배포 (9일 완성)"
git push
```

---

## 부록 — AI SDK ↔ LangGraph 에이전트 치트시트

| 개념 | 🟨 AI SDK (Day 6) | 🟨 LangGraph (Day 9) |
|------|-------------------|----------------------|
| 모델 | `anthropic("...")` | `new ChatAnthropic({ model })` |
| 도구 정의 | `tool({ description, inputSchema, execute })` | `tool(fn, { name, description, schema })` |
| 도구 바인딩 | `streamText({ tools })` | `model.bindTools(tools)` |
| 도구 실행 | SDK 내부 | `ToolNode` |
| 루프 제어 | `stopWhen: stepCountIs(N)` | 조건부 엣지(`shouldContinue`) |
| 상태 | 메시지 배열(내부) | `MessagesAnnotation` |
| 실행 | `streamText(...)` | `graph.invoke/stream(...)` |
| UI 스트리밍 | `useChat` + `toUIMessageStreamResponse` | `streamMode:"messages"` → SSE → 커스텀 훅 |

---

🎉 **9일 완주를 축하합니다.** Python 개발자에서 시작해, JS/TS를 익히고, React·Next.js 위에 스트리밍 챗봇을 세우고, RAG를 손으로 짠 뒤 LangChain으로 바꾸고, 에이전트를 LangGraph 그래프로 재구성해 전부 통합했습니다. 이제 프레임워크는 당신에게 블랙박스가 아닙니다. 🟨
