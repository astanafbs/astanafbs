CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT UNIQUE,
  email TEXT UNIQUE,
  display_name TEXT NOT NULL,
  photo_url TEXT,
  city TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL DEFAULT 0,
  rating_source TEXT NOT NULL DEFAULT 'local',
  club_name TEXT,
  skill_level TEXT,
  profile_status_id UUID REFERENCES profile_statuses(id) ON DELETE SET NULL,
  titles TEXT[] NOT NULL DEFAULT '{}',
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL DEFAULT 'Astana',
  phone TEXT,
  image_key TEXT,
  two_gis_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status tournament_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  location TEXT,
  discipline TEXT NOT NULL DEFAULT 'Москва',
  tournament_format TEXT NOT NULL DEFAULT 'single_elimination'
    CHECK (tournament_format IN ('single_elimination', 'double_elimination', 'round_robin', 'group_playoff', 'swiss')),
  entry_fee_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KZT',
  max_players INTEGER CHECK (max_players IS NULL OR max_players IN (16, 32, 64)),
  banner_key TEXT,
  first_place_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  second_place_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  third_place_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  third_place_second_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status registration_status NOT NULL DEFAULT 'pending',
  seed_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  player_a_id UUID REFERENCES users(id) ON DELETE SET NULL,
  player_b_id UUID REFERENCES users(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  next_match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  next_slot TEXT CHECK (next_slot IN ('A', 'B') OR next_slot IS NULL),
  score TEXT,
  round_name TEXT,
  round_number INTEGER NOT NULL DEFAULT 1,
  bracket_position INTEGER NOT NULL DEFAULT 1,
  status match_status NOT NULL DEFAULT 'scheduled',
  table_number INTEGER CHECK (table_number IS NULL OR table_number > 0),
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  image_key TEXT,
  status content_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS duels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID REFERENCES users(id) ON DELETE SET NULL,
  opponent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  status duel_status NOT NULL DEFAULT 'pending',
  score TEXT,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rating_delta INTEGER,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  youtube_video_id TEXT,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  status content_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'KZT',
  status listing_status NOT NULL DEFAULT 'moderation',
  image_keys TEXT[] NOT NULL DEFAULT '{}',
  published_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KZT',
  status content_status NOT NULL DEFAULT 'draft',
  image_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'new',
  quantity INTEGER NOT NULL DEFAULT 1,
  total_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KZT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL UNIQUE,
  platform TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE INDEX IF NOT EXISTS idx_tournaments_status_starts_at ON tournaments(status, starts_at);
CREATE INDEX IF NOT EXISTS idx_tournaments_club_id ON tournaments(club_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_user_status ON club_memberships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_club_memberships_club_status ON club_memberships(club_id, status);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_id ON tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_user_id ON tournament_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_players ON matches(player_a_id, player_b_id);
CREATE INDEX IF NOT EXISTS idx_matches_bracket_order ON matches(tournament_id, round_number, bracket_position);
CREATE INDEX IF NOT EXISTS idx_matches_table_number ON matches(tournament_id, table_number);
CREATE INDEX IF NOT EXISTS idx_news_posts_status_published_at ON news_posts(status, published_at DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_streams_status_starts_at ON streams(status, starts_at DESC, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_streams_match_id_unique ON streams(match_id) WHERE match_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_player_profiles_rating ON player_profiles(rating DESC);
CREATE INDEX IF NOT EXISTS idx_player_profiles_profile_status_id ON player_profiles(profile_status_id);
CREATE INDEX IF NOT EXISTS idx_profile_statuses_status_sort ON profile_statuses(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_duels_status_scheduled_at ON duels(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_duels_players ON duels(challenger_id, opponent_id);
CREATE INDEX IF NOT EXISTS idx_listings_status_created_at ON listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_status_published_until ON listings(status, published_until DESC);
CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_feature ON user_entitlements(user_id, feature, status);
CREATE INDEX IF NOT EXISTS idx_products_status_created_at ON products(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_templates_status_sort ON training_templates(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_training_metrics_status_sort ON training_metrics(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_training_sessions_trained_at ON training_sessions(trained_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_campaigns_created_at ON push_campaigns(created_at DESC);
