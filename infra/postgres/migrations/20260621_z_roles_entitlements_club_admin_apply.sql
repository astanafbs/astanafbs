ALTER TABLE users
  ALTER COLUMN role SET DEFAULT 'user'::user_role;

UPDATE users SET role = 'user'::user_role WHERE role = 'player'::user_role;
UPDATE users SET role = 'club_admin'::user_role WHERE role IN ('club_owner'::user_role, 'organizer'::user_role);
UPDATE users SET role = 'superadmin'::user_role WHERE role = 'admin'::user_role;

CREATE TABLE IF NOT EXISTS club_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'club_admin' CHECK (role IN ('club_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, club_id, role)
);

CREATE TABLE IF NOT EXISTS user_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN ('app_access', 'listing_publish', 'stream_watch', 'stream_create', 'club_admin')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature)
);

INSERT INTO user_entitlements (user_id, feature, starts_at, ends_at, status)
SELECT id, 'app_access', now(), now() + interval '30 days', 'active'
FROM users
ON CONFLICT (user_id, feature) DO NOTHING;

INSERT INTO user_entitlements (user_id, feature, starts_at, ends_at, status)
SELECT id, 'stream_watch', now(), now() + interval '30 days', 'active'
FROM users
ON CONFLICT (user_id, feature) DO NOTHING;

INSERT INTO user_entitlements (user_id, feature, starts_at, ends_at, status)
SELECT id, 'listing_publish', now(), now() + interval '7 days', 'active'
FROM users
ON CONFLICT (user_id, feature) DO NOTHING;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS published_until TIMESTAMPTZ;

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS table_number INTEGER CHECK (table_number IS NULL OR table_number > 0);

UPDATE tournaments
SET max_players = CASE
    WHEN COALESCE(max_players, 16) <= 16 THEN 16
    WHEN max_players <= 32 THEN 32
    ELSE 64
  END
WHERE max_players IS NULL OR max_players NOT IN (16, 32, 64);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_max_players_allowed'
  ) THEN
    ALTER TABLE tournaments
      ADD CONSTRAINT tournaments_max_players_allowed CHECK (max_players IS NULL OR max_players IN (16, 32, 64));
  END IF;
END $$;

UPDATE listings
SET published_until = created_at + interval '7 days'
WHERE published_until IS NULL
  AND status = 'published';

CREATE INDEX IF NOT EXISTS idx_club_memberships_user_status ON club_memberships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_club_memberships_club_status ON club_memberships(club_id, status);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_feature ON user_entitlements(user_id, feature, status);
CREATE INDEX IF NOT EXISTS idx_listings_status_published_until ON listings(status, published_until DESC);
CREATE INDEX IF NOT EXISTS idx_matches_table_number ON matches(tournament_id, table_number);
