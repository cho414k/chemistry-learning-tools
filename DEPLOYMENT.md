# 공개 서비스와 배포 안내

| 서비스 | 공개 주소 | 저장소 |
| --- | --- | --- |
| 교실 도구 허브 | https://cho414k.github.io/chemistry-learning-tools/ | GitHub Pages |
| 화학 게임 | https://cho414k.github.io/chemistry-learning-tools/chemistry-games/ | GitHub Pages |
| 엔탈피 게임 | https://cho414k.github.io/chemistry-learning-tools/#enthalpy | GitHub Pages |
| 몽실 기체 체험판 | https://cho414k.github.io/chemistry-learning-tools/gas-cafe/ | GitHub Pages, 로그인·서버 기록 없음 |
| 몽실 기체 회원판 | https://mongle-gas-cafe.vercel.app/ | Supabase Auth/Postgres + Vercel |
| 나만의 일기장 | https://chem-lab-diary-cho414k.web.app/ | Firebase Google Auth/Firestore + Hosting |

허브의 몽실 기체 카드는 회원판으로 연결됩니다. 체험판은 위 별도 주소에서 사용할 수 있습니다.

## 배포 절차

- main 브랜치에 push하면 GitHub Actions가 정적 허용목록으로 Pages를 배포합니다. DB·일기 서버는 포함하지 않습니다.
- Firebase: `cd firebase-diary` 후 `npx -y firebase-tools@latest deploy --only firestore,hosting --project chem-lab-diary-cho414k`. Google 로그인 제공자는 이미 활성화했습니다. OAuth 지원 이메일은 Git에 보관하지 않습니다.
- Vercel: `cd gas-cafe` 후 `npx vercel@64.3.1 deploy --prod --scope chobap`. 기존 연결된 프로젝트 mongle-gas-cafe에 배포합니다. 공개 대상은 dist 정적 파일입니다.
- Supabase: 서울 프로젝트 ncerjexissixnsiqrzqy. 스키마와 가입 함수 소스는 supabase/에 보관합니다. 서비스 역할 키는 Edge Function 서버 환경에서만 사용하고 브라우저에 넣지 않습니다.

## 계정과 저장

- 몽실 아이디: 영문 소문자·숫자·_·- 4~20자, 비밀번호 8~72자. 실명 대신 수업용 별칭을 권장합니다. 실제 이메일 주소는 수집하지 않습니다. 내부 인증용 주소는 아이디@students.mongle.invalid입니다.
- 비밀번호는 Supabase Auth가 처리합니다. 평문 비밀번호를 애플리케이션 DB·브라우저 저장소에 보관하지 않습니다. 로그인 세션은 탭의 sessionStorage에 보관하며 로그아웃 시 지웁니다.
- 기체 게임 완료 후 기록 저장 버튼을 누르면 완료 시각·코인·첫 시도 정답 수·시도 횟수를 저장합니다. 본인 기록만 최근 20개 조회합니다. 동일 실행 ID의 저장 재시도는 중복 기록을 만들지 않습니다. 클라이언트에서 생성된 연습 기록이므로 공식 평가·성적의 근거로 사용하지 않습니다.
- 비밀번호를 잊으면 담당 교사에게 문의하도록 안내합니다. 교사는 학생 본인 여부와 아이디를 확인한 뒤 Supabase 관리자 권한으로 Auth 사용자의 비밀번호를 재설정해야 합니다. 이메일 복구는 제공하지 않습니다. 관리자 서비스 키를 학생이나 공개 사이트에 공유하지 마세요.
- 일기는 Google 계정별 users/{uid}/entries에 저장하며 다른 사용자는 접근할 수 없습니다. 최근 50개씩 가져오고 ‘이전 기록 더 불러오기’를 제공합니다. 검색·월 필터는 불러온 기록에 적용됩니다. 공용 PC의 일기 세션은 브라우저 탭 세션에 보관합니다.
- 기존 local-data/diary.sqlite는 업로드하거나 자동 이전하지 않았습니다. 이 DB는 계속 비공개 로컬 파일입니다.

## 검증과 제한

- 기존 게임/PDF/로컬 일기 테스트 9개 통과.
- Firebase 에뮬레이터: 본인 CRUD, 다른 계정 및 비로그인 차단, Google 외 인증 차단, 목록 수 제한, 잘못된 값·날짜 차단, 생성 시각 불변성 등 7개 통과.
- 실제 Supabase: 합성 계정 두 개로 가입·로그인·세션 갱신·자기 기록 저장/조회·다른 사용자 차단·비로그인 차단·잘못된 점수 차단·중복 방지 확인. 이 두 계정과 기록은 정리했습니다.
- Supabase 보안 검사에서 signup_limits의 RLS 정책 없음은 의도한 관리자 전용 차단입니다. anon/authenticated에는 테이블 및 함수 접근을 부여하지 않았습니다.
- Supabase의 유출 비밀번호 차단은 비활성 상태입니다. [공식 안내](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)에 따르면 Pro 이상 기능이므로 유료 전환 없이 활성화하지 않았습니다. 수업용 비밀번호를 다른 서비스와 재사용하지 마세요.
- 실제 Vercel 브라우저에서 합성 계정 로그인 → 5문항 완료 → 저장 성공 → 새로고침 후 첫 시도 정답 5/5·시도 5회·500코인 조회 → 로그아웃과 화면 기록 제거를 확인했습니다.
- 화면 검증에 사용한 별도 합성 계정 1개와 그 학습 기록은 사용자가 테스트용 유지를 선택했습니다. 해당 로그인 정보는 비공개 로컬 파일에만 보관합니다.
- 실제 Google 계정 로그인은 계정 선택 팝업까지 열림을 확인했습니다. 자동 브라우저가 팝업 입력에 응답하지 않아 계정 선택 이후의 실계정 저장 확인은 사용자 확인이 필요합니다.
- Firebase Security Rules are prototypes: they restrict access to the matching Google UID, validate every write, and bound list requests. Review before wider use. 이 검증은 모든 공격 경로나 운영 부하를 검증한 침투 시험이 아닙니다.
- Firebase Spark 플랜과 Supabase/Vercel의 현재 계정 자원을 사용합니다. 결제 계정 연결 또는 유료 플랜 전환을 수행하지 않았습니다. 무료 할당량을 넘으면 기능이 제한될 수 있습니다.

Firestore 테스트 재현: Java 21 이상과 Node.js 24를 준비하고 firebase-diary 폴더에서 `pnpm install --frozen-lockfile` 후 `npx -y firebase-tools@latest emulators:exec --only firestore --project demo-classroom-diary "node --test tests/rules.test.cjs"`를 실행합니다. demo 프로젝트는 실제 서비스에 쓰지 않습니다.
