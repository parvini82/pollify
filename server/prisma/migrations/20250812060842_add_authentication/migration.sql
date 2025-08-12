/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- AlterTable
-- First add columns with default values
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "password" TEXT NOT NULL DEFAULT 'temp_password_hash',
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing records
UPDATE "User" SET 
  "password" = '$2b$10$temp.hash.for.existing.user',
  "updatedAt" = "createdAt",
  "role" = 'ADMIN'::"UserRole"
WHERE "email" = 'demo@pollify.local';

-- Remove default constraints
ALTER TABLE "User" ALTER COLUMN "password" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Response_submittedById_formId_idx" ON "Response"("submittedById", "formId");

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
