"use server";

import { Route, RoutePattern, Stop } from "@prisma/client";
import findTrip from "../../lib/findTrip";
import prisma from "../../../prisma/client";

export type TripData = {
  routePattern: RoutePattern | null;
  route: Route | null;
  stops: Stop[];
}[];

export async function findTripData({
  departureStopId,
  arrivalStopId,
}: {
  departureStopId: number;
  arrivalStopId: number;
}): Promise<TripData> {
  const trip = await findTrip({
    departureStopId,
    arrivalStopId,
  });
  const displayData = trip
    ? await Promise.all(
        trip.map(async (segment) => ({
          routePattern: await prisma.routePattern.findUnique({
            where: { id: segment.routePatternId },
          }),
          route: await prisma.route.findUnique({
            where: { id: segment.routeId },
          }),
          stops: (
            await prisma.routePatternStop.findMany({
              where: {
                routePatternId: segment.routePatternId,
                stopId: { in: segment.stopIds },
              },
              orderBy: { index: "asc" },
              include: { stop: true },
            })
          ).map((routePatternStop) => routePatternStop.stop),
        }))
      )
    : [];

  return displayData;
}
