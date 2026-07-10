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

UPDATE tournaments
SET tournament_format = CASE id
  WHEN '44444444-4444-4444-4444-444444444444' THEN 'single_elimination'
  WHEN '55555555-5555-5555-5555-555555555555' THEN 'group_playoff'
  WHEN '66666666-6666-6666-6666-666666666666' THEN 'round_robin'
  WHEN '77777777-7777-7777-7777-777777777771' THEN 'single_elimination'
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

UPDATE matches
SET next_match_id = '43434343-4343-4343-4343-434343434343',
    next_slot = 'A',
    round_number = 1,
    bracket_position = 1
WHERE id = '41414141-4141-4141-4141-414141414141';

UPDATE matches
SET next_match_id = '43434343-4343-4343-4343-434343434343',
    next_slot = 'B',
    round_number = 1,
    bracket_position = 2
WHERE id = '42424242-4242-4242-4242-424242424242';

UPDATE matches
SET next_match_id = NULL,
    next_slot = NULL,
    round_number = 2,
    bracket_position = 1
WHERE id = '43434343-4343-4343-4343-434343434343';

UPDATE matches
SET round_number = 2,
    bracket_position = 1
WHERE id = '44444444-4444-4444-4444-444444444442';

UPDATE matches
SET round_number = 2,
    bracket_position = 2
WHERE id = '45454545-4545-4545-4545-454545454545';

UPDATE matches
SET round_number = 1,
    bracket_position = 1
WHERE id = '46464646-4646-4646-4646-464646464646';
