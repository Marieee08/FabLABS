/*
  Warnings:

  - You are about to drop the `CitizenSatisfaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClientSatisfaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `FeedbackDate` on the `CustomerFeedback` table. All the data in the column will be lost.
  - You are about to drop the column `Q1` on the `CustomerFeedback` table. All the data in the column will be lost.
  - You are about to drop the column `Q2` on the `CustomerFeedback` table. All the data in the column will be lost.
  - You are about to drop the column `Q3` on the `CustomerFeedback` table. All the data in the column will be lost.
  - You are about to drop the column `Q4` on the `CustomerFeedback` table. All the data in the column will be lost.
  - You are about to drop the column `Q5` on the `CustomerFeedback` table. All the data in the column will be lost.
  - You are about to drop the column `Q6` on the `CustomerFeedback` table. All the data in the column will be lost.
  - You are about to drop the column `Q7` on the `CustomerFeedback` table. All the data in the column will be lost.
  - You are about to drop the column `EvalDate` on the `EmployeeEvaluation` table. All the data in the column will be lost.
  - You are about to drop the column `EvalSig` on the `EmployeeEvaluation` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "CitizenSatisfaction_utilReqId_key";

-- DropIndex
DROP INDEX "ClientSatisfaction_utilReqId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CitizenSatisfaction";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ClientSatisfaction";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "PreliminarySurvey" (
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
    "utilReqId" INTEGER NOT NULL,
    CONSTRAINT "PreliminarySurvey_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceAvailed" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "service" TEXT NOT NULL,
    "utilReqId" INTEGER NOT NULL,
    CONSTRAINT "ServiceAvailed_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SatisfactionSurvey" (
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
    "utilReqId" INTEGER NOT NULL,
    CONSTRAINT "SatisfactionSurvey_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "utilReqId" INTEGER NOT NULL,
    CONSTRAINT "CustomerFeedback_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CustomerFeedback" ("id", "utilReqId") SELECT "id", "utilReqId" FROM "CustomerFeedback";
DROP TABLE "CustomerFeedback";
ALTER TABLE "new_CustomerFeedback" RENAME TO "CustomerFeedback";
CREATE UNIQUE INDEX "CustomerFeedback_utilReqId_key" ON "CustomerFeedback"("utilReqId");
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
    "utilReqId" INTEGER NOT NULL,
    CONSTRAINT "EmployeeEvaluation_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EmployeeEvaluation" ("E1", "E10", "E11", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "id", "utilReqId") SELECT "E1", "E10", "E11", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "id", "utilReqId" FROM "EmployeeEvaluation";
DROP TABLE "EmployeeEvaluation";
ALTER TABLE "new_EmployeeEvaluation" RENAME TO "EmployeeEvaluation";
CREATE UNIQUE INDEX "EmployeeEvaluation_utilReqId_key" ON "EmployeeEvaluation"("utilReqId");
CREATE TABLE "new_UtilReq" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Status" TEXT NOT NULL DEFAULT 'Pending',
    "RequestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "TotalAmntDue" DECIMAL,
    "BulkofCommodity" TEXT,
    "DateofProcessing" DATETIME,
    "Processedby" TEXT,
    "ReceiptNumber" TEXT,
    "PaymentDate" DATETIME,
    "accInfoId" INTEGER,
    CONSTRAINT "UtilReq_accInfoId_fkey" FOREIGN KEY ("accInfoId") REFERENCES "AccInfo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UtilReq" ("BulkofCommodity", "DateofProcessing", "PaymentDate", "Processedby", "ReceiptNumber", "RequestDate", "Status", "TotalAmntDue", "accInfoId", "id") SELECT "BulkofCommodity", "DateofProcessing", "PaymentDate", "Processedby", "ReceiptNumber", coalesce("RequestDate", CURRENT_TIMESTAMP) AS "RequestDate", "Status", "TotalAmntDue", "accInfoId", "id" FROM "UtilReq";
DROP TABLE "UtilReq";
ALTER TABLE "new_UtilReq" RENAME TO "UtilReq";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PreliminarySurvey_utilReqId_key" ON "PreliminarySurvey"("utilReqId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAvailed_utilReqId_service_key" ON "ServiceAvailed"("utilReqId", "service");

-- CreateIndex
CREATE UNIQUE INDEX "SatisfactionSurvey_utilReqId_key" ON "SatisfactionSurvey"("utilReqId");
