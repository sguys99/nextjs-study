import Link from "next/link";

export default function HomePage() {
  return (
    <main className="p-8">  {/* 본문, 페이지당 1게 */}
      <h1 className="text-2xl font-bold">홈</h1> {/* 제목*/}
      <Link href="/about" className="text-blue-600 underline">
        소개 페이지로 →
      </Link>
    </main>
  );
}