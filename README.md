# 화학 수업 도구

고등학교 화학 개념 연습과 수업 보조용 웹 프로젝트 모음입니다.

**[교실 도구 허브 열기](https://cho414k.github.io/chemistry-learning-tools/)** · [Google 로그인 일기장](https://chem-lab-diary-cho414k.web.app/) · [몽실 기체 회원판](https://mongle-gas-cafe.vercel.app/)

배포 구성, 계정·학습 기록과 보안 검증은 [DEPLOYMENT.md](DEPLOYMENT.md)에 정리했습니다. 기존 enthalpy-hub의 일기 서버는 로컬 전용이며, 실제 배포된 일기장은 firebase-diary/입니다.

| 폴더 | 기능 | 로컬 실행 |
| --- | --- | --- |
| chemistry-portal | 원소·반응식·분자 연습 | `node chemistry-portal/server.cjs` |
| enthalpy-hub | 엔탈피 게임, PDF 글자 수 도구, 기체 게임, 로컬 일기 | `node enthalpy-hub/server.mjs` |
| gas-cafe | 독립 기체 카페 게임 | `node gas-cafe/preview.cjs` |

Node.js 24 이상을 사용합니다. 별도 패키지 설치가 필요하지 않습니다. 각 서버가 출력하는 127.0.0.1 주소에서 실행합니다.

검증: `node --test enthalpy-hub/tests/*.test.mjs`

## 공개 범위와 보안

GitHub Pages는 허브·게임·PDF 도구의 정적 파일만 배포합니다. Firebase 일기장은 Google 계정별 Firestore 권한을 적용합니다. **기존 로컬 일기 서버를 공개 프록시나 터널로 연결하지 마세요. 인증과 기록 소유권 검사가 없으므로 다른 사람이 로컬 일기를 조회·수정·삭제할 수 있습니다.**

실제 일기 DB, 환경변수·인증서·비밀키, 로컬 도구와 미리보기 이미지는 공개 대상에서 제외합니다. 복사본을 공유할 때도 local-data 폴더를 제외해야 합니다. `.gitignore`는 Git으로 추적되는 파일만 제어합니다.

알려진 운영 제한:

- gas-cafe의 preview 서버는 잘못된 URL 입력에 종료될 수 있습니다. 운영 서버로 사용하지 마세요.
- chemistry-portal의 브라우저 저장 기록은 정수·범위·필드 검증 후 표시합니다.
- 일부 기체 게임·포털 CSS는 Google Fonts를 요청합니다. 사용자의 브라우저가 외부 서비스에 접속할 수 있습니다.
- 공개 서비스 전 인증, 보안 헤더, 요청·자원 제한 및 의존성 취약점 검토가 필요합니다.
- 게임 정답은 클라이언트 코드에 있으므로 성적 평가가 아닌 연습용입니다.

PDF.js 및 동봉 폰트의 라이선스는 enthalpy-hub/pdf-counter/vendor 안에 보존합니다.
