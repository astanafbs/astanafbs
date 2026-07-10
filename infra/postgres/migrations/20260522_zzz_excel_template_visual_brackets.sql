INSERT INTO users (id, firebase_uid, email, display_name, photo_url, city, role)
SELECT
  ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  'seed-demo-player-' || n,
  'demo.player' || n || '@billiardhub.kz',
  'Демо игрок ' || n,
  NULL,
  (ARRAY['Астана', 'Алматы', 'Шымкент', 'Караганда', 'Актобе', 'Павлодар'])[(n % 6) + 1],
  'player'::user_role
FROM generate_series(41, 64) AS n
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
  CASE WHEN n <= 48 THEN 'advanced' ELSE 'intermediate' END,
  ARRAY['Демо-посев ' || n],
  18 + n,
  10 + (n % 9)
FROM generate_series(41, 64) AS n
ON CONFLICT (user_id) DO UPDATE
SET rating = EXCLUDED.rating,
    club_name = EXCLUDED.club_name,
    skill_level = EXCLUDED.skill_level,
    titles = EXCLUDED.titles,
    wins = EXCLUDED.wins,
    losses = EXCLUDED.losses,
    updated_at = now();

DO $$
DECLARE
  tournament_record RECORD;
  seed_order_16 INTEGER[] := ARRAY[1,16,9,8,5,12,13,4,3,14,11,6,7,10,15,2];
  seed_order_32 INTEGER[] := ARRAY[
    1,32,17,16,9,24,25,8,5,28,21,12,13,20,29,4,
    3,30,19,14,11,22,27,6,7,26,23,10,15,18,31,2
  ];
  seed_order_64 INTEGER[] := ARRAY[
    1,64,33,32,17,48,49,16,9,56,41,24,25,40,57,8,
    5,60,37,28,21,44,53,12,13,52,45,20,29,36,61,4,
    3,62,35,30,19,46,51,14,11,54,43,22,27,38,59,6,
    7,58,39,26,23,42,55,10,15,50,47,18,31,34,63,2
  ];
  seed_order INTEGER[];
  counts INTEGER[];
  labels TEXT[];
  central_column INTEGER;
  round_number INTEGER;
  bracket_position INTEGER;
  match_count INTEGER;
  match_sequence INTEGER;
  seed_a INTEGER;
  seed_b INTEGER;
  player_a UUID;
  player_b UUID;
  winner UUID;
  status_value match_status;
  score_value TEXT;
BEGIN
  FOR tournament_record IN
    SELECT * FROM (VALUES
      (
        '44444444-4444-4444-4444-444444444444'::uuid,
        'kazakhstan-open-32-8',
        32,
        32,
        ARRAY[4,4,8,8,16,8,4,4,2,1]::INTEGER[],
        ARRAY['Место 17-24','Место 25-32','Место 9-12','Место 13-16','Старт 32','1/16 финала','Место 5-8','Полуфинал','Финалисты','Финал']::TEXT[]
      ),
      (
        '55555555-5555-5555-5555-555555555555'::uuid,
        'almaty-spring-32-16',
        32,
        32,
        ARRAY[8,8,16,8,8,4,2,1]::INTEGER[],
        ARRAY['Место 17-24','Место 25-32','Старт 32','1/16 финала','Место 9-16','Место 5-8','Полуфинал','Финал']::TEXT[]
      ),
      (
        '66666666-6666-6666-6666-666666666666'::uuid,
        'astana-friday-16-4',
        16,
        16,
        ARRAY[2,2,4,4,8,4,2,2,1]::INTEGER[],
        ARRAY['Место 5-6','Место 7-8','Место 9-12','Место 13-16','Старт 16','1/8 финала','Место 5-6','Полуфинал','Финал']::TEXT[]
      ),
      (
        '88888888-8888-8888-8888-888888888881'::uuid,
        'karaganda-masters-64-16',
        64,
        64,
        ARRAY[8,8,16,16,32,16,8,8,4,2,1]::INTEGER[],
        ARRAY['Место 33-48','Место 49-64','Место 17-24','Место 25-32','Старт 64','1/32 финала','Место 9-16','Место 5-8','1/4 финала','Полуфинал','Финал']::TEXT[]
      )
    ) AS data(tournament_id, slug, bracket_size, max_players, counts, labels)
  LOOP
    counts := tournament_record.counts;
    labels := tournament_record.labels;
    seed_order := CASE tournament_record.bracket_size
      WHEN 16 THEN seed_order_16
      WHEN 64 THEN seed_order_64
      ELSE seed_order_32
    END;

    SELECT index_value INTO central_column
    FROM generate_subscripts(counts, 1) AS index_value
    WHERE counts[index_value] = tournament_record.bracket_size / 2
    ORDER BY index_value
    LIMIT 1;

    UPDATE tournaments
    SET tournament_format = 'single_elimination',
        status = CASE WHEN tournament_record.bracket_size = 16 THEN 'in_progress'::tournament_status ELSE 'registration_closed'::tournament_status END,
        max_players = tournament_record.max_players,
        updated_at = now()
    WHERE id = tournament_record.tournament_id;

    INSERT INTO tournament_registrations (tournament_id, user_id, status, seed_number)
    SELECT tournament_record.tournament_id, source_players.id, 'confirmed'::registration_status, source_players.seed
    FROM (
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
      FROM generate_series(12, tournament_record.max_players) AS n
    ) AS source_players
    WHERE source_players.seed <= tournament_record.max_players
    ON CONFLICT (tournament_id, user_id) DO UPDATE
    SET status = EXCLUDED.status,
        seed_number = EXCLUDED.seed_number;

    DELETE FROM matches WHERE tournament_id = tournament_record.tournament_id;

    match_sequence := 1;
    FOR round_number IN 1..array_length(counts, 1) LOOP
      match_count := counts[round_number];
      FOR bracket_position IN 1..match_count LOOP
        player_a := NULL;
        player_b := NULL;
        winner := NULL;
        status_value := 'scheduled';
        score_value := NULL;

        IF round_number = central_column THEN
          seed_a := seed_order[(bracket_position - 1) * 2 + 1];
          seed_b := seed_order[(bracket_position - 1) * 2 + 2];

          SELECT user_id INTO player_a
          FROM tournament_registrations
          WHERE tournament_id = tournament_record.tournament_id
            AND status = 'confirmed'
            AND seed_number = seed_a
          LIMIT 1;

          SELECT user_id INTO player_b
          FROM tournament_registrations
          WHERE tournament_id = tournament_record.tournament_id
            AND status = 'confirmed'
            AND seed_number = seed_b
          LIMIT 1;

          IF bracket_position <= 4 THEN
            winner := player_a;
            status_value := 'completed';
            score_value := '5:' || ((bracket_position % 4) + 1)::text;
          ELSIF bracket_position <= 6 THEN
            status_value := 'live';
            score_value := '3:' || ((bracket_position % 3) + 1)::text;
          END IF;
        END IF;

        INSERT INTO matches (
          id,
          tournament_id,
          player_a_id,
          player_b_id,
          winner_id,
          next_match_id,
          next_slot,
          score,
          round_name,
          round_number,
          bracket_position,
          status,
          scheduled_at
        )
        VALUES (
          uuid_generate_v5(uuid_ns_url(), 'excel-template-' || tournament_record.slug || '-c' || round_number || '-m' || bracket_position),
          tournament_record.tournament_id,
          player_a,
          player_b,
          winner,
          NULL,
          NULL,
          score_value,
          labels[round_number],
          round_number,
          bracket_position,
          status_value,
          now() + make_interval(days => round_number, mins => bracket_position * 5)
        );

        match_sequence := match_sequence + 1;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
