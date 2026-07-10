ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS tournament_format TEXT NOT NULL DEFAULT 'single_elimination';

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

INSERT INTO users (id, firebase_uid, email, display_name, photo_url, city, role)
SELECT
  ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  'seed-demo-player-' || n,
  'demo.player' || n || '@billiardhub.kz',
  'Демо игрок ' || n,
  NULL,
  (ARRAY['Астана', 'Алматы', 'Шымкент', 'Караганда', 'Актобе', 'Павлодар'])[(n % 6) + 1],
  'player'::user_role
FROM generate_series(12, 40) AS n
ON CONFLICT (id) DO UPDATE
SET display_name = EXCLUDED.display_name,
    city = EXCLUDED.city,
    role = EXCLUDED.role,
    updated_at = now();

INSERT INTO player_profiles (user_id, rating, rating_source, club_name, skill_level, titles, wins, losses)
SELECT
  ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  1710 - n * 4,
  'local',
  'BilliardHub Demo League',
  CASE WHEN n <= 20 THEN 'advanced' ELSE 'intermediate' END,
  ARRAY['Демо-посев ' || n],
  18 + n,
  10 + (n % 9)
FROM generate_series(12, 40) AS n
ON CONFLICT (user_id) DO UPDATE
SET rating = EXCLUDED.rating,
    club_name = EXCLUDED.club_name,
    skill_level = EXCLUDED.skill_level,
    titles = EXCLUDED.titles,
    wins = EXCLUDED.wins,
    losses = EXCLUDED.losses,
    updated_at = now();

UPDATE tournaments
SET status = CASE id
    WHEN '44444444-4444-4444-4444-444444444444' THEN 'registration_closed'::tournament_status
    WHEN '55555555-5555-5555-5555-555555555555' THEN 'in_progress'::tournament_status
    WHEN '66666666-6666-6666-6666-666666666666' THEN 'in_progress'::tournament_status
    WHEN '88888888-8888-8888-8888-888888888881' THEN 'registration_closed'::tournament_status
    ELSE status
  END,
  tournament_format = CASE id
    WHEN '44444444-4444-4444-4444-444444444444' THEN 'single_elimination'
    WHEN '55555555-5555-5555-5555-555555555555' THEN 'group_playoff'
    WHEN '66666666-6666-6666-6666-666666666666' THEN 'round_robin'
    WHEN '88888888-8888-8888-8888-888888888881' THEN 'swiss'
    ELSE tournament_format
  END,
  max_players = CASE id
    WHEN '44444444-4444-4444-4444-444444444444' THEN 32
    WHEN '55555555-5555-5555-5555-555555555555' THEN 32
    WHEN '66666666-6666-6666-6666-666666666666' THEN 16
    WHEN '88888888-8888-8888-8888-888888888881' THEN 32
    ELSE max_players
  END,
  updated_at = now()
WHERE id IN (
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '88888888-8888-8888-8888-888888888881'
);

WITH players AS (
  SELECT * FROM (VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 1),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 2),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 3),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, 4),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, 5),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, 6),
    ('abababab-abab-abab-abab-abababababab'::uuid, 7),
    ('bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc'::uuid, 8),
    ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd'::uuid, 9),
    ('dededede-dede-dede-dede-dededededede'::uuid, 10),
    ('edededed-eded-eded-eded-edededededed'::uuid, 11)
  ) AS base(id, seed)
  UNION ALL
  SELECT ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid, n
  FROM generate_series(12, 40) AS n
),
tournament_limits AS (
  SELECT * FROM (VALUES
    ('44444444-4444-4444-4444-444444444444'::uuid, 32),
    ('55555555-5555-5555-5555-555555555555'::uuid, 32),
    ('66666666-6666-6666-6666-666666666666'::uuid, 16),
    ('88888888-8888-8888-8888-888888888881'::uuid, 32)
  ) AS limits(tournament_id, max_seed)
)
INSERT INTO tournament_registrations (tournament_id, user_id, status, seed_number)
SELECT tournament_limits.tournament_id, players.id, 'confirmed'::registration_status, players.seed
FROM tournament_limits
JOIN players ON players.seed <= tournament_limits.max_seed
ON CONFLICT (tournament_id, user_id) DO UPDATE
SET status = EXCLUDED.status,
    seed_number = EXCLUDED.seed_number;

DELETE FROM matches
WHERE tournament_id IN (
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '88888888-8888-8888-8888-888888888881'
);

WITH players AS (
  SELECT * FROM (VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 1),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 2),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 3),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, 4),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, 5),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, 6),
    ('abababab-abab-abab-abab-abababababab'::uuid, 7),
    ('bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc'::uuid, 8),
    ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd'::uuid, 9),
    ('dededede-dede-dede-dede-dededededede'::uuid, 10),
    ('edededed-eded-eded-eded-edededededed'::uuid, 11)
  ) AS base(id, seed)
  UNION ALL
  SELECT ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid, n
  FROM generate_series(12, 40) AS n
),
rounds AS (
  SELECT * FROM (VALUES
    (1, 16, '1/16 финала'),
    (2, 8, '1/8 финала'),
    (3, 4, '1/4 финала'),
    (4, 2, '1/2 финала'),
    (5, 1, 'Финал')
  ) AS data(round_number, match_count, round_name)
),
slots AS (
  SELECT rounds.round_number, rounds.round_name, generate_series(1, rounds.match_count) AS bracket_position
  FROM rounds
),
seed_slots AS (
  SELECT seed, row_number() OVER () AS slot_index
  FROM unnest(ARRAY[
    1,32,17,16,9,24,25,8,5,28,21,12,13,20,29,4,
    3,30,19,14,11,22,27,6,7,26,23,10,15,18,31,2
  ]) AS seed
)
INSERT INTO matches (
  id, tournament_id, player_a_id, player_b_id, winner_id, next_match_id, next_slot,
  score, round_name, round_number, bracket_position, status, scheduled_at
)
SELECT
  uuid_generate_v5(uuid_ns_url(), 'demo-kazakhstan-open-r' || round_number || '-m' || bracket_position),
  '44444444-4444-4444-4444-444444444444'::uuid,
  CASE WHEN round_number = 1 THEN (SELECT players.id FROM players JOIN seed_slots ON seed_slots.seed = players.seed WHERE seed_slots.slot_index = (bracket_position - 1) * 2 + 1) END,
  CASE WHEN round_number = 1 THEN (SELECT players.id FROM players JOIN seed_slots ON seed_slots.seed = players.seed WHERE seed_slots.slot_index = (bracket_position - 1) * 2 + 2) END,
  CASE WHEN round_number = 1 AND bracket_position <= 6 THEN (SELECT players.id FROM players JOIN seed_slots ON seed_slots.seed = players.seed WHERE seed_slots.slot_index = (bracket_position - 1) * 2 + 1) END,
  CASE WHEN round_number < 5 THEN uuid_generate_v5(uuid_ns_url(), 'demo-kazakhstan-open-r' || (round_number + 1) || '-m' || ceil(bracket_position / 2.0)::int) END,
  CASE WHEN round_number < 5 THEN CASE WHEN bracket_position % 2 = 1 THEN 'A' ELSE 'B' END END,
  CASE WHEN round_number = 1 AND bracket_position <= 6 THEN '5:' || ((bracket_position % 4) + 1)::text END,
  round_name,
  round_number,
  bracket_position,
  CASE
    WHEN round_number = 1 AND bracket_position <= 6 THEN 'completed'::match_status
    WHEN round_number = 1 AND bracket_position IN (7, 8) THEN 'live'::match_status
    ELSE 'scheduled'::match_status
  END,
  now() + interval '9 days' + make_interval(hours => round_number * 2, mins => bracket_position * 4)
FROM slots;

WITH players AS (
  SELECT * FROM (VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 1),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 2),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 3),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, 4),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, 5),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, 6),
    ('abababab-abab-abab-abab-abababababab'::uuid, 7),
    ('bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc'::uuid, 8),
    ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd'::uuid, 9),
    ('dededede-dede-dede-dede-dededededede'::uuid, 10),
    ('edededed-eded-eded-eded-edededededed'::uuid, 11)
  ) AS base(id, seed)
  UNION ALL
  SELECT ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid, n
  FROM generate_series(12, 40) AS n
),
group_players AS (
  SELECT id, seed, ((seed - 1) / 4 + 1) AS group_number, ((seed - 1) % 4 + 1) AS group_seed
  FROM players
  WHERE seed <= 24
),
pairings AS (
  SELECT * FROM (VALUES
    (1, 1, 1, 2),
    (1, 2, 3, 4),
    (2, 1, 1, 3),
    (2, 2, 2, 4),
    (3, 1, 1, 4),
    (3, 2, 2, 3)
  ) AS data(tour, slot, a_seed, b_seed)
),
group_matches AS (
  SELECT
    uuid_generate_v5(uuid_ns_url(), 'demo-almaty-group-g' || g.group_number || '-t' || pairings.tour || '-m' || pairings.slot) AS id,
    (SELECT id FROM group_players WHERE group_number = g.group_number AND group_seed = pairings.a_seed) AS player_a_id,
    (SELECT id FROM group_players WHERE group_number = g.group_number AND group_seed = pairings.b_seed) AS player_b_id,
    pairings.tour AS round_number,
    ((g.group_number - 1) * 2 + pairings.slot) AS bracket_position,
    'Группы: тур ' || pairings.tour AS round_name,
    pairings.tour,
    g.group_number
  FROM (SELECT DISTINCT group_number FROM group_players) AS g
  CROSS JOIN pairings
),
playoff_rounds AS (
  SELECT * FROM (VALUES
    (4, 4, '1/4 финала'),
    (5, 2, '1/2 финала'),
    (6, 1, 'Финал')
  ) AS data(round_number, match_count, round_name)
),
playoff_matches AS (
  SELECT
    uuid_generate_v5(uuid_ns_url(), 'demo-almaty-playoff-r' || playoff_rounds.round_number || '-m' || bracket_position) AS id,
    CASE WHEN playoff_rounds.round_number = 4 THEN (SELECT id FROM players WHERE seed = bracket_position) END AS player_a_id,
    CASE WHEN playoff_rounds.round_number = 4 THEN (SELECT id FROM players WHERE seed = 9 - bracket_position) END AS player_b_id,
    playoff_rounds.round_number,
    bracket_position,
    playoff_rounds.round_name,
    NULL::int AS tour,
    NULL::int AS group_number
  FROM playoff_rounds
  CROSS JOIN LATERAL generate_series(1, playoff_rounds.match_count) AS bracket_position
)
INSERT INTO matches (
  id, tournament_id, player_a_id, player_b_id, winner_id, next_match_id, next_slot,
  score, round_name, round_number, bracket_position, status, scheduled_at
)
SELECT
  id,
  '55555555-5555-5555-5555-555555555555'::uuid,
  player_a_id,
  player_b_id,
  CASE WHEN round_number <= 2 AND bracket_position <= 6 THEN player_a_id END,
  NULL,
  NULL,
  CASE WHEN round_number <= 2 AND bracket_position <= 6 THEN '4:' || ((bracket_position % 3) + 1)::text END,
  round_name,
  round_number,
  bracket_position,
  CASE
    WHEN round_number <= 2 AND bracket_position <= 6 THEN 'completed'::match_status
    WHEN round_number = 3 AND bracket_position <= 4 THEN 'live'::match_status
    ELSE 'scheduled'::match_status
  END,
  now() + interval '4 days' + make_interval(hours => round_number * 2, mins => bracket_position * 3)
FROM (
  SELECT * FROM group_matches
  UNION ALL
  SELECT * FROM playoff_matches
) AS matches_to_insert;

WITH players AS (
  SELECT * FROM (VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 1),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 2),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 3),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, 4),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, 5),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, 6),
    ('abababab-abab-abab-abab-abababababab'::uuid, 7),
    ('bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc'::uuid, 8),
    ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd'::uuid, 9),
    ('dededede-dede-dede-dede-dededededede'::uuid, 10),
    ('edededed-eded-eded-eded-edededededed'::uuid, 11)
  ) AS base(id, seed)
  UNION ALL
  SELECT ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid, n
  FROM generate_series(12, 40) AS n
),
league_slots AS (
  SELECT round_number, bracket_position,
         (((bracket_position - 1) * 2 + round_number - 1) % 16) + 1 AS a_seed,
         (((bracket_position - 1) * 2 + round_number) % 16) + 1 AS b_seed
  FROM generate_series(1, 7) AS round_number
  CROSS JOIN generate_series(1, 8) AS bracket_position
)
INSERT INTO matches (
  id, tournament_id, player_a_id, player_b_id, winner_id, next_match_id, next_slot,
  score, round_name, round_number, bracket_position, status, scheduled_at
)
SELECT
  uuid_generate_v5(uuid_ns_url(), 'demo-astana-league-r' || round_number || '-m' || bracket_position),
  '66666666-6666-6666-6666-666666666666'::uuid,
  (SELECT id FROM players WHERE seed = a_seed),
  (SELECT id FROM players WHERE seed = b_seed),
  CASE WHEN round_number <= 2 THEN (SELECT id FROM players WHERE seed = a_seed) END,
  NULL,
  NULL,
  CASE WHEN round_number <= 2 THEN '5:' || ((bracket_position % 4) + 1)::text END,
  'Лига: тур ' || round_number,
  round_number,
  bracket_position,
  CASE
    WHEN round_number <= 2 THEN 'completed'::match_status
    WHEN round_number = 3 THEN 'live'::match_status
    ELSE 'scheduled'::match_status
  END,
  now() - interval '2 hours' + make_interval(hours => round_number, mins => bracket_position * 5)
FROM league_slots;

WITH players AS (
  SELECT * FROM (VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 1),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 2),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 3),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, 4),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, 5),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, 6),
    ('abababab-abab-abab-abab-abababababab'::uuid, 7),
    ('bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc'::uuid, 8),
    ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd'::uuid, 9),
    ('dededede-dede-dede-dede-dededededede'::uuid, 10),
    ('edededed-eded-eded-eded-edededededed'::uuid, 11)
  ) AS base(id, seed)
  UNION ALL
  SELECT ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid, n
  FROM generate_series(12, 40) AS n
),
swiss_slots AS (
  SELECT round_number, bracket_position,
         (((bracket_position - 1) * 2 + round_number - 1) % 32) + 1 AS a_seed,
         (((bracket_position - 1) * 2 + round_number) % 32) + 1 AS b_seed
  FROM generate_series(1, 5) AS round_number
  CROSS JOIN generate_series(1, 16) AS bracket_position
)
INSERT INTO matches (
  id, tournament_id, player_a_id, player_b_id, winner_id, next_match_id, next_slot,
  score, round_name, round_number, bracket_position, status, scheduled_at
)
SELECT
  uuid_generate_v5(uuid_ns_url(), 'demo-karaganda-swiss-r' || round_number || '-m' || bracket_position),
  '88888888-8888-8888-8888-888888888881'::uuid,
  (SELECT id FROM players WHERE seed = a_seed),
  (SELECT id FROM players WHERE seed = b_seed),
  CASE WHEN round_number = 1 THEN (SELECT id FROM players WHERE seed = a_seed) END,
  NULL,
  NULL,
  CASE WHEN round_number = 1 THEN '4:' || ((bracket_position % 3) + 1)::text END,
  'Швейцарка: тур ' || round_number,
  round_number,
  bracket_position,
  CASE
    WHEN round_number = 1 THEN 'completed'::match_status
    WHEN round_number = 2 AND bracket_position <= 4 THEN 'live'::match_status
    ELSE 'scheduled'::match_status
  END,
  now() + interval '30 days' + make_interval(hours => round_number * 2, mins => bracket_position * 2)
FROM swiss_slots;
