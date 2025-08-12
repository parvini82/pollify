-- CreateEnum
CREATE TYPE "ConditionalOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'CONTAINS', 'GREATER_THAN', 'LESS_THAN');

-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'RATING';

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "allowMultipleResponses" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxResponses" INTEGER;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "maxRating" INTEGER,
ADD COLUMN     "minRating" INTEGER,
ADD COLUMN     "ratingLabels" TEXT;

-- AlterTable
ALTER TABLE "Response" ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "totalTime" INTEGER;

-- AlterTable
ALTER TABLE "ResponseItem" ADD COLUMN     "changedAnswers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timeSpent" INTEGER,
ADD COLUMN     "valueRating" INTEGER;

-- CreateTable
CREATE TABLE "ConditionalLogic" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "dependsOnQuestionId" TEXT NOT NULL,
    "operator" "ConditionalOperator" NOT NULL,
    "value" TEXT NOT NULL,
    "skipToQuestionId" TEXT,
    "showQuestion" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ConditionalLogic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConditionalLogic_questionId_key" ON "ConditionalLogic"("questionId");

-- CreateIndex
CREATE INDEX "Response_clientIp_formId_idx" ON "Response"("clientIp", "formId");

-- AddForeignKey
ALTER TABLE "ConditionalLogic" ADD CONSTRAINT "ConditionalLogic_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
