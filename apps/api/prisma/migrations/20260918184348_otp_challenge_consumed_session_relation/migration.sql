-- AddForeignKey
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_consumedSessionId_fkey" FOREIGN KEY ("consumedSessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
