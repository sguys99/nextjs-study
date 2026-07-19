# Day 0 — 몸풀기: 개발환경 셋업 (Python 개발자용)

> **소요 시간**: 저녁 1~2시간 (선택 세션)
> **목표**: JS/Node 생태계의 "골격"을 파이썬과 1:1로 매핑해서 이해하고, Node·pnpm·VS Code를 설치·검증한다.
> **핵심 태그**: 🐍 = 파이썬 대비 포인트 · 💡 = 팁 · ⚠️ = 함정

---

## 0. 이 세션의 목적 (읽고 시작하세요)

Day 0에서 실제로 "타는" 건 명령어 몇 줄뿐입니다. 하지만 여기서 진짜 배워야 하는 건 **"JS 생태계의 부품들이 서로 어떤 관계인가"**예요.

파이썬을 이미 아는 당신에게 가장 효율적인 학습법은, 새 도구를 **당신이 이미 아는 파이썬 도구에 매핑**하는 것입니다. 그래서 이 문서는 처음부터 끝까지 "파이썬이면 X, JS면 Y" 형태로 갑니다.

Day 0가 끝나면 이 문장을 자신 있게 말할 수 있어야 합니다:

> "Node는 파이썬 인터프리터에 해당하고, nvm은 pyenv, pnpm은 pip/uv에 해당하며,
> `package.json`은 `pyproject.toml`, `node_modules`는 프로젝트마다 자동으로 켜지는 venv 같은 것이다."

---

## 1. 전체 지형도 — 파이썬 vs JS 마스터 대비표

먼저 큰 그림부터. 아래 표가 이 문서 전체의 요약입니다. (세부 설명은 뒤에서)

| 역할 | 🐍 Python 세계 | 🟨 JS/Node 세계 | 한 줄 설명 |
|------|----------------|-----------------|-----------|
| **언어를 실행하는 엔진** | CPython (`python`) | Node.js (`node`) | 소스코드를 실제로 돌리는 런타임 |
| **런타임 버전 관리자** | pyenv | **nvm** (또는 fnm) | 여러 버전 설치 & 전환 |
| **기본 패키지 매니저** | pip | npm | 언어에 기본 탑재 |
| **개선된 패키지 매니저** | uv / poetry | **pnpm** / yarn | 더 빠르고 똑똑한 서드파티 |
| **프로젝트 설정 파일** | `pyproject.toml` | `package.json` | 메타데이터 + 의존성 선언 |
| **버전 고정(lock) 파일** | `poetry.lock` / `uv.lock` | `pnpm-lock.yaml` / `package-lock.json` | 정확한 버전 재현성 |
| **설치된 패키지가 사는 곳** | venv의 `site-packages/` | 프로젝트의 `node_modules/` | 다운로드된 의존성 실체 |
| **격리(isolation) 방식** | venv를 만들고 **activate** | `node_modules`가 **폴더마다 자동** | JS는 기본이 프로젝트-로컬 |
| **설치 없이 도구 실행** | `pipx run` / `python -m` | `npx` | 일회성 CLI 실행 |
| **글로벌 CLI 도구 설치** | `pipx install` | `npm i -g` | 시스템 전역 명령어 |
| **작업 자동화 스크립트** | Makefile / `poetry run` | `package.json`의 `scripts` | `npm run dev` 같은 것 |

💡 **이 표만 이해해도 Day 0의 80%는 끝난 겁니다.** 나머지는 이 부품들을 실제로 설치·검증하는 과정이에요.

---

## 2. 개념 파고들기 — 헷갈리기 쉬운 4가지

설치 전에, 파이썬 개발자가 특히 오해하기 쉬운 지점 4개만 정확히 짚습니다.

### 2-1. Node.js = "인터프리터"이자 "표준 라이브러리를 가진 런타임"

🐍 파이썬에서 `python script.py`를 치면 CPython이 코드를 실행하죠.
🟨 JS는 원래 **브라우저 안에서만** 돌던 언어였어요. Node.js는 그 JS 엔진(V8)을 **브라우저 밖으로 꺼내서** 터미널에서 `node script.js`로 돌릴 수 있게 만든 런타임입니다.

| | 🐍 Python | 🟨 Node.js |
|---|-----------|------------|
| 실행 명령 | `python script.py` | `node script.js` |
| 대화형 셸(REPL) | `python` 입력 → `>>>` | `node` 입력 → `>` |
| 파일 읽기 등 표준 기능 | `import os`, `open(...)` | `import fs from 'node:fs'` |
| 엔진 이름 | CPython | V8 (구글 크롬과 동일 엔진) |

⚠️ **함정**: "JS = 브라우저 언어" 아니었나? 맞아요. 하지만 우리는 Node로 **서버/CLI에서 JS를 실행**합니다. Next.js가 바로 이 Node 위에서 돕니다. 브라우저에서 도는 JS와 Node에서 도는 JS는 **문법은 같지만 사용 가능한 기능이 다릅니다** (예: 파일 시스템 접근은 Node에만 있음). Day 5의 "서버 컴포넌트 vs 클라이언트 컴포넌트"가 바로 이 구분의 연장선이에요. 지금은 "아, 실행 장소가 두 곳이구나" 정도만 기억하면 됩니다.

### 2-2. nvm = pyenv (왜 Node를 직접 안 깔고 nvm으로 깔까?)

🐍 파이썬도 시스템 파이썬을 건드리면 사고가 나서 pyenv로 버전을 관리하죠. Node도 똑같습니다.

- 프로젝트마다 요구하는 Node 버전이 다를 수 있음 → 전환 필요
- 시스템에 직접 설치하면 권한(`sudo`) 문제와 꼬임이 생김
- nvm으로 깔면 사용자 홈 디렉터리에 격리되어 안전

| | 🐍 pyenv | 🟨 nvm |
|---|----------|--------|
| 특정 버전 설치 | `pyenv install 3.12` | `nvm install 24` |
| 사용 버전 전환 | `pyenv global 3.12` | `nvm use 24` |
| 설치된 버전 목록 | `pyenv versions` | `nvm ls` |
| 기본 버전 지정 | `pyenv global 3.12` | `nvm alias default 24` |

⚠️ **OS 주의**: `nvm`은 macOS/Linux 전용입니다. **Windows는 `nvm`이 아니라 `nvm-windows`**라는 별개 프로젝트를 쓰거나, 크로스 플랫폼인 `fnm`을 권장합니다. (아래 3장에서 OS별로 안내)

### 2-3. npm / pnpm = pip / uv (패키지 매니저)

🐍 `pip install requests` → 🟨 `pnpm add zod`. 거의 1:1입니다.

| 작업 | 🐍 pip/uv | 🟨 npm | 🟨 pnpm |
|------|-----------|--------|---------|
| 패키지 설치 | `pip install requests` | `npm install axios` | `pnpm add axios` |
| 개발용 의존성 | `pip install -D pytest`(uv) | `npm install -D vitest` | `pnpm add -D vitest` |
| 전체 설치(lock대로) | `uv sync` / `pip install -r` | `npm install` | `pnpm install` |
| 패키지 제거 | `pip uninstall requests` | `npm uninstall axios` | `pnpm remove axios` |
| 글로벌 CLI 설치 | `pipx install ruff` | `npm i -g pnpm` | `pnpm add -g <tool>` |

💡 **왜 npm이 있는데 pnpm을 또 쓰나?** 파이썬에서 pip이 기본이지만 uv/poetry가 더 빠르고 편한 것과 똑같아요. pnpm은 디스크 효율(패키지를 전역에 한 번만 저장하고 링크)과 속도가 강점입니다. **로드맵대로 pnpm을 기본으로 쓰되, npm도 100% 호환되니 부담 갖지 마세요.**

### 2-4. `node_modules` = "자동으로 켜지는 venv" (가장 중요한 사고 전환)

이게 파이썬 개발자가 가장 신기해하는 부분입니다.

🐍 파이썬: venv를 **직접 만들고**(`python -m venv .venv`) **직접 켜야**(`source .venv/bin/activate`) 격리가 됩니다. 안 켜면 시스템 전역에 깔려요.

🟨 JS: 그런 거 없습니다. 프로젝트 폴더에서 `pnpm add`를 하면 **그 폴더 안의 `node_modules/`**에 깔립니다. 폴더마다 자동으로 격리돼요. **activate라는 개념 자체가 없습니다.**

| | 🐍 Python (venv) | 🟨 Node (node_modules) |
|---|------------------|------------------------|
| 격리 단위 | venv 디렉터리 | 프로젝트 폴더 |
| 활성화 필요? | ✅ `activate` 필요 | ❌ 자동 (폴더에 있으면 끝) |
| 설치 위치 | `.venv/lib/.../site-packages/` | `./node_modules/` |
| 전역 설치 | `pipx`로 별도 | `npm i -g` (드물게, CLI 도구용) |
| `.gitignore` 대상 | `.venv/` | `node_modules/` |

💡 **멘탈 모델**: "Node에서는 모든 프로젝트가 항상 자기만의 venv를 켠 채로 돌아간다"고 생각하면 정확합니다.
⚠️ **함정**: `node_modules`는 절대 git에 커밋하지 않습니다(파이썬의 `.venv`처럼). 대신 `package.json` + lock 파일만 커밋하면, 다른 사람이 `pnpm install`로 똑같이 복원합니다. (= `requirements.txt` 커밋하고 `.venv`는 커밋 안 하는 것과 동일)

---

## 3. 실습 — 설치 & 검증 (OS별)

이제 실제로 설치합니다. **자기 OS에 맞는 절만 따라가세요.** 각 단계 끝에 반드시 검증 명령을 넣었습니다.

> 목표 버전: **Node.js 24 LTS** (2026년 7월 현재 Active LTS).
> 로드맵의 Node 22도 정상 동작하지만, 새로 시작하니 24를 권장합니다. 7일 계획 전체가 24에서 문제없이 돌아갑니다.

### 3-A. macOS / Linux

**① nvm 설치**

nvm 공식 저장소의 설치 스크립트를 실행합니다. (버전 번호는 최신으로 바뀔 수 있으니, 막히면 `github.com/nvm-sh/nvm`에서 최신 명령을 확인하세요.)

```bash
# nvm 설치 (공식 install 스크립트)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

설치 후 **터미널을 껐다 켜거나** 아래를 실행해 nvm을 로드합니다:

```bash
source ~/.bashrc   # bash 사용 시
# 또는
source ~/.zshrc    # zsh(맥 기본) 사용 시
```

검증:
```bash
nvm --version      # 버전이 뜨면 성공
```

**② Node 24 LTS 설치 & 기본값 지정**

```bash
nvm install 24        # Node 24 최신 LTS 설치
nvm alias default 24  # 새 터미널에서도 24가 기본이 되도록
nvm use 24
```

**③ 검증**
```bash
node -v    # v24.x.x 형태로 출력되면 성공
npm -v     # npm 버전 출력 (Node에 기본 포함됨)
```

### 3-B. Windows

Windows는 `nvm`(Unix용)을 쓸 수 없습니다. 두 가지 선택지:

**옵션 1 (권장, 간단): fnm** — 크로스 플랫폼 버전 관리자

```powershell
# PowerShell에서 winget으로 설치
winget install Schniz.fnm
```
설치 후 PowerShell 프로필에 fnm을 로드하는 설정이 필요합니다. `fnm` 공식 문서의 "Shell Setup" 안내를 따르세요. 이후:
```powershell
fnm install 24
fnm use 24
fnm default 24
```

**옵션 2: nvm-windows** — [github.com/coreybutler/nvm-windows](https://github.com/coreybutler/nvm-windows)의 인스톨러(.exe) 실행 후:
```powershell
nvm install 24
nvm use 24
```

**검증 (공통)**
```powershell
node -v    # v24.x.x
npm -v
```

💡 **WSL2 대안**: Windows에서 리눅스 환경을 선호하면 WSL2(Ubuntu)를 깔고 위 **3-A(macOS/Linux)** 절차를 그대로 따르는 게 가장 깔끔합니다. 프론트엔드 개발은 WSL2 환경이 마찰이 적어요.

### 3-C. pnpm 설치 (모든 OS 공통)

Node를 깔았으면 npm은 이미 있습니다. pnpm만 추가로 설치:

```bash
npm install -g pnpm
```

검증:
```bash
pnpm -v    # 버전(11.x 등)이 뜨면 성공
```

💡 **대안 (corepack)**: Node 24에는 `corepack`이 포함돼 있어 `corepack enable` 후 사용할 수도 있습니다. 다만 서명 관련 이슈로 초보자에겐 위 `npm i -g pnpm`이 가장 확실합니다. corepack은 Node 25+부터는 기본 포함이 빠지므로, 지금은 신경 쓰지 않아도 됩니다.

---

## 4. VS Code 확인 & 필수 확장 미리 깔기

Day 1에서 본격적으로 설정하지만, Day 0에 미리 확장 3개만 깔아두면 편합니다.

**① VS Code 설치 확인**
- 터미널에서 `code --version` 실행 → 버전이 뜨면 OK.
- 안 뜨면: VS Code를 열고 `Cmd/Ctrl + Shift + P` → "Shell Command: Install 'code' command in PATH" 실행.

**② 확장 3종 (지금 깔아두기)**

| 확장 | 역할 | 🐍 파이썬 대응 |
|------|------|----------------|
| **ESLint** | 코드 문제(버그성) 자동 검출 | ruff / flake8 (린터) |
| **Prettier** | 저장 시 자동 포맷팅 | black / ruff format |
| **Error Lens** | 에러/경고를 코드 옆에 인라인 표시 | (파이썬엔 딱 맞는 대응 없음, 매우 유용) |

VS Code 확장 탭(`Cmd/Ctrl + Shift + X`)에서 이름으로 검색해 설치하면 됩니다. **설정은 Day 1에 하니, 지금은 설치만.**

---

## 5. ✅ Day 0 완료 체크리스트

아래가 전부 통과하면 Day 1 준비 끝입니다.

- [ ] `node -v` → `v24.x.x` 출력됨
- [ ] `npm -v` → 버전 출력됨
- [ ] `pnpm -v` → 버전 출력됨
- [ ] nvm(또는 fnm/nvm-windows) 설치 및 버전 확인됨
- [ ] `code --version` → VS Code 버전 출력됨
- [ ] VS Code에 ESLint / Prettier / Error Lens 확장 설치됨
- [ ] (개념) "Node=인터프리터, nvm=pyenv, pnpm=pip/uv, node_modules=자동 venv" 를 말로 설명 가능

---

## 6. 30초 실전 테스트 (선택, 재미로)

설치가 진짜 되는지 손으로 확인해보고 싶다면:

```bash
mkdir day0-test && cd day0-test
node -e "console.log('Hello from Node ' + process.version)"
```
→ `Hello from Node v24.x.x` 가 출력되면 완벽합니다.

🐍 참고: `node -e "..."`는 파이썬의 `python -c "..."`와 정확히 같은 "한 줄 실행" 방식이에요.

---

## 7. 자주 나오는 함정 정리 (⚠️)

| 증상 | 원인 | 해결 |
|------|------|------|
| `nvm: command not found` | 설치 후 셸을 다시 안 읽음 | 터미널 재시작 또는 `source ~/.zshrc` |
| `node -v`는 되는데 버전이 옛것 | 시스템 Node가 우선됨 | `nvm use 24` 실행, `nvm alias default 24` 확인 |
| Windows에서 nvm 설치 실패 | Unix용 nvm을 받음 | `fnm` 또는 `nvm-windows` 사용 |
| `pnpm: command not found` | 전역 설치 경로 문제 | 터미널 재시작, 안 되면 `npm i -g pnpm` 재실행 |
| `code` 명령이 없음 | PATH에 등록 안 됨 | VS Code에서 "Install 'code' command in PATH" 실행 |

---

## 8. Day 1 미리보기

Day 0에서 "부품"을 깔았으니, Day 1에서는:

1. **개발환경 확정** — ESLint/Prettier 설정 파일을 만들고 "저장 시 자동 포맷"을 완성 (오늘 깐 확장을 실제로 배선)
2. **JS 코어 문법** — `let`/`const`, 함수, 화살표 함수, 배열 메서드(`map`/`filter`/`reduce`)를 파이썬과 대조하며 체화
3. `package.json`을 직접 만들어보고 (`pnpm init`), `node file.js`로 스크립트 실행

💡 Day 1 시작할 때 이 로드맵 문서를 붙이고 **"Day 1 세션 1 상세 자료 만들어줘"** 라고 요청하면 이어서 자료를 만들어 드립니다.

---

### 부록 — 오늘 친 명령어 한눈에 (치트시트)

```bash
# 버전 관리자 (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
nvm install 24
nvm alias default 24
nvm use 24

# 패키지 매니저
npm install -g pnpm

# 검증
node -v      # v24.x.x
npm -v
pnpm -v
code --version
```

수고했어요. 여기까지 하면 몸풀기 끝 — Day 1에서 실제로 코드를 칩니다. 🟨
