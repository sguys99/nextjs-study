// src/app/about/page.tsx
async function saveNote(formData: FormData) {
  "use server";                              // ← 이 함수는 서버에서만 실행됨
  const text = formData.get("text");
  console.log("서버에 저장:", text);          // 터미널에 찍힘
  // await db.insert(...)
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* ⬇️ 1-5에서 만든 부분 — 그대로 유지 */}
      <h1 className="text-xl font-semibold">소개</h1>
      <p className="mt-2 text-sm text-gray-600">
        7일 학습 로드맵으로 만드는 채팅 앱입니다.
      </p>

      {/* ⬇️ 여기부터가 새로 추가되는 Server Action 폼 */}
      <form action={saveNote} className="mt-6 space-y-2">
        <input name="text" className="w-full rounded border px-3 py-2" />
        <button className="rounded bg-blue-600 px-4 py-2 text-white">저장</button>
      </form>
    </div>
  );
}