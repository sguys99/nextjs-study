// Day 6에서 진짜 LLM 스트리밍으로 교체될 stub
export async function POST(request: Request) {
    const body = await request.json(); // 기대하는 형태: { messages: [{ role, text }, ...] }
    const lastText = body.messages?.at(-1)?.text ?? ""; // 배열의 마지막 원소 꺼냄, ?: 앞이 null이면 undefined 리턴, ??. 널이면 ""반환

    return Response.json({
    reply: `(stub) "${lastText}" 잘 받았어요. Day 6에서 진짜 AI가 답합니다.`,
  });
}

// request/Response는 웹 표준 객체