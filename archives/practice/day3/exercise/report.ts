// exercise/report.ts
import { fetchJson } from "./api.ts";
import type { GitHubUser, GitHubRepo } from "./types.ts";

const USERNAME = "vercel";

// 제네릭 유틸: score 기준 상위 k개 
// (⭐ Day 7 RAG의 top-k 검색이 정확히 이 함수)
function topK<T>(items: T[], k: number, score: (item: T) => number): T[] {
  return [...items].sort((a, b) => score(b) - score(a)).slice(0, k);
}

async function main(): Promise<void> {
    // 병렬 호출 — Promise.all이 [GitHubUser, GitHubRepo[]] 튜플 타입을 유지
    const [user, repos] = await Promise.all([
    fetchJson<GitHubUser>(`https://api.github.com/users/${USERNAME}`),
    fetchJson<GitHubRepo[]>(
      `https://api.github.com/users/${USERNAME}/repos?per_page=100`
    ),
  ]);

  // 스타 상위 3개
  const top3 = topK(repos, 3, (r) => r.stargazers_count);

  // 총 스타 수 (reduce의 acc/r 타입이 전부 추론됨)
  const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0);

  // 사용 언어 목록 — 커스텀 타입 가드로 null 제거 (세션 3의 narrowing 실전!)
  const languages = [
    ...new Set(
      repos.map((r) => r.language).filter((l): l is string => l !== null)
    ),
  ];

  console.log(`=== ${user.name ?? user.login} 리포트 ===`); // ?? 실전 사용
  console.log(`팔로워: ${user.followers.toLocaleString()}명`);
  console.log(`공개 저장소: ${user.public_repos}개 / 총 ⭐ ${totalStars.toLocaleString()}`);
  console.log(`주요 언어: ${languages.slice(0, 5).join(", ")}`);
  console.log("스타 Top 3:");
  for (const r of top3) {
    console.log(`  - ${r.name} (⭐ ${r.stargazers_count.toLocaleString()})`);
  }  
}

main().catch((err: unknown) => {
  // catch의 err는 unknown — narrowing으로 안전하게 처리 (세션 1의 unknown 실전!)
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});