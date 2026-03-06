-- DropIndex
DROP INDEX "ChatMember_userId_chatId_key";

-- CreateIndex
CREATE INDEX "Message_chatId_idx" ON "Message"("chatId");
