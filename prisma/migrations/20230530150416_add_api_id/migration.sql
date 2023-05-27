/*
  Warnings:

  - Added the required column `sourceId` to the `Route` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceId` to the `RoutePattern` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceId` to the `Stop` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "sourceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RoutePattern" ADD COLUMN     "sourceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Stop" ADD COLUMN     "sourceId" TEXT NOT NULL;
