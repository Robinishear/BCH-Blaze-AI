-- CreateTable
CREATE TABLE "TrackSession" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "entryPath" TEXT NOT NULL,
    "referrer" TEXT,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackEvent" (
    "id" BIGSERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "props" JSONB,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackSession_userId_startedAt_idx" ON "TrackSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "TrackSession_visitorId_idx" ON "TrackSession"("visitorId");

-- CreateIndex
CREATE INDEX "TrackSession_lastSeenAt_idx" ON "TrackSession"("lastSeenAt");

-- CreateIndex
CREATE INDEX "TrackEvent_sessionId_at_idx" ON "TrackEvent"("sessionId", "at");

-- CreateIndex
CREATE INDEX "TrackEvent_type_at_idx" ON "TrackEvent"("type", "at");

-- AddForeignKey
ALTER TABLE "TrackEvent" ADD CONSTRAINT "TrackEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrackSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
