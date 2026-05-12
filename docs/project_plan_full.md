Общая концепция приложения
FBS Astana — современное спортивное приложение для бильярдного сообщества: игроки, турниры, рейтинги, клубы, дуэли, новости и трансляции.
Главная идея интерфейса:
чистый спортивный премиум-стиль без перегруза, с аккуратной бильярдной эстетикой.
Визуально приложение должно ощущаться так:


тёмно-зелёное сукно как основной фон;


молочный/ivory цвет как цвет шаров и карточек;


латунный/gold акцент для важных действий;


тёмное дерево/rail для нижней навигации и разделителей;


мягкие минималистичные анимации: движение шара, лёгкий roll, fade, slide;


никакого “казино-стиля”, перегруженных бликов и кислотных цветов.


2. Информационная архитектура
Основная навигация через bottom tabs:
Home          Tournaments          Rating          Duels          ProfileГлавная       Турниры              Рейтинг         Дуэли          Профиль
Дополнительные экраны открываются поверх табов через stack navigation:
Tournament DetailTournament RegistrationTournament PlayersTournament BracketTournament Match DetailPlayer ProfileClub DetailNews DetailStream DetailProduct DetailListing DetailSettingsEdit ProfileNotificationsLanguage
Рекомендуемая структура expo-router:
app/  _layout.tsx  index.tsx  (auth)/    _layout.tsx    welcome.tsx    sign-in.tsx    onboarding.tsx    complete-profile.tsx  (tabs)/    _layout.tsx    home/      index.tsx    tournaments/      index.tsx    rating/      index.tsx    duels/      index.tsx    profile/      index.tsx  tournaments/    [id]/      index.tsx      register.tsx      players.tsx      bracket.tsx      matches/        [matchId].tsx  players/    [id].tsx  clubs/    index.tsx    [id].tsx  news/    [id].tsx  streams/    index.tsx    [id].tsx  listings/    index.tsx    [id].tsx    create.tsx  shop/    index.tsx    [id].tsx  settings/    index.tsx    edit-profile.tsx    language.tsx    notifications.tsx  modals/    filter-tournaments.tsx    filter-rating.tsx    challenge-player.tsx    confirm-action.tsx
Лучше держать route-файлы тонкими, а бизнес-логику и UI выносить в src.
src/  app/    providers/      AppProviders.tsx      AuthProvider.tsx      QueryProvider.tsx      TamaguiProvider.tsx  shared/    ui/      Screen.tsx      AppHeader.tsx      Card.tsx      Button.tsx      IconButton.tsx      Badge.tsx      Avatar.tsx      EmptyState.tsx      ErrorState.tsx      Skeleton.tsx      BottomSheet.tsx      SegmentedControl.tsx      SearchInput.tsx      StatPill.tsx      InfoGrid.tsx    theme/      tamagui.config.ts      tokens.ts      animations.ts    lib/      api.ts      firebase.ts      storage.ts      formatDate.ts      i18n.ts      haptics.ts  entities/    user/    player/    tournament/    match/    club/    news/    duel/    rating/  features/    auth/    profile-edit/    tournament-register/    tournament-filters/    rating-filters/    duel-create/    push-token-sync/  widgets/    home/      HomeHero.tsx      QuickActions.tsx      UpcomingTournamentCard.tsx      NewsSection.tsx      LiveStreamsSection.tsx    tournaments/      TournamentCard.tsx      TournamentStatusChip.tsx      TournamentDetailHeader.tsx      TournamentTabs.tsx      RegistrationCTA.tsx      BracketPreview.tsx    rating/      RatingRow.tsx      RatingPodium.tsx      RatingFilters.tsx    duels/      DuelCard.tsx      ChallengeSheet.tsx    profile/      ProfileHeader.tsx      PlayerStats.tsx      MatchHistory.tsx
3. Дизайн-система Tamagui
Цветовая тема
export const colors = {  felt900: '#041F18',      // глубокий фон  felt800: '#063327',  felt700: '#0B4A39',      // сукно  felt600: '#0F6B50',  rail900: '#1B100B',      // дерево / борта стола  rail800: '#2A1810',  ivory50: '#FFFDF7',      // шар / светлые поверхности  ivory100: '#F7F0E3',  ivory200: '#E8DDC8',  chalk300: '#A8C7D6',     // мел / холодный акцент  chalk500: '#6F9FB3',  brass400: '#D6B56D',     // премиум-акцент  brass500: '#C89B3C',  brass600: '#A77924',  red500: '#D84A4A',  blue500: '#3C7DD9',  yellow500: '#E6C84F',  success500: '#42B883',  warning500: '#E5A93D',  danger500: '#E05252',  textPrimary: '#FFFDF7',  textSecondary: '#B8C7C0',  textMuted: '#7F938B',  cardDark: '#08291F',  cardLight: '#FFF9EC',  borderSoft: 'rgba(255,255,255,0.10)',};
Радиусы, отступы, тени
export const radii = {  xs: 8,  sm: 12,  md: 16,  lg: 22,  xl: 28,  full: 999,};export const spacing = {  1: 4,  2: 8,  3: 12,  4: 16,  5: 20,  6: 24,  8: 32,  10: 40,};export const shadows = {  card: {    shadowColor: '#000',    shadowOpacity: 0.18,    shadowRadius: 18,    shadowOffset: { width: 0, height: 8 },    elevation: 5,  },};
Типографика
Стиль: спортивный, аккуратный, без тяжёлых декоративных шрифтов.
Display / Hero: 28–34, semiboldScreen Title: 24–28, semiboldSection Title: 18–20, semiboldBody: 15–16, regularCaption: 12–13, mediumStat Number: 24–32, semibold
В интерфейсе лучше использовать короткие заголовки:
Ближайшие турнирыТоп рейтингаМои дуэлиПоследние новостиПрямой эфир
4. Motion system: минималистичные анимации
Анимации должны быть быстрыми, нативными и не мешать.
export const motion = {  fast: 120,  base: 220,  slow: 360,  easing: {    standard: 'cubic-bezier(0.2, 0, 0, 1)',    emphasized: 'cubic-bezier(0.2, 0, 0, 1)',  },};
Где использовать анимации
Splash
Идея: логотип FBS появляется на фоне сукна, тонкая линия кия проходит слева направо, маленький шар мягко вкатывается в точку логотипа.
Состояния:
loading assetschecking authsyncing user with backendreadyerror
Bottom tabs
При нажатии на таб:
icon scale 0.96 -> 1.04 -> 1label fade inмаленький highlight как отражение шара
Для активного таба можно использовать круглый ivory-indicator, напоминающий бильярдный шар.
Карточки
Карточки появляются через:
opacity 0 -> 1translateY 8 -> 0duration 180–220ms
Турнирная регистрация
При успешной регистрации:
bottom sheet закрываетсяCTA меняется на "Вы зарегистрированы"маленький success-ball animationлёгкий haptic feedback
Рейтинг
При изменении позиции:
позиция плавно подсвечиваетсячисло рейтинга анимируетсястрелка вверх/вниз появляется через fade
Дуэли
При создании вызова:
sheet с игрокомвыбор клуба/датыsubmitкарточка появляется в списке "Ожидает ответа"
5. Экран запуска и авторизация
app/index.tsx
Это не экран для пользователя, а gate.
Логика:
1. Показать Splash.2. Проверить Firebase Auth user.3. Если user отсутствует -> /welcome.4. Если user есть -> получить /me с backend.5. Если backend user не создан -> POST /auth/firebase.6. Если профиль неполный -> /complete-profile.7. Если всё ок -> /(tabs)/home.
Welcome Screen
Задача: быстро объяснить ценность приложения.
Компоненты:
BilliardHeroVisualLanguageSwitchPrimaryButton "Войти через Google"SecondaryButton "Посмотреть турниры"
Визуал:
тёмное сукноминималистичный стол сверху3 шара как navigation dotsлоготип FBS
Sign In
Основной способ — Google Sign-In через Firebase.
Состояния:
idleloadingfirebase_errorbackend_sync_errorsuccess
Важно: ошибка backend sync не должна оставлять пользователя в сломанном состоянии. Нужно либо повторить синхронизацию, либо дать кнопку “Повторить”.
Complete Profile
После первого входа:
photonamecityclub optionaldominant hand optionalpreferred discipline optional
CTA:
Сохранить профиль
Состояния:
validinvalidsavingsavederror
6. Главная страница
Route:
/(tabs)/home
Цель: дать быстрый обзор всего важного.
Структура:
HomeHeader  приветствие  avatar  notification iconHeroBanner  ближайший крупный турнир / новость / liveQuickActions  Турниры  Клубы  Дуэли  Магазин  Объявления  ТрансляцииUpcomingTournaments  2–3 карточкиRatingPreview  топ-3 игрокаNewsSection  последние новостиLiveStreamsSection  если есть активные трансляции
HomeHeader
<HomeHeader  title="Салам, Арман"  subtitle="Готов к следующей партии?"  avatarUrl={user.photoUrl}/>
QuickActions
Кнопки лучше делать не квадратными “иконками”, а мягкими pill-card:
🎱 Турниры🏆 Рейтинг⚔️ Дуэли📍 Клубы▶️ Эфиры🛒 Shop
Состояния Home
loading:  skeleton hero  skeleton quick actions  skeleton cardsempty:  "Пока нет активных событий"  CTA "Посмотреть архив турниров"error:  "Не удалось загрузить главную"  CTA "Повторить"offline:  показываем кэш  сверху маленький banner "Нет соединения"
7. Турниры
Route:
/(tabs)/tournaments
Это один из главных разделов.
Структура экрана
AppHeader "Турниры"SearchInputSegmentedControl:  Активные  Скоро  АрхивFilterBar:  Город  Клуб  Дисциплина  ДатаTournamentList
TournamentCard
Карточка должна сразу отвечать на вопросы:
название турнирастатусдатаклубдисциплинавзнос / призовой фондколичество участниковможно ли зарегистрироваться
Пример:
┌──────────────────────────────┐│ Открытый кубок Астаны         ││ ● Регистрация открыта         ││ 12 мая · FBS Club             ││ Пирамида · 24/32 игрока       ││                              ││ [Зарегистрироваться]          │└──────────────────────────────┘
Статусы турнира
В PostgreSQL и API желательно держать явные статусы:
type TournamentStatus =  | 'draft'  | 'published'  | 'registration_open'  | 'registration_closed'  | 'live'  | 'finished'  | 'cancelled';
UI-маппинг:
registration_open     green chip      "Регистрация открыта"registration_closed   muted chip      "Регистрация закрыта"live                  red/active chip "Идёт сейчас"finished              gray chip       "Завершён"cancelled             danger chip     "Отменён"
8. Детальная страница турнира
Route:
/tournaments/[id]
Структура
TournamentDetailHeader  cover image  title  status  date  club  disciplineStickyRegistrationCTATournamentInfoGrid  дата  место  участники  взнос  призовой фонд  организаторTournamentTabs  Обзор  Игроки  Сетка  Матчи  Новости
Sticky CTA
CTA должен быть видимым, но не мешать.
Состояния кнопки:
not_authenticated:  "Войти для регистрации"registration_open + not_registered:  "Зарегистрироваться"registration_open + registered:  "Вы зарегистрированы"registration_closed:  "Регистрация закрыта"live:  "Смотреть матчи"finished:  "Итоги турнира"cancelled:  "Турнир отменён"
Регистрация на турнир
Route:
/tournaments/[id]/register
Лучше открывать как modal/bottom sheet.
Структура:
TournamentMiniSummaryPlayerProfilePreviewRegistrationRulesOptionalCommentConfirmCheckboxPrimaryButton
Логика:
1. Проверить auth.2. Проверить заполненность профиля.3. Проверить registration_open.4. Проверить лимит участников.5. Проверить, что пользователь ещё не зарегистрирован.6. POST /tournaments/:id/register.7. Optimistic update.8. Success state.
Ошибки:
profile_incomplete:  "Заполните профиль перед регистрацией"already_registered:  "Вы уже зарегистрированы"tournament_full:  "Мест больше нет"registration_closed:  "Регистрация уже закрыта"network_error:  "Не удалось отправить заявку"
9. Игроки турнира
Route:
/tournaments/[id]/players
Компоненты:
SearchInputRegisteredPlayerRowPlayerSeedBadgeClubBadgeRegistrationStatusChip
Состояния регистрации:
type RegistrationStatus =  | 'pending'  | 'confirmed'  | 'waitlist'  | 'cancelled'  | 'rejected';
UI:
confirmed   "Подтверждён"pending     "Ожидает"waitlist    "Лист ожидания"cancelled   "Отменено"rejected    "Отклонено"
10. Турнирная сетка
Route:
/tournaments/[id]/bracket
Для MVP можно сделать placeholder, но правильно заложить структуру.
MVP Bracket
BracketPlaceholder  "Сетка появится после жеребьёвки"  дата жеребьёвки, если есть
Позже
горизонтальный scrollpinch/zoomround columnsmatch cardshighlight current playertap на матч -> match detail
MatchCard
Round 1Игрок A      5Игрок B      3Статус: завершён
Статусы матча:
type MatchStatus =  | 'scheduled'  | 'live'  | 'awaiting_result'  | 'confirmed'  | 'disputed'  | 'finished'  | 'cancelled';
11. Рейтинг
Route:
/(tabs)/rating
Структура
AppHeader "Рейтинг"RatingPodium top 3SearchInputFilters:  Общий  По клубам  По дисциплине  Месяц / сезон / всё времяRatingList
RatingRow
позицияavatarимя игрокагород / клубrating pointstrend
Пример:
#12  Арман С.      FBS Club      1840 ↑
Состояния рейтинга
loading:  skeleton rowsempty:  "Рейтинг пока формируется"error:  "Не удалось загрузить рейтинг"offline:  показываем последний кэш
Переход
Tap на игрока:
/players/[id]
Переход — стандартный stack push. Avatar можно визуально сохранить через shared-element-подобный эффект, но без тяжёлой зависимости можно сделать обычный fade/scale header.
12. Профиль игрока
Route:
/players/[id]
И собственный профиль:
/(tabs)/profile
Структура
ProfileHeader  avatar  name  city  club  rating  rankPlayerStats  игры  победы  win rate  турниры  текущая серияProfileActions  Вызвать на дуэль  Поделиться  Написать / контакты, если разрешеноTabs:  Матчи  Турниры  Достижения
Для своего профиля:
Edit ProfileSettingsMy RegistrationsMy DuelsPush PreferencesLogout
Состояния профиля
own_profileother_player_profileprivate_profileincomplete_profileloadingerror
13. Дуэли
Route:
/(tabs)/duels
Дуэли — отдельная спортивная механика.
Структура
AppHeader "Дуэли"PrimaryButton "Создать вызов"SegmentedControl:  Активные  Ожидают  ИсторияDuelList
DuelCard
Игрок A vs Игрок Bстатусклубдата/времядисциплинарезультат, если есть
Статусы дуэли
type DuelStatus =  | 'draft'  | 'sent'  | 'accepted'  | 'declined'  | 'expired'  | 'scheduled'  | 'result_pending'  | 'result_submitted'  | 'confirmed'  | 'cancelled';
Создание дуэли
Лучше через bottom sheet:
1. Выбрать игрока.2. Выбрать дисциплину.3. Выбрать клуб.4. Предложить дату/время.5. Отправить вызов.
Состояния:
selecting_playerselecting_detailsconfirmingsubmittingsuccesserror
14. Клубы
Route:
/clubs/clubs/[id]
Клубы можно сделать как вторичный раздел с Home Quick Action.
ClubCard
фотоназваниеадресрейтинг клубаколичество столовоткрыто/закрыто
Club Detail
cover imageназваниеадрескартаконтактырасписаниетурниры клубаигроки клуба
Переход к карте лучше открывать через native maps.
15. Новости
Route:
/news/[id]
NewsCard
imagecategorytitledateshort excerpt
News Detail
imagetitledatecontentrelated tournamentsshare button
Анимация: карточка новости раскрывается в detail через fade + image parallax.
16. Streams
Route:
/streams/streams/[id]
StreamCard
previewLIVE badgetitletournamentviewer count optional
Состояния:
livescheduledended
В detail — YouTube player или external open fallback.
17. Listings
Route:
/listings/listings/[id]/listings/create
ListingCard
фотоназваниеценагородтип: продажа / услуга
Для MVP создание объявления можно закрыть авторизацией и модерацией через admin.
18. Shop
Route:
/shop/shop/[id]
ProductCard
фотоназваниеценаналичие
Order draft без полноценной оплаты на MVP:
"Оставить заявку"
19. Глобальные UI-компоненты
Screen
Единая обёртка для всех экранов:
<Screen  preset="scroll"  background="felt"  safeArea  loading={isLoading}  error={error}>  {children}</Screen>
Варианты:
type ScreenPreset = 'fixed' | 'scroll' | 'list';type ScreenBackground = 'felt' | 'light' | 'gradient';
Card
<Card variant="dark" pressable>  ...</Card>
Варианты:
dark      для основных экрановlight     для контента на светлом фонеglass     для hero/banneroutlined  для вторичных блоков
Button
primary    brass/goldsecondary  transparent + borderghost      без фонаdanger     для отменыsuccess    подтверждение
Размеры:
smmdlg
Состояния:
defaultpressedloadingdisabledsuccess
Badge
statusdisciplineclubranklive
EmptyState
Должен быть тематическим, но минимальным:
иконка шара / киязаголовоккороткое описаниеoptional CTA
Пример:
Пока нет турнировКогда появятся новые события, они будут здесь.[Обновить]
ErrorState
Что-то пошло не такПроверьте интернет и попробуйте снова.[Повторить]
20. Нативные переходы экранов
Bottom tabs
Tab navigation должна быть постоянной только для основных разделов.
HomeTournamentsRatingDuelsProfile
Stack push
Использовать для detail-экранов:
Tournament DetailPlayer DetailClub DetailNews DetailProduct DetailListing Detail
Анимация:
iOS: native slideAndroid: native material slide/fade
Modal / Bottom Sheet
Использовать для коротких действий:
регистрация на турнирфильтрысоздание дуэлиподтверждение отменывыбор языка
Fullscreen modal
Использовать для более сложных процессов:
редактирование профилясоздание объявления
21. Состояния приложения
Нужно заранее заложить нормальную state-модель, чтобы приложение не ломалось при плохом интернете.
Глобальные состояния
type AppState =  | 'booting'  | 'checking_auth'  | 'unauthenticated'  | 'syncing_user'  | 'profile_required'  | 'authenticated'  | 'offline'  | 'maintenance';
Data states для каждого экрана
type DataState<T> =  | { status: 'idle' }  | { status: 'loading' }  | { status: 'success'; data: T }  | { status: 'empty' }  | { status: 'error'; message: string }  | { status: 'refreshing'; data: T }  | { status: 'offline'; data?: T };
Mutations
Для действий:
type MutationState =  | 'idle'  | 'submitting'  | 'success'  | 'error';
Применять для:
регистрации на турнирсоздания дуэлисохранения профиляотправки push tokenзагрузки avatar
22. Работа с Firebase и backend
Firebase не должен быть главным источником бизнес-данных. Он отвечает за identity.
Правильная схема:
Mobile  -> Firebase Auth  -> получает Firebase ID token  -> отправляет token на backendBackend  -> Firebase Admin verify token  -> создаёт/обновляет users.firebase_uid  -> возвращает локального пользователя  -> все бизнес-данные идут через PostgreSQL
Auth flow
Google Sign-InFirebase Auth successPOST /auth/firebaseGET /mesync push tokenopen app
Push token flow
после loginrequest permissionget Expo Push TokenPOST /push-tokensstore in PostgreSQL
Важно: если push permission отклонён, приложение должно работать дальше.
23. API-клиент на мобильной стороне
Рекомендуемая структура:
src/shared/lib/api.tssrc/entities/tournament/api.tssrc/entities/player/api.tssrc/entities/news/api.tssrc/entities/duel/api.ts
Пример:
export async function apiFetch<T>(  path: string,  options?: RequestInit): Promise<T> {  const token = await getFirebaseIdToken();  const response = await fetch(`${API_URL}${path}`, {    ...options,    headers: {      'Content-Type': 'application/json',      Authorization: token ? `Bearer ${token}` : '',      ...options?.headers,    },  });  if (!response.ok) {    throw await normalizeApiError(response);  }  return response.json();}
Для списков и кэша желательно использовать TanStack Query:
useNewsQueryuseTournamentsQueryuseTournamentDetailQueryuseRatingsQueryusePlayerQueryuseMyProfileQuery
24. PostgreSQL-модель статусов
Минимально важные таблицы уже указаны в постановке: users, player_profiles, clubs, tournaments, tournament_registrations, matches, news_posts, push_tokens. 
Я бы добавил явные enum-поля:
tournaments.statustournament_registrations.statusmatches.statusduels.statusnews_posts.status
Пример:
CREATE TYPE tournament_status AS ENUM (  'draft',  'published',  'registration_open',  'registration_closed',  'live',  'finished',  'cancelled');
Это сильно упростит UI, потому что каждая карточка сможет надёжно отрисовать статус.
25. Языки: русский и казахский
Сразу заложить i18n-ключи:
rukk
Пример:
t('tournaments.title')t('tournaments.registrationOpen')t('profile.edit')t('duels.create')
Не хардкодить строки внутри компонентов.
Структура:
src/shared/lib/i18n/  index.ts  ru.ts  kk.ts
26. Bottom tab дизайн
Нижняя навигация:
высота: 72–82фон: rail900 / felt900borderTop: rgba(255,255,255,0.08)active: brass / ivoryinactive: muted
Иконки:
Home: минимальный дом / столTournaments: кубокRating: podiumDuels: crossed cuesProfile: ball/avatar
Активный элемент:
иконка в маленьком кругеlabel появляется плавно
27. Надёжность и качество
Обязательные вещи для production-like MVP:
1. Skeleton loading вместо пустого экрана.2. Pull-to-refresh на списках.3. Offline banner.4. Retry button на ошибках.5. Optimistic update для регистрации.6. Защита от double submit.7. Единый ErrorBoundary.8. Единый API error normalizer.9. SafeArea на всех экранах.10. Haptic feedback на важных действиях.11. Image fallback для avatar/banner.12. Deep link на tournament/player.13. Логи ошибок через Firebase Crashlytics или аналог позже.
28. Приоритет MVP-реализации
Лучший порядок разработки:
1. Design tokens Tamagui.2. App shell + expo-router.3. Auth gate.4. Home screen skeleton.5. Tournament list.6. Tournament detail.7. Registration flow.8. Profile.9. Rating.10. Push token sync.11. Duels basic.12. Clubs / Streams / Shop / Listings as secondary surfaces.
29. Итоговая UX-логика
Пользовательский сценарий должен быть таким:
Пользователь открывает приложение→ видит красивый splash→ входит через Google→ заполняет короткий профиль→ попадает на главную→ видит ближайшие турниры→ открывает турнир→ регистрируется→ получает понятный статус→ видит себя в списке участников→ следит за сеткой, матчами и рейтингом→ может вызвать другого игрока на дуэль
Главное: приложение должно ощущаться не как набор страниц, а как цельная спортивная платформа для бильярдного сообщества. Минималистичная тема сукна, аккуратные карточки, понятные статусы, нативные переходы и предсказуемые состояния сделают MVP визуально сильным и технически удобным для развития.