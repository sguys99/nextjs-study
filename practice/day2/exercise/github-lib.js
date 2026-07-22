// exercise/github-lib.js
// GitHub 사용자 정보를 가져오는 로직 모음 (재사용 가능한 모듈)

// 사용자 한 명을 안전하게 조회 (res.ok 확인 포함)

export async function fetchUser(username) {
  const res = await fetch(`https://api.github.com/users/${username}`);
  if (!res.ok) {
    throw new Error(`'${username}' 조회 실패: ${res.status}`);
  }
  const data = await res.json();

  return {
    name: data.name ?? data.login, // 이름 없으면 로그인 아이디
    login: data.login,
    repos: data.public_repos,
    followers: data.followers,
    createdAt: data.created_at,
  };
}

// 여러명을 병렬로 조회(promise.all)
export async function fetchUsers(usernames){
  return Promise.all(usernames.map((name) => fetchUser(name)));
}