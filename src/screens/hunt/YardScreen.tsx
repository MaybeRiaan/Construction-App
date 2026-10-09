import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { ScrollView, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SiteSign } from '../../components/hunt/SiteSign';
import { MachineCard } from '../../components/MachineCard';
import { GROUPS, VEHICLES } from '../../data/vehicles';
import { plural } from '../../domain/id';
import { useHunt } from '../../state/hunt';
import { useTheme } from '../../theme/ThemeProvider';
import { hazard } from '../../theme/tokens';
import { ProgressBar } from '../../ui/ProgressBar';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { T } from '../../ui/Text';

/** The collection: every machine type, found ones in colour. */
export function YardScreen() {
  const { c } = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const spots = useHunt((s) => s.spots);
  const [width, setWidth] = useState(350);
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of spots) m[s.typeId] = (m[s.typeId] ?? 0) + 1;
    return m;
  }, [spots]);
  const found = Object.keys(counts).length;
  const cardW = Math.floor((width - 40 - 14) / 2);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <ScreenHeader title="Your Yard" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 22 }}>
        <SiteSign eyebrow="Collection" title={`${found} / ${VEHICLES.length} machines`}>
          <ProgressBar value={found / VEHICLES.length} color={hazard.yellow} height={12} style={{ marginTop: 6 }} />
          <T variant="small" color="#FFFFFF" style={{ opacity: 0.8 }}>
            {plural(spots.length, 'spot')} so far. Silhouettes are machines still out there waiting for you.
          </T>
        </SiteSign>
        {GROUPS.map((g) => {
          const list = VEHICLES.filter((v) => v.group === g.id);
          const have = list.filter((v) => counts[v.id]).length;
          return (
            <View key={g.id} style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <T variant="h2">{g.label}</T>
                <T variant="smallStrong" tone="muted">
                  {have}/{list.length}
                </T>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
                {list.map((v) => (
                  <MachineCard key={v.id} v={v} count={counts[v.id] ?? 0} width={cardW} onPress={() => nav.navigate('Vehicle', { id: v.id })} />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
