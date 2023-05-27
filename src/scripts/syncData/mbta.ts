import fetch from "node-fetch";
import { Prisma } from "@prisma/client";
import prisma from "../../../prisma/client.ts";

const baseURL = " https://api-v3.mbta.com/";

interface RouteAPIResult {
  id: string;
  attributes: {
    type: string;
    short_name: string;
    long_name: string;
    description: string;
    color: string;
  };
  links: {
    self: string;
  };
  relationships: {
    route_patterns: {
      data: { id: string; type: "route_pattern" }[];
    };
  };
}

interface RoutePatternAPIResult {
  attributes: {
    canonical: boolean;
    name: string;
  };
  id: string;
  type: "route_pattern";
  links: {
    self: string;
  };
  relationships: {
    representative_trip: {
      data: {
        id: string;
        type: "trip";
      };
    };
  };
}

interface TripAPIResult {
  attributes: {
    headsign: string;
    name: string;
  };
  id: string;
  type: "trip";
  links: {
    self: string;
  };
  relationships: {
    route_pattern: {
      data: {
        id: string;
        type: "route_pattern";
      };
    };
    stops: {
      data: [{ id: string; type: "stop" }];
    };
  };
}

interface StopAPIResult {
  attributes: {
    address: string;
    description: string;
    latitude: number;
    longitude: number;
    name: string;
    location_type: number;
  };
  id: string;
  links: {
    self: string;
  };
  relationships: {
    parent_station: {
      data: {
        id: string;
        type: "stop";
      };
    };
  };
  type: "stop";
}

interface RoutesAPIResult {
  data: RouteAPIResult[];
  included: (RoutePatternAPIResult | TripAPIResult | StopAPIResult)[];
}

export default async function mbta() {
  console.log("Sync MBTA info from public API");
  const timerName = "Time elapsed";
  console.time(timerName);
  try {
    // curl -X GET "https://api-v3.mbta.com/routes?include=route_patterns.representative_trip.stops.parent_station&filter%5Btype%5D=0%2C1" -H "accept: application/vnd.api+json"
    const routesResults = await fetch(
      `${baseURL}/routes?include=route_patterns.representative_trip.stops.parent_station&filter%5Btype%5D=0%2C1`,
      {
        headers: {
          accept: "application/vnd.api+json",
          // "X-API-Key": API_KEY,
        },
      }
    );

    const routesResultsJSON: RoutesAPIResult =
      (await routesResults.json()) as RoutesAPIResult;
    await prisma.routePatternStop.deleteMany();
    await prisma.stop.deleteMany();
    await prisma.routePattern.deleteMany();
    await prisma.route.deleteMany();

    const routesToCreate: Prisma.RouteCreateManyInput[] =
      routesResultsJSON.data.map((route) => {
        return {
          type: `${route.attributes.type}`,
          name: route.attributes.short_name,
          longName: route.attributes.long_name,
          description: route.attributes.description,
          color: route.attributes.color,
          sourceInfo: {
            id: route.id,
            links: route.links,
          },
          sourceId: route.id,
        };
      });
    await prisma.route.createMany({ data: routesToCreate });
    const routeIdMap = await prisma.route.findMany({
      select: { id: true, sourceId: true },
    });

    const routePatternsToCreate: Prisma.RoutePatternCreateManyInput[] =
      routesResultsJSON.included
        .filter((result) => result.type === "route_pattern")
        .map((routePatternResult) => {
          return {
            name: routePatternResult.attributes.name,
            sourceInfo: {
              id: routePatternResult.id,
              links: routePatternResult.links,
            },
            routeId: routeIdMap.find(
              (routeId) =>
                routeId.sourceId ===
                routesResultsJSON.data.find(
                  (route) =>
                    !!route.relationships.route_patterns.data.find(
                      (routePattern) =>
                        routePattern.id === routePatternResult.id
                    )
                )?.id
            )?.id as number,
            sourceId: routePatternResult.id,
          };
        });
    await prisma.routePattern.createMany({ data: routePatternsToCreate });
    const routePatternIdMap = await prisma.routePattern.findMany({
      select: { id: true, sourceId: true },
    });

    const stopsToCreate: Prisma.StopCreateManyInput[] =
      routesResultsJSON.included
        // only include stops that are "parent" stops
        .filter<StopAPIResult>(
          // eslint-disable-next-line
          // @ts-ignore
          (result) =>
            result.type === "stop" && result.attributes.location_type === 1
        )
        .map((stopResult) => {
          return {
            name: stopResult.attributes.name,
            description: stopResult.attributes.description,
            latitude: stopResult.attributes.latitude,
            longitude: stopResult.attributes.longitude,
            address: stopResult.attributes.address,
            sourceInfo: {
              id: stopResult.id,
              links: stopResult.links,
            },
            sourceId: stopResult.id,
          };
        });
    await prisma.stop.createMany({ data: stopsToCreate });
    const stopIdMap = await prisma.stop.findMany({
      select: { id: true, sourceId: true },
    });

    const routePatternStopsToCreate: Prisma.RoutePatternStopCreateManyInput[] =
      routesResultsJSON.included
        .filter<RoutePatternAPIResult>(
          // eslint-disable-next-line
          // @ts-ignore
          (result) => result.type === "route_pattern"
        )
        .flatMap((routePatternResult) => {
          const representativeTripResult = routesResultsJSON.included.find(
            (result) =>
              result.type === "trip" &&
              result.id ===
                routePatternResult.relationships.representative_trip.data.id
          ) as TripAPIResult;

          return representativeTripResult.relationships.stops.data.map(
            (stopRelationship, i) => {
              const stopResult = routesResultsJSON.included.find(
                (stopResult) =>
                  stopResult.type === "stop" &&
                  stopResult.id === stopRelationship.id
              ) as StopAPIResult;
              const parentStationResult = routesResultsJSON.included.find(
                (stationResult) =>
                  stationResult.type === "stop" &&
                  stationResult.id ===
                    stopResult.relationships.parent_station.data.id
              ) as StopAPIResult;

              return {
                stopId: stopIdMap.find(
                  (stop) => stop.sourceId === parentStationResult.id
                )?.id as number,
                routePatternId: routePatternIdMap.find(
                  (routePattern) =>
                    routePattern.sourceId === routePatternResult.id
                )?.id as number,
                index: i,
              };
            }
          );
        });
    await prisma.routePatternStop.createMany({
      data: routePatternStopsToCreate,
    });
    console.timeEnd(timerName);
  } catch (e) {
    console.log(e);
  }
}
