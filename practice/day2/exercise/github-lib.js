// 모듈 분리 + async/await + fetch + Promise.all + Day 1의 map/filter/reduce. 실습
// GitHub 사용자 한 명을 조회 (에러 처리 포함)

export const fetchUser = async (username) => {
  const res = await fetch(`https://api.github.com/users/${username}`);
  if (!res.ok) throw new Error(`${username}: ${res.status}`);
  return res.json();
};

// 여러 명을 병렬 조회 (실패는 건너뛰고 성공한 것만)
export const fetchUsers = async (names) => {
  const results = await Promise.allSettled(names.map((n) => fetchUser(n)));
  return results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);
};