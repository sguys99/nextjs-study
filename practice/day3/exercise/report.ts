import { fetchUsers } from "./api";
import type { GitHubUser } from "./types";

const rank = (users: GitHubUser[]): GitHubUser[] =>
  [...users].sort((a, b) => b.followers - a.followers);

const main = async () => {
  const names = ["torvalds", "gaearon", "sindresorhus", "존재하지않는유저999"];
  const users = await fetchUsers(names);

  console.log("=== 팔로워 순위 ===");
  rank(users).forEach((u, i) =>
    console.log(`${i + 1}위 ${u.login}: 팔로워 ${u.followers}, 저장소 ${u.public_repos}`)
  );

  const totalRepos = users.reduce((sum, u) => sum + u.public_repos, 0);
  console.log(`\n성공 ${users.length}/${names.length}, 저장소 총합 ${totalRepos}`);
};

main();