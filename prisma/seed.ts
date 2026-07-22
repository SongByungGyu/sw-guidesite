import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { digestSecret } from "../src/lib/security";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const guild = await prisma.guild.upsert({
    where: { slug: process.env.GUILD_SLUG ?? "conan" },
    update: {
      name: process.env.GUILD_NAME ?? "질투",
      accessCodeHash: digestSecret(process.env.GUILD_ACCESS_CODE ?? "CONAN-01"),
    },
    create: {
      slug: process.env.GUILD_SLUG ?? "conan",
      name: process.env.GUILD_NAME ?? "질투",
      accessCodeHash: digestSecret(process.env.GUILD_ACCESS_CODE ?? "CONAN-01"),
    },
  });

  const owner = await prisma.guildMember.upsert({
    where: { guildId_nickname: { guildId: guild.id, nickname: "길드 관리자" } },
    update: { role: "OWNER", active: true },
    create: { guildId: guild.id, nickname: "길드 관리자", role: "OWNER" },
  });

  await seedAnnouncementUnlessDeleted({ id: "seed-announcement-siege", guildId: guild.id, authorId: owner.id, title: "점령전 공격 전 방덱 확인 필수", content: "공격 전에 공덱 검색에서 상대 방덱을 선택하고, 사용 후에는 전투 결과를 남겨주세요.", pinned: true });
  await seedAnnouncementUnlessDeleted({ id: "seed-announcement-guide", guildId: guild.id, authorId: owner.id, title: "던전 공략 등록 안내", content: "안정적으로 사용하는 던전 덱이 있다면 몬스터별 핵심 스탯과 함께 공략을 등록해 주세요.", pinned: false });

  const nextSiege = nextWeekday(3, 12);
  const nextLab = nextWeekday(6, 21);
  await seedScheduleUnlessDeleted({
    id: "seed-schedule-siege",
    guildId: guild.id,
    authorId: owner.id,
    title: "점령전 공격 마감",
    category: "점령전",
    startsAt: nextSiege,
  });
  await seedScheduleUnlessDeleted({
    id: "seed-schedule-lab",
    guildId: guild.id,
    authorId: owner.id,
    title: "길드 미궁 정리",
    category: "미궁",
    startsAt: nextLab,
  });

  const homework = await prisma.homework.upsert({
    where: { id: "seed-homework-first" },
    update: { title: "공식 공덱 1회 사용", target: "상대 방덱의 속도 리더 + 해제 조합을 우선 공격", strategy: "공덱 검색에서 공식 배지가 붙은 조합을 확인하고 전투 결과를 남겨주세요.", dueAt: nextSiege },
    create: { id: "seed-homework-first", guildId: guild.id, authorId: owner.id, title: "공식 공덱 1회 사용", target: "상대 방덱의 속도 리더 + 해제 조합을 우선 공격", strategy: "공덱 검색에서 공식 배지가 붙은 조합을 확인하고 전투 결과를 남겨주세요.", dueAt: nextSiege },
  });
  await prisma.homeworkMonster.deleteMany({ where: { homeworkId: homework.id } });
  await prisma.homeworkMonster.createMany({ data: [
    { homeworkId: homework.id, monsterId: "2120", position: 0, runeSets: "신속 + 의지", hp: 26000, attack: 900, defense: 1800, speed: 310, critRate: 15, critDamage: 50, resistance: 100, accuracy: 55, artifactLeft: "속도 비례 피해 감소", artifactRight: "1스킬 회복량", note: "가장 먼저 행동" },
    { homeworkId: homework.id, monsterId: "1303", position: 1, isLeader: true, runeSets: "폭주 + 의지", hp: 28000, attack: 1200, defense: 1000, speed: 245, critRate: 15, critDamage: 50, resistance: 100, accuracy: 45, artifactLeft: "속성 피해 감소", artifactRight: "2스킬 효과 적중", note: "해제 후 제어" },
    { homeworkId: homework.id, monsterId: "3118", position: 2, runeSets: "격노 + 칼날", hp: 22000, attack: 2100, defense: 1100, speed: 190, critRate: 85, critDamage: 190, resistance: 15, accuracy: 0, artifactLeft: "받는 치명타 피해 감소", artifactRight: "3스킬 치명타 피해", note: "마무리 딜러" },
  ] });
}

async function seedScheduleUnlessDeleted(input: {
  id: string;
  guildId: string;
  authorId: string;
  title: string;
  category: string;
  startsAt: Date;
}) {
  const deletion = await prisma.auditLog.findFirst({
    where: {
      guildId: input.guildId,
      action: "GUILD_SCHEDULE_DELETED",
      entityType: "GuildSchedule",
      entityId: input.id,
    },
    select: { id: true },
  });

  if (deletion) {
    await prisma.guildSchedule.deleteMany({ where: { id: input.id } });
    return;
  }

  await prisma.guildSchedule.upsert({
    where: { id: input.id },
    update: {
      title: input.title,
      category: input.category,
      startsAt: input.startsAt,
    },
    create: input,
  });
}

async function seedAnnouncementUnlessDeleted(input: {
  id: string;
  guildId: string;
  authorId: string;
  title: string;
  content: string;
  pinned: boolean;
}) {
  const deletion = await prisma.auditLog.findFirst({
    where: { guildId: input.guildId, action: "ANNOUNCEMENT_DELETED", entityType: "Announcement", entityId: input.id },
    select: { id: true },
  });
  if (deletion) {
    await prisma.announcement.deleteMany({ where: { id: input.id } });
    return;
  }
  await prisma.announcement.upsert({
    where: { id: input.id },
    update: { title: input.title, content: input.content, pinned: input.pinned },
    create: input,
  });
}

function nextWeekday(day: number, hour: number) {
  const date = new Date();
  const distance = (day - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + distance);
  date.setHours(hour, 0, 0, 0);
  return date;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
