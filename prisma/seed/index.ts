import { readFile } from "fs/promises";
import prisma from "../client.ts";

async function main() {
  const jsonString = await readFile(
    "prisma/seed/data/transit-data.json",
    "utf-8"
  );
  const seedData = JSON.parse(jsonString);

  await prisma.route.createMany({ data: seedData.routes });
  await prisma.stop.createMany({ data: seedData.stops });
  await prisma.routePattern.createMany({ data: seedData.routePatterns });
  await prisma.routePatternStop.createMany({
    data: seedData.routePatternStops,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
