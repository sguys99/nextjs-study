import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";                    // ① 추가: 클라이언트 사이드 네비게이션용
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chat App",                             // ② 수정: 기본값 "Create Next App"에서 변경
  description: "7일 학습 프로젝트",               // ② 수정
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;   // ← Day 4에서 배운 children!
}>) {
  return (
    <html
      lang="ko"                                  // ③ 수정: en → ko
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-gray-900">
        {/* ④ 추가: 모든 페이지에 공통으로 붙을 상단 네비게이션 */}
        <header className="flex items-center gap-4 border-b px-6 py-3">
          <Link href="/" className="font-semibold">
            💬 Chat
          </Link>
          <nav className="flex gap-3 text-sm text-gray-600">
            <Link href="/about" className="hover:text-gray-900">
              소개
            </Link>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
