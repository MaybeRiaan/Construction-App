import { View } from 'react-native';
import { VehicleArt } from '../art/VehicleArt';
import { RARITY, type VehicleDef } from '../data/vehicles';
import { neu } from '../theme/neu';
import { useTheme } from '../theme/ThemeProvider';
import { radii } from '../theme/tokens';
import { Press } from '../ui/Press';
import { T } from '../ui/Text';

/** A Yard slot: collected machines in full colour, missing ones as silhouettes. */
export function MachineCard({ v, count, onPress, width }: { v: VehicleDef; count: number; onPress: () => void; width: number }) {
  const { c } = useTheme();
  const found = count > 0;
  const rarity = RARITY[v.rarity];
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={found ? `${v.name}, spotted ${count} times` : `${v.name}, not found yet`}
      scaleTo={0.96}
      style={[neu(c, found ? 'raised' : 'insetSm'), { width, borderRadius: radii.lg, padding: 10, gap: 6 }]}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center', height: (width - 20) * 0.62 }}>
        <VehicleArt type={v.id} width={width - 24} locked={found ? undefined : c.scheme === 'dark' ? '#2F343C' : '#CBD1DA'} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <T variant="stencilSm" numberOfLines={1} tone={found ? 'ink' : 'muted'} style={{ flex: 1, textTransform: 'uppercase' }}>
          {found ? v.name : '???'}
        </T>
        {found ? (
          <View style={{ backgroundColor: c.ink, borderRadius: 999, paddingHorizontal: 7, height: 20, justifyContent: 'center' }}>
            <T variant="micro" color={c.onInk} style={{ fontVariant: ['tabular-nums'] }}>
              ×{count}
            </T>
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: rarity.color }} />
        <T variant="micro" tone="muted">
          {rarity.label} · {rarity.xp} XP
        </T>
      </View>
    </Press>
  );
}
