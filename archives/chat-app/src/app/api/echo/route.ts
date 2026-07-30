// src/app/api/echo/route.ts
export async function POST(req: Request) {
  const body = await req.json();

  if (typeof body.message !== "string") {
    return Response.json({ error: "message는 문자열이어야 합니다" }, { status: 400 });
  }

  return Response.json({ echo: body.message.toUpperCase() });
}