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

최초 실행 전 `.env.example`을 `.env`로 복사하고 관리자 키와 세션 비밀값을 변경하세요. 로컬 PostgreSQL은 기존 5432 포트와의 충돌을 피하도록 `localhost:5433`을 사용합니다.

로그인이나 길드 코드 입력 없이 닉네임으로 접근을 요청하고, 현재 관리자가 `/requests`에서 직접 확인해 승인합니다. 승인된 길드원은 같은 화면의 목록에 자동으로 추가되며 관리자가 `MEMBER`와 `OFFICER` 권한을 변경할 수 있습니다. 요청·길드원·기기 세션·권한 변경 감사 로그는 PostgreSQL에 저장하며, 기기 토큰은 원문이 아닌 SHA-256 해시로 보관합니다. `/requests`는 `ADMIN_ACCESS_KEY` 확인 뒤 12시간 동안만 열리고, 승인된 기기 세션은 기본 90일 유지됩니다.

공덱 검색 화면에서 선택한 상대 방어덱을 기준으로 `공덱 등록`을 누르면 `/decks/new`에서 공격 몬스터 3마리, 리더, 운용법과 조건을 작성할 수 있습니다. 게시된 공덱은 PostgreSQL에 저장되며 해당 방덱의 정확 일치 검색 결과에 즉시 표시됩니다. 미완성 내용은 임시저장할 수 있습니다.

## 길드 운영 기능

- `/home`: 공지사항, 다가오는 일정, 진행 중인 숙제와 빠른 메뉴를 한 화면에 표시합니다.
- `/defenses`: 방어덱 3마리와 리더, 룬 세트, HP·공격력·방어력·속도·치명타·효과 적중/저항, 운용 메모를 저장합니다.
- `/dungeons`: 카이로스, 차원의 홀·2차 각성, 이계 던전·레이드, 시험의 탑, 특수·길드 PvE 콘텐츠를 검색하고 공략 편성과 스펙을 공유합니다. 던전별 편성 인원은 클라이언트와 서버에서 함께 검증합니다.
- `/homeworks`: OWNER와 OFFICER만 3마리 공덱, 추천 공격 대상, 운용 지시와 마감을 작성할 수 있습니다. 일반 길드원은 자신의 완료 상태만 변경할 수 있습니다.

던전 분류는 Com2uS 공식 업데이트의 [v9.0.0 콘텐츠 목록](https://summonerswar.com/en/skyarena/news/list/6113)과 [v9.1.6 차원 인페라스 업데이트](https://summonerswar.com/en/skyarena/news/list/4911?category=all&page=1)를 기준으로 정리했습니다.

로컬 개발용 관리자 키 기본값은 `CONAN-ADMIN-01`입니다. 배포 환경에서는 반드시 `.env.example`의 값을 교체하고 HTTPS를 사용하세요.

## 몬스터 데이터

- `https://www.ryhlab.com/speed`의 한국어 약칭·속성·태생 등급·몬스터 PK 체계를 기준으로 845마리를 가져옵니다.
- 이미지는 `public/monsters`에 로컬 보관해 원본 사이트 장애가 서비스 화면에 영향을 주지 않게 했습니다.
- `npm run data:monsters`로 최신 목록과 이미지를 다시 동기화할 수 있습니다.
- 몬스터 및 게임 이미지의 권리는 Com2uS에 있으며, 서비스 공개 전 사용 범위와 표기 정책을 최종 확인해야 합니다.

Windows에서 Next.js 하위 프로세스 실행이 제한되는 환경이라면 WSL에서 프로젝트를 실행하거나 빌드하세요. 이 프로젝트는 WSL2의 Node.js 22 환경에서 lint, typecheck, unit test, production build를 검증했습니다.

색상, 간격, 반응형 규칙과 컴포넌트 상태는 [DESIGN_GUIDE.md](./DESIGN_GUIDE.md)를 참고하세요.
