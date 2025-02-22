/*
  Warnings:

  - You are about to drop the column `Costs` on the `Machine` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Service" ADD COLUMN "Costs" DECIMAL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Machine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "Machine" TEXT NOT NULL,
    "Image" TEXT NOT NULL,
    "Desc" TEXT NOT NULL,
    "Instructions" TEXT,
    "Link" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Machine" ("Desc", "Image", "Instructions", "Link", "Machine", "createdAt", "id", "isAvailable", "updatedAt") SELECT "Desc", "Image", "Instructions", "Link", "Machine", "createdAt", "id", "isAvailable", "updatedAt" FROM "Machine";
DROP TABLE "Machine";
ALTER TABLE "new_Machine" RENAME TO "Machine";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
