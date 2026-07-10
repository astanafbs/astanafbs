CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES training_templates(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL DEFAULT 'Игрок BilliardHUB',
  title TEXT NOT NULL,
  discipline TEXT NOT NULL DEFAULT 'Пирамида',
  focus TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  drills JSONB NOT NULL DEFAULT '[]'::jsonb,
  mood_score INTEGER NOT NULL DEFAULT 7,
  notes TEXT,
  trained_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_trained_at ON training_sessions(trained_at DESC);

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
  )
ON CONFLICT (id) DO UPDATE
SET template_id = EXCLUDED.template_id,
    player_name = EXCLUDED.player_name,
    title = EXCLUDED.title,
    discipline = EXCLUDED.discipline,
    focus = EXCLUDED.focus,
    duration_minutes = EXCLUDED.duration_minutes,
    drills = EXCLUDED.drills,
    mood_score = EXCLUDED.mood_score,
    notes = EXCLUDED.notes,
    trained_at = EXCLUDED.trained_at,
    updated_at = now();
