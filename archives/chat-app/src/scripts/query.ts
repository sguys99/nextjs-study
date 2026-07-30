// src/scripts/query.ts
import "dotenv/config";
import { searchChunks } from "@/lib/rag/store";

async function main() {
  const query = process.argv.slice(2).join(" "); // slice(2): pnpm, query 다음 인자 사용

  if (!query) {
    console.error("사용법: pnpm query <질문>");
    process.exit(1);
  }

  const results = await searchChunks(query, { topK: 5, minScore: 0 });

  console.log(`\n🔍 "${query}"\n`);
  for (const r of results) {
    console.log(`[${r.score.toFixed(3)}] ${r.source} > ${r.heading}`); // source: 청크의 원본 파일명, heading: 이 청크가 속한 마크다운 제목
    console.log(`   ${r.text.replace(/\n/g, " ").slice(0, 120)}…\n`); //  청크 미리보기
  }
}

main().catch((err) => {
  console.error("❌ 검색 실패:", err);
  process.exit(1);
});
