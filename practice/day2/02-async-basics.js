// // 2-1
// console.log("1");
// setTimeout(() => console.log("2 (나중에)"), 0);
// console.log("3");
// // 출력순서: 1, 3, 2

// // 2-2

// const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// const p = wait(1000);
// console.log(p);                          // Promise { <pending> }  ← 아직 안 익음
// setTimeout(() => console.log(p), 1500);  // Promise { undefined }  ← 다 익음(fulfilled)

// 2-3
// (A) .then 체이닝
// const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// const run = async () => {
//   console.log("시작");
//   await wait(1000);          // 1초 기다림
//   console.log("1초 뒤");
// };
// run();

// 연습문제
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const countdown = async () => {
  for (let n = 3; n >= 1; n--) {
    console.log(n);
    await wait(1000);
  }
  console.log("발사!");
};
countdown();