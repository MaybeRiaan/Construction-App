import { View } from 'react-native';
import { familyRace } from '../../domain/game';
import type { Kid, Spot } from '../../domain/types';
import { useTheme } from '../../theme/ThemeProvider';
import { hazard } from '../../theme/tokens';
import { Avatar } from '../../ui/Avatar';
import { Icon } from '../../ui/Icon';
import { T } from '../../ui/Text';

/** Family Race: first to 10 different machines. */
export function RaceLanes({ kids, spots }: { kids: Kid[]; spots: Spot[] }) {
  const { c } = useTheme();
  const lanes = familyRace(kids, spots);
  const winner = lanes.find((l) => l.types >= 10);
  return (
    <View style={{ gap: 12 }}>
      {lanes.map((l, i) => {
        const pct = Math.min(1, l.types / 10);
        return (
          <View key={l.kid.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Avatar id={l.kid.avatar} size={34} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T variant="smallStrong">
                  {l.kid.name}
                  {winner?.kid.id === l.kid.id ? '  · Winner!' : i === 0 && l.types > 0 ? '  · Leading' : ''}
                </T>
                <T variant="micro" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>
                  {l.types}/10
                </T>
              </View>
              <View style={{ height: 14, borderRadius: 7, backgroundColor: c.well, overflow: 'hidden', justifyContent: 'center' }}>
                <View style={{ width: `${Math.max(pct * 100, 4)}%`, height: 14, borderRadius: 7, backgroundColor: i === 0 && l.types > 0 ? hazard.yellow : c.ink }} />
              </View>
            </View>
            <Icon name="flag" size={18} color={pct >= 1 ? hazard.yellow : c.faint} />
          </View>
        );
      })}
    </View>
  );
}
