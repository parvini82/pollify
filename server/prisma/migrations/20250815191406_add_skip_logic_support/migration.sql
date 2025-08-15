/*
  Warnings:

  - You are about to drop the column `skipToQuestionId` on the `ConditionalLogic` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ConditionalAction" AS ENUM ('GO_TO', 'SKIP_TO', 'END_SURVEY');

-- DropIndex
DROP INDEX "ConditionalLogic_questionId_key";

-- AlterTable
ALTER TABLE "ConditionalLogic" DROP COLUMN "skipToQuestionId",
ADD COLUMN     "action" "ConditionalAction" NOT NULL DEFAULT 'GO_TO',
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "targetQuestionId" TEXT;

-- CreateIndex
CREATE INDEX "ConditionalLogic_questionId_order_idx" ON "ConditionalLogic"("questionId", "order");
