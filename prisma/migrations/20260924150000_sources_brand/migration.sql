ALTER TABLE "Profile" ADD COLUMN "brandFolderId" TEXT, ADD COLUMN "brandFolderKey" TEXT;
CREATE TABLE "PortalSource" (
  "id" TEXT NOT NULL PRIMARY KEY, "slug" TEXT NOT NULL, "name" TEXT NOT NULL,
  "feedUrl" TEXT NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT true,
  "lastCheckedAt" TIMESTAMP(3), "lastSuccessAt" TIMESTAMP(3), "lastError" TEXT
);
CREATE UNIQUE INDEX "PortalSource_slug_key" ON "PortalSource"("slug");
CREATE UNIQUE INDEX "PortalSource_feedUrl_key" ON "PortalSource"("feedUrl");
CREATE TABLE "SourceArticle" (
  "id" TEXT NOT NULL PRIMARY KEY, "portalId" TEXT NOT NULL, "title" TEXT NOT NULL,
  "url" TEXT NOT NULL, "summary" TEXT NOT NULL, "publishedAt" TIMESTAMP(3) NOT NULL,
  "foundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SourceArticle_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "PortalSource"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SourceArticle_url_key" ON "SourceArticle"("url");
CREATE INDEX "SourceArticle_publishedAt_idx" ON "SourceArticle"("publishedAt");
