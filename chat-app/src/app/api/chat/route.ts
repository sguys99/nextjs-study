// Day 6에서 진짜 LLM 스트리밍으로 교체될 stub
export async function POST(request: Request) {
    const body = await request.json();
    const lastText = body.messages?.at(-1)?.text ?? "";

    return Response.json({
    reply: `(stub) "${lastText}" 잘 받았어요. Day 6에서 진짜 AI가 답합니다.`,
  });
}