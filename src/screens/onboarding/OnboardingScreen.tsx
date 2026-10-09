import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoMark } from '../../art/Logo';
import { VehicleArt } from '../../art/VehicleArt';
import { CATEGORIES } from '../../data/categories';
import { newId } from '../../domain/id';
import type { AvatarId, CategoryId, Kid } from '../../domain/types';
import { useLocation } from '../../state/LocationProvider';
import { useSettings } from '../../state/settings';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { hazard, radii } from '../../theme/tokens';
import { Avatar, AVATARS } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { Field } from '../../ui/Field';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { Press } from '../../ui/Press';
import { T } from '../../ui/Text';

type Step = 'welcome' | 'kids' | 'interests' | 'where';

const STEPS: Step[] = ['welcome', 'kids', 'interests', 'where'];

export function OnboardingScreen() {
  const { c } = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const location = useLocation();
  const complete = useSettings((s) => s.completeOnboarding);
  const [step, setStep] = useState<Step>('welcome');
  const [kids, setKids] = useState<Kid[]>([]);
  const [name, setName] = useState('');
  const [age, setAge] = useState(4);
  const [avatar, setAvatar] = useState<AvatarId>('rocket');
  const [team, setTeam] = useState('');
  const [interests, setInterests] = useState<CategoryId[]>(['parks', 'playgrounds', 'water', 'books']);
  const [busy, setBusy] = useState(false);

  const idx = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(STEPS.length - 1, idx + 1)]);
  const back = () => setStep(STEPS[Math.max(0, idx - 1)]);

  const addKid = () => {
    if (!name.trim()) return;
    setKids((k) => [...k, { id: newId('kid_'), name: name.trim().slice(0, 20), age, avatar }]);
    setName('');
    setAvatar(AVATARS[(AVATARS.findIndex((a) => a.id === avatar) + 1) % AVATARS.length].id);
  };

  const finish = async (live: boolean) => {
    setBusy(true);
    let mode: 'demo' | 'live' = 'demo';
    if (live) mode = (await location.useDeviceLocation()) ? 'live' : 'demo';
    const allKids = name.trim() ? [...kids, { id: newId('kid_'), name: name.trim().slice(0, 20), age, avatar }] : kids;
    complete({ kids: allKids, interests, dataMode: mode, teamName: team.trim() || undefined });
    setBusy(false);
    nav.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12, height: insets.top + 64 }}>
        {idx > 0 ? <IconButton icon="back" label="Back" size={40} onPress={back} /> : <View style={{ width: 40 }} />}
        <View style={{ flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <View key={s} style={{ height: 6, width: i === idx ? 26 : 6, borderRadius: 3, backgroundColor: i <= idx ? c.ink : c.faint, opacity: i <= idx ? 1 : 0.5 }} />
          ))}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 140, gap: 22, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {step === 'welcome' ? (
          <View style={{ gap: 22, flex: 1, justifyContent: 'center' }}>
            <View style={[neu(c, 'raisedLg'), { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }]}>
              <LogoMark size={92} />
            </View>
            <View style={{ gap: 10 }}>
              <T variant="hero" center>
                Find the good stuff nearby.
              </T>
              <T variant="body" tone="muted" center>
                Playdar finds parks, playgrounds, bookshops, splash pads and more around you, rated by local parents on one question: was it a vibe?
              </T>
            </View>
            <View style={{ gap: 12, marginTop: 6 }}>
              {[
                { icon: 'radar' as const, title: 'Your radar', body: 'Widen or shrink your range, from round the corner to a day trip.' },
                { icon: 'sparkles' as const, title: 'Vibe checks', body: 'Honest one-tap ratings from parents who went.' },
                { icon: 'hardHat' as const, title: 'Hard Hat Hunt', body: 'A game for the car ride: spot, snap and name construction machines.' },
              ].map((f) => (
                <View key={f.title} style={[neu(c, 'raisedSm'), { borderRadius: radii.lg, padding: 14, flexDirection: 'row', gap: 14, alignItems: 'center' }]}>
                  <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: f.icon === 'hardHat' ? hazard.yellow : c.ink, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={f.icon} size={20} color={f.icon === 'hardHat' ? hazard.black : c.onInk} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T variant="bodyStrong">{f.title}</T>
                    <T variant="small" tone="muted">
                      {f.body}
                    </T>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {step === 'kids' ? (
          <View style={{ gap: 18 }}>
            <View style={{ gap: 6 }}>
              <T variant="h1">Who’s coming along?</T>
              <T variant="body" tone="muted">
                Ages help us suggest the right places. Names stay on this phone and are never shared.
              </T>
            </View>
            {kids.map((k) => (
              <View key={k.id} style={[neu(c, 'raisedSm'), { borderRadius: radii.lg, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                <Avatar id={k.avatar} size={42} />
                <View style={{ flex: 1 }}>
                  <T variant="bodyStrong">{k.name}</T>
                  <T variant="small" tone="muted">
                    Age {k.age}
                  </T>
                </View>
                <IconButton icon="close" label={`Remove ${k.name}`} size={34} onPress={() => setKids((x) => x.filter((y) => y.id !== k.id))} />
              </View>
            ))}
            <View style={[neu(c, 'raised'), { borderRadius: radii.lg, padding: 16, gap: 14 }]}>
              <Field label="Name or nickname" value={name} onChangeText={setName} placeholder="e.g. Max" onSubmitEditing={addKid} returnKeyType="done" />
              <View style={{ gap: 8 }}>
                <T variant="label" tone="muted">
                  Age
                </T>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  {Array.from({ length: 13 }, (_, i) => i).map((a) => (
                    <Chip key={a} label={a === 0 ? 'Baby' : String(a)} size="sm" selected={age === a} onPress={() => setAge(a)} />
                  ))}
                </ScrollView>
              </View>
              <View style={{ gap: 8 }}>
                <T variant="label" tone="muted">
                  Hunter badge
                </T>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {AVATARS.map((a) => (
                    <Press key={a.id} onPress={() => setAvatar(a.id)} accessibilityRole="radio" accessibilityState={{ selected: avatar === a.id }} accessibilityLabel={a.id}>
                      <Avatar id={a.id} size={40} ring={avatar === a.id ? c.ink : undefined} />
                    </Press>
                  ))}
                </View>
              </View>
              <Button title="Add" icon="plus" variant="soft" onPress={addKid} disabled={!name.trim()} />
            </View>
            <Field label="Family team name (for the Hunt leaderboard)" value={team} onChangeText={(t) => setTeam(t.slice(0, 28))} placeholder="e.g. Team Dino" hint="Shown to other families instead of your name." />
          </View>
        ) : null}

        {step === 'interests' ? (
          <View style={{ gap: 18 }}>
            <View style={{ gap: 6 }}>
              <T variant="h1">What do they love?</T>
              <T variant="body" tone="muted">
                We’ll put these first. You can always see everything.
              </T>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {CATEGORIES.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.label}
                  icon={cat.icon}
                  color={cat.color}
                  selected={interests.includes(cat.id)}
                  onPress={() => setInterests((x) => (x.includes(cat.id) ? x.filter((y) => y !== cat.id) : [...x, cat.id]))}
                />
              ))}
            </View>
            <View style={[neu(c, 'insetSm'), { borderRadius: radii.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
              <VehicleArt type="excavator" width={84} />
              <T variant="small" tone="soft" style={{ flex: 1 }}>
                Little machine fan? Hard Hat Hunt turns every drive into a game. Find it in the Hunt tab.
              </T>
            </View>
          </View>
        ) : null}

        {step === 'where' ? (
          <View style={{ gap: 18, flex: 1 }}>
            <View style={{ gap: 6 }}>
              <T variant="h1">Where’s home base?</T>
              <T variant="body" tone="muted">
                {location.supportsRealLocation
                  ? 'Use your location to pull in real parks, playgrounds and more near you, or look around our demo town first.'
                  : 'This preview runs in Riverbend, our demo town. The phone app uses your real location to find places near you.'}
              </T>
            </View>
            <View style={[neu(c, 'raised'), { borderRadius: radii.xl, padding: 20, gap: 12, alignItems: 'center' }]}>
              <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="radar" size={52} color={hazard.yellow} />
              </View>
              <T variant="bodyStrong" center>
                Your location stays on your phone.
              </T>
              <T variant="small" tone="muted" center>
                We use it to find what’s nearby. Machines you share in the Hunt show a rounded location, never where you are standing.
              </T>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingBottom: Math.max(insets.bottom, 16) + 4, gap: 10, backgroundColor: c.bg }}>
        {step === 'where' ? (
          <>
            {location.supportsRealLocation ? <Button title="Use my location" icon="locate" size="lg" full loading={busy} onPress={() => finish(true)} /> : null}
            <Button
              title={location.supportsRealLocation ? 'Explore the demo town' : 'Explore Riverbend'}
              variant={location.supportsRealLocation ? 'soft' : 'primary'}
              size="lg"
              full
              icon="compass"
              onPress={() => finish(false)}
            />
          </>
        ) : (
          <Button title={step === 'welcome' ? 'Get started' : step === 'kids' && !kids.length && !name.trim() ? 'Skip for now' : 'Continue'} size="lg" full iconRight="arrowRight" onPress={() => (step === 'kids' && name.trim() ? (addKid(), next()) : next())} />
        )}
      </View>
    </View>
  );
}
