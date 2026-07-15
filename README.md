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
npm run build
```

현재 단계는 디자인 시스템과 공덱 검색 핵심 화면을 구현한 프런트엔드 기반입니다. 실제 게임 이미지 대신 권리 확인 전용 placeholder를 사용합니다.

색상, 간격, 반응형 규칙과 컴포넌트 상태는 [DESIGN_GUIDE.md](./DESIGN_GUIDE.md)를 참고하세요.
