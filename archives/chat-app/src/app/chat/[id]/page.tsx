// src/app/chat/[id]/page.tsx
type PageProps = {
  params: Promise<{ id: string }>;          // ⚠️ Next.js 16: Promise!
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
};

export default async function ChatDetailPage({ params }: PageProps) {
  const { id } = await params;              // ⚠️ await 필수
  return <div className="p-6">대화 ID: {id}</div>;
}