import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMemo } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VehicleArt } from '../../art/VehicleArt';
import { SpotCard } from '../../components/SpotCard';
import { GROUPS, RARITY, VEHICLE_BY_ID } from '../../data/vehicles';
import { distanceM } from '../../domain/geo';
import type { RootStackParamList } from '../../navigation/types';
import { useCommunity } from '../../state/CommunityProvider';
import { useHunt } from '../../state/hunt';
import { useLocation } from '../../state/LocationProvider';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { hazard, radii } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Pill } from '../../ui/Pill';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { T } from '../../ui/Text';

export function VehicleScreen() {
  const { c } = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Vehicle'>>();
  const { origin } = useLocation();
  const community = useCommunity();
  const v = VEHICLE_BY_ID[params.id];
  const spots = useHunt((s) => s.spots);
  const mine = useMemo(() => spots.filter((x) => x.typeId === params.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [spots, params.id]);
  const found = mine.length > 0;
  const famous = community.allSpots.filter((s) => s.typeId === params.id && s.nickname && s.ownerId !== 'me').slice(0, 3);
  const rarity = RARITY[v.rarity];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={GROUPS.find((g) => g.id === v.group)?.label} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 120, gap: 20 }}>
        <View style={[neu(c, 'raisedLg'), { borderRadius: radii.xl, padding: 18, alignItems: 'center', gap: 10 }]}>
          <VehicleArt type={v.id} width={280} colour={mine[0]?.colour} locked={found ? undefined : c.scheme === 'dark' ? '#2F343C' : '#CBD1DA'} />
          <T variant="stencilXL" center style={{ textTransform: 'uppercase' }}>
            {v.name}
          </T>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: rarity.color, borderRadius: 999, paddingHorizontal: 10, height: 24 }}>
              <T variant="micro" color="#FFFFFF">
                {rarity.label}
              </T>
            </View>
            <Pill label={`${rarity.xp} XP a spot`} tone="neutral" />
            {found ? <Pill label={`Spotted ×${mine.length}`} tone="success" icon="check" /> : <Pill label="Not found yet" tone="neutral" icon="lock" />}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <T variant="h2">What does it do?</T>
          <T variant="body" tone="soft">
            {v.job}
          </T>
        </View>

        <View style={{ gap: 10 }}>
          <T variant="h2">Did you know?</T>
          {v.facts.map((f) => (
            <View key={f} style={[neu(c, 'raisedSm'), { borderRadius: radii.md, padding: 14, flexDirection: 'row', gap: 12 }]}>
              <Icon name="lightbulb" size={18} color={c.accentDeep} />
              <T variant="body" style={{ flex: 1 }}>
                {f}
              </T>
            </View>
          ))}
        </View>

        <View style={{ borderRadius: radii.lg, backgroundColor: hazard.black, padding: 16, flexDirection: 'row', gap: 12 }}>
          <Icon name="binoculars" size={20} color={hazard.yellow} />
          <View style={{ flex: 1, gap: 2 }}>
            <T variant="stencilSm" color={hazard.yellow}>
              WHERE TO LOOK
            </T>
            <T variant="small" color="#FFFFFF" style={{ opacity: 0.9 }}>
              {v.lookFor}
            </T>
          </View>
        </View>

        {mine.length ? (
          <View style={{ gap: 10 }}>
            <T variant="h2">Your spots</T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {mine.slice(0, 9).map((s) => (
                <View key={s.id} style={{ width: '31%', flexGrow: 1, gap: 4 }}>
                  {s.photo ? (
                    <Image source={{ uri: s.photo }} style={{ width: '100%', aspectRatio: 1, borderRadius: radii.md, backgroundColor: c.well }} />
                  ) : (
                    <View style={{ width: '100%', aspectRatio: 1, borderRadius: radii.md, backgroundColor: c.scheme === 'dark' ? '#2A2F37' : '#F6F1DC', alignItems: 'center', justifyContent: 'center' }}>
                      <VehicleArt type={s.typeId} width={80} colour={s.colour} />
                    </View>
                  )}
                  <T variant="micro" tone="muted" numberOfLines={1}>
                    {s.nickname ?? new Date(s.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                  </T>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {famous.length ? (
          <View style={{ gap: 10 }}>
            <T variant="h2">Famous {v.name.toLowerCase()}s nearby</T>
            {famous.map((s) => (
              <SpotCard key={s.id} spot={s} distanceM={distanceM(origin, s.coordinate)} onPress={() => nav.navigate('SpotDetail', { id: s.id })} />
            ))}
          </View>
        ) : null}
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: c.bg }}>
        <Button title={found ? 'Spot another' : 'I see one!'} icon="camera" variant="accent" size="lg" full onPress={() => nav.navigate('Spot')} />
      </View>
    </View>
  );
}
