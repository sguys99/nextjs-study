# Day 0 — 몸풀기: 큰 그림 + 개발환경 셋업

> **소요 시간**: 저녁 1~2시간 (선택 세션, 하지만 강력 추천)
> **목표**: 코드를 치기 전에 **"내가 앞으로 만질 세계의 지도"**를 손에 넣는다.
> ① JS/Node 생태계를 Python에 1:1로 매핑하고, ② 웹이 대체 어떻게 굴러가는지(브라우저·HTML·CSS·DOM) 감을 잡고, ③ Node·pnpm·VS Code를 설치·검증한다.
>
> **태그 범례** (이 로드맵 전체 공통):
> `🐍` Python 대비 포인트 · `💡` 팁 · `⚠️` 함정 · `🎯` 배경지식(왜 이렇게 됐나)
> `📖` 설명용 코드(**타이핑하지 마세요, 읽고 이해만**) · `⌨️` 실습 코드(**직접 치세요**) · `✅` 완성본

---

## 0. 이 문서를 왜 읽나요? (1분)

Day 0에서 실제로 "타는" 명령어는 몇 줄뿐입니다. 진짜 목적은 두 가지예요.

1. **지도 그리기** — 당신은 Python이라는 대륙은 훤히 알지만, JS/웹이라는 대륙은 처음입니다. 새 도구를 만날 때마다 "이게 Python의 무엇에 해당하지?"를 알면 학습 속도가 몇 배 빨라집니다.
2. **웹의 작동 원리 감 잡기** — 백엔드/ML 개발자가 프론트엔드를 배울 때 **가장 크게 막히는 지점은 문법이 아니라 "브라우저가 뭘 하는지 모르는 것"**입니다. 여기서 미리 풀어둡니다.

> 💡 이 문서는 처음부터 끝까지 **"Python이면 X, JS면 Y"** 형태로 갑니다. 다만 v1과 달리, 비유로 끝내지 않고 **"웹을 처음 보는 사람도 이해되는 자체 설명"**을 항상 덧붙입니다.

---

## 1. 🎯 배경 — JS와 Node는 어쩌다 이렇게 생겼나 (5분 읽기)

문법을 배우기 전에 "왜 이런 언어가 됐는지"를 알면, 뒤에서 만날 수많은 함정이 납득됩니다.

**JavaScript의 탄생 (1995)**
- 넷스케이프라는 회사가 웹 브라우저에 "움직임"을 넣고 싶어서, 한 엔지니어에게 **딱 10일** 만에 언어를 만들게 했습니다. 그게 JavaScript예요.
- 이름에 "Java"가 들어가지만 **Java와는 거의 무관**합니다. 당시 Java가 인기라 마케팅으로 붙인 이름이에요. (⚠️ 첫 함정: Java ≠ JavaScript)
- 급하게 만들어졌고, 이미 퍼진 코드를 절대 깨면 안 됐기 때문에(하위호환), **이상한 부분을 고치지 못하고 계속 쌓아왔습니다.** `==`의 이상한 동작, `null`과 `undefined`가 둘 다 있는 것 등이 그 흔적이에요.

**표준화 = ECMAScript**
- JS의 공식 표준 이름은 **ECMAScript(ES)**입니다. "ES6", "ES2020" 같은 말은 "JS의 몇 년도 버전"이라고 보면 됩니다.
- 🐍 Python이 3.10, 3.12로 올라가듯, JS도 ES2015(=ES6)에서 크게 현대화됐어요. **우리가 배우는 건 전부 현대 JS(ES6 이후)**입니다. 옛날 문법(`var` 등)은 "있다는 것만" 알고 안 씁니다.

**Node.js의 탄생 (2009)**
- JS는 **원래 브라우저 안에서만** 돌았습니다. Node.js는 브라우저의 JS 엔진(구글 크롬의 V8)을 **브라우저 밖으로 꺼내서**, 터미널·서버에서도 JS를 돌릴 수 있게 만든 프로그램입니다.
- 🐍 Node = Python의 CPython(`python`)에 해당하는 "실행기(런타임)"입니다. `node script.js`는 `python script.py`와 똑같은 감각이에요.
- 이게 왜 중요하냐면, **Next.js가 바로 이 Node 위에서 돕니다.** 우리가 만들 앱은 "브라우저에서 도는 JS"와 "서버(Node)에서 도는 JS"를 둘 다 씁니다. (Day 5의 "서버 vs 클라이언트 컴포넌트"가 이 이야기의 절정입니다.)

---

## 2. 🎯 배경 — 웹은 대체 어떻게 굴러가나 (15분, 꼭 읽기)

**이 절이 Day 0의 숨은 핵심입니다.** React/Next.js는 결국 "브라우저에 화면을 그리는" 일인데, 브라우저가 뭘 하는지 모르면 Day 4부터 안개 속을 걷게 됩니다. 코드는 없어요. 개념만 잡습니다.

### 2-1. 웹페이지를 연다는 것 = 파일을 받아 조립하는 것

주소창에 `example.com`을 치면 벌어지는 일을 아주 단순화하면:

1. 브라우저가 그 서버에 **"이 페이지 파일 좀 주세요"** 하고 요청합니다. (🐍 `requests.get(url)`과 같은 HTTP 요청)
2. 서버가 **HTML** 문서를 돌려줍니다.
3. HTML 안에 "CSS 파일도 받아와", "JS 파일도 받아와"라는 링크가 있으면, 브라우저가 그것들도 마저 받습니다.
4. 브라우저가 이 재료들을 조립해 **화면**을 그리고, JS를 실행해 **움직임**을 붙입니다.

즉 웹페이지는 **HTML(구조) + CSS(꾸밈) + JavaScript(동작)** 세 가지의 조합입니다.

### 2-2. 세 재료의 역할 (집짓기 비유)

| 재료 | 역할 | 집짓기 비유 | 🐍 굳이 비유하면 |
|------|------|-------------|------------------|
| **HTML** | 페이지의 **구조/내용** (제목, 문단, 버튼, 입력창) | 벽·방·문의 **골조** | 데이터의 뼈대(구조) |
| **CSS** | **꾸밈** (색, 여백, 폰트, 배치) | 페인트·벽지·가구 배치 | (직접 대응 없음) |
| **JavaScript** | **동작** (클릭하면 반응, 값이 바뀌면 화면 갱신) | 전기·수도 배선(누르면 불이 켜짐) | 로직/이벤트 처리 |

📖 설명용 — 아주 작은 HTML 한 조각 (**타이핑 X, 눈으로만**):

```html
<h1>안녕하세요</h1>              <!-- 큰 제목 -->
<p>이건 문단입니다.</p>          <!-- 문단 -->
<button>눌러보세요</button>       <!-- 버튼 -->
```

`<h1>...</h1>`처럼 **여는 태그와 닫는 태그로 내용을 감싸는 것**이 HTML의 기본 문법입니다. 이 "태그로 감싸는 구조"가 나중에 React의 **JSX**(Day 4)와 똑같이 생겼어요. 지금은 "아, 이렇게 생겼구나" 정도면 충분합니다.

### 2-3. DOM — JS가 화면을 만지는 통로 (가장 중요)

브라우저는 HTML을 읽어서 메모리 안에 **"살아있는 트리(tree) 구조"**를 만듭니다. 이걸 **DOM**(Document Object Model)이라고 불러요.

- **DOM = 지금 화면에 떠 있는 페이지를, JS가 읽고 바꿀 수 있게 만든 객체 트리**입니다.
- JS로 `"이 버튼의 글자를 바꿔"`, `"이 문단을 지워"` 하고 명령하면, DOM이 바뀌고 → 화면이 따라 바뀝니다.

🐍 비유하자면, HTML은 **디스크에 있는 설정 파일(정적 텍스트)**이고, DOM은 그걸 파싱해서 **메모리에 올린 객체(런타임에 조작 가능한 상태)**입니다. 파일을 읽어 딕셔너리로 만든 뒤 그 딕셔너리를 수정하는 것과 비슷해요.

⚠️ **여기서 Day 4의 핵심 예고**: 옛날 방식은 "DOM을 JS로 직접, 일일이 조작"하는 것이었는데 이게 너무 번거롭고 버그투성이였습니다. **React는 "DOM을 직접 만지지 마. 대신 '상태(state)'만 바꿔. 화면은 내가 알아서 맞춰줄게"**라고 말하는 도구예요. 이 사고 전환이 Day 4의 전부입니다. 지금은 "DOM이라는 걸 직접 만지는 건 힘들다더라" 정도만 기억하세요.

### 2-4. 그래서 React·Next.js는 이 지도의 어디에?

```
[당신이 배울 순서]

  순수 JS 문법  ─▶  DOM을 직접 다루는 원리  ─▶  React (상태로 UI를 선언)  ─▶  Next.js (React에 뼈대를 얹은 프레임워크)
   (Day 1~3)          (개념만, Day 0)              (Day 4)                      (Day 5~)
```

💡 지금 이 그림이 흐릿해도 괜찮습니다. Day가 지나면서 또렷해집니다. **오늘은 "웹 = HTML+CSS+JS, JS는 DOM을 통해 화면을 만진다, React는 그걸 대신 해준다"** 이 한 줄만 남으면 성공이에요.

---

## 3. 지형도 — Python vs JS 마스터 대비표

이제 도구 이야기입니다. 아래 표가 JS **생태계** 전체의 요약입니다.

| 역할 | 🐍 Python 세계 | 🟨 JS/Node 세계 | 한 줄 설명 |
|------|----------------|-----------------|-----------|
| **언어를 실행하는 엔진** | CPython (`python`) | Node.js (`node`) | 소스코드를 실제로 돌리는 런타임 |
| **런타임 버전 관리자** | pyenv | **nvm** (또는 fnm) | 여러 버전 설치 & 전환 |
| **기본 패키지 매니저** | pip | npm | 언어에 기본 탑재 |
| **개선된 패키지 매니저** | uv / poetry | **pnpm** / yarn | 더 빠르고 똑똑한 서드파티 |
| **프로젝트 설정 파일** | `pyproject.toml` | `package.json` | 메타데이터 + 의존성 선언 |
| **버전 고정(lock) 파일** | `poetry.lock` / `uv.lock` | `pnpm-lock.yaml` | 정확한 버전 재현성 |
| **설치된 패키지가 사는 곳** | venv의 `site-packages/` | 프로젝트의 `node_modules/` | 다운로드된 의존성 실체 |
| **격리(isolation) 방식** | venv를 만들고 **activate** | `node_modules`가 **폴더마다 자동** | JS는 기본이 프로젝트-로컬 |
| **설치 없이 도구 실행** | `pipx run` / `python -m` | `npx` | 일회성 CLI 실행 |
| **글로벌 CLI 도구 설치** | `pipx install` | `npm i -g` | 시스템 전역 명령어 |
| **작업 자동화 스크립트** | Makefile / `poetry run` | `package.json`의 `scripts` | `npm run dev` 같은 것 |

💡 **이 표만 이해해도 Day 0의 절반은 끝난 겁니다.** 나머지는 설치·검증이에요.

---

## 4. 헷갈리기 쉬운 개념 4가지

설치 전에, Python 개발자가 특히 오해하기 쉬운 4개만 짚습니다.

### 4-1. Node.js = "인터프리터"이자 "표준 라이브러리를 가진 런타임"

🐍 Python에서 `python script.py` → CPython이 실행.
🟨 Node.js는 그 V8 엔진을 브라우저 밖으로 꺼내 `node script.js`로 돌립니다.

| | 🐍 Python | 🟨 Node.js |
|---|-----------|------------|
| 실행 명령 | `python script.py` | `node script.js` |
| 대화형 셸(REPL) | `python` → `>>>` | `node` → `>` |
| 표준 기능(파일 등) | `import os` | `import fs from 'node:fs'` |
| 엔진 이름 | CPython | V8 (크롬과 동일 엔진) |

### 4-2. nvm = pyenv

시스템에 Node를 직접 깔면 권한·버전 꼬임이 생깁니다. Python에서 pyenv 쓰는 이유와 똑같아요.

| | 🐍 pyenv | 🟨 nvm |
|---|----------|--------|
| 특정 버전 설치 | `pyenv install 3.12` | `nvm install 24` |
| 사용 버전 전환 | `pyenv global 3.12` | `nvm use 24` |
| 설치 목록 | `pyenv versions` | `nvm ls` |
| 기본값 지정 | `pyenv global 3.12` | `nvm alias default 24` |

⚠️ **OS 주의**: `nvm`은 macOS/Linux 전용. **Windows는 `fnm` 또는 `nvm-windows`**를 씁니다(아래 5장).

### 4-3. npm / pnpm = pip / uv

🐍 `pip install requests` → 🟨 `pnpm add zod`. 거의 1:1입니다.

| 작업 | 🐍 pip/uv | 🟨 pnpm |
|------|-----------|---------|
| 패키지 설치 | `pip install requests` | `pnpm add axios` |
| 개발용 의존성 | `uv add -D pytest` | `pnpm add -D vitest` |
| lock대로 전체 설치 | `uv sync` | `pnpm install` |
| 패키지 제거 | `pip uninstall requests` | `pnpm remove axios` |

💡 **왜 npm 있는데 pnpm?** Python에서 pip 대신 uv/poetry가 빠르고 편한 것과 같습니다. pnpm은 디스크 효율(패키지를 전역에 한 번만 저장하고 링크)과 속도가 강점. **pnpm을 기본으로 쓰되 npm도 100% 호환**됩니다.

### 4-4. `node_modules` = "자동으로 켜지는 venv" (가장 중요한 사고 전환)

🐍 Python: venv를 **직접 만들고**(`python -m venv .venv`) **직접 켜야**(`activate`) 격리됩니다.
🟨 JS: 그런 거 없습니다. 폴더에서 `pnpm add`를 하면 **그 폴더의 `node_modules/`**에 깔리고, 폴더마다 자동 격리돼요. **activate 개념 자체가 없습니다.**

| | 🐍 Python (venv) | 🟨 Node (node_modules) |
|---|------------------|------------------------|
| 격리 단위 | venv 디렉터리 | 프로젝트 폴더 |
| 활성화 필요? | ✅ `activate` 필요 | ❌ 자동 |
| 설치 위치 | `.venv/.../site-packages/` | `./node_modules/` |
| `.gitignore` 대상 | `.venv/` | `node_modules/` |

💡 **멘탈 모델**: "Node에서는 모든 프로젝트가 항상 자기만의 venv를 켠 채로 돈다."
⚠️ **함정**: `node_modules`는 절대 git에 커밋하지 않습니다(용량이 수백 MB). `package.json` + lock 파일만 커밋하면 남이 `pnpm install`로 복원합니다. (= `requirements.txt`는 커밋, `.venv`는 커밋 안 하는 것과 동일)

---

## 5. 실습 — 설치 & 검증 (OS별)

이제 실제로 설치합니다. **자기 OS 절만 따라가세요.** 각 단계 끝의 검증 명령을 꼭 실행하세요.

> 목표 버전: **Node.js 24 LTS** (2026년 7월 현재 Active LTS).

### 5-A. macOS / Linux

⌨️ 실습 — 터미널에 그대로 입력

```bash
# ① nvm 설치 (막히면 github.com/nvm-sh/nvm 최신 명령 확인)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

설치 후 **터미널을 껐다 켜거나** 아래로 nvm을 로드:

```bash
source ~/.zshrc    # zsh(맥 기본)
# 또는 source ~/.bashrc  (bash)
```

⌨️ 실습 — Node 24 설치 & 기본값 지정

```bash
nvm --version         # nvm 버전이 뜨면 성공
nvm install 24        # Node 24 LTS 설치
nvm alias default 24  # 새 터미널에서도 24가 기본
nvm use 24
```

### 5-B. Windows

Windows는 Unix용 `nvm`을 못 씁니다. 둘 중 하나:

**옵션 1 (권장): fnm** — 크로스 플랫폼 버전 관리자

⌨️ 실습 — PowerShell

```powershell
winget install Schniz.fnm
# 설치 후 fnm 공식 문서 "Shell Setup"으로 PowerShell 프로필에 로드 설정
fnm install 24
fnm use 24
fnm default 24
```

**옵션 2: nvm-windows** — `github.com/coreybutler/nvm-windows`의 인스톨러(.exe) 실행 후 `nvm install 24` → `nvm use 24`.

💡 **WSL2 대안**: Windows에서 리눅스 환경을 선호하면 WSL2(Ubuntu)를 깔고 위 **5-A** 절차를 그대로 따르는 게 가장 마찰이 적습니다.

### 5-C. pnpm 설치 (모든 OS 공통)

⌨️ 실습

```bash
npm install -g pnpm
pnpm -v    # 버전(11.x 등)이 뜨면 성공
```

💡 **검증 (공통)** — 아래 3개가 모두 버전을 출력하면 준비 끝:

```bash
node -v    # v24.x.x
npm -v
pnpm -v
```

---

## 6. VS Code 확인 & 필수 확장

Day 1에서 본격 설정하지만, 지금 확장 3개만 미리 깝니다.

⌨️ 실습

```bash
code --version   # 버전이 뜨면 OK
# 안 뜨면: VS Code 열고 Cmd/Ctrl+Shift+P → "Shell Command: Install 'code' command in PATH"
```

확장 탭(`Cmd/Ctrl + Shift + X`)에서 이름으로 검색해 설치:

| 확장 | 역할 | 🐍 Python 대응 |
|------|------|----------------|
| **ESLint** | 코드 문제(버그성) 자동 검출 | ruff / flake8 |
| **Prettier** | 저장 시 자동 포맷팅 | black / ruff format |
| **Error Lens** | 에러/경고를 코드 옆에 인라인 표시 | (대응 없음, 매우 유용) |

**설정은 Day 1에** 합니다. 지금은 설치만.

---

## 7. 🎯 미리 알아두기 — "에러 읽는 법"에 겁먹지 않기

앞으로 빨간 에러 메시지를 수백 번 봅니다. Python 개발자에게 미리 안심시킬 점:

- JS/Node 에러도 **위에서부터** 읽습니다: 첫 줄에 "무엇이 잘못됐나", 아래로 **스택 트레이스**(어디서 났나)가 이어집니다. 🐍 Python의 Traceback과 구조가 똑같아요.
- 흔한 3종:
  - `ReferenceError: x is not defined` — 없는 변수 사용 (🐍 `NameError`)
  - `TypeError: undefined is not a function` — `undefined`/`null`을 함수처럼 호출 (🐍 `AttributeError`와 비슷)
  - `SyntaxError` — 문법 오타 (🐍 동일)
- 💡 에러가 뜨면 **첫 줄과 파일:줄 번호**만 보면 90%는 해결됩니다. 각 Day 자료에서 그때그때 "이 에러는 이런 뜻"을 붙여줄게요.

---

## 8. ✅ Day 0 완료 체크리스트

- [ ] `node -v` → `v24.x.x`
- [ ] `npm -v`, `pnpm -v` → 버전 출력
- [ ] nvm(또는 fnm/nvm-windows) 설치·확인
- [ ] `code --version` → VS Code 버전
- [ ] ESLint / Prettier / Error Lens 확장 설치
- [ ] (개념) "Node=인터프리터, nvm=pyenv, pnpm=pip/uv, node_modules=자동 venv" 말로 설명 가능
- [ ] (개념) "웹 = HTML(구조)+CSS(꾸밈)+JS(동작), JS는 DOM으로 화면을 만진다" 한 줄로 설명 가능

---

## 9. 30초 실전 테스트 (재미로)

⌨️ 실습

```bash
node -e "console.log('Hello from Node ' + process.version)"
```

→ `Hello from Node v24.x.x` 가 나오면 완벽합니다.
🐍 `node -e "..."`는 `python -c "..."`와 정확히 같은 "한 줄 실행"이에요.

---

## 10. 자주 나오는 함정

| 증상 | 원인 | 해결 |
|------|------|------|
| `nvm: command not found` | 설치 후 셸 재로드 안 함 | 터미널 재시작 또는 `source ~/.zshrc` |
| `node -v`는 되는데 버전이 옛것 | 시스템 Node가 우선 | `nvm use 24`, `nvm alias default 24` 확인 |
| Windows에서 nvm 설치 실패 | Unix용 nvm을 받음 | `fnm` 또는 `nvm-windows` |
| `pnpm: command not found` | 전역 설치 경로 문제 | 터미널 재시작, 안 되면 `npm i -g pnpm` 재실행 |
| `code` 명령 없음 | PATH 미등록 | VS Code에서 "Install 'code' command in PATH" |

---

## 11. Day 1 미리보기

Day 0에서 부품을 깔았으니, Day 1은:

1. **개발환경 확정** — ESLint/Prettier 설정을 만들어 "저장 시 자동 포맷"을 완성
2. **JS 코어 문법** — `let`/`const`, 함수, 화살표 함수, 배열 메서드를 Python과 대조하며 손으로 체화
3. `pnpm init`으로 `package.json`을 직접 만들고 `node file.js` 실행

💡 Day 1 시작할 때 이 로드맵을 붙이고 **"Day 1 상세 자료 만들어줘"**라고 요청하면 이어집니다.

---

### 부록 — 오늘 친 명령어 치트시트

```bash
# 버전 관리자 (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
nvm install 24 && nvm alias default 24 && nvm use 24

# 패키지 매니저
npm install -g pnpm

# 검증
node -v && npm -v && pnpm -v && code --version
```

수고했어요. 지도도 그렸고 부품도 깔았습니다 — Day 1에서 드디어 코드를 칩니다. 🟨
