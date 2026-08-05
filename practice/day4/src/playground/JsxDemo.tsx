function JsxDemo() {
  const name = "광명";
  const scores = [88, 92, 70];

  return (
    <div>
      <h1>안녕, {name}!</h1>
      <p>점수 개수: {scores.length}</p>
    </div>
  );
}

export default JsxDemo;