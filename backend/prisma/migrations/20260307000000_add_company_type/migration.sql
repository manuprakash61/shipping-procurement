-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('BUYER', 'SUPPLIER');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "companyType" "CompanyType" NOT NULL DEFAULT 'BUYER';
