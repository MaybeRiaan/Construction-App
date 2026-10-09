import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaceRow } from '../../components/PlaceCard';
import { VIBE_LEVELS } from '../../data/vibes';
import { useTabBarSpace } from '../../navigation/TabBar';
import { usePlaceData } from '../../state/PlacesProvider';
import { SAVED_LISTS, usePlaces, type SavedList } from '../../state/places';
import { useTheme } from '../../theme/ThemeProvider';
import { Chip } from '../../ui/Chip';
import { EmptyState } from '../../ui/EmptyState';
import { Icon } from '../../ui/Icon';
import { Press } from '../../ui/Press';
import { T } from '../../ui/Text';

export function SavedScreen() {
  const { c } = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const data = usePlaceData();
  const saved = usePlaces((s) => s.saved);
  const moveSaved = usePlaces((s) => s.moveSaved);
  const myVibes = usePlaces((s) => s.myVibes);
  const [list, setList] = useState<SavedList | 'all'>('all');

  const items = useMemo(
    () =>
      Object.entries(saved)
        .filter(([, v]) => list === 'all' || v.list === list)
        .sort((a, b) => b[1].at.localeCompare(a[1].at))
        .map(([id, v]) => ({ p: data.byId[id], list: v.list }))
        .filter((x): x is { p: NonNullable<typeof x.p>; list: SavedList } => Boolean(x.p)),
    [saved, list, data.byId],
  );
  const visited = useMemo(() => myVibes.map((v) => ({ v, p: data.byId[v.placeId] })).filter((x) => x.p), [myVibes, data.byId]);
  const counts = useMemo(() => {
    const out: Record<string, number> = { all: 0 };
    for (const v of Object.values(saved)) {
      out.all += 1;
      out[v.list] = (out[v.list] ?? 0) + 1;
    }
    return out;
  }, [saved]);

  const nextList = (l: SavedList): SavedList => SAVED_LISTS[(SAVED_LISTS.findIndex((x) => x.id === l) + 1) % SAVED_LISTS.length].id;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: tabSpace + 20, gap: 18 }}>
        <View style={{ paddingHorizontal: 20, gap: 4 }}>
          <T variant="label" tone="muted">
            Your shortlist
          </T>
          <T variant="hero">Saved</T>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 4 }}>
          <Chip label="All" count={counts.all} selected={list === 'all'} onPress={() => setList('all')} />
          {SAVED_LISTS.map((l) => (
            <Chip key={l.id} label={l.label} count={counts[l.id] ?? 0} selected={list === l.id} onPress={() => setList(l.id)} />
          ))}
        </ScrollView>

        {items.length ? (
          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            {items.map(({ p, list: l }) => (
              <View key={p.id} style={{ gap: 6 }}>
                <PlaceRow p={p} onPress={() => nav.navigate('Place', { id: p.id })} />
                <Press
                  onPress={() => moveSaved(p.id, nextList(l))}
                  accessibilityRole="button"
                  accessibilityLabel={`In ${SAVED_LISTS.find((x) => x.id === l)?.label}. Move to ${SAVED_LISTS.find((x) => x.id === nextList(l))?.label}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4 }}
                >
                  <Icon name="bookmark" size={13} color={c.muted} />
                  <T variant="micro" tone="muted">
                    {SAVED_LISTS.find((x) => x.id === l)?.label} · tap to move
                  </T>
                </Press>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="heart"
            title={list === 'all' ? 'Nothing saved yet' : 'This list is empty'}
            body="Tap the heart on any place to keep it here for later."
            action="Explore nearby"
            onAction={() => nav.navigate('Tabs', { screen: 'Explore' })}
          />
        )}

        {visited.length ? (
          <View style={{ gap: 12, paddingHorizontal: 20, marginTop: 8 }}>
            <T variant="h2">Your vibe checks</T>
            {visited.map(({ v, p }) => (
              <Press key={v.id} onPress={() => nav.navigate('Place', { id: v.placeId })} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: v.score >= 4 ? c.accent : c.well, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={VIBE_LEVELS[v.score - 1].icon} size={18} color={v.score >= 4 ? c.onAccent : c.inkSoft} />
                </View>
                <View style={{ flex: 1 }}>
                  <T variant="bodyStrong" numberOfLines={1}>
                    {p!.name}
                  </T>
                  <T variant="small" tone="muted">
                    {VIBE_LEVELS[v.score - 1].label} · {new Date(v.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                  </T>
                </View>
                <Icon name="chevronRight" size={18} color={c.muted} />
              </Press>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
