import { Link } from 'expo-router';
import { ComponentType, ReactNode } from 'react';
import { Image } from 'react-native';
import {
  BadgeDollarSign,
  CalendarDays,
  ChevronRight,
  ChartNoAxesColumnIncreasing,
  House,
  MapPin,
  Medal,
  Megaphone,
  Package,
  Radio,
  ShoppingBag,
  Store,
  Swords,
  Trophy,
  UserRound,
  UsersRound,
} from 'lucide-react-native';
import { Button, Text, XStack, YStack, styled } from 'tamagui';

import type { BilliardIconName } from '../assets/icons';
import { billiardIconSources, isBilliardIconName } from '../assets/icons';
import { colors, radius, spacing } from '../theme';

type InterfaceIconComponent = ComponentType<{
  color?: string;
  size?: number;
  strokeWidth?: number;
}>;

const interfaceIconComponents = {
  home: House,
  players: UsersRound,
  tournament: Trophy,
  ratingList: ChartNoAxesColumnIncreasing,
  profileUser: UserRound,
  clubPin: MapPin,
  club: Store,
  shop: ShoppingBag,
  listing: Megaphone,
  stream: Radio,
  match: Swords,
  product: Package,
  price: BadgeDollarSign,
  medal: Medal,
  calendar: CalendarDays,
  chevronRight: ChevronRight,
} as const satisfies Record<string, InterfaceIconComponent>;

type InterfaceIconName = keyof typeof interfaceIconComponents;
export type AppIconName = BilliardIconName | InterfaceIconName;

function isInterfaceIconName(icon: string): icon is InterfaceIconName {
  return icon in interfaceIconComponents;
}

export const AppCard = styled(YStack, {
  name: 'AppCard',
  alignSelf: 'stretch',
  backgroundColor: colors.cardLight,
  borderRadius: radius.lg,
  padding: spacing.lg,
  borderWidth: 1,
  borderColor: colors.line,
  marginBottom: spacing.md,
  shadowColor: '#000',
  shadowOpacity: 0.14,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,

  variants: {
    tone: {
      default: {},
      dark: {
        backgroundColor: colors.cardDark,
        borderColor: colors.borderSoft,
      },
      green: {
        backgroundColor: colors.cardElevated,
        borderColor: colors.borderSoft,
      },
    },
  } as const,

  defaultVariants: {
    tone: 'default',
  },
});

export function Card({
  children,
  tone = 'default',
  href,
}: {
  children: ReactNode;
  tone?: 'default' | 'dark' | 'green';
  href?: string;
}) {
  if (href) {
    return (
      <Link href={href} asChild>
        <AppCard tone={tone} pressStyle={{ opacity: 0.9 }} style={{ boxSizing: 'border-box' } as never}>
          {children}
        </AppCard>
      </Link>
    );
  }

  return <AppCard tone={tone} style={{ boxSizing: 'border-box' } as never}>{children}</AppCard>;
}

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      marginTop={spacing.sm}
      marginBottom={spacing.sm}
    >
      <Text color={colors.textPrimary} fontSize={18} fontWeight="700">
        {title}
      </Text>
      {action ? (
        <Text color={colors.brass400} fontSize={13} fontWeight="600">
          {action}
        </Text>
      ) : null}
    </XStack>
  );
}

export function IconBadge({
  icon,
  label,
  tone = 'default',
}: {
  icon: string;
  label?: string;
  tone?: 'default' | 'accent' | 'quiet';
}) {
  const backgroundColor =
    tone === 'accent' ? colors.brass500 : tone === 'quiet' ? colors.cardDark : colors.chipDark;
  const textColor = tone === 'accent' ? colors.rail900 : colors.textPrimary;
  const InterfaceIcon = isInterfaceIconName(icon) ? interfaceIconComponents[icon] : null;
  const source = isBilliardIconName(icon) ? billiardIconSources[icon] : null;
  const iconSize = label ? 18 : 20;

  return (
    <XStack
      alignItems="center"
      alignSelf="flex-start"
      gap={spacing.sm}
      borderRadius={999}
      backgroundColor={backgroundColor}
      borderWidth={tone === 'accent' ? 0 : 1}
      borderColor={colors.borderSoft}
      paddingHorizontal={label ? 10 : 0}
      paddingVertical={label ? 6 : 0}
      minWidth={label ? undefined : 36}
      height={label ? undefined : 36}
      justifyContent="center"
    >
      {InterfaceIcon ? (
        <InterfaceIcon color={textColor} size={iconSize} strokeWidth={2.15} />
      ) : source ? (
        <Image
          source={source}
          resizeMode="contain"
          style={{
            width: iconSize,
            height: iconSize,
            tintColor: textColor,
          }}
        />
      ) : (
        <Text color={textColor} fontSize={label ? 13 : 14} fontWeight="700">
          {icon}
        </Text>
      )}
      {label ? (
        <Text color={textColor} fontSize={12} fontWeight="600">
          {label}
        </Text>
      ) : null}
    </XStack>
  );
}

export function AppIcon({
  name,
  size = 20,
  color = colors.textPrimary,
}: {
  name: AppIconName;
  size?: number;
  color?: string;
}) {
  if (isInterfaceIconName(name)) {
    const InterfaceIcon = interfaceIconComponents[name];
    return <InterfaceIcon color={color} size={size} strokeWidth={2.15} />;
  }

  return (
    <Image
      source={billiardIconSources[name]}
      resizeMode="contain"
      style={{ width: size, height: size, tintColor: color }}
    />
  );
}

export const BilliardIcon = AppIcon;

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'green' | 'warning';
}) {
  const bg = tone === 'green' ? colors.felt700 : tone === 'warning' ? colors.brass500 : colors.chipDark;
  const fg = tone === 'warning' ? colors.rail900 : colors.textPrimary;

  return (
    <YStack
      alignSelf="flex-start"
      borderRadius={999}
      paddingHorizontal={10}
      paddingVertical={5}
      backgroundColor={bg}
    >
      <Text color={fg} fontSize={12} fontWeight="600">
        {label}
      </Text>
    </YStack>
  );
}

export function PrimaryButton({
  label,
  onPress,
  href,
}: {
  label: string;
  onPress?: () => void;
  href?: string;
}) {
  const button = (
    <Button
      unstyled
      minHeight={48}
      borderRadius={radius.md}
      backgroundColor={colors.brass500}
      alignItems="center"
      justifyContent="center"
      marginTop={spacing.md}
      onPress={onPress}
      pressStyle={{ opacity: 0.82 }}
    >
      <Text color={colors.rail900} fontSize={15} fontWeight="700">
        {label}
      </Text>
    </Button>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        {button}
      </Link>
    );
  }

  return button;
}

export function SecondaryButton({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} asChild>
      <Button
        unstyled
        minHeight={44}
        borderRadius={radius.md}
        backgroundColor={colors.chipDark}
        borderWidth={1}
        borderColor={colors.borderSoft}
        alignItems="center"
        justifyContent="center"
        marginTop={spacing.md}
        pressStyle={{ opacity: 0.82 }}
      >
        <Text color={colors.textPrimary} fontSize={14} fontWeight="600">
          {label}
        </Text>
      </Button>
    </Link>
  );
}

export function InfoGrid({ items }: { items: Array<{ label: string; value: string | number }> }) {
  return (
    <XStack flexWrap="wrap" marginHorizontal={-5} marginTop={spacing.md}>
      {items.map((item, index) => (
        <YStack key={`${item.label}-${index}`} width="50%" paddingHorizontal={5} marginBottom={spacing.md}>
          <Text color={colors.textMuted} fontSize={12} marginBottom={3}>
            {item.label}
          </Text>
          <Text color={colors.textPrimary} fontSize={14} fontWeight="600">
            {item.value}
          </Text>
        </YStack>
      ))}
    </XStack>
  );
}

export function StatRow({
  items,
  compact = false,
}: {
  items: Array<{ label: string; value: string | number; icon?: string }>;
  compact?: boolean;
}) {
  const itemWidth = `${100 / items.length - 2}%`;

  return (
    <XStack justifyContent="space-between" marginBottom={spacing.md} style={{ boxSizing: 'border-box' } as never}>
      {items.map((item) => (
        <YStack
          key={item.label}
          width={itemWidth}
          backgroundColor={colors.cardLight}
          borderRadius={radius.md}
          padding={compact ? spacing.sm : spacing.md}
          gap={spacing.xs}
        >
          <XStack alignItems="center" gap={spacing.sm}>
            {item.icon ? (
              <IconBadge icon={item.icon} tone="quiet" />
            ) : null}
            <Text color={colors.textPrimary} fontSize={compact ? 17 : 20} fontWeight="700">
              {item.value}
            </Text>
          </XStack>
          <Text color={colors.textMuted} fontSize={compact ? 11 : 12} marginTop={3}>
            {item.label}
          </Text>
        </YStack>
      ))}
    </XStack>
  );
}

export function EmptyPanel({ title, body }: { title: string; body?: string }) {
  return (
    <YStack
      borderRadius={radius.lg}
      borderWidth={1}
      borderColor={colors.borderSoft}
      backgroundColor={colors.cardDark}
      padding={spacing.lg}
      gap={spacing.xs}
    >
      <Text color={colors.textPrimary} fontSize={16} fontWeight="700">
        {title}
      </Text>
      {body ? <Text {...typography.meta}>{body}</Text> : null}
    </YStack>
  );
}

export function Avatar({ initials }: { initials: string }) {
  return (
    <YStack
      width={48}
      height={48}
      borderRadius={24}
      alignItems="center"
      justifyContent="center"
      backgroundColor={colors.chipDark}
      borderWidth={1}
      borderColor={colors.brass500}
    >
      <Text color={colors.textPrimary} fontSize={15} fontWeight="700">
        {initials}
      </Text>
    </YStack>
  );
}

export const typography = {
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700' as const,
  },
  body: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  inverseTitle: {
    color: colors.white,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '700' as const,
  },
  cardTitle: {
    color: colors.white,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700' as const,
  },
  inverseBody: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
};
