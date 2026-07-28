// src/app/page.tsx  (서버 컴포넌트)
import { ClientBox } from "@/components/ClientBox";

export default async function Home() {
  console.log("🖥️ 서버에서 실행됨:", new Date().toISOString());

  // 서버에서 직접 데이터 페칭 — useEffect도 useState도 없다!
  const res = await fetch("https://api.github.com/users/torvalds", {
    cache: "no-store",
  });
  const user = await res.json();

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <p className="text-sm">
        서버가 가져온 값: <b>{user.name}</b> (팔로워 {user.followers})
      </p>
      <ClientBox />
    </div>
  );
}