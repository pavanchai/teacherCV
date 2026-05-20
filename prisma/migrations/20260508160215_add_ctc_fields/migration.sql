-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN "currentCtc" REAL;
ALTER TABLE "Candidate" ADD COLUMN "expectedCtc" REAL;

-- AlterTable
ALTER TABLE "Position" ADD COLUMN "budgetCtc" REAL;
