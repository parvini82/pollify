-- CreateTable
CREATE TABLE "LogicRule" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dependsOnQuestionId" TEXT NOT NULL,
    "operator" "ConditionalOperator" NOT NULL,
    "value" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "subjectQuestionId" TEXT,
    "showQuestion" BOOLEAN,
    "fromQuestionId" TEXT,
    "action" "ConditionalAction",
    "targetQuestionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogicRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LogicRule_formId_order_idx" ON "LogicRule"("formId", "order");

-- AddForeignKey
ALTER TABLE "LogicRule" ADD CONSTRAINT "LogicRule_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
