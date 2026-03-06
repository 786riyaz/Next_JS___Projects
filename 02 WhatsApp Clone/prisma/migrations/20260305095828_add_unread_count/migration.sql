/*
  Warnings:

  - A unique constraint covering the columns `[chatId,userId]` on the table `ChatMember` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ChatMember" ADD COLUMN     "unreadCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "ChatMember_chatId_userId_key" ON "ChatMember"("chatId", "userId");
