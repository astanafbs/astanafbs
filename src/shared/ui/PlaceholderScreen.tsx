import { Text } from 'tamagui';

import { Screen } from '../../components/Screen';
import { Card, PrimaryButton, typography } from '../../components/ui';

export function PlaceholderScreen({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Screen title={title}>
      <Card tone="dark">
        <Text {...typography.inverseTitle}>{title}</Text>
        <Text {...typography.inverseBody}>{description}</Text>
        <PrimaryButton label="Открыть раздел" />
      </Card>
    </Screen>
  );
}
