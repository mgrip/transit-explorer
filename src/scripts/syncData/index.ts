import prisma from "../../../prisma/client.ts";
import mbta from "./mbta.ts";

async function main() {
  await mbta();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
