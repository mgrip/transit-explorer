import { PrismaClient } from "@prisma/client";
import chalk from "chalk";

export default async function listRoutes(prisma: PrismaClient) {
  const routes = await prisma.route.findMany({ orderBy: { name: "asc" } });

  console.log("");
  console.log("Routes:");
  routes.forEach((route) => {
    console.log(chalk.hex(route.color ?? "FF5533").bold(route.longName));
  });
}
