import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">소개 페이지입니다.</h1>
      <Link href="/" className="text-blue-600 underline">
        홈 페이지로 →
      </Link>
    </main>
  );
}
