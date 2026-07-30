// 3-1. fetch — 표준 HTTP 클라이언트 (🐍 requests/httpx)

async function getUser(username) {
  const res = await fetch(`https://api.github.com/users/${username}`);
  const data = await res.json(); // ⚠️ .json()도 비동기라 await 필요
  return data;
}

const user = await getUser("sguys99");
console.log(user.name, user.public_repos);


// 3-2 fetch는 404·500에서 에러를 안 던진다
//  fetch는 네트워크 자체가 실패해야 reject합니다. 서버가 404나 500을 보내도 "응답은 성공적으로 받았다"고 보고 정상 통과시켜요.

async function getUserSafe(username) {
  const res = await fetch(`https://api.github.com/users/${username}`);

  // ✅ 반드시 res.ok(또는 res.status)를 직접 확인해야 함
  if (!res.ok) {
    throw new Error(`GitHub API 오류: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

const user2 = await getUser("sdgsdhethrjrtjsf2423");
console.log(user2.name, user2.public_repos);

// 3-3 try/catch로 에러 처리
async function safeMain() {
    try {
        const user = await getUserSafe("이런 계정은 없음ㄴㅇㄹㄴㅎ");
        console.log(user.name);
    } catch (err) {
        console.error("문제 발생:", err.message);
    } finally {
        console.log("정리 작업 (항상실행)");
    }
}

safeMain();

// 3-4 Promise.all — 병렬 요청 (🐍 asyncio.gather)

// ❌ 순차 (느림): 하나 끝나야 다음 시작 — 총 시간 = 합
const a = await getUserSafe("torvalds");
const b = await getUserSafe("gvanrossum");

// ✅ 병렬 (빠름): 동시에 쏘고 한꺼번에 기다림 — 총 시간 = 최댓값
const [user3, user4] = await Promise.all([
  getUserSafe("torvalds"),
  getUserSafe("gvanrossum"),
]);
console.log(user3.name, user3.name);

// Promise.all은 하나라도 실패하면 전체가 reject됩니다("all or nothing"). "일부 실패해도 나머지는 받고 싶다"면 Promise.allSettled
const results = await Promise.allSettled([
  getUserSafe("torvalds"),
  getUserSafe("존재하지않는계정999"),
]);
// results = [
//   { status: "fulfilled", value: {...} },
//   { status: "rejected", reason: Error }
// ]
results.forEach((r) => {
  if (r.status === "fulfilled") console.log("성공:", r.value.name);
  else console.log("실패:", r.reason.message);
});

// 3-5. (선택) AbortController — 요청 취소
// 사용자가 "취소"를 누르거나 타임이아웃을 걸 때 진행중인 fetch 중단
// 챗봇 에서 스트리밍 중 중단 버튼에 활용

const controller = new AbortController();
setTimeout(() => controller.abort(), 2000) // 2초뒤 자동 취소

try {
  const res = await fetch("https://api.github.com/users/torvalds", {
    signal: controller.signal,
  });
  console.log(await res.json());
} catch (err) {
  if (err.name === "AbortError") console.log("요청이 취소됨");
  else throw err;
}