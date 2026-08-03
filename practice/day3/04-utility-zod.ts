// 4-1 유틸리티 타입


// 4-2 Zod — "타입이 런타임에 사라지는" 문제의 해결책 
// "런타임에도 살아있는 타입 검사기"

import {z} from "zod";

const UserSchema = z.object({
    login: z.string(),
    followers: z.number(),
    bio: z.string().nullable(), // string 또는 null
})

// 스키마에서 TS 타입을 자동 추출
type User = z.infer<typeof UserSchema>;

// 런타임 검증: 맞으면 타입 붙은 값, 틀리면 에러 throw
const raw: unknown = {login: "tovalds", followers: 100, bio: null};
const user: User = UserSchema.parse(raw);
console.log(user.login, user.followers);
// z.infer<typeof UserSchema>로 스키마 하나에서 타입과 검증을 동시에 얻습니다. 
// 타입을 따로, 검증을 따로 관리할 필요가 없어요. ⚠️ 검증에 실패하면 .parse는 에러를 던집니다. 
// 던지지 않고 결과를 받고 싶으면 .safeParse(성공/실패를 객체로 반환)를 쓰세요.