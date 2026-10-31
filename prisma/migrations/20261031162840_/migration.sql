-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "reminderClaimedAt" TIMESTAMP(3),
ADD COLUMN     "reminderSentAt" TIMESTAMP(3);

CREATE INDEX "Appointment_status_date_reminderSentAt_idx"
ON "Appointment"("status", "date", "reminderSentAt");
