ALTER TABLE player_profiles
  ADD COLUMN IF NOT EXISTS titles TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS two_gis_url TEXT;

ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS discipline TEXT NOT NULL DEFAULT 'Москва',
  ADD COLUMN IF NOT EXISTS first_place_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS second_place_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS third_place_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS third_place_second_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

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

CREATE INDEX IF NOT EXISTS idx_training_templates_status_sort ON training_templates(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_training_metrics_status_sort ON training_metrics(status, sort_order);

INSERT INTO clubs (id, name, address, city, phone, image_key, two_gis_url)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Astana Billiard Club', 'пр. Кабанбай Батыра, 46', 'Astana', '+7 700 000 00 01', 'https://images.unsplash.com/photo-1626277888730-2f35193088bf?auto=format&fit=crop&w=900&q=80', 'https://2gis.kz/astana/search/Astana%20Billiard%20Club'),
  ('22222222-2222-2222-2222-222222222222', 'Qazaq Billiards', 'ул. Сыганак, 18', 'Astana', '+7 700 000 00 02', 'https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=900&q=80', 'https://2gis.kz/astana/search/Qazaq%20Billiards'),
  ('33333333-3333-3333-3333-333333333333', 'FBS Arena', 'ул. Туран, 12', 'Astana', '+7 700 000 00 03', 'https://images.unsplash.com/photo-1576085898323-218337e3e43c?auto=format&fit=crop&w=900&q=80', 'https://2gis.kz/astana/search/FBS%20Arena')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    phone = EXCLUDED.phone,
    image_key = EXCLUDED.image_key,
    two_gis_url = EXCLUDED.two_gis_url,
    updated_at = now();

INSERT INTO users (id, firebase_uid, email, display_name, city, role)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'seed-player-1', 'alexey@example.com', 'Алексей Иванов', 'Astana', 'player'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'seed-player-2', 'erlan@example.com', 'Ерлан Сапаров', 'Astana', 'player'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'seed-player-3', 'daniyar@example.com', 'Данияр Ахметов', 'Astana', 'player'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'seed-player-4', 'ruslan@example.com', 'Руслан Ким', 'Astana', 'player'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'seed-player-5', 'madina@example.com', 'Мадина Сеитова', 'Astana', 'player'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'seed-player-6', 'timur@example.com', 'Тимур Нурланов', 'Astana', 'player'),
  ('abababab-abab-abab-abab-abababababab', 'seed-player-7', 'arman@example.com', 'Арман Жаксылыков', 'Astana', 'player'),
  ('bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'seed-player-8', 'aslan@example.com', 'Аслан Морозов', 'Astana', 'player')
ON CONFLICT (id) DO UPDATE
SET display_name = EXCLUDED.display_name,
    city = EXCLUDED.city,
    role = EXCLUDED.role,
    updated_at = now();

INSERT INTO tournaments (
  id,
  title,
  status,
  starts_at,
  ends_at,
  club_id,
  location,
  discipline,
  entry_fee_cents,
  currency,
  max_players,
  first_place_user_id,
  second_place_user_id,
  third_place_user_id,
  third_place_second_user_id
)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'FBS Astana Open', 'registration_open', now() + interval '12 days', now() + interval '12 days 8 hours', '11111111-1111-1111-1111-111111111111', 'пр. Кабанбай Батыра, 46', 'Москва', 1000000, 'KZT', 32, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  ('55555555-5555-5555-5555-555555555555', 'Лига ветеранов', 'registration_open', now() + interval '19 days', now() + interval '19 days 6 hours', '22222222-2222-2222-2222-222222222222', 'ул. Сыганак, 18', 'Комби', 700000, 'KZT', 24, NULL, NULL, NULL, NULL),
  ('66666666-6666-6666-6666-666666666666', 'Summer Cup Qualifier', 'draft', now() + interval '27 days', now() + interval '27 days 8 hours', '33333333-3333-3333-3333-333333333333', 'ул. Туран, 12', 'Невка', 1500000, 'KZT', 32, NULL, NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    status = EXCLUDED.status,
    starts_at = EXCLUDED.starts_at,
    ends_at = EXCLUDED.ends_at,
    club_id = EXCLUDED.club_id,
    location = EXCLUDED.location,
    discipline = EXCLUDED.discipline,
    entry_fee_cents = EXCLUDED.entry_fee_cents,
    currency = EXCLUDED.currency,
    max_players = EXCLUDED.max_players,
    first_place_user_id = EXCLUDED.first_place_user_id,
    second_place_user_id = EXCLUDED.second_place_user_id,
    third_place_user_id = EXCLUDED.third_place_user_id,
    third_place_second_user_id = EXCLUDED.third_place_second_user_id,
    updated_at = now();

UPDATE clubs
SET image_key = CASE id
  WHEN '11111111-1111-1111-1111-111111111111' THEN 'https://images.unsplash.com/photo-1626277888730-2f35193088bf?auto=format&fit=crop&w=900&q=80'
  WHEN '22222222-2222-2222-2222-222222222222' THEN 'https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=900&q=80'
  WHEN '33333333-3333-3333-3333-333333333333' THEN 'https://images.unsplash.com/photo-1576085898323-218337e3e43c?auto=format&fit=crop&w=900&q=80'
  ELSE image_key
END,
two_gis_url = CASE id
  WHEN '11111111-1111-1111-1111-111111111111' THEN 'https://2gis.kz/astana/search/Astana%20Billiard%20Club'
  WHEN '22222222-2222-2222-2222-222222222222' THEN 'https://2gis.kz/astana/search/Qazaq%20Billiards'
  WHEN '33333333-3333-3333-3333-333333333333' THEN 'https://2gis.kz/astana/search/FBS%20Arena'
  ELSE two_gis_url
END;

UPDATE player_profiles
SET titles = CASE user_id
  WHEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' THEN ARRAY['КМС', 'Чемпион клуба']
  WHEN 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' THEN ARRAY['Мастер серии']
  WHEN 'cccccccc-cccc-cccc-cccc-cccccccccccc' THEN ARRAY['Финалист лиги']
  WHEN 'dddddddd-dddd-dddd-dddd-dddddddddddd' THEN ARRAY['Сильный любитель']
  ELSE titles
END;

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

INSERT INTO player_profiles (user_id, rating, rating_source, club_name, skill_level, titles, wins, losses)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1840, 'local', 'Astana Billiard Club', 'pro', ARRAY['КМС', 'Чемпион клуба'], 18, 7),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1795, 'local', 'Qazaq Billiards', 'pro', ARRAY['Мастер серии'], 16, 8),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 1730, 'local', 'FBS Arena', 'advanced', ARRAY['Финалист лиги'], 14, 10),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 1690, 'local', 'Astana Billiard Club', 'advanced', ARRAY['Сильный любитель'], 12, 9),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1655, 'local', 'Qazaq Billiards', 'advanced', ARRAY['Лучший новичок'], 11, 11),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 1620, 'local', 'FBS Arena', 'intermediate', ARRAY['Полуфиналист клуба'], 10, 12),
  ('abababab-abab-abab-abab-abababababab', 1580, 'local', 'Astana Billiard Club', 'intermediate', ARRAY['Активный игрок'], 9, 12),
  ('bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 1510, 'local', 'Qazaq Billiards', 'beginner+', ARRAY['Участник лиги'], 7, 14)
ON CONFLICT (user_id) DO UPDATE
SET rating = EXCLUDED.rating,
    rating_source = EXCLUDED.rating_source,
    club_name = EXCLUDED.club_name,
    skill_level = EXCLUDED.skill_level,
    titles = EXCLUDED.titles,
    wins = EXCLUDED.wins,
    losses = EXCLUDED.losses,
    updated_at = now();

UPDATE tournaments
SET discipline = CASE id
  WHEN '44444444-4444-4444-4444-444444444444' THEN 'Москва'
  WHEN '55555555-5555-5555-5555-555555555555' THEN 'Комби'
  WHEN '66666666-6666-6666-6666-666666666666' THEN 'Невка'
  ELSE discipline
END,
first_place_user_id = CASE WHEN id = '44444444-4444-4444-4444-444444444444' THEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid ELSE first_place_user_id END,
second_place_user_id = CASE WHEN id = '44444444-4444-4444-4444-444444444444' THEN 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid ELSE second_place_user_id END,
third_place_user_id = CASE WHEN id = '44444444-4444-4444-4444-444444444444' THEN 'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid ELSE third_place_user_id END,
third_place_second_user_id = CASE WHEN id = '44444444-4444-4444-4444-444444444444' THEN 'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid ELSE third_place_second_user_id END;

INSERT INTO news_posts (id, title, body, status, published_at)
VALUES
  ('77777777-7777-7777-7777-777777777777', 'Открыта регистрация на майский турнир FBS Astana', 'Игроки могут подать заявку через мобильное приложение.', 'published', now()),
  ('88888888-8888-8888-8888-888888888888', 'Прямые трансляции финалов будут доступны на YouTube', 'Эфиры появятся в разделе трансляций.', 'published', now() - interval '1 day'),
  ('99999999-9999-9999-9999-999999999999', 'Клубы обновили расписание', 'Площадки Астаны добавили новые игровые окна.', 'published', now() - interval '2 days')
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    body = EXCLUDED.body,
    status = EXCLUDED.status,
    published_at = COALESCE(news_posts.published_at, EXCLUDED.published_at);

INSERT INTO streams (id, title, youtube_video_id, status, starts_at)
VALUES
  ('12121212-1212-1212-1212-121212121212', 'FBS Astana Open: полуфиналы', NULL, 'published', now() + interval '12 days 7 hours'),
  ('13131313-1313-1313-1313-131313131313', 'Дуэль недели: стол 4', NULL, 'published', now() + interval '1 day')
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    youtube_video_id = EXCLUDED.youtube_video_id,
    status = EXCLUDED.status,
    starts_at = EXCLUDED.starts_at,
    updated_at = now();

INSERT INTO listings (id, user_id, title, description, category, price_cents, status)
VALUES
  ('14141414-1414-1414-1414-141414141414', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Кий Predator SP2', 'Состояние хорошее, Astana.', 'cues', 18000000, 'published'),
  ('15151515-1515-1515-1515-151515151515', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Индивидуальная тренировка', 'Тренировка по пирамиде.', 'coaches', 1500000, 'published'),
  ('15151515-1515-1515-1515-151515151516', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Мел Taom V10', 'Новый мел, упаковка закрыта.', 'chalk', 490000, 'published'),
  ('15151515-1515-1515-1515-151515151517', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Чехол 2x4', 'Кожаный чехол под два кия.', 'cases', 3200000, 'published'),
  ('15151515-1515-1515-1515-151515151518', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Стол 12 футов', 'Стол для пирамиды под заказ.', 'tables', 145000000, 'published'),
  ('15151515-1515-1515-1515-151515151519', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Комплект шаров', 'Комплект шаров в хорошем состоянии.', 'misc', 8500000, 'published')
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    price_cents = EXCLUDED.price_cents,
    status = EXCLUDED.status;

UPDATE listings
SET category = CASE category
  WHEN 'inventory' THEN 'cues'
  WHEN 'service' THEN 'coaches'
  ELSE category
END;

INSERT INTO training_templates (id, title, target, metric, sort_order, status)
VALUES
  ('21212121-2121-2121-2121-212121212121', 'Разбой пирамиды', '50-100 разбоев', 'разгон, забитые, контроль битка', 10, 'published'),
  ('22222222-2222-2222-2222-222222222221', 'Чужой прямой удар', 'чужой прямой удар с дистанции >1,5 м', 'процент попаданий', 20, 'published'),
  ('23232323-2323-2323-2323-232323232323', 'Свояк, скат с точки', 'свояк со скатом с точки', 'точность свояка и контроль битка', 30, 'published'),
  ('24242424-2424-2424-2424-242424242424', 'Свояк в отскок', 'свояк через отскок от борта', '% выполнения', 40, 'published'),
  ('25252525-2525-2525-2525-252525252525', 'Чужой на резке', 'чужой шар на резке', '% правильных и ошибок', 50, 'published'),
  ('26262626-2626-2626-2626-262626262626', 'Защитная игра', 'глухие и полуглухие', '% успешных защит', 60, 'published')
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    target = EXCLUDED.target,
    metric = EXCLUDED.metric,
    sort_order = EXCLUDED.sort_order,
    status = EXCLUDED.status;

INSERT INTO training_metrics (id, label, value, detail, sort_order, status)
VALUES
  ('31313131-3131-3131-3131-313131313131', 'Точность', '68%', '+14% за месяц', 10, 'published'),
  ('32323232-3232-3232-3232-323232323232', 'Макс. серия', '11', 'цель 12 шаров', 20, 'published'),
  ('33333333-3333-3333-3333-333333333331', 'Разбой', '64%', 'цель 70%', 30, 'published'),
  ('34343434-3434-3434-3434-343434343434', 'Часы', '38', 'из 100 за 3 месяца', 40, 'published')
ON CONFLICT (id) DO UPDATE
SET label = EXCLUDED.label,
    value = EXCLUDED.value,
    detail = EXCLUDED.detail,
    sort_order = EXCLUDED.sort_order,
    status = EXCLUDED.status;

INSERT INTO products (id, title, description, price_cents, status)
VALUES
  ('16161616-1616-1616-1616-161616161616', 'Перчатка FBS Pro', 'Перчатка для тренировок и турниров.', 650000, 'published'),
  ('17171717-1717-1717-1717-171717171717', 'Мел Taom V10', 'Профессиональный мел.', 490000, 'published'),
  ('18181818-1818-1818-1818-181818181818', 'Чехол для кия', 'Под заказ.', 3200000, 'draft')
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    price_cents = EXCLUDED.price_cents,
    status = EXCLUDED.status;

INSERT INTO tournament_registrations (tournament_id, user_id, status, seed_number)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'confirmed', 1),
  ('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'confirmed', 2),
  ('44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'confirmed', 3),
  ('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'confirmed', 4),
  ('44444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'confirmed', 5),
  ('44444444-4444-4444-4444-444444444444', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'confirmed', 6),
  ('44444444-4444-4444-4444-444444444444', 'abababab-abab-abab-abab-abababababab', 'confirmed', 7),
  ('44444444-4444-4444-4444-444444444444', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'confirmed', 8),
  ('55555555-5555-5555-5555-555555555555', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'confirmed', 1),
  ('55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'confirmed', 2),
  ('55555555-5555-5555-5555-555555555555', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'pending', 3),
  ('55555555-5555-5555-5555-555555555555', 'abababab-abab-abab-abab-abababababab', 'waitlist', 4)
ON CONFLICT (tournament_id, user_id) DO UPDATE
SET status = EXCLUDED.status,
    seed_number = EXCLUDED.seed_number;

INSERT INTO matches (id, tournament_id, player_a_id, player_b_id, winner_id, score, round_name, status, scheduled_at)
VALUES
  ('41414141-4141-4141-4141-414141414141', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '5:2', '1/4 финала', 'completed', now() + interval '12 days 1 hour'),
  ('42424242-4242-4242-4242-424242424242', '44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'abababab-abab-abab-abab-abababababab', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '5:3', '1/4 финала', 'completed', now() + interval '12 days 1 hour 30 minutes'),
  ('43434343-4343-4343-4343-434343434343', '44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'ffffffff-ffff-ffff-ffff-ffffffffffff', NULL, NULL, '1/4 финала', 'scheduled', now() + interval '12 days 2 hours'),
  ('45454545-4545-4545-4545-454545454545', '44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NULL, '2:1', '1/4 финала', 'live', now() + interval '12 days 2 hours 30 minutes'),
  ('46464646-4646-4646-4646-464646464646', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, NULL, '1/2 финала', 'scheduled', now() + interval '12 days 5 hours'),
  ('47474747-4747-4747-4747-474747474747', '55555555-5555-5555-5555-555555555555', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NULL, NULL, 'Полуфинал', 'scheduled', now() + interval '19 days 2 hours')
ON CONFLICT (id) DO UPDATE
SET player_a_id = EXCLUDED.player_a_id,
    player_b_id = EXCLUDED.player_b_id,
    winner_id = EXCLUDED.winner_id,
    score = EXCLUDED.score,
    round_name = EXCLUDED.round_name,
    status = EXCLUDED.status,
    scheduled_at = EXCLUDED.scheduled_at,
    updated_at = now();

INSERT INTO push_tokens (id, user_id, expo_push_token, platform, enabled)
VALUES
  ('51515151-5151-5151-5151-515151515151', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ExponentPushToken[seed-player-1]', 'ios', TRUE),
  ('52525252-5252-5252-5252-525252525252', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ExponentPushToken[seed-player-2]', 'android', TRUE)
ON CONFLICT (expo_push_token) DO UPDATE
SET user_id = EXCLUDED.user_id,
    platform = EXCLUDED.platform,
    enabled = EXCLUDED.enabled,
    updated_at = now();

INSERT INTO push_campaigns (id, title, body, target, status, sent_at)
VALUES
  ('53535353-5353-5353-5353-535353535353', 'Тестовое уведомление', 'Проверьте регистрацию на ближайший турнир.', 'all', 'draft', NULL),
  ('54545454-5454-5454-5454-545454545454', 'Финалы FBS Astana Open', 'Прямые трансляции появятся в разделе эфиров.', 'players', 'published', now() - interval '1 day')
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    body = EXCLUDED.body,
    target = EXCLUDED.target,
    status = EXCLUDED.status,
    sent_at = EXCLUDED.sent_at,
    updated_at = now();
