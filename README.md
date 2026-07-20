# 길드 아카이브

`sw-guidesite` — 서머너즈워 점령전에서 상대 방어덱 3마리를 선택하고 길드가 검증한 공격덱을 찾은 뒤 전투 결과를 축적하는 길드 전용 웹서비스입니다.

## 실행

```bash
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

검증 명령:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

최초 실행 전 `.env.example`을 `.env`로 복사하고 길드 코드, 관리자 키, 세션 비밀값을 변경하세요. 로컬 PostgreSQL은 기존 5432 포트와의 충돌을 피하도록 `localhost:5433`을 사용합니다.

로그인 대신 `닉네임 + 길드 코드`로 접근을 요청하고 관리자가 `/requests`에서 승인합니다. 요청·길드원·기기 세션·감사 로그는 PostgreSQL에 저장하며, 기기 토큰은 원문이 아닌 SHA-256 해시로 보관합니다. `/requests`는 `ADMIN_ACCESS_KEY` 확인 뒤 12시간 동안만 열리고, 승인된 기기 세션은 기본 90일 유지됩니다.

공덱 검색 화면에서 선택한 상대 방어덱을 기준으로 `공덱 등록`을 누르면 `/decks/new`에서 공격 몬스터 3마리, 리더, 운용법과 조건을 작성할 수 있습니다. 게시된 공덱은 PostgreSQL에 저장되며 해당 방덱의 정확 일치 검색 결과에 즉시 표시됩니다. 미완성 내용은 임시저장할 수 있습니다.

로컬 개발용 기본값은 길드 코드 `CONAN-01`, 관리자 키 `CONAN-ADMIN-01`입니다. 배포 환경에서는 반드시 `.env.example`의 값을 교체하고 HTTPS를 사용하세요.

## 몬스터 데이터

- `https://www.ryhlab.com/speed`의 한국어 약칭·속성·태생 등급·몬스터 PK 체계를 기준으로 845마리를 가져옵니다.
- 이미지는 `public/monsters`에 로컬 보관해 원본 사이트 장애가 서비스 화면에 영향을 주지 않게 했습니다.
- `npm run data:monsters`로 최신 목록과 이미지를 다시 동기화할 수 있습니다.
- 몬스터 및 게임 이미지의 권리는 Com2uS에 있으며, 서비스 공개 전 사용 범위와 표기 정책을 최종 확인해야 합니다.

Windows에서 Next.js 하위 프로세스 실행이 제한되는 환경이라면 WSL에서 프로젝트를 실행하거나 빌드하세요. 이 프로젝트는 WSL2의 Node.js 22 환경에서 lint, typecheck, unit test, production build를 검증했습니다.

색상, 간격, 반응형 규칙과 컴포넌트 상태는 [DESIGN_GUIDE.md](./DESIGN_GUIDE.md)를 참고하세요.
