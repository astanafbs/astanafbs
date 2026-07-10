# BilliardHUB

React Native + Expo платформа для бильярдного сообщества Казахстана.

Проект состоит из трех частей:

- mobile app: Expo / React Native / Tamagui / Expo Router;
- backend API: Node.js / Fastify / PostgreSQL / S3-compatible storage;
- admin panel: Next.js web-приложение для управления контентом.

## Dev / Production запуск

Dev mobile iOS:

```bash
cd /Users/akhanbakhitov/Documents/astanafbs
npm install
npm run ios:dev-build
npm run ios:metro
```

Если приложение не открылось само, во втором терминале:

```bash
npm run ios:open
```

Dev backend, DB и storage:

```bash
cp .env.example .env
npm run infra:up
npm run api:dev
```

Dev admin panel:

```bash
npm run admin:dev
```

Production проверка и сборки:

```bash
npm run check
npm run build:apk:android
npm run build:prod:ios
npm run build:prod:android
```

Перед production нужны реальные Firebase config files, EAS project id,
Google Auth client IDs, Apple Developer / Google Play аккаунты и production API URL.

## Быстрый запуск mobile на iOS Simulator

Требования:

- macOS;
- Xcode с iOS Simulator;
- Node.js;
- CocoaPods;
- установленные зависимости `npm install`.

Первый запуск или запуск после native-изменений:

```bash
cd /Users/akhanbakhitov/Documents/astanafbs
npm install
npm run ios:dev-build
```

Если development build уже установлен в симулятор:

```bash
cd /Users/akhanbakhitov/Documents/astanafbs
npm run ios:metro
```

Потом в открытом приложении `BilliardHUB Development Build` нажать сервер:

```text
http://localhost:8081
```

Или открыть установленный dev build из второго терминала:

```bash
npm run ios:open
```

Если Simulator завис, пишет `Unable to boot device in current state: Booted`
или падает с `Mach error -308`, сбросьте Simulator и заново установите dev build:

```bash
npm run ios:reset-sim
npm run ios:dev-build
```

`npm run ios:metro` только запускает Metro. Если приложение еще не установлено
в Simulator, сначала нужен `npm run ios:dev-build`.

## Запуск Android

Нужен Android Studio и запущенный emulator.

```bash
cd /Users/akhanbakhitov/Documents/astanafbs
npm install
npm run android
```

## Запуск backend, DB и storage

Локальная инфраструктура поднимает PostgreSQL, MinIO и Adminer.

```bash
cd /Users/akhanbakhitov/Documents/astanafbs
cp .env.example .env
npm run infra:up
npm run infra:ps
```

Адреса:

- PostgreSQL: `localhost:5433`;
- Adminer: `http://localhost:8080`;
- MinIO API: `http://localhost:9000`;
- MinIO Console: `http://localhost:9001`;
- MinIO bucket: `fbs-astana`.

Backend API локально:

```bash
npm run api:dev
```

API будет на:

```text
http://localhost:3000
```

Admin API защищен заголовком:

```text
x-admin-token: dev-admin-token
```

## Запуск admin panel

```bash
cd /Users/akhanbakhitov/Documents/astanafbs
npm run admin:dev
```

Admin panel будет на:

```text
http://localhost:3001
```

## Проверки

Полная локальная проверка:

```bash
npm run check
```

Отдельно:

```bash
npx tsc --noEmit
npm run api:check
npm run admin:check
npx expo-doctor
npx expo export --platform ios --output-dir dist/ios-test
```

## Google авторизация

В коде подключены `@react-native-firebase/auth` и
`@react-native-google-signin/google-signin`.

Для настоящего Google login нужно:

1. Создать Firebase project.
2. Включить `Authentication -> Sign-in method -> Google`.
3. Добавить iOS app с bundle id `kz.fbsastana.app`.
4. Добавить Android app с package `kz.fbsastana.app`.
5. Скачать настоящий `GoogleService-Info.plist` и положить в корень проекта.
6. Скачать настоящий `google-services.json` и положить в корень проекта.
7. Заполнить `.env`:

```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
```

Сейчас без реальных ключей приложение не падает, но Google login показывает
состояние “не настроено”.

## Push-уведомления

В mobile app подключен `expo-notifications`.

Для production push нужно:

```bash
npx eas-cli@latest init
```

Потом заполнить:

```bash
EXPO_PUBLIC_EAS_PROJECT_ID=
```

Важно:

- iOS push тестируется на реальном устройстве, не на iOS Simulator;
- для iOS нужен Apple Developer Account и APNs key;
- для Android нужны FCM V1 credentials в Expo/EAS.

## Production builds

```bash
npm run build:prod:ios
npm run build:prod:android
```

Development builds:

```bash
npm run build:dev:ios
npm run build:dev:android
```

## Что есть сейчас по факту

Mobile app:

- приложение называется `BilliardHUB`;
- bundle id/package: `kz.fbsastana.app`;
- splash screen использует полноэкранную картинку `assets/previewlogo.png`;
- Expo Router навигация с нижними табами;
- основные табы: Главная, Турниры, Рейтинг, Дуэли, Профиль;
- базовый дизайн на Tamagui и shared UI компонентах;
- главная страница с приветствием, счетчиками, ближайшими событиями и быстрой навигацией;
- турниры: список, фильтр-модалка, карточка турнира, детали, игроки, сетка, матчи, регистрация;
- рейтинг: общий список игроков и карточки игроков;
- дуэли: список, история, создание вызова через modal route;
- профиль: данные игрока, история, рейтинг, настройки;
- дополнительные разделы: клубы, трансляции, объявления, тренировочный дневник;
- legal pages: Privacy Policy и Terms of Use;
- на регистрации и заявке на турнир есть ссылки на Privacy Policy и Terms of Use;
- интерфейс берет бизнес-данные из backend API; стартовые данные лежат в PostgreSQL seed.

Backend API:

- Fastify API;
- PostgreSQL connection;
- dev-auth режим для локальной разработки;
- endpoints для пользователя, профиля, турниров, регистраций, рейтинга, дуэлей;
- endpoints для клубов, трансляций, объявлений, товаров, новостей и тренировочного дневника;
- presigned upload flow под S3-compatible storage;
- admin endpoints для dashboard summary и CRUD-разделов;
- заготовка под Firebase token verification.

Admin panel:

- Next.js приложение;
- dashboard;
- страницы управления турнирами, новостями, пользователями, клубами, объявлениями, товарами, матчами, тренировочным дневником и push campaigns;
- подключение к backend через `API_INTERNAL_URL` / `NEXT_PUBLIC_API_URL`;
- admin token через `ADMIN_API_TOKEN`.

Infrastructure:

- Docker Compose для PostgreSQL, MinIO, Adminer;
- init schema для PostgreSQL;
- миграции для существующей базы: `npm run db:migrate`;
- MinIO bucket создается автоматически;
- `.env.example` содержит локальные переменные.

## Что пока не production-ready

- нужны реальные Firebase config files;
- нужен реальный EAS project id;
- push-рассылку нужно связать с Expo Push Service на backend/admin уровне;
- bill4you.ru пока не подключен, рейтинг работает на локальной модели/моках;
- платежи магазина не подключены;
- юридические тексты базовые, перед публикацией их лучше проверить юристом.
