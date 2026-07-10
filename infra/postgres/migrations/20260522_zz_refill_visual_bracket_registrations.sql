DO $$
DECLARE
  tournament_record RECORD;
  seed_order_16 INTEGER[] := ARRAY[1,16,9,8,5,12,13,4,3,14,11,6,7,10,15,2];
  seed_order_32 INTEGER[] := ARRAY[
    1,32,17,16,9,24,25,8,5,28,21,12,13,20,29,4,
    3,30,19,14,11,22,27,6,7,26,23,10,15,18,31,2
  ];
  seed_order INTEGER[];
  total_rounds INTEGER;
  round_number INTEGER;
  match_count INTEGER;
  bracket_position INTEGER;
  remaining_rounds INTEGER;
  round_name TEXT;
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
      ('44444444-4444-4444-4444-444444444444'::uuid, 'kazakhstan-open', 32, 32, 'registration_closed'::tournament_status),
      ('55555555-5555-5555-5555-555555555555'::uuid, 'almaty-spring', 32, 32, 'in_progress'::tournament_status),
      ('66666666-6666-6666-6666-666666666666'::uuid, 'astana-friday', 16, 16, 'in_progress'::tournament_status),
      ('88888888-8888-8888-8888-888888888881'::uuid, 'karaganda-masters', 32, 32, 'registration_closed'::tournament_status)
    ) AS data(tournament_id, slug, bracket_size, max_players, tournament_status)
  LOOP
    seed_order := CASE tournament_record.bracket_size
      WHEN 16 THEN seed_order_16
      ELSE seed_order_32
    END;
    total_rounds := CASE tournament_record.bracket_size
      WHEN 16 THEN 4
      ELSE 5
    END;

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
    ON CONFLICT (tournament_id, user_id) DO UPDATE
    SET status = EXCLUDED.status,
        seed_number = EXCLUDED.seed_number;

    UPDATE tournaments
    SET tournament_format = 'single_elimination',
        status = tournament_record.tournament_status,
        max_players = tournament_record.max_players,
        updated_at = now()
    WHERE id = tournament_record.tournament_id;

    DELETE FROM matches WHERE tournament_id = tournament_record.tournament_id;

    FOR round_number IN REVERSE total_rounds..1 LOOP
      match_count := tournament_record.bracket_size / (2 ^ round_number)::integer;
      remaining_rounds := total_rounds - round_number + 1;
      round_name := CASE
        WHEN remaining_rounds = 1 THEN 'Финал'
        WHEN remaining_rounds = 2 THEN '1/2 финала'
        ELSE '1/' || (2 ^ (remaining_rounds - 1))::integer || ' финала'
      END;

      FOR bracket_position IN 1..match_count LOOP
        player_a := NULL;
        player_b := NULL;
        winner := NULL;
        status_value := 'scheduled';
        score_value := NULL;

        IF round_number = 1 THEN
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
          uuid_generate_v5(uuid_ns_url(), 'visual-bracket-v2-' || tournament_record.slug || '-r' || round_number || '-m' || bracket_position),
          tournament_record.tournament_id,
          player_a,
          player_b,
          winner,
          CASE
            WHEN round_number < total_rounds
              THEN uuid_generate_v5(uuid_ns_url(), 'visual-bracket-v2-' || tournament_record.slug || '-r' || (round_number + 1) || '-m' || ceil(bracket_position / 2.0)::integer)
            ELSE NULL
          END,
          CASE
            WHEN round_number < total_rounds
              THEN CASE WHEN bracket_position % 2 = 1 THEN 'A' ELSE 'B' END
            ELSE NULL
          END,
          score_value,
          round_name,
          round_number,
          bracket_position,
          status_value,
          now() + make_interval(days => round_number, mins => bracket_position * 5)
        );
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
