ALTER TABLE news_posts
  ADD COLUMN IF NOT EXISTS status content_status NOT NULL DEFAULT 'draft';

ALTER TABLE streams
  ADD COLUMN IF NOT EXISTS youtube_video_id TEXT,
  ADD COLUMN IF NOT EXISTS status content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS image_keys TEXT[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role' AND udt_name <> 'user_role'
  ) THEN
    ALTER TABLE users
      ALTER COLUMN role DROP DEFAULT,
      ALTER COLUMN role TYPE user_role
        USING CASE
          WHEN role IN ('player', 'club_owner', 'organizer', 'admin') THEN role::user_role
          ELSE 'player'::user_role
        END,
      ALTER COLUMN role SET DEFAULT 'player';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournaments' AND column_name = 'status' AND udt_name <> 'tournament_status'
  ) THEN
    ALTER TABLE tournaments
      ALTER COLUMN status DROP DEFAULT,
      ALTER COLUMN status TYPE tournament_status
        USING CASE
          WHEN status IN ('draft', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled')
            THEN status::tournament_status
          WHEN status = 'published' THEN 'registration_open'::tournament_status
          WHEN status = 'live' THEN 'in_progress'::tournament_status
          WHEN status = 'finished' THEN 'completed'::tournament_status
          ELSE 'draft'::tournament_status
        END,
      ALTER COLUMN status SET DEFAULT 'draft';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tournament_registrations' AND column_name = 'status' AND udt_name <> 'registration_status'
  ) THEN
    ALTER TABLE tournament_registrations
      ALTER COLUMN status DROP DEFAULT,
      ALTER COLUMN status TYPE registration_status
        USING CASE
          WHEN status IN ('pending', 'confirmed', 'waitlist', 'cancelled', 'rejected')
            THEN status::registration_status
          WHEN status = 'registered' THEN 'confirmed'::registration_status
          ELSE 'pending'::registration_status
        END,
      ALTER COLUMN status SET DEFAULT 'pending';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'status' AND udt_name <> 'match_status'
  ) THEN
    ALTER TABLE matches
      ALTER COLUMN status DROP DEFAULT,
      ALTER COLUMN status TYPE match_status
        USING CASE
          WHEN status IN ('scheduled', 'live', 'completed', 'cancelled') THEN status::match_status
          WHEN status IN ('finished', 'confirmed') THEN 'completed'::match_status
          WHEN status IN ('awaiting_result', 'disputed') THEN 'live'::match_status
          ELSE 'scheduled'::match_status
        END,
      ALTER COLUMN status SET DEFAULT 'scheduled';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS push_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT 'all',
  status content_status NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_campaigns_created_at ON push_campaigns(created_at DESC);

WITH ranked_profiles AS (
  SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY created_at ASC, id ASC) AS rn
  FROM player_profiles
)
DELETE FROM player_profiles
USING ranked_profiles
WHERE player_profiles.id = ranked_profiles.id
  AND ranked_profiles.rn > 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'player_profiles_user_id_key'
  ) THEN
    ALTER TABLE player_profiles ADD CONSTRAINT player_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;
