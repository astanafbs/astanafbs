import { ImageSourcePropType } from 'react-native';

export const billiardIconSources = {
  badge: require('../../assets/icons/generated/znachek.png') as ImageSourcePropType,
  ball: require('../../assets/icons/generated/billiard-ball.png') as ImageSourcePropType,
  battleCue: require('../../assets/icons/generated/battle_cue.png') as ImageSourcePropType,
  battleCueBalls: require('../../assets/icons/generated/battle_cue_balls.png') as ImageSourcePropType,
  cue: require('../../assets/icons/generated/cue.png') as ImageSourcePropType,
  cueBalls: require('../../assets/icons/generated/cue_balls.png') as ImageSourcePropType,
  glove: require('../../assets/icons/generated/hand.png') as ImageSourcePropType,
  money: require('../../assets/icons/generated/money.png') as ImageSourcePropType,
  rating: require('../../assets/icons/generated/raiting_users.png') as ImageSourcePropType,
  snooker: require('../../assets/icons/generated/snooker.png') as ImageSourcePropType,
  table: require('../../assets/icons/generated/billiard_table.png') as ImageSourcePropType,
  tableBallsCue: require('../../assets/icons/generated/billiard_table_balls_cue.png') as ImageSourcePropType,
  tableTop: require('../../assets/icons/generated/billiard_table_vid_sverhu.png') as ImageSourcePropType,
  triangle: require('../../assets/icons/generated/billiard_treugolnik.png') as ImageSourcePropType,
  trophy: require('../../assets/icons/generated/cubok_pobedy.png') as ImageSourcePropType,
};

export type BilliardIconName = keyof typeof billiardIconSources;

export function isBilliardIconName(icon: string): icon is BilliardIconName {
  return icon in billiardIconSources;
}
