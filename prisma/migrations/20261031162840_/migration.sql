-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "reminderClaimedAt" TIMESTAMP(3),
ADD COLUMN     "reminderSentAt" TIMESTAMP(3);
