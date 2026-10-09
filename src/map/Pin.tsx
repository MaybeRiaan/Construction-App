import { View } from 'react-native';
import { VehicleArt } from '../art/VehicleArt';
import { useTheme } from '../theme/ThemeProvider';
import { hazard } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { T } from '../ui/Text';
import type { MapMarker } from './types';

/** Map pin shared by the native and web maps. Anchor: bottom centre. */
export function Pin({ m }: { m: MapMarker }) {
  const { c } = useTheme();
  if (m.kind === 'spot') {
    const size = m.selected ? 50 : 40;
    return (
      <View style={{ alignItems: 'center' }}>
        {m.selected && m.label ? <Label text={m.label} /> : null}
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#FFFFFF',
            borderWidth: 3,
            borderColor: m.mine ? c.ink : hazard.yellow,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0px 4px 10px rgba(16,18,22,0.28)',
            opacity: m.muted && !m.selected ? 0.92 : 1,
          }}
        >
          {m.vehicle ? <VehicleArt type={m.vehicle} width={size - 10} /> : <Icon name="hardHat" size={18} color={c.ink} />}
        </View>
        <View style={{ width: 3, height: 7, backgroundColor: m.mine ? c.ink : hazard.yellow, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }} />
      </View>
    );
  }
  const size = m.selected ? 44 : 34;
  return (
    <View style={{ alignItems: 'center' }}>
      {m.selected && m.label ? <Label text={m.label} /> : null}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.36,
          backgroundColor: m.color,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: m.selected ? 3 : 2,
          borderColor: m.sponsored ? hazard.yellow : '#FFFFFF',
          boxShadow: m.selected ? '0px 8px 16px rgba(16,18,22,0.35)' : '0px 3px 8px rgba(16,18,22,0.25)',
        }}
      >
        <Icon name={m.icon} size={m.selected ? 22 : 17} color="#FFFFFF" strokeWidth={2.4} />
        {m.sponsored ? (
          <View style={{ position: 'absolute', top: -7, right: -7, width: 16, height: 16, borderRadius: 8, backgroundColor: hazard.yellow, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFFFFF' }}>
            <Icon name="star" size={9} color={hazard.black} fill={hazard.black} />
          </View>
        ) : null}
      </View>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 6,
          borderRightWidth: 6,
          borderTopWidth: 7,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: m.sponsored ? hazard.yellow : '#FFFFFF',
          marginTop: -1,
        }}
      />
    </View>
  );
}

function Label({ text }: { text: string }) {
  const { c } = useTheme();
  return (
    <View style={{ backgroundColor: c.ink, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 6, maxWidth: 200, boxShadow: '0px 4px 10px rgba(16,18,22,0.25)' }}>
      <T variant="micro" color={c.onInk} numberOfLines={1} style={{ fontSize: 12 }}>
        {text}
      </T>
    </View>
  );
}
