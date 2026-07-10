ALTER TABLE news_posts
  ADD COLUMN IF NOT EXISTS status content_status NOT NULL DEFAULT 'draft';

ALTER TABLE streams
  ADD COLUMN IF NOT EXISTS youtube_video_id TEXT,
  ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status content_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_streams_match_id_unique ON streams(match_id) WHERE match_id IS NOT NULL;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS image_keys TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE player_profiles
  ADD COLUMN IF NOT EXISTS titles TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS profile_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE player_profiles
  ADD COLUMN IF NOT EXISTS profile_status_id UUID REFERENCES profile_statuses(id) ON DELETE SET NULL;

INSERT INTO profile_statuses (id, label, description, sort_order, status)
VALUES
  ('10101010-1010-4010-8010-101010101010', 'Открыт к дуэлям', 'Игрок принимает вызовы на рейтинговые и товарищеские игры.', 10, 'published'),
  ('20202020-2020-4020-8020-202020202020', 'Ищу клуб', 'Игрок ищет постоянный клуб или команду для тренировок.', 20, 'published'),
  ('30303030-3030-4030-8030-303030303030', 'Турнирный игрок', 'Игрок активно участвует в турнирах и рейтинговых матчах.', 30, 'published'),
  ('40404040-4040-4040-8040-404040404040', 'Тренируюсь', 'Игрок сейчас делает упор на тренировки и набор формы.', 40, 'published')
ON CONFLICT (id) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    status = EXCLUDED.status,
    updated_at = now();

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS two_gis_url TEXT;

ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS discipline TEXT NOT NULL DEFAULT 'Москва',
  ADD COLUMN IF NOT EXISTS tournament_format TEXT NOT NULL DEFAULT 'single_elimination',
  ADD COLUMN IF NOT EXISTS first_place_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS second_place_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS third_place_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS third_place_second_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tournaments_tournament_format_check'
  ) THEN
    ALTER TABLE tournaments
      ADD CONSTRAINT tournaments_tournament_format_check
      CHECK (tournament_format IN ('single_elimination', 'double_elimination', 'round_robin', 'group_playoff', 'swiss'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS training_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  target TEXT,
  metric TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  detail TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES training_templates(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL DEFAULT 'Игрок BilliardHUB',
  title TEXT NOT NULL,
  discipline TEXT NOT NULL DEFAULT 'Пирамида',
  focus TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  drills JSONB NOT NULL DEFAULT '[]'::jsonb,
  mood_score INTEGER NOT NULL DEFAULT 7,
  notes TEXT,
  trained_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_templates_status_sort ON training_templates(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_training_metrics_status_sort ON training_metrics(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_training_sessions_trained_at ON training_sessions(trained_at DESC);

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
CREATE INDEX IF NOT EXISTS idx_tournaments_club_id ON tournaments(club_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_id ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user_id ON tournament_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_players ON matches(player_a_id, player_b_id);
CREATE INDEX IF NOT EXISTS idx_news_posts_status_published_at ON news_posts(status, published_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_streams_status_starts_at ON streams(status, starts_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_player_profiles_profile_status_id ON player_profiles(profile_status_id);
CREATE INDEX IF NOT EXISTS idx_profile_statuses_status_sort ON profile_statuses(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_duels_players ON duels(challenger_id, opponent_id);
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

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
