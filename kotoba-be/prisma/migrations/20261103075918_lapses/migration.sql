-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Card" (
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "box" INTEGER NOT NULL,
    "due" TEXT,
    "at" REAL NOT NULL,
    "lapses" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("userId", "itemId"),
    CONSTRAINT "Card_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Card_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Card" ("at", "box", "due", "itemId", "userId") SELECT "at", "box", "due", "itemId", "userId" FROM "Card";
DROP TABLE "Card";
ALTER TABLE "new_Card" RENAME TO "Card";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
