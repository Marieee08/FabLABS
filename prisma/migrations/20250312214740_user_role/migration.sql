-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PreliminarySurvey" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userRole" TEXT,
    "age" INTEGER NOT NULL,
    "sex" TEXT NOT NULL,
    "CC1" TEXT,
    "CC2" TEXT,
    "CC3" TEXT,
    "clientType" TEXT,
    "region" TEXT,
    "office" TEXT,
    "otherService" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "utilReqId" INTEGER NOT NULL,
    CONSTRAINT "PreliminarySurvey_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PreliminarySurvey" ("CC1", "CC2", "CC3", "age", "clientType", "createdAt", "id", "office", "otherService", "region", "sex", "updatedAt", "userRole", "utilReqId") SELECT "CC1", "CC2", "CC3", "age", "clientType", "createdAt", "id", "office", "otherService", "region", "sex", "updatedAt", "userRole", "utilReqId" FROM "PreliminarySurvey";
DROP TABLE "PreliminarySurvey";
ALTER TABLE "new_PreliminarySurvey" RENAME TO "PreliminarySurvey";
CREATE UNIQUE INDEX "PreliminarySurvey_utilReqId_key" ON "PreliminarySurvey"("utilReqId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
