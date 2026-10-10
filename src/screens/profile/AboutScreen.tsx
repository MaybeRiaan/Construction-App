import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';
import { Icon, type IconName } from '../../ui/Icon';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { T } from '../../ui/Text';

const POINTS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'users', title: 'Parents hold the account', body: 'Kids never sign up, chat or post on their own. Their names and ages stay on your phone.' },
  { icon: 'pin', title: 'No live locations', body: 'Shared machines show a location rounded to about 150 m, so nobody can tell where a child is standing.' },
  { icon: 'scan', title: 'Photos with people stay private', body: 'Every shared photo is checked for people and faces. If any are found, the spot is kept to your family.' },
  { icon: 'thumbsUp', title: 'Names, not people, get votes', body: 'Other families vote on machine names. There are no comments, followers or direct messages.' },
  { icon: 'star', title: 'Ads are labelled', body: 'Partner venues are marked as partners and never change ratings or the order of results.' },
  { icon: 'sparkles', title: 'One family, one vibe', body: 'Each family gets one vibe check per place, so ratings reflect real visits.' },
  { icon: 'listChecks', title: 'Added places are checked', body: 'Places parents add are checked by a person before they go live. No homes or schools, and the parent shows only as “Parent of 2”.' },
  { icon: 'globe', title: 'Open data', body: 'Live places come from OpenStreetMap. Missing a favourite? Add it from the Explore map and it helps everyone.' },
];

export function AboutScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title="Privacy & safety" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 14 }}>
        <T variant="hero" style={{ marginBottom: 6 }}>
          Built for families, not feeds.
        </T>
        {POINTS.map((p) => (
          <View key={p.title} style={[neu(c, 'raisedSm'), { borderRadius: radii.lg, padding: 16, flexDirection: 'row', gap: 14 }]}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={p.icon} size={18} color={c.onInk} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <T variant="bodyStrong">{p.title}</T>
              <T variant="small" tone="muted">
                {p.body}
              </T>
            </View>
          </View>
        ))}
        <T variant="micro" tone="faint" center style={{ marginTop: 10 }}>
          Map data © OpenStreetMap contributors, available under the Open Database Licence.
        </T>
      </ScrollView>
    </View>
  );
}
