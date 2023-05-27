import { select } from "@inquirer/prompts";
import planTrip from "./planTrip.ts";
import listRoutes from "./listRoutes.ts";
import listRouteInfo from "./listRouteInfo.ts";
import prisma from "../../prisma/client.ts";

enum Questions {
  LIST_ROUTES,
  LIST_ROUTE_INFO,
  PLAN_TRIP,
}

const question = await select({
  message: "What would you like to do?",
  choices: [
    { name: "List subway routes", value: Questions.LIST_ROUTES },
    {
      name: "List subway route information, including number of stops and connection hubs",
      value: Questions.LIST_ROUTE_INFO,
    },
    { name: "Plan a trip", value: Questions.PLAN_TRIP },
  ],
});

switch (question) {
  case Questions.LIST_ROUTES:
    await listRoutes(prisma);
    break;
  case Questions.LIST_ROUTE_INFO:
    await listRouteInfo(prisma);
    break;
  case Questions.PLAN_TRIP:
    await planTrip(prisma);
    break;
}

prisma.$disconnect();
