import { objectContainsKey } from "jest-mock-extended";
import { prismaMock } from "../../../prisma/singleton";
import { RoutePattern, RoutePatternStop } from "@prisma/client";
import findTrip from "../findTrip";

test("can find trip", async () => {
  type RoutePatternResult = RoutePattern & {
    routePatternStops: RoutePatternStop[];
  };
  const routePattern1: RoutePatternResult = {
    id: 1,
    name: "Route 1",
    routeId: 1,
    sourceInfo: {},
    sourceId: "1",
    routePatternStops: [
      { routePatternId: 1, stopId: 1, index: 0 },
      { routePatternId: 1, stopId: 2, index: 1 },
      { routePatternId: 1, stopId: 3, index: 2 },
    ],
  };
  const routePattern2: RoutePatternResult = {
    id: 2,
    name: "Route 2",
    routeId: 2,
    sourceInfo: {},
    sourceId: "2",
    routePatternStops: [
      { routePatternId: 2, stopId: 4, index: 0 },
      { routePatternId: 2, stopId: 3, index: 1 },
      { routePatternId: 2, stopId: 5, index: 2 },
    ],
  };
  const routePatterns = [routePattern1, routePattern2];

  prismaMock.routePattern.findMany
    // this is the call to get all route patterns
    .calledWith(objectContainsKey("include"))
    .mockResolvedValue(routePatterns);

  prismaMock.routePattern.findMany
    // this is the call to get routePatterns "where stop id = departure stop id",
    // so we want to just return the first route pattern which actually includes stop 1
    .calledWith(objectContainsKey("where"))
    .mockResolvedValue([routePattern1]);

  const result = await await findTrip({ departureStopId: 1, arrivalStopId: 5 });

  expect(result).toMatchSnapshot();
});
