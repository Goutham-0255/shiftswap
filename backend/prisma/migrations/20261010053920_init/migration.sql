-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "certifications" TEXT NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "requiredCertification" TEXT,
    "assignedToId" TEXT NOT NULL,
    CONSTRAINT "Shift_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shiftId" TEXT NOT NULL,
    "posterId" TEXT NOT NULL,
    "claimerId" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Listing_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Listing_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Listing_claimerId_fkey" FOREIGN KEY ("claimerId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoryEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "listingId" INTEGER,
    "outcome" TEXT NOT NULL,
    "reasons" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistoryEntry_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Shift_assignedToId_idx" ON "Shift"("assignedToId");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_shiftId_idx" ON "Listing"("shiftId");

-- CreateIndex
CREATE INDEX "HistoryEntry_createdAt_idx" ON "HistoryEntry"("createdAt");
