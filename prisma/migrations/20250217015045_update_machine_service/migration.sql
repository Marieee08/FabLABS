/*
  Warnings:

  - You are about to drop the column `machineId` on the `Service` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "MachineService" (
    "machineId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    PRIMARY KEY ("machineId", "serviceId"),
    CONSTRAINT "MachineService_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine" ("id") ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT "MachineService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE NO ACTION ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "Service" TEXT NOT NULL,
    "Costs" DECIMAL
);
INSERT INTO "new_Service" ("Costs", "Service", "id") SELECT "Costs", "Service", "id" FROM "Service";
DROP TABLE "Service";
ALTER TABLE "new_Service" RENAME TO "Service";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
