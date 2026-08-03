import {z} from "zod";

// Github 사용자 응답 중 우리가 쓸 필드만 스키마로
export const GitHubUserSchema = z.object({
    login: z.string(),
    followers: z.number(),
    public_repos: z.number(),
});

// 스키마에서 타입 추출
export type GitHubUser = z.infer<typeof GitHubUserSchema>;