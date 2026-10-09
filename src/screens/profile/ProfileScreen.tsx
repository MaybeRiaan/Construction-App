import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoMark } from '../../art/Logo';
import { levelFor } from '../../domain/game';
import { useTabBarSpace } from '../../navigation/TabBar';
import { useCommunity } from '../../state/CommunityProvider';
import { totalXp, useHunt } from '../../state/hunt';
import { useLocation } from '../../state/LocationProvider';
import { usePlaces } from '../../state/places';
import { useSettings, type ThemePref } from '../../state/settings';
import { toast } from '../../state/ui';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { Icon, type IconName } from '../../ui/Icon';
import { Press } from '../../ui/Press';
import { Segmented } from '../../ui/Segmented';
import { Surface } from '../../ui/Surface';
import { T } from '../../ui/Text';
import { Toggle } from '../../ui/Toggle';

function LinkRow({ icon, title, hint, onPress }: { icon: IconName; title: string; hint?: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Press onPress={onPress} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 }}>
      <View style={[neu(c, 'raisedSm'), { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }]}>
        <Icon name={icon} size={18} />
      </View>
      <View style={{ flex: 1 }}>
        <T variant="bodyStrong">{title}</T>
        {hint ? (
          <T variant="small" tone="muted">
            {hint}
          </T>
        ) : null}
      </View>
      <Icon name="chevronRight" size={18} color={c.muted} />
    </Press>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <T variant="number" style={{ fontSize: 24, lineHeight: 28 }}>
        {value}
      </T>
      <T variant="micro" tone="muted">
        {label}
      </T>
    </View>
  );
}

export function ProfileScreen() {
  const { c } = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const s = useSettings();
  const location = useLocation();
  const community = useCommunity();
  const spots = useHunt((x) => x.spots);
  const claimed = useHunt((x) => x.claimed);
  const saved = usePlaces((x) => Object.keys(x.saved).length);
  const vibes = usePlaces((x) => x.myVibes.length);
  const [editingTeam, setEditingTeam] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const level = levelFor(totalXp({ spots, claimed }));

  const syncLabel =
    community.backend === 'artifact'
      ? community.status === 'live'
        ? 'Shared with everyone who opens this prototype'
        : 'Shared prototype (read-only for you)'
      : community.backend === 'supabase'
        ? 'Synced to Playdar cloud'
        : 'Saved on this device';

  const resetAll = () => {
    useHunt.getState().resetAll();
    usePlaces.getState().resetAll();
    useSettings.getState().resetAll();
    setConfirmReset(false);
    nav.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: tabSpace + 24, paddingHorizontal: 20, gap: 22 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={[neu(c, 'raised'), { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }]}>
            <LogoMark size={50} />
          </View>
          <View style={{ flex: 1 }}>
            <T variant="label" tone="muted">
              Family
            </T>
            {editingTeam ? (
              <Field
                value={s.teamName}
                onChangeText={s.setTeamName}
                autoFocus
                onBlur={() => setEditingTeam(false)}
                onSubmitEditing={() => setEditingTeam(false)}
                accessibilityLabel="Team name"
              />
            ) : (
              <Press onPress={() => setEditingTeam(true)} accessibilityRole="button" accessibilityLabel="Edit team name" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <T variant="h1" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {s.teamName}
                </T>
                <Icon name="pencil" size={16} color={c.muted} />
              </Press>
            )}
          </View>
        </View>

        <Surface depth="raised" radius={radii.lg} style={{ flexDirection: 'row', paddingVertical: 16 }}>
          <Stat value={saved} label="Saved" />
          <Stat value={vibes} label="Vibe checks" />
          <Stat value={spots.length} label="Machines" />
          <Stat value={`L${level.level}`} label={level.title} />
        </Surface>

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <T variant="h2">Kids</T>
            <Button title="Manage" variant="ghost" size="sm" iconRight="chevronRight" onPress={() => nav.navigate('Kids')} />
          </View>
          {s.kids.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {s.kids.map((k) => (
                <View key={k.id} style={[neu(c, 'raisedSm'), { borderRadius: radii.lg, padding: 10, paddingRight: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                  <Avatar id={k.avatar} size={36} />
                  <View>
                    <T variant="bodyStrong">{k.name}</T>
                    <T variant="micro" tone="muted">
                      Age {k.age}
                    </T>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Press onPress={() => nav.navigate('Kids')} accessibilityRole="button" style={[neu(c, 'insetSm'), { borderRadius: radii.lg, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }]}>
              <Icon name="userPlus" size={20} color={c.muted} />
              <T variant="small" tone="soft" style={{ flex: 1 }}>
                Add your kids’ ages to get better suggestions and play Family Race.
              </T>
            </Press>
          )}
        </View>

        <View style={{ gap: 14 }}>
          <T variant="h2">Settings</T>
          <View style={{ gap: 8 }}>
            <T variant="label" tone="muted">
              Appearance
            </T>
            <Segmented<ThemePref>
              options={[
                { value: 'system', label: 'Auto', icon: 'monitor' },
                { value: 'light', label: 'Light', icon: 'sun' },
                { value: 'dark', label: 'Dark', icon: 'moon' },
              ]}
              value={s.themePref}
              onChange={s.setThemePref}
            />
          </View>
          <View style={{ gap: 8 }}>
            <T variant="label" tone="muted">
              Distances
            </T>
            <Segmented
              options={[
                { value: 'km', label: 'Kilometres' },
                { value: 'mi', label: 'Miles' },
              ]}
              value={s.units}
              onChange={s.setUnits}
            />
          </View>
          <View style={{ gap: 8 }}>
            <T variant="label" tone="muted">
              Places
            </T>
            {location.supportsRealLocation ? (
              <Segmented
                options={[
                  { value: 'live', label: 'Near me', icon: 'locate' },
                  { value: 'demo', label: 'Demo town', icon: 'map' },
                ]}
                value={s.dataMode}
                onChange={async (m) => {
                  if (m === 'live' && !(await location.useDeviceLocation())) {
                    toast('Location is off. Turn it on in your phone settings to see places near you.', { tone: 'danger' });
                    return;
                  }
                  s.setDataMode(m);
                }}
              />
            ) : (
              <Surface depth="insetSm" radius={radii.md} style={{ padding: 14 }}>
                <T variant="small" tone="soft">
                  This preview shows Riverbend, a demo town. The phone app imports real places near you from OpenStreetMap.
                </T>
              </Surface>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 }}>
            <View style={{ flex: 1 }}>
              <T variant="bodyStrong">Share named machines</T>
              <T variant="small" tone="muted">
                Other hunters can find and vote on them. Location is rounded; photos with people stay private.
              </T>
            </View>
            <Toggle value={s.sharePublicly} onChange={s.setSharePublicly} label="Share named machines" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: community.status === 'live' ? c.success : c.faint }} />
            <T variant="small" tone="muted">
              {syncLabel}
            </T>
          </View>
        </View>

        <View>
          <LinkRow icon="store" title="Run a kid-friendly venue?" hint="Get featured on Playdar" onPress={() => nav.navigate('Business')} />
          <LinkRow icon="shield" title="Privacy & safety" hint="How we look after families" onPress={() => nav.navigate('About')} />
        </View>

        {confirmReset ? (
          <Surface depth="insetSm" radius={radii.lg} style={{ padding: 16, gap: 12 }}>
            <T variant="bodyStrong">Reset everything on this device?</T>
            <T variant="small" tone="muted">
              This clears your kids, saved places, vibe checks and Hunt progress, then restarts setup.
            </T>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Cancel" variant="soft" style={{ flex: 1 }} onPress={() => setConfirmReset(false)} />
              <Button title="Reset" variant="danger" style={{ flex: 1 }} onPress={resetAll} />
            </View>
          </Surface>
        ) : (
          <Button title="Reset demo data" variant="ghost" icon="refresh" onPress={() => setConfirmReset(true)} />
        )}
        <T variant="micro" tone="faint" center>
          Playdar prototype · Places © OpenStreetMap contributors
        </T>
      </ScrollView>
    </View>
  );
}
