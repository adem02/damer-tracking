-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "location" geometry(Point, 4326) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "positions_location_idx" ON "positions" USING GIST ("location");

-- CreateIndex
CREATE INDEX "positions_machine_id_timestamp_idx" ON "positions"("machine_id", "timestamp");

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
