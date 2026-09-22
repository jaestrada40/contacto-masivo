ALTER TABLE "Contact"
  ADD COLUMN "department" TEXT,
  ADD COLUMN "zone" TEXT;

UPDATE "Contact"
SET
  "department" = CASE
    WHEN POSITION(' / ' IN COALESCE("departmentOrZone", '')) > 0
      THEN NULLIF(BTRIM(SPLIT_PART("departmentOrZone", ' / ', 1)), '')
    ELSE NULL
  END,
  "zone" = CASE
    WHEN POSITION(' / ' IN COALESCE("departmentOrZone", '')) > 0
      THEN NULLIF(BTRIM(SPLIT_PART("departmentOrZone", ' / ', 2)), '')
    ELSE NULLIF(BTRIM("departmentOrZone"), '')
  END;

ALTER TABLE "Contact" DROP COLUMN "departmentOrZone";
