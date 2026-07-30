const experiments = [
  { model: "baseline", acc: 0.71, params: 1_200_000, ok: true },
  { model: "resnet-lite", acc: 0.86, params: 5_400_000, ok: true },
  { model: "broken-run", acc: 0.0, params: 5_400_000, ok: false },
  { model: "transformer-s", acc: 0.93, params: 22_000_000, ok: true },
];

// 1) 실패한 실험 제외
const valid = experiments.filter((e) => e.ok);

// 2) 정확도 내림차순 정렬 (sort는 원본을 바꾸므로 복사 후 정렬)
const ranked = [...valid].sort((a, b) => b.acc - a.acc);

// 3) 보기 좋은 문자열로 변환
const lines = ranked.map(
  (e, i) => `${i + 1}위 ${e.model}: acc ${(e.acc * 100).toFixed(1)}%`,
);

// 4) 집계
const best = ranked[0];
const avgAcc = valid.reduce((sum, e) => sum + e.acc, 0) / valid.length;

console.log("=== 유효 실험 순위 ===");
lines.forEach((line) => console.log(line));
console.log(`\n최고 모델: ${best.model}`);
console.log(`평균 정확도: ${(avgAcc * 100).toFixed(1)}%`);
