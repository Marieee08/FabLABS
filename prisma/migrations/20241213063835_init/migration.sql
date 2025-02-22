-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "Machine" TEXT NOT NULL,
    "Image" TEXT NOT NULL,
    "Desc" TEXT NOT NULL,
    "Instructions" TEXT,
    "Link" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "Costs" DECIMAL
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "Tool" TEXT NOT NULL,
    "Quantity" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "Service" TEXT NOT NULL,
    "machineId" TEXT,
    CONSTRAINT "Service_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccInfo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clerkId" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "Role" TEXT NOT NULL DEFAULT 'MSME'
);

-- CreateTable
CREATE TABLE "ClientInfo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ContactNum" TEXT NOT NULL,
    "Address" TEXT,
    "City" TEXT,
    "Province" TEXT,
    "Zipcode" INTEGER,
    "accInfoId" INTEGER NOT NULL,
    CONSTRAINT "ClientInfo_accInfoId_fkey" FOREIGN KEY ("accInfoId") REFERENCES "AccInfo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BusinessInfo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "isNotBusinessOwner" BOOLEAN NOT NULL DEFAULT false,
    "CompanyName" TEXT,
    "BusinessOwner" TEXT,
    "BusinessPermitNum" TEXT,
    "TINNum" TEXT,
    "CompanyIDNum" TEXT,
    "CompanyEmail" TEXT,
    "ContactPerson" TEXT,
    "Designation" TEXT,
    "CompanyAddress" TEXT,
    "CompanyCity" TEXT,
    "CompanyProvince" TEXT,
    "CompanyZipcode" INTEGER,
    "CompanyPhoneNum" TEXT,
    "CompanyMobileNum" TEXT,
    "Manufactured" TEXT,
    "ProductionFrequency" TEXT,
    "Bulk" TEXT,
    "accInfoId" INTEGER NOT NULL,
    CONSTRAINT "BusinessInfo_accInfoId_fkey" FOREIGN KEY ("accInfoId") REFERENCES "AccInfo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UtilReq" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Status" TEXT NOT NULL DEFAULT 'Pending',
    "RequestDate" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "TotalAmntDue" DECIMAL,
    "BulkofCommodity" TEXT,
    "DateofProcessing" DATETIME,
    "Processedby" TEXT,
    "accInfoId" INTEGER,
    "ReceiptNumber" TEXT,
    "PaymentDate" DATETIME,
    CONSTRAINT "UtilReq_accInfoId_fkey" FOREIGN KEY ("accInfoId") REFERENCES "AccInfo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserTool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ToolUser" TEXT NOT NULL,
    "ToolQuantity" INTEGER NOT NULL,
    "utilReqId" INTEGER,
    CONSTRAINT "UserTool_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ServiceAvail" TEXT NOT NULL,
    "EquipmentAvail" TEXT NOT NULL,
    "CostsAvail" DECIMAL,
    "MinsAvail" DECIMAL,
    "utilReqId" INTEGER,
    CONSTRAINT "UserService_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UtilTime" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "DayNum" INTEGER,
    "StartTime" DATETIME,
    "EndTime" DATETIME,
    "utilReqId" INTEGER,
    CONSTRAINT "UtilTime_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlockedDate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EVCReservation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "EVCStatus" TEXT NOT NULL DEFAULT 'Pending',
    "ControlNo" INTEGER,
    "LvlSec" TEXT,
    "NoofStudents" INTEGER,
    "Subject" TEXT,
    "Teacher" TEXT,
    "Topic" TEXT,
    "DateRequested" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "ApprovedBy" TEXT,
    "SchoolYear" INTEGER,
    "ReceivedBy" TEXT,
    "ReceivedDate" DATETIME,
    "InspectedBy" TEXT,
    "InspectedDate" DATETIME,
    "accInfoId" INTEGER,
    CONSTRAINT "EVCReservation_accInfoId_fkey" FOREIGN KEY ("accInfoId") REFERENCES "AccInfo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LabDate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "LabDay" INTEGER,
    "LabStart" DATETIME,
    "LabEnd" DATETIME,
    "evcId" INTEGER,
    CONSTRAINT "LabDate_evcId_fkey" FOREIGN KEY ("evcId") REFERENCES "EVCReservation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EVCStudent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Students" TEXT,
    "evcId" INTEGER,
    CONSTRAINT "EVCStudent_evcId_fkey" FOREIGN KEY ("evcId") REFERENCES "EVCReservation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NeededMaterial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Item" TEXT,
    "ItemQty" INTEGER,
    "Description" TEXT,
    "Issued" TEXT,
    "Returned" TEXT,
    "evcId" INTEGER,
    CONSTRAINT "NeededMaterial_evcId_fkey" FOREIGN KEY ("evcId") REFERENCES "EVCReservation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MachineUtilization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ReviwedBy" TEXT,
    "MachineApproval" BOOLEAN,
    "DateReviewed" DATETIME,
    "utilReqId" INTEGER,
    CONSTRAINT "MachineUtilization_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OperatingTime" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "OTDate" DATETIME,
    "OTTypeofProducts" TEXT,
    "OTStartTime" DATETIME,
    "OTEndTime" DATETIME,
    "OTMachineOp" TEXT,
    "machineUtilId" INTEGER,
    CONSTRAINT "OperatingTime_machineUtilId_fkey" FOREIGN KEY ("machineUtilId") REFERENCES "MachineUtilization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DownTime" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "DTDate" DATETIME,
    "DTTypeofProducts" TEXT,
    "DTTime" INTEGER,
    "Cause" TEXT,
    "DTMachineOp" TEXT,
    "machineUtilId" INTEGER,
    CONSTRAINT "DownTime_machineUtilId_fkey" FOREIGN KEY ("machineUtilId") REFERENCES "MachineUtilization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RepairCheck" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "RepairDate" DATETIME,
    "Service" TEXT,
    "Duration" INTEGER,
    "RepairReason" TEXT,
    "PartsReplaced" TEXT,
    "RPPersonnel" TEXT,
    "machineUtilId" INTEGER,
    CONSTRAINT "RepairCheck_machineUtilId_fkey" FOREIGN KEY ("machineUtilId") REFERENCES "MachineUtilization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerFeedback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "FeedbackDate" DATETIME,
    "Q1" INTEGER,
    "Q2" INTEGER,
    "Q3" INTEGER,
    "Q4" INTEGER,
    "Q5" INTEGER,
    "Q6" INTEGER,
    "Q7" INTEGER,
    "utilReqId" INTEGER NOT NULL,
    CONSTRAINT "CustomerFeedback_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmployeeEvaluation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "EvalDate" DATETIME,
    "EvalSig" BOOLEAN,
    "E1" INTEGER,
    "E2" INTEGER,
    "E3" INTEGER,
    "E4" INTEGER,
    "E5" INTEGER,
    "E6" INTEGER,
    "E7" INTEGER,
    "E8" INTEGER,
    "E9" INTEGER,
    "E10" INTEGER,
    "E11" INTEGER,
    "utilReqId" INTEGER NOT NULL,
    CONSTRAINT "EmployeeEvaluation_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientSatisfaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "C1" INTEGER,
    "C2" INTEGER,
    "C3" INTEGER,
    "C4" INTEGER,
    "C5" INTEGER,
    "C6" INTEGER,
    "C7" INTEGER,
    "C8" INTEGER,
    "utilReqId" INTEGER NOT NULL,
    CONSTRAINT "ClientSatisfaction_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CitizenSatisfaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Sex" TEXT,
    "Age" INTEGER,
    "CC1" INTEGER,
    "CC2" INTEGER,
    "CC3" INTEGER,
    "CC4" INTEGER,
    "CC5" INTEGER,
    "SQD0" INTEGER,
    "SQD1" INTEGER,
    "SQD2" INTEGER,
    "SQD3" INTEGER,
    "SQD4" INTEGER,
    "SQD5" INTEGER,
    "SQD6" INTEGER,
    "SQD7" INTEGER,
    "SQD8" INTEGER,
    "Suggestions" TEXT,
    "utilReqId" INTEGER NOT NULL,
    CONSTRAINT "CitizenSatisfaction_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobandPayment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Date" DATETIME,
    "ClientProfile" TEXT,
    "ProjDesc" TEXT,
    "CompletionDate" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "utilReqId" INTEGER,
    CONSTRAINT "JobandPayment_utilReqId_fkey" FOREIGN KEY ("utilReqId") REFERENCES "UtilReq" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AccInfo_clerkId_key" ON "AccInfo"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "AccInfo_email_key" ON "AccInfo"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClientInfo_accInfoId_key" ON "ClientInfo"("accInfoId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessInfo_accInfoId_key" ON "BusinessInfo"("accInfoId");

-- CreateIndex
CREATE INDEX "BlockedDate_date_idx" ON "BlockedDate"("date");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedDate_date_key" ON "BlockedDate"("date");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerFeedback_utilReqId_key" ON "CustomerFeedback"("utilReqId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeEvaluation_utilReqId_key" ON "EmployeeEvaluation"("utilReqId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientSatisfaction_utilReqId_key" ON "ClientSatisfaction"("utilReqId");

-- CreateIndex
CREATE UNIQUE INDEX "CitizenSatisfaction_utilReqId_key" ON "CitizenSatisfaction"("utilReqId");

-- CreateIndex
CREATE UNIQUE INDEX "JobandPayment_utilReqId_key" ON "JobandPayment"("utilReqId");
