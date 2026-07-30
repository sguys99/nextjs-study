// exercise/github-report.js
import { format } from "date-fns";
import { fetchUsers } from "./github-lib.js";

const USERNAMES = ["torvalds", "gvanrossum", "sguys99"]; // 리누스, 귀도, You


async function main() {
    try {
        // 1) 세명 병렬로 동시 조회
        const users = await fetchUsers(USERNAMES);

    // 2) 팔로워 많은 순으로 정렬 (Day 1 배열 메서드 복습)
    const ranked = [...users].sort((a, b) => b.followers - a.followers);        

    // 3) 리포트 출력
    console.log("=== GitHub 개발자 리포트 ===\n");
    ranked.forEach((u, i) => {
      const joined = format(new Date(u.createdAt), "yyyy년 M월");
      console.log(
        `${i + 1}. ${u.name} (@${u.login})\n` +
          `   팔로워 ${u.followers.toLocaleString()}명 · 공개 저장소 ${u.repos}개 · 가입 ${joined}`
      );
    });

    // 4) 집계 (reduce)
    const totalFollowers = users.reduce((acc, u) => acc + u.followers, 0);
    console.log(`\n총 팔로워 합계: ${totalFollowers.toLocaleString()}명`);
  } catch (err) {
    console.error("리포트 생성 실패:", err.message);
  }
}

main();