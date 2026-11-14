-- Phase 40a: starred items. Additive, so old rows read as not saved.
ALTER TABLE "Card" ADD COLUMN "saved" BOOLEAN NOT NULL DEFAULT false;
