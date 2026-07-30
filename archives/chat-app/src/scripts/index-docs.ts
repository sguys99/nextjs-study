// src/scripts/index-docs.ts
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import { chunkMarkdown } from "@/lib/rag/chunk";
import { embedTexts } from "@/lib/rag/embedding";
import type { EmbeddedChunk, VectorStore } from "@/lib/rag/types";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const OUT_PATH = path.join(process.cwd(), "data", "vector-store.json");

// ⚠️ Voyage 무료 티어(결제수단 미등록): 3 RPM / 10K TPM
//    → 요청당 청크를 줄이고(BATCH), 요청 사이에 쉰다(DELAY_MS).
//    결제수단 등록 후에는 BATCH=50, DELAY_MS=0 으로 되돌리면 훨씬 빠름.
const BATCH = Number(process.env.INDEX_BATCH ?? 4);        // 한 번에 임베딩할 청크 수
const DELAY_MS = Number(process.env.INDEX_DELAY_MS ?? 20_000);  // 배치 사이 대기 (3 RPM ≈ 20초)

async function main() {
  // ① 로드
  const files = (await readdir(KNOWLEDGE_DIR)).filter((f) => f.endsWith(".md"));
  console.log(`📄 문서 ${files.length}개 발견`);

  // ② 청킹
  const allChunks = [];
  for (const file of files) {
    const raw = await readFile(path.join(KNOWLEDGE_DIR, file), "utf-8");
    const chunks = chunkMarkdown(raw, file);
    console.log(`  - ${file}: ${chunks.length} 청크`);
    allChunks.push(...chunks);
  }
  console.log(`✂️  총 ${allChunks.length} 청크`);

  // ③ 임베딩 (배치로 나눠서 + rate limit 대응)
  const embedded: EmbeddedChunk[] = [];
  const totalBatches = Math.ceil(allChunks.length / BATCH);
  const startedAt = Date.now();

  for (let i = 0; i < allChunks.length; i += BATCH) {
    const batch = allChunks.slice(i, i + BATCH);
    const vectors = await embedTexts(batch.map((c) => c.text));

    batch.forEach((chunk, j) => {
      embedded.push({ ...chunk, embedding: vectors[j] });
    });

    const done = Math.min(i + BATCH, allChunks.length);
    const batchNo = Math.floor(i / BATCH) + 1;
    const elapsed = Math.round((Date.now() - startedAt) / 1000);
    const eta = Math.round((elapsed / batchNo) * (totalBatches - batchNo));
    console.log(
      `🧮 임베딩 ${done}/${allChunks.length}  (배치 ${batchNo}/${totalBatches}, 경과 ${elapsed}s, 남은 시간 ~${eta}s)`,
    );

    // 마지막 배치 뒤엔 쉴 필요 없음
    if (DELAY_MS > 0 && done < allChunks.length) await sleep(DELAY_MS);
  }

  // ④ 저장
  const store: VectorStore = {
    model: "voyage-3-lite",
    dimensions: embedded[0]?.embedding.length ?? 0,
    createdAt: new Date().toISOString(),
    chunks: embedded,
  };

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(store), "utf-8");

  console.log(`\n✅ 저장 완료: ${OUT_PATH}`);
  console.log(`   차원: ${store.dimensions}, 청크: ${store.chunks.length}개`);
}

main().catch((err) => {
  console.error("❌ 인덱싱 실패:", err);
  process.exit(1);
});