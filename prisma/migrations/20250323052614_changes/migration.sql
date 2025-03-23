/*
  Warnings:

  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "UserService" ADD COLUMN "Files" TEXT;

-- AlterTable
ALTER TABLE "UtilReq" ADD COLUMN "Remarks" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "File";
PRAGMA foreign_keys=on;
