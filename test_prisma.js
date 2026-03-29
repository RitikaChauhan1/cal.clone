const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const res = await prisma.eventType.findMany();
    console.log(res);
  } catch(e) {
    console.error("PRISMA ERROR", e);
  }
}
run();
