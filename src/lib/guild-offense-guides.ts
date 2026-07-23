export type GuildOffenseStatKey =
  | "hp"
  | "attack"
  | "defense"
  | "speed"
  | "critRate"
  | "critDamage"
  | "resistance"
  | "accuracy";

export type GuildOffenseMonsterGuide = {
  monsterId: string;
  roleName: string;
  isLeader?: boolean;
  leaderNote?: string;
  runeSets: string;
  slotBuild?: string;
  stats: Record<GuildOffenseStatKey, string>;
  artifactLeft: string;
  artifactRight: string;
};

export type GuildOffenseGuide = {
  id: string;
  title: string;
  summary: string;
  monsters: [GuildOffenseMonsterGuide, GuildOffenseMonsterGuide, GuildOffenseMonsterGuide];
  strategy: string[];
  note?: string;
};

const emptyStats: Record<GuildOffenseStatKey, string> = {
  hp: "상관없음",
  attack: "상관없음",
  defense: "상관없음",
  speed: "상관없음",
  critRate: "상관없음",
  critDamage: "상관없음",
  resistance: "상관없음",
  accuracy: "상관없음",
};

function stats(values: Partial<Record<GuildOffenseStatKey, string>>) {
  return { ...emptyStats, ...values };
}

export const guildOffenseGuides: GuildOffenseGuide[] = [
  {
    id: "fan-to-hwa",
    title: "팬토화",
    summary: "풍팬더·물토템·물화백의 안정형 후턴 공덱",
    monsters: [
      {
        monsterId: "3118",
        roleName: "풍웅묘무사",
        isLeader: true,
        leaderNote: "방어력 44%",
        runeSets: "폭주 + 의지",
        stats: stats({ hp: "+20,000", defense: "+2,000", speed: "+90", resistance: "100%", accuracy: "30%" }),
        artifactLeft: "속성 피해 감소 또는 방어·체력 추가 피해",
        artifactRight: "1스킬 효과 적중 또는 체력·방어 추가 피해",
      },
      {
        monsterId: "2131",
        roleName: "물토템술사",
        runeSets: "폭주 + 의지",
        stats: stats({ hp: "+26,000", defense: "+800", speed: "+140", resistance: "100%" }),
        artifactLeft: "속성 피해 감소",
        artifactRight: "1스킬 회복량",
      },
      {
        monsterId: "2125",
        roleName: "물화백",
        runeSets: "절망 + 의지",
        stats: stats({ hp: "+28,000", defense: "+600", speed: "+120", resistance: "100%", accuracy: "40%" }),
        artifactLeft: "속성 피해 감소",
        artifactRight: "2스킬 효과 적중",
      },
    ],
    strategy: [
      "물토템 선턴 3스로 약화 효과 1개를 제거합니다. 약화 효과가 없다면 상황에 맞게 사용하며 방어 감소·기절·낙인을 우선 지웁니다.",
      "풍팬더 2스로 본인의 약화 효과를 완전히 제거하는 운영을 반복합니다.",
      "물화백 2스로 강화 효과를 제거하고 빗맞음 확률 증가를 겁니다.",
    ],
  },
  {
    id: "pal-deu-yu",
    title: "팔드유",
    summary: "빛팔라·풍드나·불유니콘의 속도 방덱 대응 공덱",
    monsters: [
      {
        monsterId: "4124",
        roleName: "빛팔라딘",
        isLeader: true,
        leaderNote: "효과 저항 41%",
        runeSets: "폭주 + 의지",
        slotBuild: "체력% · 체력% · 체력%",
        stats: stats({ hp: "+36,000", defense: "+800", speed: "불유니보다 빠르게", resistance: "59%", accuracy: "50%" }),
        artifactLeft: "상대 방덱에 맞춘 속성 피해 감소",
        artifactRight: "1스킬 회복량 또는 효과 적중",
      },
      {
        monsterId: "3107",
        roleName: "풍드래곤나이트",
        runeSets: "의지 + 의지 + 보호",
        slotBuild: "체력% · 체력% · 체력%",
        stats: stats({ hp: "+36,000", attack: "여유되면 추가", defense: "+500", critRate: "여유되면 추가", resistance: "59%", accuracy: "30%" }),
        artifactLeft: "상대 방덱에 맞춘 속성 피해 감소",
        artifactRight: "3스킬 효과 적중 또는 2스킬 치명타 피해",
      },
      {
        monsterId: "1119",
        roleName: "불유니콘",
        runeSets: "폭주 + 의지",
        slotBuild: "체력% · 체력% · 체력%",
        stats: stats({ hp: "+28,000", attack: "여유되면 추가", defense: "+400", critRate: "100%", critDamage: "130%", resistance: "45%", accuracy: "40%" }),
        artifactLeft: "상대 방덱에 맞춘 속성 피해 감소",
        artifactRight: "2스킬 효과 적중 또는 3스킬 회복량",
      },
    ],
    strategy: [
      "상대 속도 방덱에 사용합니다.",
      "풍드나로 의지가 없는 몬스터의 공격 게이지를 감소시킨 뒤 빛팔라가 도발합니다.",
      "불유니콘은 변신과 2스킬을 중심으로 운영합니다.",
    ],
  },
  {
    id: "kkae-to-to",
    title: "깨토토",
    summary: "불깨비·불토템·풍토템의 유지력 공덱",
    monsters: [
      {
        monsterId: "1144",
        roleName: "불깨비",
        runeSets: "폭주 + 의지",
        slotBuild: "속도 · 체력% · 체력% 또는 체력% · 체력% · 체력%",
        stats: stats({ hp: "+35,000", defense: "+800", speed: "+120", resistance: "100%", accuracy: "50%" }),
        artifactLeft: "속성 피해 감소",
        artifactRight: "2스킬 효과 적중",
      },
      {
        monsterId: "1132",
        roleName: "불토템",
        runeSets: "폭주 + 의지",
        slotBuild: "속도 · 체력% · 체력% 또는 체력% · 체력% · 체력%",
        stats: stats({ hp: "+30,000", defense: "+800", speed: "+120", resistance: "100%", accuracy: "50%" }),
        artifactLeft: "속성 피해 감소",
        artifactRight: "2스킬 효과 적중",
      },
      {
        monsterId: "3132",
        roleName: "풍토템",
        runeSets: "폭주 + 의지",
        slotBuild: "속도 · 체력% · 체력% 또는 체력% · 체력% · 체력%",
        stats: stats({ hp: "+28,000", defense: "+800", speed: "+150", resistance: "100%" }),
        artifactLeft: "속성 피해 감소",
        artifactRight: "3스킬 회복량",
      },
    ],
    strategy: [
      "풍토템 3스킬의 해제와 회복을 잘 활용합니다.",
      "불토템 다음 턴에 불깨비가 움직이도록 속도를 조정합니다.",
    ],
  },
  {
    id: "mu-pyu-si",
    title: "무퓨시",
    summary: "물무희·물푸딩·물시리의 선턴 공덱",
    monsters: [
      {
        monsterId: "2319",
        roleName: "물무희",
        runeSets: "신속 잡세트 · 격노 잡세트 · 폭주 잡세트",
        stats: stats({ hp: "+10,000", attack: "+1,500", defense: "+0", speed: "+197", critDamage: "160%" }),
        artifactLeft: "속도 비례 추가 피해",
        artifactRight: "2스킬 치명타 피해",
      },
      {
        monsterId: "2135",
        roleName: "물퓨어바닐라쿠키(푸딩)",
        runeSets: "신속 잡세트",
        stats: stats({ speed: "최소 +220 권장", accuracy: "남는 수치 최대" }),
        artifactLeft: "속성 피해 감소",
        artifactRight: "2스킬 효과 적중",
      },
      {
        monsterId: "2145",
        roleName: "물시리",
        runeSets: "신속 잡세트",
        stats: stats({ hp: "+10,000", attack: "+1,800", speed: "+210", critDamage: "170%" }),
        artifactLeft: "속도 비례 추가 피해",
        artifactRight: "2스킬 치명타 피해",
      },
    ],
    strategy: [
      "본인의 최대 속도에 비례해 공속 증가가 부여되므로 물푸딩 속도가 중요합니다.",
      "물푸딩 3스 → 물시리 2스 → 물무희 2스 순서로 사용합니다. 물무희 2스는 뒤집기 같은 몬스터에게 사용합니다.",
      "다음 물시리 2스는 공격력·공속 증가 버프가 있을 때 사용하면 좋습니다.",
    ],
    note: "물무희: 체력 +10,000 · 속도 +197 이상 · 전투력 31,000 이상 / 물시리: 체력 +10,000 전후 · 속도 +210 · 전투력 35,000 이상",
  },
  {
    id: "deu-sya-pu",
    title: "드샤푸",
    summary: "풍드나·풍사막전사·풍푸딩의 보호 공덱",
    monsters: [
      {
        monsterId: "3107",
        roleName: "풍드래곤나이트",
        runeSets: "의지 + 의지 + 보호",
        stats: stats({ hp: "+39,000", defense: "+900", critRate: "50%", resistance: "100%" }),
        artifactLeft: "속성 피해 감소",
        artifactRight: "3스킬 효과 적중",
      },
      {
        monsterId: "3140",
        roleName: "풍사막전사",
        runeSets: "폭주 + 의지",
        stats: stats({ hp: "+39,000", defense: "+900", resistance: "100%", accuracy: "50%" }),
        artifactLeft: "속성 피해 감소",
        artifactRight: "2스킬 효과 적중",
      },
      {
        monsterId: "3137",
        roleName: "풍푸딩",
        runeSets: "폭주 + 응보",
        stats: stats({ hp: "+40,000", defense: "+1,000", resistance: "100%" }),
        artifactLeft: "속성 피해 감소",
        artifactRight: "2스킬 회복량 증가",
      },
    ],
    strategy: [
      "풍드나로 선턴 몬스터의 공격 게이지를 감소시킵니다.",
      "풍푸딩의 실드와 보호 상태를 확인해 스킬을 사용합니다.",
      "풍사막전사 2스킬은 까다로운 물속성 몬스터나 딜러에게 먼저 사용합니다.",
    ],
  },
  {
    id: "nin-ho-hel",
    title: "닌호헬",
    summary: "물닌자·물호박·물키메라의 속공 공덱",
    monsters: [
      {
        monsterId: "2307",
        roleName: "물닌자",
        runeSets: "신속 + 보호 또는 신속 + 칼날",
        stats: stats({ hp: "+10,000", attack: "+1,300", speed: "+193", critRate: "70%", critDamage: "150%" }),
        artifactLeft: "속도 비례 추가 피해",
        artifactRight: "2스킬 치명타 피해",
      },
      {
        monsterId: "2330",
        roleName: "물호박",
        runeSets: "신속 + 의지",
        stats: stats({ hp: "+20,000", attack: "+1,000", speed: "+210" }),
        artifactLeft: "속도 비례 추가 피해",
        artifactRight: "1스킬 치명타 피해",
      },
      {
        monsterId: "2104",
        roleName: "물키메라",
        runeSets: "신속 + 칼날 또는 신속 + 보호",
        stats: stats({ hp: "+10,000", attack: "+1,500", speed: "+200", critRate: "70%", critDamage: "150%" }),
        artifactLeft: "속도 비례 추가 피해",
        artifactRight: "협공 피해",
      },
    ],
    strategy: [
      "물닌자가 보호 세트라면 물키메라는 의지 세트로 맞춥니다.",
    ],
  },
];

export const guildOffenseStatRows: Array<{ key: GuildOffenseStatKey; label: string }> = [
  { key: "hp", label: "체력" },
  { key: "attack", label: "공격력" },
  { key: "defense", label: "방어력" },
  { key: "speed", label: "속도" },
  { key: "critRate", label: "치명타 확률" },
  { key: "critDamage", label: "치명타 피해" },
  { key: "resistance", label: "효과 저항" },
  { key: "accuracy", label: "효과 적중" },
];
