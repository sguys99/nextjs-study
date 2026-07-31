// 3-2
const getUser = async (username) => {
  const res = await fetch(`https://api.github.com/users/${username}`);
  if (!res.ok) {
    throw new Error(`요청 실패: ${res.status}`); // 404 등을 직접 에러로
  }
  return res.json();
};

const main = async () => {
  try {
    //const user = await getUser("torvalds");
    const user = await getUser("이런사용자없음");
    console.log(`${user.login}: 공개 저장소 ${user.public_repos}개`);
  } catch (err) {
    console.error("에러:", err.message);
  }
};
main();

// 병렬 처리 3-3

const compare  = async () => {
    const names = ["tovalds", "gaearon", "sindresorhus"];
    const users = await Promise.all(names.map((n) => getUser(n)));
    users.forEach((u) => console.log(`${u.login}: ${u.followers} 팔로워`));
};
compare();