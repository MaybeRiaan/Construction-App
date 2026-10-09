import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { hazard, radii } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { Icon, type IconName } from '../../ui/Icon';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { T } from '../../ui/Text';
import { toast } from '../../state/ui';

const TIERS: { name: string; price: string; icon: IconName; points: string[]; highlight?: boolean }[] = [
  {
    name: 'Claimed listing',
    price: 'Free',
    icon: 'badgeCheck',
    points: ['Verified badge', 'Edit hours, photos and amenities', 'Reply to vibe checks'],
  },
  {
    name: 'Featured',
    price: 'From $49 / month',
    icon: 'star',
    points: ['Spot in the Featured row near you', 'Highlighted map pin', 'One live offer for Playdar families'],
    highlight: true,
  },
  {
    name: 'Event boost',
    price: 'From $19 / event',
    icon: 'ticket',
    points: ['Top of “Happening soon”', 'Reminder for families who saved you'],
  },
];

/** Sponsorship pitch for venues. Prototype: the form doesn't send anything yet. */
export function BusinessScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [venue, setVenue] = useState('');
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title="For venues" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 8 }}>
          <T variant="hero">Get found by local families.</T>
          <T variant="body" tone="muted">
            Parents open Playdar when they need something to do right now. Featured venues show up first in the carousel and on the map, clearly labelled as partners.
          </T>
        </View>
        <View style={{ borderRadius: radii.lg, backgroundColor: c.ink, padding: 16, gap: 10 }}>
          <T variant="label" color={hazard.yellow}>
            Our promise to parents
          </T>
          <T variant="body" color={c.onInk}>
            Partners never change vibe scores, never get hidden reviews, and never move up the organic list. Trust is the product.
          </T>
        </View>
        {TIERS.map((t) => (
          <View key={t.name} style={[neu(c, 'raised'), { borderRadius: radii.lg, padding: 16, gap: 10 }, t.highlight && { borderWidth: 2, borderColor: hazard.yellow }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.highlight ? hazard.yellow : c.well, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={t.icon} size={19} color={t.highlight ? hazard.black : c.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <T variant="h3">{t.name}</T>
                <T variant="smallStrong" tone="muted">
                  {t.price}
                </T>
              </View>
            </View>
            {t.points.map((p) => (
              <View key={p} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Icon name="check" size={15} color={c.success} strokeWidth={3} />
                <T variant="small" tone="soft">
                  {p}
                </T>
              </View>
            ))}
          </View>
        ))}
        <View style={[neu(c, 'insetSm'), { borderRadius: radii.lg, padding: 16, gap: 12 }]}>
          <T variant="h3">Register interest</T>
          <Field value={venue} onChangeText={setVenue} placeholder="Venue name" accessibilityLabel="Venue name" />
          <Button
            title="I’m interested"
            disabled={!venue.trim()}
            onPress={() => {
              toast('Noted! In the full app this goes to the Playdar partner team.', { icon: 'store' });
              setVenue('');
            }}
          />
          <T variant="micro" tone="muted">
            Prototype: nothing is sent yet.
          </T>
        </View>
      </ScrollView>
    </View>
  );
}
