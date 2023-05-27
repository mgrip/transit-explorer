import { writeFile } from "fs";
import prisma from "../../prisma/client.ts";

const seedJson = {
  routes: await prisma.route.findMany(),
  stops: await prisma.stop.findMany(),
  routePatterns: await prisma.routePattern.findMany(),
  routePatternStops: await prisma.routePatternStop.findMany(),
};

writeFile(
  "prisma/seed/data/transit-data.json",
  JSON.stringify(seedJson),
  "utf8",
  () => null
);
