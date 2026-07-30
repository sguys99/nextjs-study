// src/lib/tools.ts
import { tool } from "ai";
import { z } from "zod";
import { searchChunks } from "@/lib/rag/store";

/** ① 현재 시각 — 가장 단순한 도구 (LLM이 모르는 정보) */

export const getCurrentTime = tool({
    description:
    "현재 날짜와 시각을 알려준다. 사용자가 '지금', '오늘', '며칠' 등을 물으면 사용한다.",
    inputSchema: z.object({
        timeZone: z.string().optional().describe("IANA 타임존 (예: Asia/Seoul). 생략하면 Asia/Seoul"),
    }),
    execute: async ({timeZone = "Asia/Seoul"}) =>{
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

export const searchKnowledgeBase = tool({
  description: `학습 자료 지식베이스(JS/TS/React/Next.js 7일 학습 문서)를 검색한다.
사용자가 학습 내용, 특정 개념, "Day N에서 뭐라고 했지" 같은 질문을 하면 반드시 이 도구를 사용한다.
답을 지어내지 말고 먼저 검색하라. 필요하면 다른 키워드로 여러 번 검색해도 된다.`,
  inputSchema: z.object({
    query: z
      .string()
      .describe("검색어. 사용자 질문을 그대로 쓰기보다 핵심 키워드 위주로 재작성한다."),
    topK: z.number().int().min(1).max(8).default(4)
      .describe("가져올 문서 조각 수"),
  }),
  execute: async ({ query, topK }) => {
    const results = await searchChunks(query, { topK });

    if (results.length === 0) {
      return { found: false, message: "관련 내용을 찾지 못했습니다.", results: [] };
    }

    return {
      found: true,
      results: results.map((r) => ({
        source: r.source,
        heading: r.heading,
        score: Number(r.score.toFixed(3)),
        // ⚠️ 토큰 절약: 너무 긴 청크는 자른다
        text: r.text.slice(0, 1000),
      })),
    };
  },
});

export const chatTools = {
  getCurrentTime,
  calculate,
  getGithubUser,
  searchKnowledgeBase,     // 🆕
};