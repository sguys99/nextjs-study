import Link from "next/link";
import ChatPanel from "@/components/ChatPanel";

// 이 파일은 서버 컴포넌트 (지시문 없음 = 기본값).
// 상태를 가진 ChatPanel만 클라이언트 → "검문소는 깊고 작은 곳에" 원칙
export default function HomePage() {
  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-xl font-bold mb-4">내 채팅 앱</h1>
      <ChatPanel />
      <Link href="/about" className="text-blue-600 underline text-sm">
        소개 페이지로 →
      </Link>
    </main>
  );
}