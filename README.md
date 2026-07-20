# 길드 아카이브

`sw-guidesite` — 서머너즈워 점령전에서 상대 방어덱 3마리를 선택하고 길드가 검증한 공격덱을 찾은 뒤 전투 결과를 축적하는 길드 전용 웹서비스입니다.

## 실행

```bash
npm install
npm run dev
```

검증 명령:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

현재 단계는 디자인 시스템과 공덱 검색 핵심 화면을 구현한 프런트엔드 기반입니다. 실제 게임 이미지 대신 권리 확인 전용 placeholder를 사용합니다.

로그인 대신 `닉네임 + 길드 코드`로 접근을 요청하고 관리자가 `/requests`에서 승인하는 브라우저 기반 프로토타입이 포함되어 있습니다. 현재 승인은 `localStorage`에만 저장되므로 운영 전에는 서버 DB, 서명된 세션 쿠키, OFFICER/OWNER 권한 검사와 감사 로그를 연결해야 합니다.

Windows에서 Next.js 하위 프로세스 실행이 제한되는 환경이라면 WSL에서 프로젝트를 실행하거나 빌드하세요. 이 프로젝트는 WSL2의 Node.js 22 환경에서 lint, typecheck, unit test, production build를 검증했습니다.

색상, 간격, 반응형 규칙과 컴포넌트 상태는 [DESIGN_GUIDE.md](./DESIGN_GUIDE.md)를 참고하세요.
