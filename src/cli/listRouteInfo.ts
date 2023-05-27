import { PrismaClient } from "@prisma/client";
import chalk from "chalk";

export default async function listRouteInfo(prisma: PrismaClient) {
  interface ResultRow {
    id: number;
    routeId: number;
    stopCount: number;
  }
  const routePatternStopCounts = await prisma.$queryRaw<ResultRow[]>`
    WITH "routePatternStopCounts" AS (
      SELECT "routePatternId", COUNT(*) AS "stopCount"
      FROM "RoutePatternStop"
      GROUP BY "routePatternId"
    )
    SELECT *
    FROM "RoutePattern" rp
    INNER JOIN "routePatternStopCounts" rpsc ON rpsc."routePatternId" = rp.id
    ORDER BY rpsc."stopCount" DESC
  `;

  const routeWithMostStops = await prisma.route.findUnique({
    where: { id: routePatternStopCounts.at(0)?.routeId },
  });
  const routeWithLeastStops = await prisma.route.findUnique({
    where: { id: routePatternStopCounts.at(-1)?.routeId },
  });

  console.log("");
  console.log("Route with most stops:");
  console.log(
    chalk
      .hex(routeWithMostStops?.color ?? "FF5533")
      .bold(routeWithMostStops?.longName) +
      ` (${routePatternStopCounts.at(0)?.stopCount} stops)`
  );
  console.log("");
  console.log("Route with least stops:");
  console.log(
    chalk
      .hex(routeWithLeastStops?.color ?? "FF5533")
      .bold(routeWithLeastStops?.longName) +
      ` (${routePatternStopCounts.at(-1)?.stopCount} stops)`
  );

  interface HubResultRow {
    stopId: number;
    routeId: number;
  }
  const stopHubResults = await prisma.$queryRaw<HubResultRow[]>`
    WITH "hubStops" AS (
      SELECT rps."stopId", COUNT(DISTINCT rp."routeId") AS "routeCount"
      FROM "RoutePatternStop" rps
      INNER JOIN "RoutePattern" rp ON rp.id = rps."routePatternId"
      GROUP BY rps."stopId"
      HAVING COUNT(DISTINCT rp."routeId") > 1
    )
    SELECT DISTINCT s.id AS "stopId", rp."routeId"
    FROM "Stop" s
    INNER JOIN "hubStops" hs ON hs."stopId" = s.id
    INNER JOIN "RoutePatternStop" rps ON rps."stopId" = s.id
    INNER JOIN "RoutePattern" rp ON rp.id = rps."routePatternId"
    ORDER BY "stopId";
  `;

  const stopHubs = stopHubResults.reduce<
    { stopId: number; routeIds: number[] }[]
  >((acc, hub) => {
    const existingHub = acc.find((h) => h.stopId === hub.stopId);
    if (existingHub) {
      existingHub.routeIds.push(hub.routeId);
    } else {
      acc.push({
        stopId: hub.stopId,
        routeIds: [hub.routeId],
      });
    }
    return acc;
  }, []);

  const displayData = await Promise.all(
    stopHubs.map(async (hub) => ({
      stop: await prisma.stop.findUniqueOrThrow({
        where: { id: hub.stopId },
      }),
      routes: await prisma.route.findMany({
        where: {
          id: { in: hub.routeIds },
        },
        orderBy: { name: "asc" },
      }),
    }))
  );

  displayData.forEach((hub) => {
    console.log("");
    console.log(chalk.bold(hub.stop.name));
    console.log(hub.routes.map((route) => route.longName).join(", "));
  });
}
