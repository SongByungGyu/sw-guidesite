export type DungeonCategory = "cairos" | "dimension" | "rift" | "tower" | "special";

export type DungeonCatalogItem = {
  key: string;
  category: DungeonCategory;
  name: string;
  shortName: string;
  description: string;
  reward: string;
  teamSize: number;
  badge?: string;
};

export const dungeonCategories: Array<{ key: DungeonCategory; name: string; description: string }> = [
  { key: "cairos", name: "카이로스", description: "룬·아티팩트·정수를 반복 파밍하는 핵심 던전" },
  { key: "dimension", name: "차원의 홀 · 2차 각성", description: "고대 룬과 2차 각성 경험치를 얻는 지역" },
  { key: "rift", name: "이계 던전 · 레이드", description: "연마석·보석과 호문쿨루스 재료를 얻는 콘텐츠" },
  { key: "tower", name: "시험의 탑", description: "월간 탑과 도전형 PvE 공략" },
  { key: "special", name: "특수 · 길드 PvE", description: "혼돈의 신전과 길드 협동 콘텐츠" },
];

export const dungeonCatalog: DungeonCatalogItem[] = [
  { key: "cairos-giant", category: "cairos", name: "거인의 던전", shortName: "거인", description: "룬 파밍의 출발점. 방어력 기반 보스를 상대합니다.", reward: "절망·신속·맹공 등 룬", teamSize: 5 },
  { key: "cairos-dragon", category: "cairos", name: "용의 던전", shortName: "용던", description: "지속 피해와 면역·해제 대응이 중요한 던전입니다.", reward: "폭주·반격·보호 등 룬", teamSize: 5 },
  { key: "cairos-necro", category: "cairos", name: "죽음의 던전", shortName: "죽던", description: "다단 공격과 공격 속도 제어가 핵심입니다.", reward: "격노·흡혈·의지 등 룬", teamSize: 5 },
  { key: "cairos-spiritual", category: "cairos", name: "정령의 던전", shortName: "정던", description: "강화 효과와 턴 순서를 정교하게 맞추는 룬 던전입니다.", reward: "봉인·투지·결의 등 룬", teamSize: 5 },
  { key: "cairos-steel", category: "cairos", name: "강철의 던전", shortName: "강던", description: "강화 불가와 방어력 감소를 활용하는 아티팩트 던전입니다.", reward: "속성 아티팩트", teamSize: 5 },
  { key: "cairos-punisher", category: "cairos", name: "심판의 던전", shortName: "심던", description: "턴 획득과 속도 조절이 중요한 아티팩트 던전입니다.", reward: "유형 아티팩트", teamSize: 5 },
  { key: "cairos-magic", category: "cairos", name: "마력의 던전", shortName: "마력", description: "각성에 필요한 마력 정수를 획득합니다.", reward: "마력의 정수", teamSize: 5 },
  ...["불", "물", "바람", "빛", "어둠"].map((element, index) => ({ key: `cairos-element-${index}`, category: "cairos" as const, name: `${element}의 던전`, shortName: `${element}던`, description: `${element} 속성 각성 정수를 획득하는 요일 던전입니다.`, reward: `${element}의 정수`, teamSize: 5 })),
  { key: "dimension-karzhan", category: "dimension", name: "차원 카르잔", shortName: "카르잔", description: "포효하는 야수의 숲과 2차 각성 던전을 포함합니다.", reward: "고대 룬·2차 각성 경험치", teamSize: 4 },
  { key: "dimension-ellunia", category: "dimension", name: "차원 엘루니아", shortName: "엘루니아", description: "꿈꾸는 요정의 안식처와 2차 각성 던전을 포함합니다.", reward: "고대 룬·2차 각성 경험치", teamSize: 4 },
  { key: "dimension-lumel", category: "dimension", name: "차원 루메르", shortName: "루메르", description: "강인한 수인의 절벽과 2차 각성 던전을 포함합니다.", reward: "고대 룬·2차 각성 경험치", teamSize: 4 },
  { key: "dimension-khalderun", category: "dimension", name: "차원 칼데룬", shortName: "칼데룬", description: "침묵의 죽음 폐허와 2차 각성 던전을 포함합니다.", reward: "고대 룬·2차 각성 경험치", teamSize: 4 },
  { key: "dimension-sacreon", category: "dimension", name: "차원 세크리온", shortName: "세크리온", description: "잊혀진 영웅의 성과 2차 각성 던전을 포함합니다.", reward: "고대 룬·2차 각성 경험치", teamSize: 4 },
  { key: "dimension-inferath", category: "dimension", name: "차원 인페라스", shortName: "인페라스", description: "격노하는 불길의 지옥과 헬하운드·인페르노 2차 각성 던전입니다.", reward: "고대 룬·2차 각성 경험치", teamSize: 4, badge: "2026" },
  ...["화염", "빙결", "폭풍", "광휘", "심연"].map((name, index) => ({ key: `rift-beast-${index}`, category: "rift" as const, name: `${name}의 마수`, shortName: `${name} 마수`, description: "전열·후열 배치와 그로기 구간 화력이 중요한 이계 던전입니다.", reward: "마력 결정·보석 재료", teamSize: 6 })),
  { key: "rift-raid-chaos", category: "rift", name: "카오스 키자르 카줄", shortName: "카오스 레이드", description: "협동 또는 솔로 편성으로 도전하는 이계 레이드입니다.", reward: "연마석", teamSize: 6 },
  { key: "rift-raid-blazing", category: "rift", name: "작열의 키자르 카줄", shortName: "작열 레이드", description: "불꽃 계열 기믹에 대응하는 이계 레이드입니다.", reward: "연마석", teamSize: 6 },
  { key: "rift-raid-frostjade", category: "rift", name: "빙옥의 키자르 카줄", shortName: "빙옥 레이드", description: "빙결 계열 기믹에 대응하는 이계 레이드입니다.", reward: "연마석", teamSize: 6 },
  { key: "rift-raid-tempest", category: "rift", name: "폭풍수 키자르 카줄", shortName: "폭풍수 레이드", description: "폭풍 계열 기믹에 대응하는 이계 레이드입니다.", reward: "연마석", teamSize: 6 },
  { key: "tower-normal", category: "tower", name: "시험의 탑 노말", shortName: "TOA 노말", description: "100층까지 진행하는 월간 PvE 탑입니다.", reward: "소환서·데빌몬", teamSize: 5 },
  { key: "tower-hard", category: "tower", name: "시험의 탑 하드", shortName: "TOA 하드", description: "제어와 지속 피해 활용도가 높은 고난도 탑입니다.", reward: "소환서·데빌몬", teamSize: 5 },
  { key: "tower-hell", category: "tower", name: "시험의 탑 헬", shortName: "TOA 헬", description: "별 조건을 만족하며 보스를 공략하는 최상위 탑입니다.", reward: "별 누적 보상", teamSize: 5 },
  { key: "tower-challenge", category: "tower", name: "도전의 탑", shortName: "도전의 탑", description: "특수 규칙에 맞춘 별도 도전 콘텐츠입니다.", reward: "단계별 보상", teamSize: 5 },
  { key: "special-chaos-temple", category: "special", name: "혼돈의 신전", shortName: "혼돈의 신전", description: "세 덱 15마리로 최고 점수를 겨루는 월간 콘텐츠입니다.", reward: "달성·랭킹 보상", teamSize: 15, badge: "월간" },
  { key: "special-world-boss", category: "special", name: "월드 보스", shortName: "월드 보스", description: "다수의 몬스터 성장도를 활용하는 일일 콘텐츠입니다.", reward: "일일 전리품", teamSize: 6 },
  { key: "special-labyrinth", category: "special", name: "타르타로스의 미궁", shortName: "길드 미궁", description: "길드원이 협력해 보스와 특수 스테이지를 공략합니다.", reward: "길드 미궁 보상", teamSize: 5 },
  { key: "special-subjugation", category: "special", name: "몬스터 토벌전", shortName: "토벌전", description: "길드 단위로 누적 피해를 쌓는 협동 콘텐츠입니다.", reward: "길드 토벌 보상", teamSize: 6 },
];

export const dungeonByKey = new Map(dungeonCatalog.map((dungeon) => [dungeon.key, dungeon]));
