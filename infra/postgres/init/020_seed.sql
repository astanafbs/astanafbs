TRUNCATE TABLE
  orders,
  push_tokens,
  push_campaigns,
  matches,
  tournament_registrations,
  duels,
  listings,
  products,
  training_metrics,
  training_templates,
  streams,
  news_posts,
  tournaments,
  clubs,
  player_profiles,
  profile_statuses,
  users
RESTART IDENTITY CASCADE;

INSERT INTO clubs (id, name, address, city, phone, image_key, two_gis_url)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Billiard Hub Astana', 'пр. Кабанбай Батыра, 46', 'Астана', '+7 700 101 10 01', 'clubs/astana-billiard-hub.jpg', 'https://2gis.kz/astana/search/Billiard%20Hub%20Astana'),
  ('22222222-2222-2222-2222-222222222222', 'Nomad Pyramid Club', 'ул. Сыганак, 18', 'Астана', '+7 700 101 10 02', 'clubs/nomad-pyramid-club.jpg', 'https://2gis.kz/astana/search/Nomad%20Pyramid%20Club'),
  ('33333333-3333-3333-3333-333333333333', 'Alatau Billiards', 'пр. Абая, 52', 'Алматы', '+7 701 202 20 03', 'clubs/alatau-billiards.jpg', 'https://2gis.kz/almaty/search/Alatau%20Billiards'),
  ('44444444-4444-4444-4444-444444444441', 'Silk Way Cue Club', 'ул. Навои, 7', 'Алматы', '+7 701 202 20 04', 'clubs/silk-way-cue-club.jpg', 'https://2gis.kz/almaty/search/Silk%20Way%20Cue%20Club'),
  ('55555555-5555-5555-5555-555555555551', 'Shymkent Pyramid Hall', 'пр. Тауке хана, 31', 'Шымкент', '+7 702 303 30 05', 'clubs/shymkent-pyramid-hall.jpg', 'https://2gis.kz/shymkent/search/Pyramid%20Hall'),
  ('66666666-6666-6666-6666-666666666661', 'Saryarqa Billiards', 'пр. Бухар Жырау, 64', 'Караганда', '+7 702 404 40 06', 'clubs/saryarqa-billiards.jpg', 'https://2gis.kz/karaganda/search/Saryarqa%20Billiards');

INSERT INTO users (id, firebase_uid, email, display_name, photo_url, city, role)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'seed-aibar', 'aibar.nurlybek@fbs.local', 'Айбар Нурлыбек', NULL, 'Астана', 'player'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'seed-daniyar', 'daniyar.sadykov@fbs.local', 'Данияр Садыков', NULL, 'Алматы', 'player'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'seed-erlan', 'erlan.akishev@fbs.local', 'Ерлан Акишев', NULL, 'Астана', 'player'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'seed-madina', 'madina.seitova@fbs.local', 'Мадина Сеитова', NULL, 'Шымкент', 'player'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'seed-aruzhan', 'aruzhan.kairat@fbs.local', 'Аружан Кайрат', NULL, 'Алматы', 'player'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'seed-timur', 'timur.ermek@fbs.local', 'Тимур Ермек', NULL, 'Караганда', 'player'),
  ('abababab-abab-abab-abab-abababababab', 'seed-assel', 'assel.rahim@fbs.local', 'Асель Рахим', NULL, 'Астана', 'player'),
  ('bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'seed-nikita', 'nikita.volkov@fbs.local', 'Никита Волков', NULL, 'Павлодар', 'player'),
  ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 'seed-sergey', 'sergey.kim@fbs.local', 'Сергей Ким', NULL, 'Костанай', 'player'),
  ('dededede-dede-dede-dede-dededededede', 'seed-bekzat', 'bekzat.oraz@fbs.local', 'Бекзат Ораз', NULL, 'Атырау', 'player'),
  ('edededed-eded-eded-eded-edededededed', 'seed-sabina', 'sabina.murat@fbs.local', 'Сабина Мурат', NULL, 'Актобе', 'organizer'),
  ('fafafafa-fafa-fafa-fafa-fafafafafafa', 'seed-admin', 'admin@billiardhub.kz', 'Администратор BilliardHub', NULL, 'Астана', 'admin');

INSERT INTO profile_statuses (id, label, description, sort_order, status)
VALUES
  ('10101010-1010-4010-8010-101010101010', 'Открыт к дуэлям', 'Игрок принимает вызовы на рейтинговые и товарищеские игры.', 10, 'published'),
  ('20202020-2020-4020-8020-202020202020', 'Ищу клуб', 'Игрок ищет постоянный клуб или команду для тренировок.', 20, 'published'),
  ('30303030-3030-4030-8030-303030303030', 'Турнирный игрок', 'Игрок активно участвует в турнирах и рейтинговых матчах.', 30, 'published'),
  ('40404040-4040-4040-8040-404040404040', 'Тренируюсь', 'Игрок сейчас делает упор на тренировки и набор формы.', 40, 'published');

INSERT INTO player_profiles (user_id, rating, rating_source, club_name, skill_level, profile_status_id, titles, wins, losses)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1884, 'local', 'Billiard Hub Astana', 'pro', '30303030-3030-4030-8030-303030303030', ARRAY['Чемпион Астаны', 'КМС'], 42, 11),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1848, 'local', 'Alatau Billiards', 'pro', '30303030-3030-4030-8030-303030303030', ARRAY['Финалист Almaty Open'], 39, 13),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 1806, 'local', 'Nomad Pyramid Club', 'advanced', '30303030-3030-4030-8030-303030303030', ARRAY['Победитель лиги'], 34, 16),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 1762, 'local', 'Shymkent Pyramid Hall', 'advanced', '30303030-3030-4030-8030-303030303030', ARRAY['Топ-8 Кубка Юга'], 31, 17),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1724, 'local', 'Silk Way Cue Club', 'advanced', '30303030-3030-4030-8030-303030303030', ARRAY['Лучший женский результат'], 29, 18),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 1688, 'local', 'Saryarqa Billiards', 'advanced', '30303030-3030-4030-8030-303030303030', ARRAY['Полуфиналист Караганда Cup'], 27, 21),
  ('abababab-abab-abab-abab-abababababab', 1642, 'local', 'Billiard Hub Astana', 'intermediate', '10101010-1010-4010-8010-101010101010', ARRAY['Активный игрок'], 23, 22),
  ('bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 1605, 'local', 'Qazaq League', 'intermediate', '10101010-1010-4010-8010-101010101010', ARRAY['Стабильная серия'], 21, 24),
  ('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 1578, 'local', 'Kostanay Cue Room', 'intermediate', '10101010-1010-4010-8010-101010101010', ARRAY['Участник тура'], 18, 25),
  ('dededede-dede-dede-dede-dededededede', 1532, 'local', 'Atyrau Pyramid', 'beginner+', '40404040-4040-4040-8040-404040404040', ARRAY['Новый игрок сезона'], 14, 26),
  ('edededed-eded-eded-eded-edededededed', 1498, 'local', 'Aktobe Billiards', 'organizer', '30303030-3030-4030-8030-303030303030', ARRAY['Организатор тура'], 12, 18),
  ('fafafafa-fafa-fafa-fafa-fafafafafafa', 1200, 'local', 'Billiard Hub Astana', 'admin', '30303030-3030-4030-8030-303030303030', ARRAY['Служебный профиль'], 0, 0);

INSERT INTO tournaments (
  id, title, status, starts_at, ends_at, club_id, location, discipline, tournament_format,
  entry_fee_cents, currency, max_players, banner_key,
  first_place_user_id, second_place_user_id, third_place_user_id, third_place_second_user_id
)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'BilliardHub Kazakhstan Open', 'registration_open', now() + interval '9 days', now() + interval '9 days 8 hours', '11111111-1111-1111-1111-111111111111', 'пр. Кабанбай Батыра, 46', 'Москва', 'single_elimination', 1200000, 'KZT', 32, 'tournaments/kazakhstan-open.jpg', NULL, NULL, NULL, NULL),
  ('55555555-5555-5555-5555-555555555555', 'Almaty Spring Pyramid', 'registration_closed', now() + interval '4 days', now() + interval '4 days 7 hours', '33333333-3333-3333-3333-333333333333', 'пр. Абая, 52', 'Комби', 'group_playoff', 900000, 'KZT', 32, 'tournaments/almaty-spring.jpg', NULL, NULL, NULL, NULL),
  ('66666666-6666-6666-6666-666666666666', 'Astana Friday League', 'in_progress', now() - interval '2 hours', now() + interval '4 hours', '22222222-2222-2222-2222-222222222222', 'ул. Сыганак, 18', 'Америка', 'round_robin', 500000, 'KZT', 16, 'tournaments/friday-league.jpg', NULL, NULL, NULL, NULL),
  ('77777777-7777-7777-7777-777777777771', 'Shymkent Cup Finals', 'completed', now() - interval '12 days', now() - interval '11 days 18 hours', '55555555-5555-5555-5555-555555555551', 'пр. Тауке хана, 31', 'Длинная америка', 'double_elimination', 800000, 'KZT', 16, 'tournaments/shymkent-cup.jpg', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('88888888-8888-8888-8888-888888888881', 'Karaganda Saryarqa Masters', 'draft', now() + interval '30 days', now() + interval '30 days 8 hours', '66666666-6666-6666-6666-666666666661', 'пр. Бухар Жырау, 64', 'Невка', 'swiss', 1000000, 'KZT', 32, 'tournaments/saryarqa-masters.jpg', NULL, NULL, NULL, NULL);

INSERT INTO tournament_registrations (tournament_id, user_id, status, seed_number)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'confirmed', 1),
  ('44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'confirmed', 2),
  ('44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'confirmed', 3),
  ('44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'confirmed', 4),
  ('44444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'pending', 5),
  ('44444444-4444-4444-4444-444444444444', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'waitlist', 6),
  ('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'confirmed', 1),
  ('55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'confirmed', 2),
  ('55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'confirmed', 3),
  ('55555555-5555-5555-5555-555555555555', 'abababab-abab-abab-abab-abababababab', 'confirmed', 4),
  ('66666666-6666-6666-6666-666666666666', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'confirmed', 1),
  ('66666666-6666-6666-6666-666666666666', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'confirmed', 2),
  ('66666666-6666-6666-6666-666666666666', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'confirmed', 3),
  ('66666666-6666-6666-6666-666666666666', 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 'confirmed', 4),
  ('77777777-7777-7777-7777-777777777771', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'confirmed', 1),
  ('77777777-7777-7777-7777-777777777771', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'confirmed', 2),
  ('77777777-7777-7777-7777-777777777771', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'confirmed', 3),
  ('77777777-7777-7777-7777-777777777771', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'confirmed', 4);

INSERT INTO matches (
  id, tournament_id, player_a_id, player_b_id, winner_id, next_match_id, next_slot,
  score, round_name, round_number, bracket_position, status, scheduled_at
)
VALUES
  -- 44444444: single elimination (8 players)
  ('11111111-aaaa-4000-8000-000000000001', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-aaaa-4000-8000-000000000005', 'A', '5:2', '1/4 финала', 1, 1, 'completed', now() + interval '9 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000002', '44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'abababab-abab-abab-abab-abababababab', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-aaaa-4000-8000-000000000005', 'B', '5:3', '1/4 финала', 1, 2, 'completed', now() + interval '9 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000003', '44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-aaaa-4000-8000-000000000006', 'A', '5:4', '1/4 финала', 1, 3, 'completed', now() + interval '9 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000004', '44444444-4444-4444-4444-444444444444', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-aaaa-4000-8000-000000000006', 'B', '5:1', '1/4 финала', 1, 4, 'completed', now() + interval '9 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000005', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, '11111111-aaaa-4000-8000-000000000007', 'A', NULL, '1/2 финала', 2, 1, 'live', now() + interval '9 days 3 hours'),
  ('11111111-aaaa-4000-8000-000000000006', '44444444-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL, '11111111-aaaa-4000-8000-000000000007', 'B', NULL, '1/2 финала', 2, 2, 'scheduled', now() + interval '9 days 3 hours'),
  ('11111111-aaaa-4000-8000-000000000007', '44444444-4444-4444-4444-444444444444', NULL, NULL, NULL, NULL, NULL, NULL, 'Финал', 3, 1, 'scheduled', now() + interval '9 days 6 hours'),

  -- 55555555: groups + playoff
  ('11111111-aaaa-4000-8000-000000000101', '55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-aaaa-4000-8000-000000000105', 'A', '4:2', 'G-A T1', 1, 1, 'completed', now() + interval '4 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000102', '55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'abababab-abab-abab-abab-abababababab', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-aaaa-4000-8000-000000000106', 'A', '4:3', 'G-A T1', 1, 2, 'completed', now() + interval '4 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000103', '55555555-5555-5555-5555-555555555555', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-aaaa-4000-8000-000000000105', 'B', '4:1', 'G-B T1', 1, 3, 'completed', now() + interval '4 days 2 hours'),
  ('11111111-aaaa-4000-8000-000000000104', '55555555-5555-5555-5555-555555555555', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', '11111111-aaaa-4000-8000-000000000106', 'B', '2:4', 'G-B T1', 1, 4, 'completed', now() + interval '4 days 2 hours'),
  ('11111111-aaaa-4000-8000-000000000105', '55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', NULL, '11111111-aaaa-4000-8000-000000000107', 'A', NULL, 'PO-SF1', 2, 1, 'live', now() + interval '4 days 4 hours'),
  ('11111111-aaaa-4000-8000-000000000106', '55555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NULL, '11111111-aaaa-4000-8000-000000000107', 'B', NULL, 'PO-SF2', 2, 2, 'scheduled', now() + interval '4 days 4 hours'),
  ('11111111-aaaa-4000-8000-000000000107', '55555555-5555-5555-5555-555555555555', NULL, NULL, NULL, NULL, NULL, NULL, 'PO-F', 3, 1, 'scheduled', now() + interval '4 days 6 hours'),

  -- 66666666: round robin (4 players, 3 tours)
  ('11111111-aaaa-4000-8000-000000000201', '66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, NULL, '4:1', 'RR R1', 1, 1, 'completed', now() - interval '2 hours'),
  ('11111111-aaaa-4000-8000-000000000202', '66666666-6666-6666-6666-666666666666', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL, NULL, '2:4', 'RR R1', 1, 2, 'completed', now() - interval '2 hours'),
  ('11111111-aaaa-4000-8000-000000000203', '66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NULL, NULL, NULL, NULL, 'RR R2', 2, 1, 'live', now() - interval '30 minutes'),
  ('11111111-aaaa-4000-8000-000000000204', '66666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL, NULL, NULL, NULL, 'RR R2', 2, 2, 'scheduled', now() + interval '30 minutes'),
  ('11111111-aaaa-4000-8000-000000000205', '66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL, NULL, NULL, NULL, 'RR R3', 3, 1, 'scheduled', now() + interval '2 hours'),
  ('11111111-aaaa-4000-8000-000000000206', '66666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NULL, NULL, NULL, NULL, 'RR R3', 3, 2, 'scheduled', now() + interval '2 hours'),

  -- 77777777: two billiards chains, each 2-2-4-4-8-4-2-2 players, converging into GF.
  ('11111111-aaaa-4000-8000-000000000501', '77777777-7777-7777-7777-777777777771', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-aaaa-4000-8000-000000000502', 'A', '5:2', 'A-R1 · 2 игрока', 1, 1, 'completed', now() - interval '12 days 8 hours'),
  ('11111111-aaaa-4000-8000-000000000502', '77777777-7777-7777-7777-777777777771', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-aaaa-4000-8000-000000000503', 'A', '5:3', 'A-R2 · 2 игрока', 2, 1, 'completed', now() - interval '12 days 7 hours'),
  ('11111111-aaaa-4000-8000-000000000503', '77777777-7777-7777-7777-777777777771', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-aaaa-4000-8000-000000000505', 'A', '5:1', 'A-R3 · 4 игрока', 3, 1, 'completed', now() - interval '12 days 6 hours'),
  ('11111111-aaaa-4000-8000-000000000504', '77777777-7777-7777-7777-777777777771', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-aaaa-4000-8000-000000000506', 'A', '5:4', 'A-R3 · 4 игрока', 3, 2, 'completed', now() - interval '12 days 6 hours'),
  ('11111111-aaaa-4000-8000-000000000505', '77777777-7777-7777-7777-777777777771', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'abababab-abab-abab-abab-abababababab', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-aaaa-4000-8000-000000000507', 'A', '5:2', 'A-R4 · 4 игрока', 4, 1, 'completed', now() - interval '12 days 5 hours'),
  ('11111111-aaaa-4000-8000-000000000506', '77777777-7777-7777-7777-777777777771', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-aaaa-4000-8000-000000000508', 'A', '5:3', 'A-R4 · 4 игрока', 4, 2, 'completed', now() - interval '12 days 5 hours'),
  ('11111111-aaaa-4000-8000-000000000507', '77777777-7777-7777-7777-777777777771', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-aaaa-4000-8000-000000000511', 'A', '5:4', 'A-R5 · 8 игроков', 5, 1, 'completed', now() - interval '12 days 4 hours'),
  ('11111111-aaaa-4000-8000-000000000508', '77777777-7777-7777-7777-777777777771', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dededede-dede-dede-dede-dededededede', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-aaaa-4000-8000-000000000511', 'B', '5:1', 'A-R5 · 8 игроков', 5, 2, 'completed', now() - interval '12 days 4 hours'),
  ('11111111-aaaa-4000-8000-000000000509', '77777777-7777-7777-7777-777777777771', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-aaaa-4000-8000-000000000512', 'A', '5:3', 'A-R5 · 8 игроков', 5, 3, 'completed', now() - interval '12 days 4 hours'),
  ('11111111-aaaa-4000-8000-000000000510', '77777777-7777-7777-7777-777777777771', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-aaaa-4000-8000-000000000512', 'B', '5:2', 'A-R5 · 8 игроков', 5, 4, 'completed', now() - interval '12 days 4 hours'),
  ('11111111-aaaa-4000-8000-000000000511', '77777777-7777-7777-7777-777777777771', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-aaaa-4000-8000-000000000513', 'A', '6:4', 'A-R6 · 4 игрока', 6, 1, 'completed', now() - interval '12 days 3 hours'),
  ('11111111-aaaa-4000-8000-000000000512', '77777777-7777-7777-7777-777777777771', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-aaaa-4000-8000-000000000513', 'B', '6:5', 'A-R6 · 4 игрока', 6, 2, 'completed', now() - interval '12 days 3 hours'),
  ('11111111-aaaa-4000-8000-000000000513', '77777777-7777-7777-7777-777777777771', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-aaaa-4000-8000-000000000514', 'A', '6:3', 'A-R7 · 2 игрока', 7, 1, 'completed', now() - interval '12 days 2 hours'),
  ('11111111-aaaa-4000-8000-000000000514', '77777777-7777-7777-7777-777777777771', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NULL, '11111111-aaaa-4000-8000-000000000529', 'A', NULL, 'A-R8 · 2 игрока', 8, 1, 'live', now() - interval '12 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000515', '77777777-7777-7777-7777-777777777771', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-aaaa-4000-8000-000000000516', 'A', '5:2', 'B-R1 · 2 игрока', 1, 1, 'completed', now() - interval '12 days 8 hours'),
  ('11111111-aaaa-4000-8000-000000000516', '77777777-7777-7777-7777-777777777771', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-aaaa-4000-8000-000000000517', 'A', '4:5', 'B-R2 · 2 игрока', 2, 1, 'completed', now() - interval '12 days 7 hours'),
  ('11111111-aaaa-4000-8000-000000000517', '77777777-7777-7777-7777-777777777771', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-aaaa-4000-8000-000000000519', 'A', '5:2', 'B-R3 · 4 игрока', 3, 1, 'completed', now() - interval '12 days 6 hours'),
  ('11111111-aaaa-4000-8000-000000000518', '77777777-7777-7777-7777-777777777771', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', '11111111-aaaa-4000-8000-000000000520', 'A', '3:5', 'B-R3 · 4 игрока', 3, 2, 'completed', now() - interval '12 days 6 hours'),
  ('11111111-aaaa-4000-8000-000000000519', '77777777-7777-7777-7777-777777777771', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'abababab-abab-abab-abab-abababababab', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-aaaa-4000-8000-000000000521', 'A', '5:1', 'B-R4 · 4 игрока', 4, 1, 'completed', now() - interval '12 days 5 hours'),
  ('11111111-aaaa-4000-8000-000000000520', '77777777-7777-7777-7777-777777777771', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', '11111111-aaaa-4000-8000-000000000522', 'A', '5:3', 'B-R4 · 4 игрока', 4, 2, 'completed', now() - interval '12 days 5 hours'),
  ('11111111-aaaa-4000-8000-000000000521', '77777777-7777-7777-7777-777777777771', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dededede-dede-dede-dede-dededededede', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-aaaa-4000-8000-000000000525', 'A', '5:4', 'B-R5 · 8 игроков', 5, 1, 'completed', now() - interval '12 days 4 hours'),
  ('11111111-aaaa-4000-8000-000000000522', '77777777-7777-7777-7777-777777777771', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', '11111111-aaaa-4000-8000-000000000525', 'B', '5:2', 'B-R5 · 8 игроков', 5, 2, 'completed', now() - interval '12 days 4 hours'),
  ('11111111-aaaa-4000-8000-000000000523', '77777777-7777-7777-7777-777777777771', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-aaaa-4000-8000-000000000526', 'A', '2:5', 'B-R5 · 8 игроков', 5, 3, 'completed', now() - interval '12 days 4 hours'),
  ('11111111-aaaa-4000-8000-000000000524', '77777777-7777-7777-7777-777777777771', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-aaaa-4000-8000-000000000526', 'B', '4:5', 'B-R5 · 8 игроков', 5, 4, 'completed', now() - interval '12 days 4 hours'),
  ('11111111-aaaa-4000-8000-000000000525', '77777777-7777-7777-7777-777777777771', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-aaaa-4000-8000-000000000527', 'A', '6:2', 'B-R6 · 4 игрока', 6, 1, 'completed', now() - interval '12 days 3 hours'),
  ('11111111-aaaa-4000-8000-000000000526', '77777777-7777-7777-7777-777777777771', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-aaaa-4000-8000-000000000527', 'B', '6:4', 'B-R6 · 4 игрока', 6, 2, 'completed', now() - interval '12 days 3 hours'),
  ('11111111-aaaa-4000-8000-000000000527', '77777777-7777-7777-7777-777777777771', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-aaaa-4000-8000-000000000528', 'A', '6:5', 'B-R7 · 2 игрока', 7, 1, 'completed', now() - interval '12 days 2 hours'),
  ('11111111-aaaa-4000-8000-000000000528', '77777777-7777-7777-7777-777777777771', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', NULL, '11111111-aaaa-4000-8000-000000000529', 'B', NULL, 'B-R8 · 2 игрока', 8, 1, 'live', now() - interval '12 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000529', '77777777-7777-7777-7777-777777777771', NULL, NULL, NULL, NULL, NULL, NULL, 'GF', 9, 1, 'scheduled', now() - interval '11 days 20 hours'),

  -- 88888888: swiss (8 players, 2 tours)
  ('11111111-aaaa-4000-8000-000000000401', '88888888-8888-8888-8888-888888888881', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, NULL, '4:0', 'SW R1', 1, 1, 'completed', now() + interval '30 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000402', '88888888-8888-8888-8888-888888888881', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'abababab-abab-abab-abab-abababababab', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, NULL, '4:2', 'SW R1', 1, 2, 'completed', now() + interval '30 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000403', '88888888-8888-8888-8888-888888888881', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'ffffffff-ffff-ffff-ffff-ffffffffffff', NULL, NULL, '2:4', 'SW R1', 1, 3, 'completed', now() + interval '30 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000404', '88888888-8888-8888-8888-888888888881', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL, NULL, '4:3', 'SW R1', 1, 4, 'completed', now() + interval '30 days 1 hour'),
  ('11111111-aaaa-4000-8000-000000000405', '88888888-8888-8888-8888-888888888881', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, NULL, NULL, NULL, 'SW R2', 2, 1, 'live', now() + interval '30 days 3 hours'),
  ('11111111-aaaa-4000-8000-000000000406', '88888888-8888-8888-8888-888888888881', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ffffffff-ffff-ffff-ffff-ffffffffffff', NULL, NULL, NULL, NULL, 'SW R2', 2, 2, 'scheduled', now() + interval '30 days 3 hours'),
  ('11111111-aaaa-4000-8000-000000000407', '88888888-8888-8888-8888-888888888881', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NULL, NULL, NULL, NULL, 'SW R2', 2, 3, 'scheduled', now() + interval '30 days 3 hours'),
  ('11111111-aaaa-4000-8000-000000000408', '88888888-8888-8888-8888-888888888881', 'abababab-abab-abab-abab-abababababab', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NULL, NULL, NULL, NULL, 'SW R2', 2, 4, 'scheduled', now() + interval '30 days 3 hours');

INSERT INTO news_posts (id, title, body, image_key, status, published_at)
VALUES
  ('51515151-5151-5151-5151-515151515151', 'Открыта регистрация на BilliardHub Kazakhstan Open', 'Турнир пройдет в Астане. Регистрация доступна для игроков со всех городов Казахстана.', 'news/kazakhstan-open-registration.jpg', 'published', now() - interval '3 hours'),
  ('52525252-5252-5252-5252-525252525252', 'Алматинская серия закрыла список участников', 'Almaty Spring Pyramid набрал сетку из 32 игроков. Посев доступен в разделе турнира.', 'news/almaty-series.jpg', 'published', now() - interval '1 day'),
  ('53535353-5353-5353-5353-535353535353', 'Новые клубы подключены к карте', 'В каталоге появились площадки из Алматы, Шымкента и Караганды.', 'news/kazakhstan-clubs.jpg', 'published', now() - interval '2 days'),
  ('54545454-5454-5454-5454-545454545454', 'Обновлен тренировочный дневник', 'Добавлены упражнения для разбоя, длинных ударов и позиционной игры.', 'news/training-diary.jpg', 'published', now() - interval '3 days'),
  ('56565656-5656-5656-5656-565656565656', 'Черновик: партнерская лига', 'Материал готовится к публикации.', NULL, 'draft', NULL);

INSERT INTO streams (id, title, youtube_video_id, status, starts_at)
VALUES
  ('61616161-6161-6161-6161-616161616161', 'Astana Friday League: финальный стол', 'dQw4w9WgXcQ', 'published', now() + interval '3 hours'),
  ('62626262-6262-6262-6262-626262626262', 'Almaty Spring Pyramid: жеребьевка', NULL, 'published', now() + interval '3 days'),
  ('63636363-6363-6363-6363-636363636363', 'Shymkent Cup Finals: запись финала', NULL, 'published', now() - interval '11 days'),
  ('64646464-6464-6464-6464-646464646464', 'Черновой эфир Karaganda Masters', NULL, 'draft', now() + interval '30 days');

INSERT INTO listings (id, user_id, title, description, category, price_cents, currency, status, image_keys)
VALUES
  ('71717171-7171-7171-7171-717171717171', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Кий Predator SP2, 19 oz', 'Игровой кий в отличном состоянии. Осмотр в Астане.', 'cues', 18500000, 'KZT', 'published', ARRAY['listings/predator-sp2.jpg']),
  ('72727272-7272-7272-7272-727272727272', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Тренировка по пирамиде в Алматы', 'Индивидуальный разбор техники, выходов и разбоя.', 'coaches', 1800000, 'KZT', 'published', ARRAY['listings/almaty-coach.jpg']),
  ('73737373-7373-7373-7373-737373737373', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Мел Taom V10, новая упаковка', 'Оригинальный мел, есть 6 штук.', 'chalk', 520000, 'KZT', 'published', ARRAY['listings/taom-v10.jpg']),
  ('74747474-7474-7474-7474-747474747474', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Чехол 2x4 кожа', 'Чехол для двух киев и аксессуаров.', 'cases', 3400000, 'KZT', 'published', ARRAY['listings/case-2x4.jpg']),
  ('75757575-7575-7575-7575-757575757575', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Стол 12 футов под заказ', 'Доставка и установка по Казахстану.', 'tables', 148000000, 'KZT', 'published', ARRAY['listings/table-12ft.jpg']),
  ('76767676-7676-7676-7676-767676767676', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Комплект шаров Aramith', 'Комплект для русской пирамиды, состояние хорошее.', 'misc', 8800000, 'KZT', 'published', ARRAY['listings/aramith-set.jpg']),
  ('77777777-7777-7777-7777-777777777772', 'dededede-dede-dede-dede-dededededede', 'Кий ручной работы', 'Мастерская Атырау, вес 18.7 oz.', 'cues', 7600000, 'KZT', 'moderation', ARRAY['listings/atyrau-cue.jpg']);

INSERT INTO products (id, title, description, price_cents, currency, status, image_key)
VALUES
  ('81818181-8181-8181-8181-818181818181', 'Перчатка BilliardHub Pro', 'Перчатка для турниров и регулярных тренировок.', 690000, 'KZT', 'published', 'products/glove-pro.jpg'),
  ('82828282-8282-8282-8282-828282828282', 'Мел Taom V10', 'Профессиональный мел для пирамиды и пула.', 520000, 'KZT', 'published', 'products/taom-v10.jpg'),
  ('83838383-8383-8383-8383-838383838383', 'Наклейка Kamui Black M', 'Средняя жесткость, контроль и стабильность.', 420000, 'KZT', 'published', 'products/kamui-black-m.jpg'),
  ('84848484-8484-8484-8484-848484848484', 'Чехол для кия 1x1', 'Легкий чехол для городских тренировок.', 2400000, 'KZT', 'published', 'products/cue-case-1x1.jpg'),
  ('85858585-8585-8585-8585-858585858585', 'Набор для ухода за кием', 'Полотенце, полироль и щетка.', 310000, 'KZT', 'published', 'products/cue-care.jpg'),
  ('86868686-8686-8686-8686-868686868686', 'Черновик: турнирная форма', 'Будет опубликовано после согласования размеров.', 990000, 'KZT', 'draft', 'products/team-shirt.jpg');

INSERT INTO training_templates (id, title, target, metric, sort_order, status)
VALUES
  ('91919191-9191-9191-9191-919191919191', 'Разбой пирамиды', '60 разбоев, фиксация позиции битка', 'успешный разбой, забитые, фол', 10, 'published'),
  ('92929292-9292-9292-9292-929292929292', 'Чужой прямой удар', '50 чужих прямых ударов с дистанции 1,8 м', 'процент попаданий', 20, 'published'),
  ('93939393-9393-9393-9393-939393939393', 'Свояк, скат с точки', 'серия контрольных свояков со скатом с точки', 'точность свояка и контроль битка', 30, 'published'),
  ('94949494-9494-9494-9494-949494949494', 'Свояк в отскок', '30 свояков через отскок от борта', 'точность и контроль силы', 40, 'published'),
  ('95959595-9595-9595-9595-959595959595', 'Чужой на резке', '40 чужих на резке с разных углов', 'точность резки и позиция битка', 50, 'published'),
  ('96969696-9696-9696-9696-969696969696', 'Черновик: серия на время', 'будет опубликовано после теста', 'скорость серии', 60, 'draft');

INSERT INTO training_metrics (id, label, value, detail, sort_order, status)
VALUES
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'Средняя точность', '71%', '+8% за месяц по активным игрокам', 10, 'published'),
  ('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2', 'Максимальная серия', '14', 'цель сезона: 18 шаров', 20, 'published'),
  ('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3', 'Разбой без фола', '67%', 'учитываются последние 200 попыток', 30, 'published'),
  ('a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4', 'Тренировочные часы', '126', 'суммарно по клубным группам', 40, 'published');

INSERT INTO training_sessions (
  id,
  template_id,
  player_name,
  title,
  discipline,
  focus,
  duration_minutes,
  drills,
  mood_score,
  notes,
  trained_at
)
VALUES
  (
    '41414141-4141-4141-4141-414141414141',
    '91919191-9191-9191-9191-919191919191',
    'Айбар Сулеймен',
    'Контрольный разбой и выход',
    'Пирамида',
    'Разбой без фола',
    85,
    '[{"label":"Разбой пирамиды","made":32,"total":50},{"label":"Свояк, скат с точки","made":18,"total":30},{"label":"Чужой прямой удар","made":21,"total":35}]'::jsonb,
    8,
    'Биток чаще остается в центре. На длинных ударах проседает темп.',
    now() - interval '1 day'
  ),
  (
    '42424242-4242-4242-4242-424242424242',
    '92929292-9292-9292-9292-929292929292',
    'Аружан Есен',
    'Длинная дистанция',
    'Пирамида',
    'Точность',
    70,
    '[{"label":"Прямой длинный","made":28,"total":40},{"label":"Резка в угол","made":19,"total":30},{"label":"Контроль силы","made":22,"total":30}]'::jsonb,
    7,
    'Лучше работает пауза перед ударом. Добавить видеоразбор стойки.',
    now() - interval '3 days'
  );

INSERT INTO duels (id, challenger_id, opponent_id, club_id, status, score, winner_id, rating_delta, scheduled_at)
VALUES
  ('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'scheduled', NULL, NULL, NULL, now() + interval '1 day'),
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'completed', '7:5', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 18, now() - interval '2 days'),
  ('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '55555555-5555-5555-5555-555555555551', 'pending', NULL, NULL, NULL, now() + interval '3 days'),
  ('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4', 'abababab-abab-abab-abab-abababababab', 'bcbcbcbc-bcbc-bcbc-bcbc-bcbcbcbcbcbc', '22222222-2222-2222-2222-222222222222', 'live', '2:1', NULL, NULL, now());

INSERT INTO orders (id, user_id, product_id, status, quantity, total_cents, currency)
VALUES
  ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '81818181-8181-8181-8181-818181818181', 'paid', 1, 690000, 'KZT'),
  ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '82828282-8282-8282-8282-828282828282', 'confirmed', 2, 1040000, 'KZT'),
  ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '83838383-8383-8383-8383-838383838383', 'new', 1, 420000, 'KZT');

INSERT INTO push_tokens (id, user_id, expo_push_token, platform, enabled)
VALUES
  ('d1d1d1d1-d1d1-d1d1-d1d1-d1d1d1d1d1d1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ExponentPushToken[kz-aibar-demo]', 'ios', TRUE),
  ('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ExponentPushToken[kz-daniyar-demo]', 'android', TRUE),
  ('d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ExponentPushToken[kz-aruzhan-demo]', 'ios', FALSE);

INSERT INTO push_campaigns (id, title, body, target, status, sent_at)
VALUES
  ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'Регистрация открыта', 'BilliardHub Kazakhstan Open уже доступен для заявок.', 'players:all', 'published', now() - interval '3 hours'),
  ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'Напоминание о финальном столе', 'Сегодня вечером смотрите финал Astana Friday League.', 'city:Астана', 'draft', NULL);
