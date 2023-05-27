import Link from "next/link";
import prisma from "../../../prisma/client";

export default async function RouteInfo() {
  const routes = await prisma.route.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <Link href={"/"}>Back</Link>
      <h1>Routes</h1>
      {routes.map((route) => (
        <div key={route.id} style={{ color: `#${route.color}` ?? undefined }}>
          {route.longName}
        </div>
      ))}
    </div>
  );
}
