-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "lesson" INTEGER,
    "level" INTEGER NOT NULL DEFAULT 5,
    "sort" INTEGER NOT NULL,
    "search" TEXT NOT NULL,
    "data" TEXT NOT NULL
);
INSERT INTO "new_Item" ("data", "id", "kind", "lesson", "search", "sort") SELECT "data", "id", "kind", "lesson", "search", "sort" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE INDEX "Item_kind_sort_idx" ON "Item"("kind", "sort");
CREATE INDEX "Item_kind_level_sort_idx" ON "Item"("kind", "level", "sort");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
