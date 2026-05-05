CREATE TABLE "PlatformActivity" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "detail" TEXT,
  "actorName" TEXT,
  "actorEmail" TEXT,
  "userId" TEXT,
  "path" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PlatformActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PlatformActivity_category_action_createdAt_idx" ON "PlatformActivity"("category", "action", "createdAt");
CREATE INDEX "PlatformActivity_actorEmail_createdAt_idx" ON "PlatformActivity"("actorEmail", "createdAt");
CREATE INDEX "PlatformActivity_userId_createdAt_idx" ON "PlatformActivity"("userId", "createdAt");
CREATE INDEX "PlatformActivity_createdAt_idx" ON "PlatformActivity"("createdAt");

ALTER TABLE "PlatformActivity" ADD CONSTRAINT "PlatformActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
