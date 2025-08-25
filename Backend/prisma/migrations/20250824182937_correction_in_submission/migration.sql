/*
  Warnings:

  - You are about to drop the column `compiledOutput` on the `TestcaseResult` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Submission" ADD COLUMN     "compileOutput" TEXT;

-- AlterTable
ALTER TABLE "public"."TestcaseResult" DROP COLUMN "compiledOutput",
ADD COLUMN     "compileOutput" TEXT;
