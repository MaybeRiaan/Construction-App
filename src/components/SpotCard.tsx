import { Image, View } from 'react-native';
import { VehicleArt } from '../art/VehicleArt';
import { VEHICLE_BY_ID } from '../data/vehicles';
import { formatDistance } from '../domain/geo';
import type { Spot } from '../domain/types';
import { useCommunity } from '../state/CommunityProvider';
import { useSettings } from '../state/settings';
import { toast } from '../state/ui';
import { neu } from '../theme/neu';
import { useTheme } from '../theme/ThemeProvider';
import { hazard, radii } from '../theme/tokens';
import { Icon } from '../ui/Icon';
import { Pill } from '../ui/Pill';
import { Press } from '../ui/Press';
import { T } from '../ui/Text';

export function SpotPhoto({ spot, size, radius = radii.md }: { spot: Spot; size: number; radius?: number }) {
  const { c } = useTheme();
  if (spot.photo) {
    return <Image source={{ uri: spot.photo }} style={{ width: size, height: size, borderRadius: radius, backgroundColor: c.well }} resizeMode="cover" />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: c.scheme === 'dark' ? '#2A2F37' : '#F6F1DC', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <VehicleArt type={spot.typeId} width={size * 0.86} colour={spot.colour} />
    </View>
  );
}

export function VoteButton({ spot, compact }: { spot: Spot; compact?: boolean }) {
  const { c } = useTheme();
  const community = useCommunity();
  const voted = community.hasVoted(spot.id);
  const count = community.voteCount(spot.id);
  const mine = spot.ownerId === 'me';
  return (
    <Press
      disabled={mine}
      onPress={() => {
        const now = community.toggleVote(spot.id);
        if (now) toast(`You love the name “${spot.nickname}”`, { icon: 'hardHat', tone: 'accent' });
      }}
      accessibilityRole="button"
      accessibilityLabel={voted ? `Remove your vote for ${spot.nickname}` : `Vote for the name ${spot.nickname}`}
      accessibilityState={{ selected: voted }}
      scaleTo={0.9}
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 6, height: compact ? 32 : 38, paddingHorizontal: compact ? 10 : 12, borderRadius: 999 },
        voted ? { backgroundColor: hazard.yellow } : neu(c, 'raisedSm'),
        mine && { opacity: 0.7 },
      ]}
    >
      <Icon name="thumbsUp" size={compact ? 14 : 16} color={voted ? hazard.black : c.ink} fill={voted ? hazard.black : undefined} />
      <T variant="smallStrong" color={voted ? hazard.black : c.ink} style={{ fontVariant: ['tabular-nums'] }}>
        {count}
      </T>
    </Press>
  );
}

/** A named machine in the Fame list. */
export function SpotCard({ spot, distanceM, onPress }: { spot: Spot; distanceM?: number; onPress: () => void }) {
  const { c } = useTheme();
  const units = useSettings((s) => s.units);
  const v = VEHICLE_BY_ID[spot.typeId];
  return (
    <Press onPress={onPress} accessibilityRole="button" accessibilityLabel={`${spot.nickname}, ${v.name}`} scaleTo={0.98} style={[neu(c, 'raised'), { borderRadius: radii.lg, padding: 10, flexDirection: 'row', gap: 12, alignItems: 'center' }]}>
      <SpotPhoto spot={spot} size={76} />
      <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
        <T variant="stencil" numberOfLines={1} style={{ fontSize: 21, lineHeight: 23, textTransform: 'uppercase' }}>
          {spot.nickname ?? v.name}
        </T>
        <T variant="small" tone="muted" numberOfLines={1}>
          {v.name}
          {spot.area ? ` · ${spot.area}` : ''}
          {distanceM != null ? ` · ${formatDistance(distanceM, units)}` : ''}
        </T>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 3, alignItems: 'center' }}>
          {spot.ownerId === 'me' ? <Pill label="Yours" tone="ink" /> : <Pill label={spot.teamName ?? 'Hunters'} tone="neutral" icon="users" />}
          {spot.sample ? <Pill label="Sample" tone="neutral" /> : null}
        </View>
      </View>
      {spot.nickname ? <VoteButton spot={spot} compact /> : null}
    </Press>
  );
}
