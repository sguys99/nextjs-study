// 마크다운을 의미 단위로 자르기

// src/lib/rag/chunk.ts
import type { Chunk } from "./types";

const MAX_CHARS = 1200;   // 청크 최대 길이
const OVERLAP = 150;      // 청크 간 겹침 (문맥 끊김 방지)

/**
 * 마크다운을 헤딩 기준으로 나누고, 너무 긴 섹션은 문단 단위로 다시 자른다.
 * 🐍 LangChain의 MarkdownHeaderTextSplitter + RecursiveCharacterTextSplitter를
 *    직접 구현한 것. 로직이 눈에 보이는 게 학습엔 낫습니다.
 */
export function chunkMarkdown(text: string, source: string): Chunk[] {
  const lines = text.split("\n");
  const sections: { heading: string; body: string[] }[] = [];
  let current = { heading: "(문서 시작)", body: [] as string[] };

  for (const line of lines) {
    const match = /^(#{1,3})\s+(.*)$/.exec(line);   // #, ##, ### 만 경계로
    if (match) {
      if (current.body.length > 0) sections.push(current);
      current = { heading: match[2].trim(), body: [] };
    } else {
      current.body.push(line);
    }
  }
  if (current.body.length > 0) sections.push(current);

  const chunks: Chunk[] = [];
  let index = 0;

  for (const section of sections) {
    const body = section.body.join("\n").trim();
    if (body.length < 30) continue;   // 너무 짧으면 버림

    for (const piece of splitLong(body, MAX_CHARS, OVERLAP)) {
      chunks.push({
        id: `${source}#${index}`,
        // ⭐ 헤딩을 본문 앞에 붙인다 — 임베딩 품질이 눈에 띄게 좋아짐
        text: `[${source} > ${section.heading}]\n${piece}`,
        source,
        heading: section.heading,
        index,
      });
      index += 1;
    }
  }

  return chunks;
}

/**
 * 문자열 뒤에서 n 코드유닛을 잘라내되, 서로게이트 페어(이모지)를 반토막 내지 않는다.
 *
 * ⚠️ JS 문자열은 UTF-16이라 slice()가 "코드 유닛" 단위로 자른다.
 *    🆕(U+1F195)는 \ud83c + \udd95 두 유닛이라 경계에서 잘리면 짝 잃은 서로게이트가 남고,
 *    이건 유효한 UTF-8로 인코딩할 수 없어서 임베딩 API가 400을 뱉는다.
 * 🐍 파이썬 str은 코드포인트 단위라 이 문제가 아예 없다. JS 고유의 함정.
 */
function tailSlice(text: string, n: number): string {
  const piece = text.slice(-n);
  const first = piece.charCodeAt(0);
  // 첫 글자가 하위 서로게이트(\uDC00~\uDFFF)면 짝을 잃은 것 → 한 칸 버린다
  return first >= 0xdc00 && first <= 0xdfff ? piece.slice(1) : piece;
}

/** 긴 텍스트를 문단 경계를 존중하며 자르고, 앞부분을 조금 겹쳐준다 */
function splitLong(text: string, maxChars: number, overlap: number): string[] {
  if (text.length <= maxChars) return [text];

  const paragraphs = text.split(/\n{2,}/);
  const out: string[] = [];
  let buf = "";

  for (const p of paragraphs) {
    if (buf.length + p.length + 2 > maxChars && buf.length > 0) {
      out.push(buf.trim());
      buf = tailSlice(buf, overlap) + "\n\n" + p;   // ← 겹침
    } else {
      buf += (buf ? "\n\n" : "") + p;
    }
  }
  if (buf.trim()) out.push(buf.trim());

  return out;
}