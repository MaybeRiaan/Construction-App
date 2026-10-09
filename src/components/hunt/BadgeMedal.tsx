import { View } from 'react-native';
import type { BadgeDef } from '../../data/challenges';
import { useTheme } from '../../theme/ThemeProvider';
import { Icon } from '../../ui/Icon';
import { T } from '../../ui/Text';

export function BadgeMedal({ badge, earned, size = 64 }: { badge: BadgeDef; earned: boolean; size?: number }) {
  const { c } = useTheme();
  return (
    <View style={{ width: size + 20, alignItems: 'center', gap: 6 }} accessibilityLabel={`${badge.name}${earned ? ', earned' : ', locked'}`}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: earned ? badge.color : c.well,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 4,
          borderColor: earned ? '#FFFFFF' : c.bg,
          boxShadow: earned ? `0px 6px 14px ${c.shadowDark}` : `inset 2px 2px 5px ${c.shadowDark}, inset -2px -2px 5px ${c.shadowLight}`,
        }}
      >
        <Icon name={earned ? badge.icon : 'lock'} size={size * 0.4} color={earned ? (badge.color === '#FFC21A' || badge.color === '#E2A100' ? '#15171B' : '#FFFFFF') : c.faint} />
      </View>
      <T variant="micro" tone={earned ? 'ink' : 'faint'} center numberOfLines={2}>
        {badge.name}
      </T>
    </View>
  );
}
