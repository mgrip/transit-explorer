import React from "react";
import StopSelect from "./stopSelect";
import prisma from "../../../prisma/client";

export default async function Test() {
  const stops = await prisma.stop.findMany();

  return <StopSelect stops={stops} />;
}
