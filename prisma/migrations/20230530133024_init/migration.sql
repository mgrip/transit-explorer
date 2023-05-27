-- CreateTable
CREATE TABLE "Route" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "longName" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "color" TEXT,
    "sourceInfo" JSONB NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutePattern" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "routeId" INTEGER NOT NULL,
    "sourceInfo" JSONB NOT NULL,

    CONSTRAINT "RoutePattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stop" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "sourceInfo" JSONB NOT NULL,

    CONSTRAINT "Stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutePatternStop" (
    "routePatternId" INTEGER NOT NULL,
    "stopId" INTEGER NOT NULL,
    "index" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "RoutePatternStop_routePatternId_stopId_key" ON "RoutePatternStop"("routePatternId", "stopId");

-- AddForeignKey
ALTER TABLE "RoutePattern" ADD CONSTRAINT "RoutePattern_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutePatternStop" ADD CONSTRAINT "RoutePatternStop_routePatternId_fkey" FOREIGN KEY ("routePatternId") REFERENCES "RoutePattern"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutePatternStop" ADD CONSTRAINT "RoutePatternStop_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "Stop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
