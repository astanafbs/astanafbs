WITH seed_slots AS (
  SELECT seed, row_number() OVER () AS slot_index
  FROM unnest(ARRAY[
    1,32,17,16,9,24,25,8,5,28,21,12,13,20,29,4,
    3,30,19,14,11,22,27,6,7,26,23,10,15,18,31,2
  ]) AS seed
),
players AS (
  SELECT r.user_id, r.seed_number
  FROM tournament_registrations r
  WHERE r.tournament_id = '44444444-4444-4444-4444-444444444444'
    AND r.status = 'confirmed'
)
UPDATE matches m
SET player_a_id = player_a.user_id,
    player_b_id = player_b.user_id,
    winner_id = CASE
      WHEN m.round_number = 1 AND m.bracket_position <= 6 THEN player_a.user_id
      ELSE m.winner_id
    END,
    updated_at = now()
FROM seed_slots slot_a
JOIN seed_slots slot_b ON slot_b.slot_index = slot_a.slot_index + 1
JOIN players player_a ON player_a.seed_number = slot_a.seed
JOIN players player_b ON player_b.seed_number = slot_b.seed
WHERE m.tournament_id = '44444444-4444-4444-4444-444444444444'
  AND m.round_number = 1
  AND slot_a.slot_index = (m.bracket_position - 1) * 2 + 1;
