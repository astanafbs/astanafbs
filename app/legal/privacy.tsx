import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, SectionHeader, typography } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';

const sections = [
  {
    title: 'Какие данные обрабатываются',
    body:
      'BilliardHUB может обрабатывать имя, фото профиля, город, клуб, рейтинг, историю игр, заявки на турниры, объявления, заказы, push-токены и технические данные устройства.',
  },
  {
    title: 'Для чего используются данные',
    body:
      'Данные нужны для входа через Google, ведения профиля игрока, регистрации на турниры, рейтингов, дуэлей, уведомлений, работы объявлений, магазина и поддержки пользователей.',
  },
  {
    title: 'Сторонние сервисы',
    body:
      'В приложении могут использоваться Google Sign-In, YouTube, аналитика, push-уведомления и серверы BilliardHUB. Эти сервисы могут обрабатывать данные по своим правилам.',
  },
  {
    title: 'Хранение и безопасность',
    body:
      'Данные хранятся только в объеме, необходимом для работы сервиса. Мы применяем технические меры защиты, ограничиваем доступ к административным функциям и используем защищенные каналы передачи данных.',
  },
  {
    title: 'Права пользователя',
    body:
      'Пользователь может запросить уточнение, исправление или удаление персональных данных, а также отказаться от уведомлений в настройках устройства или приложения.',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <Screen title="Privacy Policy" eyebrow="Юридическая часть">
      <Card tone="dark">
        <Text {...typography.inverseTitle}>Политика конфиденциальности</Text>
        <Text {...typography.inverseBody}>Дата обновления: 8 мая 2026</Text>
      </Card>

      {sections.map((section) => (
        <Card key={section.title}>
          <Text {...typography.title}>{section.title}</Text>
          <Text {...typography.body} selectable>
            {section.body}
          </Text>
        </Card>
      ))}

      <SectionHeader title="Контакты" />
      <Card>
        <Text color={colors.textPrimary} fontSize={15} lineHeight={22} fontWeight="600" selectable>
          BilliardHUB / FBS Kazakhstan
        </Text>
        <Text color={colors.textMuted} fontSize={14} lineHeight={22} marginTop={spacing.sm} selectable>
          +7 777 635 54 15{'\n'}Астана, ул. Тауелсыздык 21/5{'\n'}info@fbs.kz
        </Text>
      </Card>
    </Screen>
  );
}
