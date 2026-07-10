ALTER TABLE streams
  ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES matches(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_streams_match_id_unique ON streams(match_id) WHERE match_id IS NOT NULL;
