interface User {
  login: string;
  followers: number;
  bio: string | null;      // null일 수도 있음
}

// type으로도 거의 같은 걸 표현
type Point = {
  x: number;
  y: number;
};

const u: User = { login: "torvalds", followers: 100, bio: null };
console.log(u.login);

// 실무 관례: 객체 모양엔 interface, 그 외(유니온·별칭 등)엔 type. 헷갈리면 둘 중 아무거나 써도 대부분 문제없어요. Day 4부터는 React 관례를 따라 interface를 주로 씁니다.

//-----------
// 2-2. 유니온 |, 인터섹션 &, 리터럴 타입

type Status = "idle" | "loading" | "success" | "error"; // 이 4개만 허용
let s: Status = "loading";
// s = "wrong";   // ❌ 에러: 4개 중에 없음

type Id = string | number;   // 유니온

type WithTimestamp = {createdAt: number};
type Post = {title: string} & WithTimestamp; // 인터섹션, 합침
const p: Post = {title: "안녕", createdAt: 123};

console.log(p);

// ----------
// 2-3. 옵셔널 ?, 옵셔널 체이닝 ?., null 병합 ??
// ?: 있어도 되고 없어도 되는 속성 (🐍 Optional/기본값 없는 필드)
// ?.: 앞이 null/undefined면 에러 대신 undefined 반환
// ??: 왼쪽이 null/undefined면 오른쪽 값 사용

interface Profile {
  name: string;
  nickname?: string;      // 옵셔널 (없을 수 있음)
}

const printName = (p: Profile) => {
    console.log(p.nickname ?? p.name);
};
printName({ name: "광명" });                    // 광명
printName({ name: "광명", nickname: "KM" });    // KM