# 🧿 네이버 카페 댓글 추첨기

네이버 카페 게시글의 댓글을 기준으로 **자동 추첨**을 진행하는 데스크탑 애플리케이션입니다.  
특정 키워드 포함 여부, 게시글 수, 제외 닉네임 등 조건을 설정해 공정한 추첨이 가능합니다.

## 📦 다운로드

최신 버전은 아래 GitHub 릴리즈 페이지에서 다운로드할 수 있습니다:

👉 [🔗 릴리즈 바로가기](https://github.com/hwanam1111/electron-test/releases)

- Windows: `Naver-Cafe-Post-Comment-Raffle-Setup-*.exe`
- macOS (Apple Silicon): `Naver-Cafe-Post-Comment-Raffle-*-arm64.dmg`

## ✅ 주요 기능

- 네이버 로그인 후, 게시글 댓글을 자동 수집
- **특정 키워드**가 포함된 댓글만 필터링
- 각 댓글 작성자의 **작성 글 수** 조건 체크
- **제외할 닉네임**을 입력해 필터링
- 중복 닉네임 제거 후, 무작위 추첨
- 당첨자 수 지정 가능
- GUI를 통한 간편한 사용

## 🖥️ 설치 방법

### Windows

1. [릴리즈 페이지](https://github.com/hwanam1111/electron-test/releases)에서 `.exe` 파일 다운로드
2. 설치 후 실행 (Microsoft Defender SmartScreen 경고 시 `추가 정보 → 실행` 선택)

### macOS (Apple Silicon)

1. `.dmg` 파일 다운로드 후 열기
2. 애플리케이션 폴더로 드래그하여 설치
3. 보안 경고 시: `시스템 설정 → 개인정보 및 보안 → 허용` 후 재실행

## 🛠️ 사용 방법

1. 프로그램 실행 후, **네이버 로그인**
2. 아래 정보를 입력:
   - 📎 필수 | 게시글 URL
   - 🔍 필수 | 키워드 (예: 참여)
   - 🎁 필수 | 당첨자 수 (숫자)
   - 📝 필수 | 최소 작성 글 수 (예: 5)
   - 🚫 선택 | 제외 닉네임 (쉼표로 구분: `김이름,박이름`)
3. **[추첨 시작]** 클릭 → 자동 실행
4. 로그에서 추첨 진행 상황과 결과 확인 가능

## 🔒 보안 및 로그인 정보

- 자동화 도구(Puppeteer)를 이용해 직접 로그인 후 추첨을 진행합니다.
- 로그인은 사용자의 **로컬 브라우저 세션**을 이용하며, **아이디/비밀번호는 앱, 서버, DB등 어떠한 외부 저장소에 저장되지 않습니다.**

## 🧑‍💻 패키지

| 종류         | 패키지                                             | 버전       |
| ---------- | ----------------------------------------------- | -------- |
| 런타임        | [Electron](https://www.electronjs.org/)         | ^29.0.0  |
| 빌드 툴       | [electron-builder](https://www.electron.build/) | ^24.13.2 |
| 브라우저 자동화   | [Puppeteer](https://pptr.dev/)                  | ^24.8.2  |
| 로그 출력 스타일링 | [chalk](https://www.npmjs.com/package/chalk)    | ^5.3.0   |
| 유틸리티 함수    | [lodash](https://lodash.com/)                   | ^4.17.21 |


## 📜 라이선스

MIT License  
Copyright (c) 2025 [Leejun Kim](mailto:support@makeyone.com)

---

> 이 프로그램은 네이버와 무관한 **비공식 프로젝트**이며, 커뮤니티 이벤트 및 추첨 자동화를 위해 제작되었습니다.
