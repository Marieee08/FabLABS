/*
  Warnings:

  - You are about to drop the column `File` on the `UserService` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "userServiceId" TEXT NOT NULL,
    CONSTRAINT "File_userServiceId_fkey" FOREIGN KEY ("userServiceId") REFERENCES "UserService" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ServiceAvail" TEXT NOT NULL,
    "EquipmentAvail" TEXT NOT NULL,
    "CostsAvail" DECIMAL,
    "MinsAvail" DECIMAL,
    "utilReqId" INTEGER,
    CONSTRAINT "UserService_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UserService" ("CostsAvail", "EquipmentAvail", "MinsAvail", "ServiceAvail", "id", "utilReqId") SELECT "CostsAvail", "EquipmentAvail", "MinsAvail", "ServiceAvail", "id", "utilReqId" FROM "UserService";
DROP TABLE "UserService";
ALTER TABLE "new_UserService" RENAME TO "UserService";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
