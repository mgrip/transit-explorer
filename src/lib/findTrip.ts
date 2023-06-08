import prisma from "../../prisma/client.ts";

interface TripSegment {
  routePatternId: number;
  routeId: number;
  stopIds: number[];
}

type Trip = TripSegment[];

interface RoutePatternMap {
  id: number;
  routeId: number;
  routePatternStops: { id: number; stopId: number; index: number }[];
}
interface RouteMap {
  [routePatternId: number]: RoutePatternMap;
}

function incrementTripSegments(
  currentTrips: Trip[],
  routeMap: RouteMap
): Trip[] {
  return currentTrips.reduce<Trip[]>((acc, trip) => {
    const mostRecentSegment = trip.at(-1);
    if (!mostRecentSegment) {
      throw new Error("No current segment for trip");
    }
    const currentRoutePatternStop = routeMap[
      mostRecentSegment.routePatternId
    ].routePatternStops.find(
      (routePatternStop) =>
        routePatternStop.stopId === mostRecentSegment.stopIds.at(-1)
    );
    if (!currentRoutePatternStop) {
      console.log(mostRecentSegment, "1");
      console.log(routeMap[mostRecentSegment.routePatternId], "2");
      console.log(currentTrips[1][0].stopIds);
      throw new Error("Current route pattern does not include current stop");
    }

    const nextRoutePatternStop = routeMap[
      mostRecentSegment.routePatternId
    ].routePatternStops.find(
      (routePatternStop) =>
        routePatternStop.index === currentRoutePatternStop.index + 1
    );

    const availableTransferRoutePatterns = Object.values<RoutePatternMap>(
      // eslint-disable-next-line
      // @ts-ignore
      routeMap
    ).reduce<RoutePatternMap[]>((acc, routePattern) => {
      const matchingRoutePatternStop = routePattern.routePatternStops.find(
        (routePatternStop) =>
          routePatternStop.stopId === currentRoutePatternStop.stopId
      );

      // don't allow transfer to route patterns on the same route
      if (routePattern.routeId === mostRecentSegment.routeId) {
        return [...acc];
      } else if (matchingRoutePatternStop) {
        // check to match sure there is a next stop on any available transfer route pattern
        const nextStopOnTransferRoute = routePattern.routePatternStops.find(
          (routePatternStop) =>
            routePatternStop.index === matchingRoutePatternStop.index + 1
        );
        if (nextStopOnTransferRoute) {
          return [...acc, routePattern];
        } else {
          return [...acc];
        }
      } else {
        return [...acc];
      }
    }, []);

    let continuingTrips: Trip[] = [];
    if (nextRoutePatternStop && mostRecentSegment) {
      continuingTrips = [
        [
          ...trip.slice(0, -1),
          {
            ...mostRecentSegment,
            stopIds: [
              ...mostRecentSegment.stopIds,
              nextRoutePatternStop.stopId,
            ],
          },
        ],
      ];
    }

    let newTransferTrips: Trip[] = [];
    if (availableTransferRoutePatterns.length > 0) {
      newTransferTrips = availableTransferRoutePatterns.map(
        (transferRoutePattern) => {
          const matchingRoutePatternStop =
            transferRoutePattern.routePatternStops.find(
              (routePatternStop) =>
                routePatternStop.stopId === currentRoutePatternStop.stopId
            );
          if (!matchingRoutePatternStop) {
            throw new Error("should never get here");
          }
          const nextStopOnTransferRoute =
            transferRoutePattern.routePatternStops.find(
              (routePatternStop) =>
                routePatternStop.index === matchingRoutePatternStop.index + 1
            );
          if (!nextStopOnTransferRoute) {
            throw new Error("should never get here");
          }
          const newTrip: Trip = [
            ...trip,
            {
              routePatternId: transferRoutePattern.id,
              routeId: transferRoutePattern.routeId,
              stopIds: [
                currentRoutePatternStop.stopId,
                nextStopOnTransferRoute.stopId,
              ],
            },
          ];
          return newTrip;
        }
      );
    }

    // at some point its not worth checking the exponential number of possible trips based on every possible transfer combination
    // we're using a heuristic here to assume any trip with more than 3 segments is not worth checking
    const filterUnrealisticTrips = (trip: Trip) => trip.length < 4;

    return [
      ...acc,
      ...continuingTrips.filter(filterUnrealisticTrips),
      ...newTransferTrips.filter(filterUnrealisticTrips),
    ];
  }, []);
}

function checkForRoutes(
  currentTrips: Trip[],
  routeMap: RouteMap,
  destinationStopId: number,
  depth = 1000
): Trip {
  const newTrips = incrementTripSegments(currentTrips, routeMap);
  const completeTrips = newTrips.filter(
    (trip) => trip.at(-1)?.stopIds.at(-1) === destinationStopId
  );
  if (completeTrips.length > 0) {
    // sort by stop length
    completeTrips.sort((a, b) => {
      const aLength = a.reduce(
        (acc, segment) => acc + segment.stopIds.length,
        0
      );
      const bLength = b.reduce(
        (acc, segment) => acc + segment.stopIds.length,
        0
      );
      return aLength < bLength ? -1 : aLength > bLength ? 1 : 0;
    });

    return completeTrips[0];
  } else if (depth === 0) {
    throw new Error("Max depth exceeded - no route found");
  } else {
    return checkForRoutes(newTrips, routeMap, destinationStopId, depth - 1);
  }
}

export default async function findTrip({
  departureStopId,
  arrivalStopId,
}: {
  departureStopId: number;
  arrivalStopId: number;
}): Promise<Trip | undefined> {
  const routeMap: RouteMap = {};
  const routePatterns = await prisma.routePattern.findMany({
    include: {
      routePatternStops: true,
    },
  });
  routePatterns.forEach((routePattern) => {
    routeMap[routePattern.id] = {
      id: routePattern.id,
      routeId: routePattern.routeId,
      routePatternStops: routePattern.routePatternStops.map(
        (routePatternStop) => ({
          id: routePatternStop.index,
          stopId: routePatternStop.stopId,
          index: routePatternStop.index,
        })
      ),
    };
  });
  const availableRoutePatterns = await prisma.routePattern.findMany({
    where: {
      routePatternStops: {
        some: {
          stopId: departureStopId,
        },
      },
    },
  });
  const startTrips = availableRoutePatterns.map((routePattern) => {
    const trip: Trip = [
      {
        routeId: routePattern.routeId,
        routePatternId: routePattern.id,
        stopIds: [departureStopId],
      },
    ];
    return trip;
  });

  return checkForRoutes(startTrips, routeMap, arrivalStopId);
}
