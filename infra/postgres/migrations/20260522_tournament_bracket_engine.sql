ALTER TABLE matches ADD COLUMN IF NOT EXISTS next_match_id UUID REFERENCES matches(id) ON DELETE SET NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS next_slot TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS round_number INTEGER NOT NULL DEFAULT 1;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS bracket_position INTEGER NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'matches_next_slot_check'
  ) THEN
    ALTER TABLE matches
      ADD CONSTRAINT matches_next_slot_check CHECK (next_slot IN ('A', 'B') OR next_slot IS NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_matches_bracket_order ON matches(tournament_id, round_number, bracket_position);

UPDATE matches
SET round_number = CASE
    WHEN COALESCE(round_name, '') LIKE '%1/4%' THEN 1
    WHEN COALESCE(round_name, '') LIKE '%1/2%' THEN 2
    WHEN COALESCE(round_name, '') ILIKE '%финал%' THEN 3
    ELSE 1
  END,
  bracket_position = COALESCE(bracket_position, 1)
WHERE round_number IS NULL OR round_number = 1;
