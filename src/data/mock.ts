export const news = [
  {
    id: '77777777-7777-7777-7777-777777777777',
    title: 'Открыта регистрация на BilliardHUB Astana Open',
    meta: 'Сегодня',
    tag: 'Турниры',
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    title: 'Прямые трансляции финалов будут доступны на YouTube',
    meta: 'Вчера',
    tag: 'Трансляции',
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    title: 'Клубы Астаны, Алматы и Шымкента обновили расписание',
    meta: '2 дня назад',
    tag: 'Клубы',
  },
];

export const banners = [
  {
    id: 'banner-1',
    title: 'BilliardHUB Astana Open',
    subtitle: '18 мая, Astana Billiard Club',
    cta: 'Регистрация открыта',
  },
  {
    id: 'banner-2',
    title: 'Дуэль недели',
    subtitle: 'Вызови игрока и подними рейтинг',
    cta: 'Создать вызов',
  },
];

export const quickActions = [
  { title: 'Турниры', href: '/tournaments', subtitle: 'Сетка и результаты', icon: 'tournament' },
  { title: 'Клубы', href: '/clubs', subtitle: 'Площадки Казахстана', icon: 'clubPin' },
  { title: 'Дуэли', href: '/duels', subtitle: 'Вызов игрока', icon: 'battleCueBalls' },
  { title: 'Магазин', href: '/shop', subtitle: 'Инвентарь', icon: 'shop' },
  { title: 'Объявления', href: '/listings', subtitle: 'Продажа и услуги', icon: 'listing' },
  { title: 'Трансляции', href: '/streams', subtitle: 'YouTube эфиры', icon: 'stream' },
];

export const tournaments = [
  {
    id: '44444444-4444-4444-4444-444444444444',
    title: 'BilliardHUB Astana Open',
    date: '18 мая',
    fullDate: '18 мая, 10:00',
    place: 'Astana Billiard Club',
    location: 'Астана, пр. Кабанбай Батыра, 46',
    fee: '10 000 ₸',
    status: 'Регистрация открыта',
    players: 24,
    maxPlayers: 32,
    prize: '500 000 ₸',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    title: 'Лига ветеранов Казахстана',
    date: '25 мая',
    fullDate: '25 мая, 12:00',
    place: 'Qazaq Billiards',
    location: 'Астана, ул. Сыганак, 18',
    fee: '7 000 ₸',
    status: '12 участников',
    players: 12,
    maxPlayers: 24,
    prize: '250 000 ₸',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    title: 'Almaty Summer Cup Qualifier',
    date: '2 июня',
    fullDate: '2 июня, 11:00',
    place: 'BilliardHUB Almaty',
    location: 'Алматы, пр. Абая, 150',
    fee: '15 000 ₸',
    status: 'Скоро',
    players: 8,
    maxPlayers: 32,
    prize: '700 000 ₸',
  },
];

export const players = [
  { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Алексей Иванов', score: 1840, club: 'Astana Billiard Club', trend: '+24' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'Ерлан Сапаров', score: 1795, club: 'Qazaq Billiards', trend: '+12' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'Данияр Ахметов', score: 1730, club: 'BilliardHUB Almaty', trend: '-5' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', name: 'Руслан Ким', score: 1690, club: 'Shymkent Billiards', trend: '+8' },
];

export const clubs = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Astana Billiard Club', address: 'Астана, пр. Кабанбай Батыра, 46', tables: 12, status: 'Открыто' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Qazaq Billiards', address: 'Астана, ул. Сыганак, 18', tables: 9, status: 'Открыто' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'BilliardHUB Almaty', address: 'Алматы, пр. Абая, 150', tables: 16, status: 'Турнир сегодня' },
  { id: '33333333-4444-5555-6666-333333333333', name: 'Shymkent Billiards', address: 'Шымкент, ул. Байтурсынова, 72', tables: 10, status: 'Открыто' },
];

export const duels = [
  { id: '19191919-1919-1919-1919-191919191919', title: 'Ерлан Сапаров против Данияра Ахметова', score: '5:3', status: 'Завершено' },
  { id: '20202020-2020-2020-2020-202020202020', title: 'Алексей Иванов против Руслана Кима', score: 'ожидает', status: 'Подтверждение' },
];

export const streams = [
  { id: '12121212-1212-1212-1212-121212121212', title: 'BilliardHUB Astana Open: полуфиналы', time: '18 мая, 17:00', status: 'Запланировано' },
  { id: '13131313-1313-1313-1313-131313131313', title: 'Дуэль недели: стол 4', time: 'Сегодня, 20:00', status: 'Скоро эфир' },
];

export const listings = [
  { id: '14141414-1414-1414-1414-141414141414', title: 'Кий Predator SP2', price: '180 000 ₸', type: 'Продажа' },
  { id: '15151515-1515-1515-1515-151515151515', title: 'Индивидуальная тренировка', price: '15 000 ₸/час', type: 'Услуги' },
];

export const products = [
  { id: '16161616-1616-1616-1616-161616161616', title: 'Перчатка BilliardHUB Pro', price: '6 500 ₸', status: 'В наличии' },
  { id: '17171717-1717-1717-1717-171717171717', title: 'Мел Taom V10', price: '4 900 ₸', status: 'В наличии' },
  { id: '18181818-1818-1818-1818-181818181818', title: 'Чехол для кия', price: '32 000 ₸', status: 'Под заказ' },
];
