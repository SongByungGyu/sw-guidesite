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

  await prisma.announcement.upsert({
    where: { id: "seed-announcement-siege" },
    update: { title: "점령전 공격 전 방덱 확인 필수", content: "공격 전에 공덱 검색에서 상대 방덱을 선택하고, 사용 후에는 전투 결과를 남겨주세요.", pinned: true },
    create: { id: "seed-announcement-siege", guildId: guild.id, authorId: owner.id, title: "점령전 공격 전 방덱 확인 필수", content: "공격 전에 공덱 검색에서 상대 방덱을 선택하고, 사용 후에는 전투 결과를 남겨주세요.", pinned: true },
  });
  await prisma.announcement.upsert({
    where: { id: "seed-announcement-guide" },
    update: { title: "던전 공략 등록 안내", content: "안정적으로 사용하는 던전 덱이 있다면 몬스터별 핵심 스탯과 함께 공략을 등록해 주세요." },
    create: { id: "seed-announcement-guide", guildId: guild.id, authorId: owner.id, title: "던전 공략 등록 안내", content: "안정적으로 사용하는 던전 덱이 있다면 몬스터별 핵심 스탯과 함께 공략을 등록해 주세요." },
  });

  const nextSiege = nextWeekday(3, 12);
  const nextLab = nextWeekday(6, 21);
  await prisma.guildSchedule.upsert({
    where: { id: "seed-schedule-siege" },
    update: { title: "점령전 공격 마감", category: "점령전", startsAt: nextSiege },
    create: { id: "seed-schedule-siege", guildId: guild.id, authorId: owner.id, title: "점령전 공격 마감", category: "점령전", startsAt: nextSiege },
  });
  await prisma.guildSchedule.upsert({
    where: { id: "seed-schedule-lab" },
    update: { title: "길드 미궁 정리", category: "미궁", startsAt: nextLab },
    create: { id: "seed-schedule-lab", guildId: guild.id, authorId: owner.id, title: "길드 미궁 정리", category: "미궁", startsAt: nextLab },
  });

  const homework = await prisma.homework.upsert({
    where: { id: "seed-homework-first" },
    update: { title: "공식 공덱 1회 사용", target: "상대 방덱의 속도 리더 + 해제 조합을 우선 공격", strategy: "공덱 검색에서 공식 배지가 붙은 조합을 확인하고 전투 결과를 남겨주세요.", dueAt: nextSiege, status: "ACTIVE" },
    create: { id: "seed-homework-first", guildId: guild.id, authorId: owner.id, title: "공식 공덱 1회 사용", target: "상대 방덱의 속도 리더 + 해제 조합을 우선 공격", strategy: "공덱 검색에서 공식 배지가 붙은 조합을 확인하고 전투 결과를 남겨주세요.", dueAt: nextSiege },
  });
  await prisma.homeworkMonster.deleteMany({ where: { homeworkId: homework.id } });
  await prisma.homeworkMonster.createMany({ data: [
    { homeworkId: homework.id, monsterId: "2120", position: 0, runeSets: "신속 + 의지", speed: 310, accuracy: 55 },
    { homeworkId: homework.id, monsterId: "1303", position: 1, isLeader: true, runeSets: "폭주 + 의지", speed: 245, hp: 28000 },
    { homeworkId: homework.id, monsterId: "3118", position: 2, runeSets: "격노 + 칼날", attack: 2100, critRate: 85, critDamage: 190 },
  ] });
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
