-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomerFeedback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "SQD0" TEXT,
    "SQD1" TEXT,
    "SQD2" TEXT,
    "SQD3" TEXT,
    "SQD4" TEXT,
    "SQD5" TEXT,
    "SQD6" TEXT,
    "SQD7" TEXT,
    "SQD8" TEXT,
    "utilReqId" INTEGER,
    "evcId" INTEGER,
    CONSTRAINT "CustomerFeedback_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CustomerFeedback_evcId_fkey" FOREIGN KEY ("evcId") REFERENCES "EVCReservation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CustomerFeedback" ("SQD0", "SQD1", "SQD2", "SQD3", "SQD4", "SQD5", "SQD6", "SQD7", "SQD8", "id", "submittedAt", "utilReqId") SELECT "SQD0", "SQD1", "SQD2", "SQD3", "SQD4", "SQD5", "SQD6", "SQD7", "SQD8", "id", "submittedAt", "utilReqId" FROM "CustomerFeedback";
DROP TABLE "CustomerFeedback";
ALTER TABLE "new_CustomerFeedback" RENAME TO "CustomerFeedback";
CREATE UNIQUE INDEX "CustomerFeedback_utilReqId_key" ON "CustomerFeedback"("utilReqId");
CREATE UNIQUE INDEX "CustomerFeedback_evcId_key" ON "CustomerFeedback"("evcId");
CREATE TABLE "new_EmployeeEvaluation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "E1" TEXT,
    "E2" TEXT,
    "E3" TEXT,
    "E4" TEXT,
    "E5" TEXT,
    "E6" TEXT,
    "E7" TEXT,
    "E8" TEXT,
    "E9" TEXT,
    "E10" TEXT,
    "E11" TEXT,
    "E12" TEXT,
    "E13" TEXT,
    "E14" TEXT,
    "E15" TEXT,
    "E16" TEXT,
    "E17" TEXT,
    "utilReqId" INTEGER,
    "evcId" INTEGER,
    CONSTRAINT "EmployeeEvaluation_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmployeeEvaluation_evcId_fkey" FOREIGN KEY ("evcId") REFERENCES "EVCReservation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EmployeeEvaluation" ("E1", "E10", "E11", "E12", "E13", "E14", "E15", "E16", "E17", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "id", "submittedAt", "utilReqId") SELECT "E1", "E10", "E11", "E12", "E13", "E14", "E15", "E16", "E17", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "id", "submittedAt", "utilReqId" FROM "EmployeeEvaluation";
DROP TABLE "EmployeeEvaluation";
ALTER TABLE "new_EmployeeEvaluation" RENAME TO "EmployeeEvaluation";
CREATE UNIQUE INDEX "EmployeeEvaluation_utilReqId_key" ON "EmployeeEvaluation"("utilReqId");
CREATE UNIQUE INDEX "EmployeeEvaluation_evcId_key" ON "EmployeeEvaluation"("evcId");
CREATE TABLE "new_PreliminarySurvey" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userRole" TEXT NOT NULL,
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
    "utilReqId" INTEGER,
    "evcId" INTEGER,
    CONSTRAINT "PreliminarySurvey_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PreliminarySurvey_evcId_fkey" FOREIGN KEY ("evcId") REFERENCES "EVCReservation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PreliminarySurvey" ("CC1", "CC2", "CC3", "age", "clientType", "createdAt", "id", "office", "otherService", "region", "sex", "updatedAt", "userRole", "utilReqId") SELECT "CC1", "CC2", "CC3", "age", "clientType", "createdAt", "id", "office", "otherService", "region", "sex", "updatedAt", "userRole", "utilReqId" FROM "PreliminarySurvey";
DROP TABLE "PreliminarySurvey";
ALTER TABLE "new_PreliminarySurvey" RENAME TO "PreliminarySurvey";
CREATE UNIQUE INDEX "PreliminarySurvey_utilReqId_key" ON "PreliminarySurvey"("utilReqId");
CREATE UNIQUE INDEX "PreliminarySurvey_evcId_key" ON "PreliminarySurvey"("evcId");
CREATE TABLE "new_SatisfactionSurvey" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userRole" TEXT NOT NULL,
    "sex" TEXT,
    "age" INTEGER,
    "CC1" TEXT,
    "CC2" TEXT,
    "CC3" TEXT,
    "SQD0" TEXT,
    "SQD1" TEXT,
    "SQD2" TEXT,
    "SQD3" TEXT,
    "SQD4" TEXT,
    "SQD5" TEXT,
    "SQD6" TEXT,
    "SQD7" TEXT,
    "SQD8" TEXT,
    "suggestions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "utilReqId" INTEGER,
    "evcId" INTEGER,
    CONSTRAINT "SatisfactionSurvey_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SatisfactionSurvey_evcId_fkey" FOREIGN KEY ("evcId") REFERENCES "EVCReservation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SatisfactionSurvey" ("CC1", "CC2", "CC3", "SQD0", "SQD1", "SQD2", "SQD3", "SQD4", "SQD5", "SQD6", "SQD7", "SQD8", "age", "createdAt", "id", "sex", "suggestions", "updatedAt", "userRole", "utilReqId") SELECT "CC1", "CC2", "CC3", "SQD0", "SQD1", "SQD2", "SQD3", "SQD4", "SQD5", "SQD6", "SQD7", "SQD8", "age", "createdAt", "id", "sex", "suggestions", "updatedAt", "userRole", "utilReqId" FROM "SatisfactionSurvey";
DROP TABLE "SatisfactionSurvey";
ALTER TABLE "new_SatisfactionSurvey" RENAME TO "SatisfactionSurvey";
CREATE UNIQUE INDEX "SatisfactionSurvey_utilReqId_key" ON "SatisfactionSurvey"("utilReqId");
CREATE UNIQUE INDEX "SatisfactionSurvey_evcId_key" ON "SatisfactionSurvey"("evcId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
