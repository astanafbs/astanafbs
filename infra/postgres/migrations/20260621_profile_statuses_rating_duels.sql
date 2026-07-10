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

UPDATE player_profiles
SET profile_status_id = CASE
    WHEN skill_level IN ('pro', 'advanced', 'organizer', 'admin') THEN '30303030-3030-4030-8030-303030303030'::uuid
    WHEN skill_level IN ('beginner+', 'intermediate') THEN '10101010-1010-4010-8010-101010101010'::uuid
    ELSE profile_status_id
  END
WHERE profile_status_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_profile_statuses_status_sort ON profile_statuses(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_player_profiles_profile_status_id ON player_profiles(profile_status_id);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
