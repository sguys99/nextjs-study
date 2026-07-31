import { fetchUsers } from "./github-lib.js";

const names = ["torvalds", "gaearon", "sindresorhus", "존재하지않는유저999"];

const main = async () => {
  const users = await fetchUsers(names);

  const ranked = [...users].sort((a, b) => b.followers - a.followers);
  const totalRepos = users.reduce((sum, u) => sum + u.public_repos, 0);

  console.log("=== 팔로워 순위 ===");
  ranked.forEach((u, i) =>
    console.log(`${i + 1}위 ${u.login}: 팔로워 ${u.followers}, 저장소 ${u.public_repos}`)
  );
  console.log(`\n조회 성공: ${users.length}/${names.length}명`);
  console.log(`공개 저장소 총합: ${totalRepos}`);
};

main();