-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Machine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "Machine" TEXT NOT NULL,
    "GenName" TEXT,
    "Image" TEXT NOT NULL,
    "Desc" TEXT NOT NULL,
    "Number" INTEGER,
    "NeedLink" BOOLEAN NOT NULL DEFAULT false,
    "Instructions" TEXT,
    "Link" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Machine" ("Desc", "Image", "Instructions", "Link", "Machine", "Number", "createdAt", "id", "isAvailable", "updatedAt") SELECT "Desc", "Image", "Instructions", "Link", "Machine", "Number", "createdAt", "id", "isAvailable", "updatedAt" FROM "Machine";
DROP TABLE "Machine";
ALTER TABLE "new_Machine" RENAME TO "Machine";
CREATE TABLE "new_UserService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ServiceAvail" TEXT NOT NULL,
    "EquipmentAvail" TEXT NOT NULL,
    "CostsAvail" DECIMAL,
    "MinsAvail" DECIMAL,
    "Files" TEXT,
    "utilReqId" INTEGER,
    "evcId" INTEGER,
    CONSTRAINT "UserService_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "UserService_evcId_fkey" FOREIGN KEY ("evcId") REFERENCES "EVCReservation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UserService" ("CostsAvail", "EquipmentAvail", "Files", "MinsAvail", "ServiceAvail", "id", "utilReqId") SELECT "CostsAvail", "EquipmentAvail", "Files", "MinsAvail", "ServiceAvail", "id", "utilReqId" FROM "UserService";
DROP TABLE "UserService";
ALTER TABLE "new_UserService" RENAME TO "UserService";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
