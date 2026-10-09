import { View } from 'react-native';
import { VehicleArt } from '../../art/VehicleArt';
import { VEHICLE_BY_ID } from '../../data/vehicles';
import { BINGO_LINES, bingoCard, bingoState, startOfWeek } from '../../domain/game';
import type { Spot, VehicleTypeId } from '../../domain/types';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { hazard, radii } from '../../theme/tokens';
import { Icon } from '../../ui/Icon';
import { T } from '../../ui/Text';

/** This week's 3×3 Digger Bingo card. */
export function BingoGrid({ spots, size = 'md' }: { spots: Spot[]; size?: 'sm' | 'md' }) {
  const { c } = useTheme();
  const now = new Date();
  const card = bingoCard(now);
  const from = startOfWeek(now).toISOString();
  const week = new Set<VehicleTypeId>(spots.filter((s) => s.createdAt >= from).map((s) => s.typeId));
  const { filled, lines } = bingoState(card, week);
  const inLine = new Set(lines.flatMap((l) => l));
  const cell = size === 'sm' ? 30 : 92;
  const gap = size === 'sm' ? 4 : 8;
  return (
    <View style={{ width: cell * 3 + gap * 2, flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {card.map((t, i) => {
        const on = filled[i];
        const win = inLine.has(i) && BINGO_LINES.length > 0;
        if (size === 'sm') {
          return <View key={i} style={{ width: cell, height: cell, borderRadius: 7, backgroundColor: on ? (win ? hazard.yellow : c.ink) : c.well }} />;
        }
        return (
          <View
            key={i}
            accessibilityLabel={t === 'free' ? 'Free square' : `${VEHICLE_BY_ID[t].name}${on ? ', spotted' : ''}`}
            style={[
              { width: cell, height: cell, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', padding: 6, gap: 2 },
              on ? { backgroundColor: win ? hazard.yellow : c.ink } : neu(c, 'raisedSm'),
            ]}
          >
            {t === 'free' ? (
              <>
                <Icon name="hardHat" size={28} color={on ? (win ? hazard.black : hazard.yellow) : c.ink} />
                <T variant="stencilSm" color={on ? (win ? hazard.black : hazard.yellow) : c.ink}>
                  FREE
                </T>
              </>
            ) : (
              <>
                <VehicleArt type={t} width={cell - 18} locked={on ? undefined : undefined} />
                <T variant="micro" numberOfLines={1} color={on ? (win ? hazard.black : c.onInk) : c.inkSoft} style={{ fontSize: 10 }}>
                  {VEHICLE_BY_ID[t].name}
                </T>
                {on ? (
                  <View style={{ position: 'absolute', top: 5, right: 5, width: 18, height: 18, borderRadius: 9, backgroundColor: win ? hazard.black : hazard.yellow, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={12} color={win ? hazard.yellow : hazard.black} strokeWidth={3.2} />
                  </View>
                ) : null}
              </>
            )}
          </View>
        );
      })}
    </View>
  );
}
