import { Text } from 'tamagui';

import { Screen } from '../../src/components/Screen';
import { Card, SectionHeader, typography } from '../../src/components/ui';
import { colors, spacing } from '../../src/theme';

const sections = [
  {
    title: 'Назначение сервиса',
    body:
      'BilliardHUB предоставляет цифровую платформу для бильярдных турниров, рейтингов, клубов, дуэлей, трансляций, объявлений, магазина и пользовательских профилей.',
  },
  {
    title: 'Аккаунт пользователя',
    body:
      'Пользователь отвечает за актуальность данных профиля, корректность заявок и действия, совершенные через его аккаунт. Вход может выполняться через Google.',
  },
  {
    title: 'Турниры и заявки',
    body:
      'Регистрация на турнир может требовать подтверждения организатором. Организатор вправе закрыть регистрацию, изменить расписание, отклонить заявку или отменить событие при необходимости.',
  },
  {
    title: 'Объявления и магазин',
    body:
      'Пользователь несет ответственность за достоверность объявлений, описаний товаров и услуг. Запрещены незаконные товары, спам, вводящая в заблуждение информация и чужие материалы без разрешения.',
  },
  {
    title: 'Ограничение ответственности',
    body:
      'BilliardHUB не гарантирует отсутствие технических сбоев, ошибок сторонних сервисов или изменений расписания клубов и турниров. Мы стараемся поддерживать данные актуальными и исправлять ошибки после обращения.',
  },
];

export default function TermsOfUseScreen() {
  return (
    <Screen title="Terms of Use" eyebrow="Юридическая часть">
      <Card tone="dark">
        <Text {...typography.inverseTitle}>Условия использования</Text>
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

      <SectionHeader title="Контакты компании" />
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
