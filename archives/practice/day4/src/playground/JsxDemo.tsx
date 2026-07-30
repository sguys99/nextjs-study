export function JsxDemo(){
    const name = "ML 개발자";
    const runs = [
        {id: "a", label: "baseline", acc:0.81},
        {id: "b", label: "resnet", acc: 0.93},
    ];

  return (
    <div className="p-6">
      {/* 1. 중괄호 = "여기부터 JS 표현식" */}
      <h2 className="text-xl font-bold">안녕하세요, {name}님</h2>

      {/* 2. 표현식만 가능. if/for 같은 "문(statement)"은 못 씀 */}
      <p>평균: {(runs.reduce((a, r) => a + r.acc, 0) / runs.length).toFixed(2)}</p>

      {/* 3. style은 객체 + camelCase */}
      <p style={{ marginTop: 8, color: "gray" }}>스타일 예시</p>
    </div>
    )
};
