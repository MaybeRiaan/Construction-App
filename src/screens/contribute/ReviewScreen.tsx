import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AMENITY_BY_ID, CATEGORY_BY_ID } from '../../data/categories';
import { REJECT_REASON_BY_ID, REJECT_REASONS, SCOUT_POINTS } from '../../data/scouts';
import { ageRangeFor, likelyDuplicates } from '../../domain/contribute';
import { distanceM, formatDistance } from '../../domain/geo';
import type { PlaceSubmission, RejectReason } from '../../domain/types';
import { AppMap } from '../../map/AppMap';
import type { MapMarker } from '../../map/types';
import { haptics } from '../../services/haptics';
import { useCommunity } from '../../state/CommunityProvider';
import { usePlaceData } from '../../state/PlacesProvider';
import { toast } from '../../state/ui';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { EmptyState } from '../../ui/EmptyState';
import { Icon } from '../../ui/Icon';
import { Pill } from '../../ui/Pill';
import { Press } from '../../ui/Press';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { Surface } from '../../ui/Surface';
import { T } from '../../ui/Text';

function ago(iso: string): string {
  const h = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 3600000));
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function ReviewCard({ sub, onDecide }: { sub: PlaceSubmission; onDecide: (sub: PlaceSubmission, reason: RejectReason | null) => Promise<void> }) {
  const { c } = useTheme();
  const nav = useNavigation();
  const data = usePlaceData();
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const cat = CATEGORY_BY_ID[sub.category];
  const dupes = useMemo(() => likelyDuplicates({ name: sub.name, category: sub.category, coordinate: sub.coordinate }, data.places), [sub, data.places]);
  const markers = useMemo<MapMarker[]>(
    () => [
      ...data.places
        .filter((p) => distanceM(sub.coordinate, p.coordinate) < 800)
        .slice(0, 30)
        .map((p): MapMarker => ({ id: p.id, coordinate: p.coordinate, kind: 'place', color: CATEGORY_BY_ID[p.category].color, icon: CATEGORY_BY_ID[p.category].icon, muted: true })),
      { id: sub.id, coordinate: sub.coordinate, kind: 'place', color: cat.color, icon: cat.icon, label: sub.name, selected: true },
    ],
    [data.places, sub, cat],
  );
  const [lo, hi] = ageRangeFor(sub.ages);

  const decide = async (reason: RejectReason | null) => {
    setBusy(true);
    await onDecide(sub, reason);
    setBusy(false);
  };

  return (
    <Surface depth="raised" radius={radii.lg} style={{ overflow: 'hidden' }}>
      <View style={{ height: 170 }} pointerEvents="none">
        <AppMap origin={sub.coordinate} radiusKm={0.35} showRange={false} markers={markers} showUser={false} interactive={false} />
      </View>
      <View style={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Pill label={cat.short} icon={cat.icon} tone="ink" />
          {sub.sample ? <Pill label="Sample" /> : null}
          <T variant="micro" tone="muted">
            {sub.author} · {ago(sub.createdAt)}
          </T>
        </View>
        <T variant="h2">{sub.name}</T>
        <T variant="small" tone="muted">
          Ages {lo}–{hi} · {sub.price ? 'Paid' : 'Free'} · {sub.indoor ? 'Indoor' : 'Outdoor'}
        </T>
        {sub.tip ? (
          <T variant="body" tone="soft">
            “{sub.tip}”
          </T>
        ) : null}
        {sub.amenities.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {sub.amenities.map((a) => (
              <Pill key={a} label={AMENITY_BY_ID[a].label} icon={AMENITY_BY_ID[a].icon} />
            ))}
          </View>
        ) : null}
        {sub.website ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="globe" size={14} color={c.muted} />
            <T variant="small" tone="muted" numberOfLines={1}>
              {sub.website}
            </T>
          </View>
        ) : null}

        {dupes.length ? (
          <Surface depth="insetSm" radius={radii.md} style={{ padding: 12, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="layers" size={16} color={c.danger} />
              <T variant="smallStrong">Possible duplicate</T>
            </View>
            {dupes.map(({ place, distanceM: d }) => (
              <Press key={place.id} onPress={() => nav.navigate('Place', { id: place.id })} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <T variant="small" style={{ flex: 1 }} numberOfLines={1}>
                  {place.name}
                </T>
                <T variant="micro" tone="muted">
                  {formatDistance(d)} away
                </T>
                <Icon name="chevronRight" size={14} color={c.muted} />
              </Press>
            ))}
          </Surface>
        ) : null}

        {rejecting ? (
          <View style={{ gap: 10 }}>
            <T variant="smallStrong">Why isn’t it going on the map?</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {REJECT_REASONS.map((r) => (
                <Chip key={r.id} label={r.label} icon={r.icon} size="sm" onPress={() => void decide(r.id)} />
              ))}
            </View>
            <Button title="Back" variant="ghost" size="sm" onPress={() => setRejecting(false)} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Button title="It’s a vibe" icon="sparkles" variant="accent" style={{ flex: 1 }} loading={busy} onPress={() => void decide(null)} />
            <Button title="Not for Playdar" variant="soft" style={{ flex: 1 }} disabled={busy} onPress={() => setRejecting(true)} />
          </View>
        )}
      </View>
    </Surface>
  );
}

/** Places parents added, waiting for the Playdar team (or, in the prototype, you). */
export function ReviewScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const community = useCommunity();
  const [handled, setHandled] = useState<Record<string, true>>({});
  const queue = community.queue.filter((s) => !handled[s.id]);

  const onDecide = async (sub: PlaceSubmission, reason: RejectReason | null) => {
    const ok = await community.reviewPlace(sub, reason ? { status: 'rejected', reason } : { status: 'approved' });
    if (!ok) {
      toast('Couldn’t save that decision. Try again.', { tone: 'danger' });
      return;
    }
    haptics.success();
    setHandled((h) => ({ ...h, [sub.id]: true }));
    toast(reason ? `Not added: ${REJECT_REASON_BY_ID[reason].label}` : `${sub.name} is live for every family`, { icon: reason ? 'info' : 'sparkles', tone: reason ? 'default' : 'accent' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title="Review queue" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32, gap: 18 }}>
        <View style={{ gap: 8 }}>
          {community.backend === 'demo' ? <Pill label="Prototype: the Playdar team’s view" icon="eye" tone="sponsored" /> : null}
          <T variant="body" tone="soft">
            Places parents added. Check each one is real, open to the public and good for kids. Approved places go live for every family and earn the parent {SCOUT_POINTS.added} Scout points.
          </T>
        </View>
        {queue.length ? (
          queue.map((s) => <ReviewCard key={s.id} sub={s} onDecide={onDecide} />)
        ) : (
          <View style={[neu(c, 'insetSm'), { borderRadius: radii.lg }]}>
            <EmptyState icon="checkCircle" title="All caught up" body="New places parents add will show up here." />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
