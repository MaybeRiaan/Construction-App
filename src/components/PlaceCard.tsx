import { View, type StyleProp, type ViewStyle } from 'react-native';
import { CategoryArt } from '../art/CategoryArt';
import { CATEGORY_BY_ID } from '../data/categories';
import { formatDistance } from '../domain/geo';
import type { PlaceView } from '../domain/search';
import { usePlaces } from '../state/places';
import { useSettings } from '../state/settings';
import { toast } from '../state/ui';
import { neu } from '../theme/neu';
import { useTheme } from '../theme/ThemeProvider';
import { radii } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Pill } from '../ui/Pill';
import { Press } from '../ui/Press';
import { T } from '../ui/Text';
import { VibeBadge } from './VibeBadge';

export function priceLabel(p: PlaceView): string {
  return p.price === 0 ? 'Free' : '$'.repeat(p.price);
}

export function SaveHeart({ id, name, size = 36, onDark }: { id: string; name: string; size?: number; onDark?: boolean }) {
  const { c } = useTheme();
  const saved = usePlaces((s) => Boolean(s.saved[id]));
  const toggle = usePlaces((s) => s.toggleSave);
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={saved ? `Remove ${name} from saved` : `Save ${name}`}
      hitSlop={8}
      scaleTo={0.85}
      onPress={() => {
        const now = toggle(id);
        toast(now ? 'Saved to Favourites' : 'Removed from saved', { icon: 'heart' });
      }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: onDark ? 'rgba(16,18,22,0.45)' : c.card,
        boxShadow: onDark ? undefined : c.floatShadow,
      }}
    >
      <Icon name="heart" size={size * 0.48} color={saved ? '#FF5A6E' : onDark ? '#FFFFFF' : c.ink} fill={saved ? '#FF5A6E' : undefined} />
    </Press>
  );
}

function Meta({ p }: { p: PlaceView }) {
  const units = useSettings((s) => s.units);
  return (
    <T variant="small" tone="muted" numberOfLines={1}>
      {CATEGORY_BY_ID[p.category].short} · {formatDistance(p.distanceM, units)} · {p.travel}
    </T>
  );
}

/** Horizontal list row. */
export function PlaceRow({ p, onPress, style }: { p: PlaceView; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={p.name}
      scaleTo={0.98}
      style={[neu(c, 'raised'), { borderRadius: radii.lg, padding: 10, flexDirection: 'row', gap: 12, alignItems: 'center' }, style]}
    >
      <View style={{ width: 92, height: 92, borderRadius: radii.md, overflow: 'hidden' }}>
        <CategoryArt category={p.category} seed={p.coverSeed} width={92} height={92} />
        {p.sponsored ? (
          <Pill label="Partner" tone="accent" icon="star" style={{ position: 'absolute', left: 6, top: 6, height: 20, paddingHorizontal: 6 }} />
        ) : p.source === 'community' ? (
          <Pill label="Parent pick" tone="ink" icon="users" style={{ position: 'absolute', left: 6, top: 6, height: 20, paddingHorizontal: 6 }} />
        ) : null}
      </View>
      <View style={{ flex: 1, gap: 5, minWidth: 0 }}>
        <T variant="h3" numberOfLines={1}>
          {p.name}
        </T>
        <Meta p={p} />
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <VibeBadge stats={p.stats} compact />
          <Pill label={p.open.open ? (p.open.closingSoon ? 'Closing soon' : 'Open') : 'Closed'} tone={p.open.open ? (p.open.closingSoon ? 'sponsored' : 'success') : 'neutral'} />
          <Pill label={priceLabel(p)} tone="neutral" />
        </View>
      </View>
      <SaveHeart id={p.id} name={p.name} size={34} />
    </Press>
  );
}

/** Big vertical card for carousels. */
export function PlaceFeature({ p, onPress, width = 260 }: { p: PlaceView; onPress: () => void; width?: number }) {
  const { c } = useTheme();
  return (
    <Press onPress={onPress} accessibilityRole="button" accessibilityLabel={p.name} scaleTo={0.98} style={[neu(c, 'raised'), { width, borderRadius: radii.lg, padding: 10, gap: 10 }]}>
      <View style={{ height: 140, borderRadius: radii.md, overflow: 'hidden' }}>
        <CategoryArt category={p.category} seed={p.coverSeed} width={width - 20} height={140} />
        <View style={{ position: 'absolute', left: 8, top: 8, flexDirection: 'row', gap: 6 }}>
          {p.sponsored ? <Pill label={p.sponsored.label ?? 'Sponsored'} tone="accent" icon="star" /> : null}
        </View>
        <View style={{ position: 'absolute', right: 8, top: 8 }}>
          <SaveHeart id={p.id} name={p.name} size={32} onDark />
        </View>
      </View>
      <View style={{ gap: 4, paddingHorizontal: 4, paddingBottom: 4 }}>
        <T variant="h3" numberOfLines={1}>
          {p.name}
        </T>
        <Meta p={p} />
        {p.sponsored?.offer ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Icon name="tag" size={13} color={c.accentDeep} />
            <T variant="smallStrong" tone="accent" numberOfLines={1} style={{ flex: 1 }}>
              {p.sponsored.offer}
            </T>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
            <VibeBadge stats={p.stats} />
          </View>
        )}
      </View>
    </Press>
  );
}
