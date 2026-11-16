/*
  Warnings:

  - A unique constraint covering the columns `[visitorId,clientSessionId]` on the table `TrackSession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clientSessionId` to the `TrackSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TrackSession" ADD COLUMN     "clientSessionId" TEXT NOT NULL,
ADD COLUMN     "devtoolsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "eventCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "pageViewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "screen" TEXT,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TrackSession_visitorId_clientSessionId_key" ON "TrackSession"("visitorId", "clientSessionId");
