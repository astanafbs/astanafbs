INSERT INTO clubs (id, name, address, city, phone)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Astana Billiard Club', 'пр. Кабанбай Батыра, 46', 'Astana', '+7 700 000 00 01'),
  ('22222222-2222-2222-2222-222222222222', 'Qazaq Billiards', 'ул. Сыганак, 18', 'Astana', '+7 700 000 00 02'),
  ('33333333-3333-3333-3333-333333333333', 'FBS Arena', 'ул. Туран, 12', 'Astana', '+7 700 000 00 03')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, firebase_uid, email, display_name, city, role)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'seed-player-1', 'alexey@example.com', 'Алексей Иванов', 'Astana', 'player'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'seed-player-2', 'erlan@example.com', 'Ерлан Сапаров', 'Astana', 'player'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'seed-player-3', 'daniyar@example.com', 'Данияр Ахметов', 'Astana', 'player'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'seed-player-4', 'ruslan@example.com', 'Руслан Ким', 'Astana', 'player')
ON CONFLICT (id) DO NOTHING;

INSERT INTO player_profiles (user_id, rating, rating_source, club_name, skill_level, wins, losses)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1840, 'local', 'Astana Billiard Club', 'pro', 18, 7),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1795, 'local', 'Qazaq Billiards', 'pro', 16, 8),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 1730, 'local', 'FBS Arena', 'advanced', 14, 10),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 1690, 'local', 'Astana Billiard Club', 'advanced', 12, 9)
ON CONFLICT DO NOTHING;

INSERT INTO tournaments (
  id,
  title,
  status,
  starts_at,
  ends_at,
  club_id,
  location,
  entry_fee_cents,
  currency,
  max_players
)
VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    'FBS Astana Open',
    'registration_open',
    now() + interval '12 days',
    now() + interval '12 days 8 hours',
    '11111111-1111-1111-1111-111111111111',
    'пр. Кабанбай Батыра, 46',
    1000000,
    'KZT',
    32
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Лига ветеранов',
    'registration_open',
    now() + interval '19 days',
    now() + interval '19 days 6 hours',
    '22222222-2222-2222-2222-222222222222',
    'ул. Сыганак, 18',
    700000,
    'KZT',
    24
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'Summer Cup Qualifier',
    'draft',
    now() + interval '27 days',
    now() + interval '27 days 8 hours',
    '33333333-3333-3333-3333-333333333333',
    'ул. Туран, 12',
    1500000,
    'KZT',
    32
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO tournament_registrations (tournament_id, user_id, status, seed_number)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'confirmed', 1),
  ('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'confirmed', 2),
  ('44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'pending', 3),
  ('55555555-5555-5555-5555-555555555555', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'confirmed', 1)
ON CONFLICT (tournament_id, user_id) DO NOTHING;

INSERT INTO news_posts (id, title, body, status, published_at)
VALUES
  ('77777777-7777-7777-7777-777777777777', 'Открыта регистрация на майский турнир FBS Astana', 'Игроки могут подать заявку через мобильное приложение.', 'published', now()),
  ('88888888-8888-8888-8888-888888888888', 'Прямые трансляции финалов будут доступны на YouTube', 'Эфиры появятся в разделе трансляций.', 'published', now() - interval '1 day'),
  ('99999999-9999-9999-9999-999999999999', 'Клубы обновили расписание', 'Площадки Астаны добавили новые игровые окна.', 'published', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO streams (id, title, youtube_video_id, status, starts_at)
VALUES
  ('12121212-1212-1212-1212-121212121212', 'FBS Astana Open: полуфиналы', NULL, 'published', now() + interval '12 days 7 hours'),
  ('13131313-1313-1313-1313-131313131313', 'Дуэль недели: стол 4', NULL, 'published', now() + interval '1 day')
ON CONFLICT (id) DO NOTHING;

INSERT INTO listings (id, user_id, title, description, category, price_cents, status)
VALUES
  ('14141414-1414-1414-1414-141414141414', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Кий Predator SP2', 'Состояние хорошее, Astana.', 'inventory', 18000000, 'published'),
  ('15151515-1515-1515-1515-151515151515', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Индивидуальная тренировка', 'Тренировка по пирамиде.', 'service', 1500000, 'published')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, title, description, price_cents, status)
VALUES
  ('16161616-1616-1616-1616-161616161616', 'Перчатка FBS Pro', 'Перчатка для тренировок и турниров.', 650000, 'published'),
  ('17171717-1717-1717-1717-171717171717', 'Мел Taom V10', 'Профессиональный мел.', 490000, 'published'),
  ('18181818-1818-1818-1818-181818181818', 'Чехол для кия', 'Под заказ.', 3200000, 'draft')
ON CONFLICT (id) DO NOTHING;

INSERT INTO duels (id, challenger_id, opponent_id, club_id, status, score, winner_id, scheduled_at)
VALUES
  (
    '19191919-1919-1919-1919-191919191919',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '33333333-3333-3333-3333-333333333333',
    'completed',
    '5:3',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    now() - interval '2 days'
  ),
  (
    '20202020-2020-2020-2020-202020202020',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    'pending',
    NULL,
    NULL,
    now() + interval '1 day'
  )
ON CONFLICT (id) DO NOTHING;
