import { select } from "@inquirer/prompts";
import { PrismaClient } from "@prisma/client";
import findTrip from "../lib/findTrip.ts";
import chalk from "chalk";

export default async function planTrip(prisma: PrismaClient) {
  const stops = await prisma.stop.findMany({ orderBy: { name: "asc" } });

  const departureStopId = await select({
    message: "Select the stop you are departing from",
    choices: stops.map((stop) => ({
      name: stop.name,
      value: stop.id,
    })),
  });
  const arrivalStopId = await select({
    message: "Select a destination",
    choices: stops.map((stop) => ({
      name: stop.name,
      value: stop.id,
    })),
  });

  try {
    const trip =
      (await findTrip({
        departureStopId,
        arrivalStopId,
      })) ?? [];

    const displayData = await Promise.all(
      trip.map(async (segment) => ({
        route: await prisma.route.findUnique({
          where: { id: segment.routeId },
        }),
        stops: await prisma.routePatternStop.findMany({
          where: {
            routePatternId: segment.routePatternId,
            stopId: { in: segment.stopIds },
          },
          orderBy: { index: "asc" },
          include: { stop: true },
        }),
      }))
    );

    console.log("");
    console.log(chalk.bold("Your trip:") + "\n");
    displayData.forEach((segment, i) => {
      console.log(
        chalk
          .hex(segment.route?.color ?? "FF5533")
          .bold(segment.route?.longName)
      );
      console.log(segment.stops.map((stop) => stop.stop.name).join(" -> "));
      if (typeof displayData[i + 1] !== "undefined") {
        console.log("");
        console.log(
          "Transfer at" +
            chalk.bold(" " + segment.stops.at(-1)?.stop.name) +
            " to"
        );
        console.log("");
      }
    });
  } catch (e) {
    console.log(e);
  }
}
