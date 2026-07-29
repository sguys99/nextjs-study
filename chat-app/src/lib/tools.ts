// src/lib/tools.ts
import { tool } from "ai";
import { z } from "zod";

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

export const chatTools = { getCurrentTime, calculate, getGithubUser };