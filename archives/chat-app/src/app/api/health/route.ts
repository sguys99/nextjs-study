// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: "ok", 
    at: new Date().toISOString(),
    app: process.env.NEXT_PUBLIC_APP_NAME,
  });
}