import { GitHubUserSchema, type GitHubUser } from "./types";

// 한 명 조회 + Zod 검증
export const fetchUser = async (username: string): Promise<GitHubUser> => {
  const res = await fetch(`https://api.github.com/users/${username}`);
  if (!res.ok) throw new Error(`${username}: ${res.status}`);
  const raw: unknown = await res.json();     // res.json()은 unknown 취급
  return GitHubUserSchema.parse(raw);        // 검증 통과해야 GitHubUser로
};

// 여러 명 병렬 조회 (실패는 제외)
export const fetchUsers = async (names: string[]): Promise<GitHubUser[]> => {
  const results = await Promise.allSettled(names.map((n) => fetchUser(n)));
  return results
    .filter((r): r is PromiseFulfilledResult<GitHubUser> => r.status === "fulfilled")
    .map((r) => r.value);
};