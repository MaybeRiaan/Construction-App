import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SpotCard } from '../../components/SpotCard';
import { distanceM } from '../../domain/geo';
import { useCommunity } from '../../state/CommunityProvider';
import { useLocation } from '../../state/LocationProvider';
import { useTheme } from '../../theme/ThemeProvider';
import { hazard, radii } from '../../theme/tokens';
import { EmptyState } from '../../ui/EmptyState';
import { Icon } from '../../ui/Icon';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { Segmented } from '../../ui/Segmented';
import { T } from '../../ui/Text';

type Sort = 'top' | 'new' | 'near';

/** Named machines: vote for the best names, then go and find them. */
export function FameScreen() {
  const { c } = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { origin } = useLocation();
  const community = useCommunity();
  const [sort, setSort] = useState<Sort>('top');

  const list = useMemo(() => {
    const named = community.allSpots.filter((s) => s.nickname).map((s) => ({ s, d: distanceM(origin, s.coordinate), votes: community.voteCount(s.id) }));
    if (sort === 'new') named.sort((a, b) => b.s.createdAt.localeCompare(a.s.createdAt));
    else if (sort === 'near') named.sort((a, b) => a.d - b.d);
    else named.sort((a, b) => b.votes - a.votes);
    return named;
  }, [community, origin, sort]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title="Famous machines" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 14 }}>
        <View style={{ borderRadius: radii.lg, backgroundColor: hazard.black, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Icon name="thumbsUp" size={22} color={hazard.yellow} />
          <T variant="small" color="#FFFFFF" style={{ flex: 1 }}>
            Vote for the names you love. Then hunt them down in real life and snap them to add a famous machine to your Yard.
          </T>
        </View>
        <Segmented<Sort>
          options={[
            { value: 'top', label: 'Top names', icon: 'crown' },
            { value: 'new', label: 'Newest', icon: 'sparkles' },
            { value: 'near', label: 'Closest', icon: 'navigate' },
          ]}
          value={sort}
          onChange={setSort}
        />
        {list.length ? (
          list.map(({ s, d }, i) => (
            <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {sort === 'top' ? (
                <T variant="stencil" tone={i < 3 ? 'ink' : 'faint'} style={{ width: 26, textAlign: 'center' }}>
                  {i + 1}
                </T>
              ) : null}
              <View style={{ flex: 1 }}>
                <SpotCard spot={s} distanceM={d} onPress={() => nav.navigate('SpotDetail', { id: s.id })} />
              </View>
            </View>
          ))
        ) : (
          <EmptyState icon="hardHat" title="No named machines yet" body="Name a machine when you spot it and it will show up here for other hunters." />
        )}
      </ScrollView>
    </View>
  );
}
