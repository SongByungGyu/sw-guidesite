export const monsterStatFields = [
  { key: "hp", label: "체력", shortLabel: "체력", placeholder: "25000" },
  { key: "attack", label: "공격력", shortLabel: "공격", placeholder: "1800" },
  { key: "defense", label: "방어력", shortLabel: "방어", placeholder: "1000" },
  { key: "speed", label: "공격속도", shortLabel: "속도", placeholder: "220" },
  { key: "critRate", label: "치명 확률", shortLabel: "치확", placeholder: "85" },
  { key: "critDamage", label: "치명 피해", shortLabel: "치피", placeholder: "170" },
  { key: "resistance", label: "효과 저항", shortLabel: "저항", placeholder: "15" },
  { key: "accuracy", label: "효과 적중", shortLabel: "효적", placeholder: "55" },
] as const;

export type MonsterStatKey = (typeof monsterStatFields)[number]["key"];
export type MonsterStatValues = Record<MonsterStatKey, number | null>;

export type ParsedMonsterScreenshot = {
  stats: MonsterStatValues;
  detectedKeys: MonsterStatKey[];
  runeSets: string;
};

const aliases: Record<MonsterStatKey, string[]> = {
  hp: ["체력", "최대체력", "hp"],
  attack: ["공격력", "atk"],
  defense: ["방어력", "def"],
  speed: ["공격속도", "속도", "spd"],
  critRate: ["치명확률", "치명타확률", "치확", "critrate", "crate"],
  critDamage: ["치명피해", "치명타피해", "치피", "critdamage", "cdmg"],
  resistance: ["효과저항", "저항", "resistance", "res"],
  accuracy: ["효과적중", "효적", "accuracy", "acc"],
};

const additiveStats = new Set<MonsterStatKey>(["hp", "attack", "defense", "speed"]);

const runeNames = [
  "활력", "수호", "신속", "칼날", "격노", "집중", "인내", "맹공", "절망",
  "흡혈", "응보", "폭주", "의지", "보호", "파괴", "투지", "결의", "명중",
  "고양", "봉인", "강화",
];

const plausibleRanges: Record<MonsterStatKey, [number, number]> = {
  hp: [1000, 100000],
  attack: [50, 10000],
  defense: [50, 10000],
  speed: [50, 500],
  critRate: [0, 100],
  critDamage: [0, 400],
  resistance: [15, 100],
  accuracy: [0, 100],
};

export function createEmptyMonsterStats(): MonsterStatValues {
  return {
    hp: null,
    attack: null,
    defense: null,
    speed: null,
    critRate: null,
    critDamage: null,
    resistance: null,
    accuracy: null,
  };
}

export function parseMonsterScreenshotText(text: string): ParsedMonsterScreenshot {
  const lines = text
    .normalize("NFKC")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const stats = createEmptyMonsterStats();
  const detectedKeys: MonsterStatKey[] = [];

  for (const field of monsterStatFields) {
    const match = findStatValue(lines, field.key);
    if (match === null) continue;
    stats[field.key] = match;
    detectedKeys.push(field.key);
  }

  const compactText = normalizeForMatch(text);
  const detectedRunes = runeNames.filter((name) => compactText.includes(normalizeForMatch(name)));

  return {
    stats,
    detectedKeys,
    runeSets: detectedRunes.slice(0, 3).join(" + "),
  };
}

export function getMonsterStatQuality(key: MonsterStatKey, value: number | null) {
  if (value === null) return "missing" as const;
  const [minimum, maximum] = plausibleRanges[key];
  return value >= minimum && value <= maximum ? "ok" as const : "warning" as const;
}

function findStatValue(lines: string[], key: MonsterStatKey) {
  for (let index = 0; index < lines.length; index += 1) {
    const compactLine = normalizeForMatch(lines[index]);
    const alias = aliases[key].find((candidate) => compactLine.includes(normalizeForMatch(candidate)));
    if (!alias) continue;

    const normalizedAlias = normalizeForMatch(alias);
    let remainder = compactLine.slice(compactLine.indexOf(normalizedAlias) + normalizedAlias.length);
    let numbers = extractNumbers(remainder);

    for (let nextIndex = index + 1; numbers.length === 0 && nextIndex < Math.min(lines.length, index + 3); nextIndex += 1) {
      const nextLine = normalizeForMatch(lines[nextIndex]);
      if (containsAnotherStatLabel(nextLine)) break;
      remainder += nextLine;
      numbers = extractNumbers(remainder);
    }

    if (numbers.length === 0) continue;
    if (remainder.includes("+") && numbers.length >= 2) return Math.round(numbers[0] + numbers[1]);
    if (additiveStats.has(key) && numbers.length >= 2) return Math.round(numbers[0] + numbers[1]);
    return Math.round(numbers[0]);
  }

  return null;
}

function extractNumbers(value: string) {
  const numberFriendly = value
    .replace(/[oOㅇ]/g, "0")
    .replace(/[lI|]/g, "1");
  return [...numberFriendly.matchAll(/[+]?\d[\d,.]*/g)]
    .map((match) => Number(match[0].replace(/[+,]/g, "")))
    .filter(Number.isFinite);
}

function containsAnotherStatLabel(value: string) {
  return Object.values(aliases)
    .flat()
    .some((alias) => value.includes(normalizeForMatch(alias)));
}

function normalizeForMatch(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s_:·.%-]/g, "");
}
