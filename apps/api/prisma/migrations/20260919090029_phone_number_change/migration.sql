-- AlterEnum
ALTER TYPE "OtpPurpose" ADD VALUE 'PHONE_CHANGE';

-- AlterTable
ALTER TABLE "otp_challenges" ADD COLUMN     "pendingCountryCode" TEXT,
ADD COLUMN     "pendingNumber" TEXT;
