UPDATE tournaments
SET tournament_format = CASE id
  WHEN '44444444-4444-4444-4444-444444444444' THEN 'single_elimination'
  WHEN '55555555-5555-5555-5555-555555555555' THEN 'group_playoff'
  WHEN '66666666-6666-6666-6666-666666666666' THEN 'round_robin'
  WHEN '77777777-7777-7777-7777-777777777771' THEN 'double_elimination'
  WHEN '88888888-8888-8888-8888-888888888881' THEN 'swiss'
  ELSE tournament_format
END
WHERE id IN (
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777771',
  '88888888-8888-8888-8888-888888888881'
);

DELETE FROM matches
WHERE tournament_id IN (
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777771',
  '88888888-8888-8888-8888-888888888881'
);

INSERT INTO matches (
  id, tournament_id, player_a_id, player_b_id, winner_id, next_match_id, next_slot,
  score, round_name, round_number, bracket_position, status, scheduled_at
)
VALUES
  ('11111111-aaaa-4000-8000-000000000001', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-aaaa-4000-8000-000000000005', 'A', '5:2', '1/4 финала', 1, 1, 'completed', now() + interval '9 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000002', '44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'abababab-abab-abab-abab-abababababab', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-aaaa-4000-8000-000000000005', 'B', '5:3', '1/4 финала', 1, 2, 'completed', now() + interval '9 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000003', '44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-aaaa-4000-8000-000000000006', 'A', '5:4', '1/4 финала', 1, 3, 'completed', now() + interval '9 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000004', '44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-aaaa-4000-8000-000000000006', 'B', '5:1', '1/4 финала', 1, 4, 'completed', now() + interval '9 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000005', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, '11111111-aaaa-4000-8000-000000000007', 'A', NULL, '1/2 финала', 2, 1, 'live', now() + interval '9 days 3 hours'),
  ('11111111-aaaa-4000-8000-000000000006', '44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL, '11111111-aaaa-4000-8000-000000000007', 'B', NULL, '1/2 финала', 2, 2, 'scheduled', now() + interval '9 days 3 hours'),
  ('11111111-aaaa-4000-8000-000000000007', '44444444-4444-4444-4444-444444444444', NULL, NULL, NULL, NULL, NULL, NULL, 'Финал', 3, 1, 'scheduled', now() + interval '9 days 6 hours'),

  ('11111111-aaaa-4000-8000-000000000101', '55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-aaaa-4000-8000-000000000105', 'A', '4:2', 'G-A T1', 1, 1, 'completed', now() + interval '4 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000102', '55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'abababab-abab-abab-abab-abababababab', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-aaaa-4000-8000-000000000106', 'A', '4:3', 'G-A T1', 1, 2, 'completed', now() + interval '4 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000103', '55555555-5555-5555-5555-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-aaaa-4000-8000-000000000105', 'B', '4:1', 'G-B T1', 1, 3, 'completed', now() + interval '4 days 2 hours'),
  ('11111111-aaaa-4000-8000-000000000104', '55555555-5555-5555-5555-555555555555', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', '11111111-aaaa-4000-8000-000000000106', 'B', '2:4', 'G-B T1', 1, 4, 'completed', now() + interval '4 days 2 hours'),
  ('11111111-aaaa-4000-8000-000000000105', '55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', NULL, '11111111-aaaa-4000-8000-000000000107', 'A', NULL, 'PO-SF1', 2, 1, 'live', now() + interval '4 days 4 hours'),
  ('11111111-aaaa-4000-8000-000000000106', '55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NULL, '11111111-aaaa-4000-8000-000000000107', 'B', NULL, 'PO-SF2', 2, 2, 'scheduled', now() + interval '4 days 4 hours'),
  ('11111111-aaaa-4000-8000-000000000107', '55555555-5555-5555-5555-555555555555', NULL, NULL, NULL, NULL, NULL, NULL, 'PO-F', 3, 1, 'scheduled', now() + interval '4 days 6 hours'),

  ('11111111-aaaa-4000-8000-000000000201', '66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, NULL, '4:1', 'RR R1', 1, 1, 'completed', now() - interval '2 hours'),
  ('11111111-aaaa-4000-8000-000000000202', '66666666-6666-6666-6666-666666666666', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL, NULL, '2:4', 'RR R1', 1, 2, 'completed', now() - interval '2 hours'),
  ('11111111-aaaa-4000-8000-000000000203', '66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NULL, NULL, NULL, NULL, 'RR R2', 2, 1, 'live', now() - interval '30 minutes'),
  ('11111111-aaaa-4000-8000-000000000204', '66666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL, NULL, NULL, NULL, 'RR R2', 2, 2, 'scheduled', now() + interval '30 minutes'),
  ('11111111-aaaa-4000-8000-000000000205', '66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL, NULL, NULL, NULL, 'RR R3', 3, 1, 'scheduled', now() + interval '2 hours'),
  ('11111111-aaaa-4000-8000-000000000206', '66666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NULL, NULL, NULL, NULL, 'RR R3', 3, 2, 'scheduled', now() + interval '2 hours'),

  ('11111111-aaaa-4000-8000-000000000301', '77777777-7777-7777-7777-777777777771', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-aaaa-4000-8000-000000000303', 'A', '5:2', 'W-R1', 1, 1, 'completed', now() - interval '12 days 3 hours'),
  ('11111111-aaaa-4000-8000-000000000302', '77777777-7777-7777-7777-777777777771', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-aaaa-4000-8000-000000000303', 'B', '5:4', 'W-R1', 1, 2, 'completed', now() - interval '12 days 3 hours'),
  ('11111111-aaaa-4000-8000-000000000304', '77777777-7777-7777-7777-777777777771', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-aaaa-4000-8000-000000000305', 'B', '4:3', 'L-R1', 1, 3, 'completed', now() - interval '12 days 2 hours'),
  ('11111111-aaaa-4000-8000-000000000303', '77777777-7777-7777-7777-777777777771', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-aaaa-4000-8000-000000000306', 'A', '6:4', 'W-R2', 2, 1, 'completed', now() - interval '12 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000305', '77777777-7777-7777-7777-777777777771', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-aaaa-4000-8000-000000000306', 'B', '3:5', 'L-R2', 2, 2, 'completed', now() - interval '12 days 40 minutes'),
  ('11111111-aaaa-4000-8000-000000000306', '77777777-7777-7777-7777-777777777771', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, NULL, '7:5', 'GF', 3, 1, 'completed', now() - interval '11 days 20 hours'),

  ('11111111-aaaa-4000-8000-000000000401', '88888888-8888-8888-8888-888888888881', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, NULL, '4:0', 'SW R1', 1, 1, 'completed', now() + interval '30 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000402', '88888888-8888-8888-8888-888888888881', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'abababab-abab-abab-abab-abababababab', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, NULL, '4:2', 'SW R1', 1, 2, 'completed', now() + interval '30 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000403', '88888888-8888-8888-8888-888888888881', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'ffffffff-ffff-ffff-ffff-ffffffffffff', NULL, NULL, '2:4', 'SW R1', 1, 3, 'completed', now() + interval '30 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000404', '88888888-8888-8888-8888-888888888881', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL, NULL, '4:3', 'SW R1', 1, 4, 'completed', now() + interval '30 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000405', '88888888-8888-8888-8888-888888888881', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, NULL, NULL, NULL, 'SW R2', 2, 1, 'live', now() + interval '30 days 3 hours'),
  ('11111111-aaaa-4000-8000-000000000406', '88888888-8888-8888-8888-888888888881', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ffffffff-ffff-ffff-ffff-ffffffffffff', NULL, NULL, NULL, NULL, 'SW R2', 2, 2, 'scheduled', now() + interval '30 days 3 hours'),
  ('11111111-aaaa-4000-8000-000000000407', '88888888-8888-8888-8888-888888888881', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NULL, NULL, NULL, NULL, 'SW R2', 2, 3, 'scheduled', now() + interval '30 days 3 hours'),
  ('11111111-aaaa-4000-8000-000000000408', '88888888-8888-8888-8888-888888888881', 'abababab-abab-abab-abab-abababababab', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NULL, NULL, NULL, NULL, 'SW R2', 2, 4, 'scheduled', now() + interval '30 days 3 hours');
