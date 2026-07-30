// exercise/model-report.js
// 모델 실험 기록을 변환·집계하는 리포트 스크립트

const runs = [
  { name: "baseline", accuracy: 0.81, params: 1_200_000 },
  { name: "resnet", accuracy: 0.93, params: 25_000_000 },
  { name: "tiny-cnn", accuracy: 0.76, params: 300_000 },
  { name: "vit", accuracy: 0.95, params: 86_000_000 },
];

// 1) accuracy 0.9 이상만 추리기
const strong = runs.filter((r) => r.accuracy >= 0.9);

// 2) "이름: 정확도%" 형태 문자열로 변환
const labels = strong.map(
  (r) => `${r.name}: ${(r.accuracy * 100).toFixed(1)}%`,
);

// 3) 전체 평균 정확도, 0은 초기 값
const avgAccuracy = runs.reduce((acc, r) => acc + r.accuracy, 0) / runs.length;

// 4) 가장 정확한 모델 찾기
const best = runs.reduce((a, b) => (b.accuracy > a.accuracy ? b : a));

// 5) 출력
console.log("=== 모델 리포트 ===");
console.log("강한 모델(≥0.9):", labels);
console.log("평균 정확도:", avgAccuracy.toFixed(3));
console.log(
  "최고 모델:",
  `${best.name} (${(best.accuracy * 100).toFixed(1)}%)`,
);
