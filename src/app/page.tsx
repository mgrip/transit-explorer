import Link from "next/link";
import prisma from "../../prisma/client";
import Map from "./map";

export default async function Home() {
  const representativeRoutePatternIds: [{ id: number }] =
    await prisma.$queryRaw`
      WITH routePatternStopCounts AS (
        SELECT "routePatternId", COUNT(*) AS "stopCount"
        FROM "RoutePatternStop"
        GROUP BY "routePatternId"
      )
      SELECT DISTINCT ON (rp."routeId") id
      FROM "RoutePattern" rp
      INNER JOIN routePatternStopCounts rpsc ON rpsc."routePatternId" = rp.id
      ORDER BY rp."routeId", rpsc."stopCount" DESC;
  `;

  const routePatterns = await prisma.routePattern.findMany({
    include: { routePatternStops: { include: { stop: true } }, route: true },
    where: { id: { in: representativeRoutePatternIds.map((row) => row.id) } },
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl text-blue-800">Transit Explorer</h1>
      <div className="flex flex-row w-72 justify-around">
        <Link href="/routeList" data-test="nav-link-route-list">
          Route List
        </Link>
        <Link href="/tripPlanner" data-test="nav-link-trip-planner">
          Trip Planner
        </Link>
      </div>
      <Map routePatterns={routePatterns} />
    </main>
  );
}
