# Plocky — Minecraft Plugin Creator

**Block-based Coding 으로 Minecraft Paper API 플러그인을 쉽게 만들어보세요.**

[Blockly](https://github.com/kimminkyuol/blockly) 라이브러리를 기반으로 시각적으로 블록을 조립하면, Java 코드로 자동 변환해 ZIP 파일로 다운로드할 수 있습니다.

---

## 특징

- 판네리 3장의 에디터 (Sidebar | Blockly Workspace | 생성 Java 코드)
- Event Listener & Command Handler 지원
- LocalStorage 기반 프로젝트 저장/불러오기
- **Export ZIP** — 바로 Gradle 프로젝트로 빌드 가능
- 현대적인 다크 테마 UI (Tailwind CSS)

---

## 실행 방법

### 요구사항

- Node.js 18+
- Blockly 코어 파일 (`src/plocky/blockly_compressed.js` 등) —
  [kimminkyuol/blockly](https://github.com/kimminkyuol/blockly) 레포를 빌드하거나
  이 레포의 기존 `src/plocky/` 파일을 유지하세요.

### 개발 서버

```bash
npm install
npm run dev
# 브라우저에서 http://localhost:5173 접속
```

### 프로덕션 빌드

```bash
npm run build
# dist/ 디렉토리에 완성된 웹 앱 생성
```

---

## 프로젝트 구조

```
plocky/
├── index.html          # Vite 진입점 (Blockly 스크립트 태그 포함)
├── vite.config.js       # Vite 설정 (Blockly 미들웨어 포함)
├── tailwind.config.js
├── scripts/
│   └── copy-blockly.mjs    # 프로덕션 빌드 후 Blockly 파일 복사
└── src/
    ├── main.jsx            # React 진입점
    ├── App.jsx             # React Router 설정
    ├── pages/
    │   ├── SettingsPage.jsx  # 프로젝트 생성/불러오기 페이지
    │   └── EditorPage.jsx    # 메인 에디터 (3판널)
    ├── components/
    │   ├── ConfirmModal.jsx
    │   └── InputModal.jsx
    ├── utils/
    │   ├── store.js          # localStorage 래퍼
    │   └── export.js         # JSZip 기반 내보내기
    ├── styles/
    │   └── app.css           # Tailwind + 전역 스타일
    └── plocky/              # Blockly 컴파일드 파일 (kimminkyuol/blockly)
        ├── blockly_compressed.js
        ├── blocks_compressed.js
        ├── java_compressed.js
        └── msg/messages.js
```

---

## 사용 방법

1. **프로젝트 생성** — Group ID, Artifact ID, Plugin Name, 마인크래프트 버전 설정
2. **Event / Command 파일 생성** — 사이드바의 `New` 버튼
3. **Blockly로 블록 조립** — 우측에 실시간 Java 코드 생성
4. **Export ZIP** — Gradle 프로젝트 쫐을 ZIP으로 다운로드
5. **빌드** — `./gradlew build`로 컴파일 후 서버에 배포

---

## 라이선스

MIT License © 2025 김민결
