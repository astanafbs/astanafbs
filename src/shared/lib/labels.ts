export const tournamentStatusLabels: Record<string, string> = {
  draft: 'Черновик',
  registration_open: 'Регистрация',
  registration_closed: 'Закрыто',
  in_progress: 'Идет',
  completed: 'Завершен',
  cancelled: 'Отменен',
};

export const tournamentFormatLabels: Record<string, string> = {
  single_elimination: 'Олимпийская сетка',
  double_elimination: 'Double elimination',
  round_robin: 'Круговая лига',
  group_playoff: 'Группы + плей-офф',
  swiss: 'Швейцарка',
};

export const listingCategoryLabels: Record<string, string> = {
  coaches: 'Тренера',
  cues: 'Кии',
  chalk: 'Мелки',
  cases: 'Чехлы',
  tables: 'Столы',
  misc: 'Разное',
};

export const contentStatusLabels: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликовано',
  archived: 'Архив',
  moderation: 'Модерация',
};

export function labelFor(map: Record<string, string>, value?: string | null) {
  if (!value) return '-';
  return map[value] ?? value;
}
