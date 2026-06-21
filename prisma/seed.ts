import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  "คำสั่ง",
  "บันทึกข้อความ",
  "รายงานการประชุมครู",
  "รายงานการประชุมคณะกรรมการสถานศึกษา",
];

async function main() {
  console.log("Seeding document categories...");
  for (const name of CATEGORIES) {
    await prisma.documentCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Seeding complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
