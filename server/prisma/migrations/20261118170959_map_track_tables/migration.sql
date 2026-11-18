/*
  Warnings:

  - You are about to drop the `TrackEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrackSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TrackEvent" DROP CONSTRAINT "TrackEvent_sessionId_fkey";

-- DropTable
DROP TABLE "TrackEvent";

-- DropTable
DROP TABLE "TrackSession";

-- CreateTable
CREATE TABLE "track_session" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "clientSessionId" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "timezone" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "userAgent" TEXT,
    "screen" TEXT,
    "language" TEXT,
    "entryPath" TEXT NOT NULL,
    "referrer" TEXT,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "pageViewCount" INTEGER NOT NULL DEFAULT 0,
    "devtoolsCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "track_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "track_event" (
    "id" BIGSERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "props" JSONB,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "track_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "track_session_userId_startedAt_idx" ON "track_session"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "track_session_visitorId_idx" ON "track_session"("visitorId");

-- CreateIndex
CREATE INDEX "track_session_lastSeenAt_idx" ON "track_session"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "track_session_visitorId_clientSessionId_key" ON "track_session"("visitorId", "clientSessionId");

-- CreateIndex
CREATE INDEX "track_event_sessionId_at_idx" ON "track_event"("sessionId", "at");

-- CreateIndex
CREATE INDEX "track_event_type_at_idx" ON "track_event"("type", "at");

-- AddForeignKey
ALTER TABLE "track_event" ADD CONSTRAINT "track_event_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "track_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
