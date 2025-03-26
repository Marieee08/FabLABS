-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UtilTime" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "DayNum" INTEGER,
    "StartTime" DATETIME,
    "EndTime" DATETIME,
    "DateStatus" TEXT DEFAULT 'Ongoing',
    "utilReqId" INTEGER,
    "evcId" INTEGER,
    CONSTRAINT "UtilTime_evcId_fkey" FOREIGN KEY ("evcId") REFERENCES "EVCReservation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "UtilTime_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UtilTime" ("DateStatus", "DayNum", "EndTime", "StartTime", "evcId", "id", "utilReqId") SELECT "DateStatus", "DayNum", "EndTime", "StartTime", "evcId", "id", "utilReqId" FROM "UtilTime";
DROP TABLE "UtilTime";
ALTER TABLE "new_UtilTime" RENAME TO "UtilTime";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
