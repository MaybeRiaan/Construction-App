import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VehicleArt } from '../../art/VehicleArt';
import { VoteButton } from '../../components/SpotCard';
import { RARITY, VEHICLE_BY_ID } from '../../data/vehicles';
import { distanceM, formatDistance } from '../../domain/geo';
import { AppMap } from '../../map/AppMap';
import type { AppMapHandle } from '../../map/types';
import type { RootStackParamList } from '../../navigation/types';
import { useCommunity } from '../../state/CommunityProvider';
import { useHunt } from '../../state/hunt';
import { useLocation } from '../../state/LocationProvider';
import { useSettings } from '../../state/settings';
import { toast } from '../../state/ui';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { hazard, radii } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Icon } from '../../ui/Icon';
import { Pill } from '../../ui/Pill';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { Surface } from '../../ui/Surface';
import { T } from '../../ui/Text';

export function SpotDetailScreen() {
  const { c } = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<RootStackParamList, 'SpotDetail'>>();
  const { origin } = useLocation();
  const community = useCommunity();
  const mySpots = useHunt((s) => s.spots);
  const removeSpot = useHunt((s) => s.removeSpot);
  const units = useSettings((s) => s.units);
  const map = useRef<AppMapHandle>(null);
  const [confirm, setConfirm] = useState(false);

  const mine = mySpots.find((s) => s.id === params.id);
  const spot = useMemo(
    () => (mine ? { ...mine, ownerId: 'me' } : community.allSpots.find((s) => s.id === params.id)),
    [mine, community.allSpots, params.id],
  );
  const alreadyFound = mySpots.some((s) => s.foundOf === params.id);

  useEffect(() => {
    const t = setTimeout(() => spot && map.current?.focus(spot.coordinate), 400);
    return () => clearTimeout(t);
  }, [spot?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const markers = useMemo(
    () => (spot ? [{ id: spot.id, coordinate: spot.coordinate, kind: 'spot' as const, color: hazard.yellow, icon: 'hardHat' as const, vehicle: spot.typeId, selected: true, label: spot.nickname, mine: Boolean(mine) }] : []),
    [spot, mine],
  );

  if (!spot) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader />
        <EmptyState icon="hardHat" title="Machine not found" body="It may have been removed by its spotter." />
      </View>
    );
  }
  const v = VEHICLE_BY_ID[spot.typeId];
  const d = distanceM(origin, spot.coordinate);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={v.name} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 120, gap: 18 }}>
        <View style={{ borderRadius: radii.xl, overflow: 'hidden', aspectRatio: 4 / 3, backgroundColor: c.scheme === 'dark' ? '#2A2F37' : '#F6F1DC', alignItems: 'center', justifyContent: 'center' }}>
          {spot.photo ? <Image source={{ uri: spot.photo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <VehicleArt type={spot.typeId} width={260} colour={spot.colour} />}
          {spot.sample ? <Pill label="Sample" tone="glass" style={{ position: 'absolute', top: 12, left: 12 }} /> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <T variant="stencilXL" style={{ textTransform: 'uppercase' }}>
              {spot.nickname ?? v.name}
            </T>
            <T variant="small" tone="muted">
              {RARITY[v.rarity].label} {v.name.toLowerCase()} · {spot.area ?? `${formatDistance(d, units)} away`}
            </T>
          </View>
          {spot.nickname ? <VoteButton spot={spot} /> : null}
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Pill label={mine ? 'Spotted by you' : `Named by ${spot.teamName ?? 'a local family'}`} tone={mine ? 'ink' : 'neutral'} icon="users" />
          <Pill label={new Date(spot.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short' })} tone="neutral" icon="calendar" />
          {spot.foundOf ? <Pill label="Famous find" tone="accent" icon="binoculars" /> : null}
        </View>

        <View style={{ height: 190, borderRadius: radii.lg, overflow: 'hidden' }}>
          <AppMap ref={map} origin={origin} markers={markers} interactive={false} showUser />
        </View>
        <T variant="micro" tone="muted">
          Location rounded to about 150 m to keep families private. Look around the area!
        </T>

        <Surface depth="raisedSm" radius={radii.md} style={{ padding: 14, flexDirection: 'row', gap: 12 }}>
          <Icon name="lightbulb" size={18} color={c.accentDeep} />
          <T variant="body" style={{ flex: 1 }}>
            {v.facts[0]}
          </T>
        </Surface>

        {mine ? (
          confirm ? (
            <Surface depth="insetSm" radius={radii.lg} style={{ padding: 16, gap: 12 }}>
              <T variant="bodyStrong">Delete this spot?</T>
              <T variant="small" tone="muted">
                It comes out of your Yard and stops being shared. XP from it is removed.
              </T>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button title="Keep" variant="soft" style={{ flex: 1 }} onPress={() => setConfirm(false)} />
                <Button
                  title="Delete"
                  variant="danger"
                  style={{ flex: 1 }}
                  onPress={() => {
                    if (mine.isPublic) community.unpublish(mine.id);
                    removeSpot(mine.id);
                    toast('Spot deleted', { icon: 'trash' });
                    nav.goBack();
                  }}
                />
              </View>
            </Surface>
          ) : (
            <Button title="Delete spot" variant="ghost" icon="trash" onPress={() => setConfirm(true)} />
          )
        ) : null}
      </ScrollView>
      {!mine ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: c.bg }}>
          {alreadyFound ? (
            <View style={[neu(c, 'insetSm'), { borderRadius: radii.md, padding: 16, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' }]}>
              <Icon name="checkCircle" size={20} color={c.success} />
              <T variant="bodyStrong">In your Yard. Nice find!</T>
            </View>
          ) : (
            <Button title="I found it!" icon="binoculars" variant="accent" size="lg" full onPress={() => nav.navigate('Spot', { foundOf: spot.id })} />
          )}
        </View>
      ) : null}
    </View>
  );
}
