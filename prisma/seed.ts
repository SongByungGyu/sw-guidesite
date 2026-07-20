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
      name: process.env.GUILD_NAME ?? "코난 길드",
      accessCodeHash: digestSecret(process.env.GUILD_ACCESS_CODE ?? "CONAN-01"),
    },
    create: {
      slug: process.env.GUILD_SLUG ?? "conan",
      name: process.env.GUILD_NAME ?? "코난 길드",
      accessCodeHash: digestSecret(process.env.GUILD_ACCESS_CODE ?? "CONAN-01"),
    },
  });

  await prisma.guildMember.upsert({
    where: { guildId_nickname: { guildId: guild.id, nickname: "길드 관리자" } },
    update: { role: "OWNER", active: true },
    create: { guildId: guild.id, nickname: "길드 관리자", role: "OWNER" },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
