// exercise/types.ts
// GitHub API 응답 중 "우리가 쓰는 필드만" 타이핑

export interface GitHubUser {
  login: string;
  name: string | null; // 이름 미설정 유저가 있음
  public_repos: number;
  followers: number;
  created_at: string; // ISO 날짜 문자열
}

export interface GitHubRepo {
  name: string;
  stargazers_count: number;
  language: string | null; // 언어 감지 안 된 저장소가 있음
  updated_at: string;
}

// 전체 응답을 다 타이핑할 필요 없습니다. 
// TS는 구조적 타이핑이라, 
// 실제 응답에 필드가 더 있어도 "선언한 필드가 맞는 모양으로 존재하는가"만 봅니다. 
// 쓰는 것만 선언하는 게 실무 관행이에요.
