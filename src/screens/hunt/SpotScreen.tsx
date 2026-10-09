import { StackActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VehicleArt } from '../../art/VehicleArt';
import { GROUPS, MACHINE_COLOURS, RARITY, suggestNames, VEHICLE_BY_ID, VEHICLE_COLOUR, VEHICLES } from '../../data/vehicles';
import { FIRST_OF_TYPE_BONUS, NAME_BONUS, PHOTO_BONUS } from '../../domain/game';
import { offset } from '../../domain/geo';
import type { MachineColour, VehicleTypeId } from '../../domain/types';
import type { RootStackParamList } from '../../navigation/types';
import { AiUnavailableError, identifyVehicle, type VehicleGuess } from '../../services/ai';
import { pickPhoto } from '../../services/camera';
import { haptics } from '../../services/haptics';
import type { PhotoAsset } from '../../services/photo';
import { useCommunity } from '../../state/CommunityProvider';
import { useHunt } from '../../state/hunt';
import { useLocation } from '../../state/LocationProvider';
import { useSettings } from '../../state/settings';
import { toast, useUi } from '../../state/ui';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { hazard, radii } from '../../theme/tokens';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { Field } from '../../ui/Field';
import { Icon } from '../../ui/Icon';
import { Pill } from '../../ui/Pill';
import { Press } from '../../ui/Press';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { T } from '../../ui/Text';
import { Toggle } from '../../ui/Toggle';

type Step = 'snap' | 'identify' | 'pick' | 'details';

function Corners({ color }: { color: string }) {
  const L = 28;
  const W = 5;
  const base = { position: 'absolute' as const, width: L, height: L, borderColor: color };
  return (
    <>
      <View style={[base, { top: 12, left: 12, borderTopWidth: W, borderLeftWidth: W, borderTopLeftRadius: 10 }]} />
      <View style={[base, { top: 12, right: 12, borderTopWidth: W, borderRightWidth: W, borderTopRightRadius: 10 }]} />
      <View style={[base, { bottom: 12, left: 12, borderBottomWidth: W, borderLeftWidth: W, borderBottomLeftRadius: 10 }]} />
      <View style={[base, { bottom: 12, right: 12, borderBottomWidth: W, borderRightWidth: W, borderBottomRightRadius: 10 }]} />
    </>
  );
}

function ScanLine({ height }: { height: number }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(y, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [y]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        height: 4,
        borderRadius: 2,
        backgroundColor: hazard.yellow,
        boxShadow: `0px 0px 16px ${hazard.yellow}`,
        transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [20, height - 24] }) }],
      }}
    />
  );
}

export function SpotScreen() {
  const { c } = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Spot'>>();
  const community = useCommunity();
  const { origin } = useLocation();
  const mySpots = useHunt((s) => s.spots);
  const activeHunt = useHunt((s) => s.activeHunt);
  const addSpot = useHunt((s) => s.addSpot);
  const kids = useSettings((s) => s.kids);
  const activeKidId = useSettings((s) => s.activeKidId);
  const sharePublicly = useSettings((s) => s.sharePublicly);
  const teamName = useSettings((s) => s.teamName);
  const setCelebration = useUi((s) => s.setCelebration);

  const famous = params?.foundOf ? community.allSpots.find((s) => s.id === params.foundOf) : undefined;
  const [step, setStep] = useState<Step>('snap');
  const [photo, setPhoto] = useState<PhotoAsset | null>(null);
  const [guess, setGuess] = useState<VehicleGuess | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<VehicleTypeId | null>(famous?.typeId ?? null);
  const [nickname, setNickname] = useState('');
  const [colour, setColour] = useState<MachineColour | null>(null);
  const [kidId, setKidId] = useState<string | null>(activeKidId);
  const [share, setShare] = useState(sharePublicly);
  const ctl = useRef<AbortController | null>(null);

  useEffect(() => () => ctl.current?.abort(), []);

  const hasPeople = Boolean(guess?.hasPeople);
  const firstOfType = typeId ? !mySpots.some((s) => s.typeId === typeId) : false;
  const names = useMemo(() => (typeId ? suggestNames(typeId) : []), [typeId]);
  const xpPreview = typeId
    ? RARITY[VEHICLE_BY_ID[typeId].rarity].xp + (firstOfType ? FIRST_OF_TYPE_BONUS : 0) + (photo ? PHOTO_BONUS : 0) + (nickname.trim() || famous ? NAME_BONUS : 0)
    : 0;

  const runIdentify = async (p: PhotoAsset) => {
    if (!community.ai?.vision) {
      setStep(famous ? 'details' : 'pick');
      return;
    }
    setStep('identify');
    setIdentifying(true);
    setAiNote(null);
    const c2 = new AbortController();
    ctl.current = c2;
    try {
      const g = await identifyVehicle(p, c2.signal);
      if (c2.signal.aborted) return;
      setGuess(g);
      if (g.typeId && !famous) setTypeId(g.typeId);
      if (g.colour) setColour(g.colour);
      if (g.hasPeople) setShare(false);
      haptics.success();
    } catch (e) {
      if (c2.signal.aborted) return;
      const reason = e instanceof AiUnavailableError ? e.reason : 'failed';
      setAiNote(reason === 'declined' ? 'The machine spotter needs permission to look at photos. Pick it yourself instead.' : 'Couldn’t check the photo this time. Pick the machine yourself.');
    } finally {
      setIdentifying(false);
    }
  };

  const choose = async (source: 'camera' | 'library') => {
    try {
      const p = await pickPhoto(source);
      if (!p) return;
      setPhoto(p);
      await runIdentify(p);
    } catch (e) {
      toast(e instanceof Error && e.message === 'permission' ? 'Camera access is off. You can turn it on in Settings.' : 'Couldn’t read that photo. Try another.', { tone: 'danger' });
    }
  };

  const save = () => {
    if (!typeId) return;
    const here = activeHunt?.path.at(-1) ?? origin;
    // In the demo everyone starts in the same spot, so nudge new spots apart a little.
    const jitter = activeHunt ? here : offset(here, (Math.random() - 0.5) * 300, (Math.random() - 0.5) * 300);
    const result = addSpot({
      typeId,
      nickname: famous?.nickname ?? (nickname.trim() || undefined),
      colour: colour ?? VEHICLE_COLOUR[typeId] ?? 'yellow',
      coordinate: famous?.coordinate ?? jitter,
      photo: photo?.thumb,
      ownerId: 'me',
      teamName,
      kidId: kidId ?? undefined,
      isPublic: !famous && share && !hasPeople && Boolean(nickname.trim()),
      foundOf: famous?.id,
      aiConfidence: guess?.typeId === typeId ? guess.confidence : undefined,
      area: famous?.area,
    });
    if (result.spot.isPublic) community.publish(result.spot);
    haptics.success();
    setCelebration({
      kind: famous ? 'found' : 'spot',
      spot: result.spot,
      xp: result.xp,
      firstOfType: result.firstOfType,
      completed: result.completed,
      xpBefore: result.totalXpBefore,
      xpAfter: result.totalXpAfter,
      hadPeople: hasPeople,
    });
    nav.dispatch(StackActions.replace('Celebrate'));
  };

  const v = typeId ? VEHICLE_BY_ID[typeId] : null;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={famous ? `Find ${famous.nickname}` : 'Spot a machine'} close />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 140, gap: 18 }} keyboardShouldPersistTaps="handled">
        {famous ? (
          <View style={{ borderRadius: radii.lg, backgroundColor: hazard.yellow, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <VehicleArt type={famous.typeId} width={70} />
            <T variant="smallStrong" color={hazard.black} style={{ flex: 1 }}>
              Found {famous.nickname} the {VEHICLE_BY_ID[famous.typeId].name.toLowerCase()}? Snap it to add it to your Yard.
            </T>
          </View>
        ) : null}

        {step === 'snap' ? (
          <View style={{ gap: 16 }}>
            <View style={[neu(c, 'inset'), { borderRadius: radii.xl, aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden' }]}>
              <Corners color={hazard.yellow} />
              <VehicleArt type={famous?.typeId ?? 'excavator'} width={170} locked={c.scheme === 'dark' ? '#2F343C' : '#CBD1DA'} />
              <T variant="stencil" tone="muted">
                POINT. SNAP. COLLECT.
              </T>
            </View>
            <Button title="Take a photo" icon="camera" variant="accent" size="lg" full onPress={() => choose('camera')} />
            <Button title="Choose from photos" icon="images" variant="soft" size="lg" full onPress={() => choose('library')} />
            <Button title={famous ? 'No photo, just collect it' : 'No photo, pick it myself'} variant="ghost" onPress={() => setStep(famous ? 'details' : 'pick')} />
            <View style={[neu(c, 'insetSm'), { borderRadius: radii.md, padding: 12, flexDirection: 'row', gap: 10 }]}>
              <Icon name="shield" size={18} color={c.muted} />
              <T variant="small" tone="muted" style={{ flex: 1 }}>
                Snap the machine, not people. Photos with people in them are kept private to your family.
              </T>
            </View>
          </View>
        ) : null}

        {step === 'identify' && photo ? (
          <View style={{ gap: 16 }}>
            <View style={{ borderRadius: radii.xl, overflow: 'hidden', aspectRatio: 4 / 3, backgroundColor: c.well }}>
              <Image source={{ uri: photo.thumb }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <Corners color={hazard.yellow} />
              {identifying ? <ScanLine height={240} /> : null}
            </View>
            {identifying ? (
              <View style={{ alignItems: 'center', gap: 6 }}>
                <T variant="stencil">SCANNING…</T>
                <T variant="small" tone="muted">
                  Our machine spotter is taking a look
                </T>
                <Button title="Pick it myself" variant="ghost" size="sm" onPress={() => (ctl.current?.abort(), setIdentifying(false), setStep('pick'))} />
              </View>
            ) : aiNote ? (
              <View style={{ gap: 12 }}>
                <T variant="body" tone="soft">
                  {aiNote}
                </T>
                <Button title="Pick the machine" icon="grid" onPress={() => setStep('pick')} />
              </View>
            ) : guess ? (
              <View style={{ gap: 14 }}>
                {hasPeople ? (
                  <View style={{ borderRadius: radii.md, backgroundColor: c.well, padding: 12, flexDirection: 'row', gap: 10 }}>
                    <Icon name="shield" size={18} color={c.danger} />
                    <T variant="small" tone="soft" style={{ flex: 1 }}>
                      We can see a person in this photo, so this spot stays private to your family.
                    </T>
                  </View>
                ) : null}
                {guess.typeId ? (
                  <View style={[neu(c, 'raised'), { borderRadius: radii.xl, padding: 16, gap: 10, alignItems: 'center' }]}>
                    <T variant="label" tone="muted">
                      It looks like a…
                    </T>
                    <VehicleArt type={guess.typeId} width={200} colour={guess.colour} />
                    <T variant="stencilXL" center style={{ textTransform: 'uppercase' }}>
                      {VEHICLE_BY_ID[guess.typeId].name}
                    </T>
                    <Pill label={`${Math.round(guess.confidence * 100)}% sure`} tone={guess.confidence > 0.7 ? 'success' : 'sponsored'} />
                    {guess.funFact ? (
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                        <Icon name="lightbulb" size={16} color={c.accentDeep} />
                        <T variant="small" tone="soft" style={{ flex: 1 }}>
                          {guess.funFact}
                        </T>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <T variant="body" tone="soft">
                    {guess.isMachine ? 'That machine is a mystery to us. Which one is it?' : 'We couldn’t see a construction machine in that photo. Which one did you spot?'}
                  </T>
                )}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {guess.typeId ? <Button title="Yes, that’s it!" icon="check" variant="accent" style={{ flex: 1 }} onPress={() => setStep('details')} /> : null}
                  <Button title={guess.typeId ? 'Not quite' : 'Pick it'} variant="soft" style={{ flex: guess.typeId ? 0.8 : 1 }} onPress={() => setStep('pick')} />
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {step === 'pick' ? (
          <View style={{ gap: 18 }}>
            <T variant="h2">Which machine is it?</T>
            {GROUPS.map((g) => (
              <View key={g.id} style={{ gap: 10 }}>
                <T variant="label" tone="muted">
                  {g.label}
                </T>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {VEHICLES.filter((x) => x.group === g.id).map((x) => {
                    const on = typeId === x.id;
                    return (
                      <Press
                        key={x.id}
                        onPress={() => {
                          setTypeId(x.id);
                          setStep('details');
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={x.name}
                        scaleTo={0.95}
                        style={[{ width: '31%', flexGrow: 1, borderRadius: radii.md, padding: 8, alignItems: 'center', gap: 4 }, on ? { backgroundColor: hazard.yellow } : neu(c, 'raisedSm')]}
                      >
                        <VehicleArt type={x.id} width={84} />
                        <T variant="micro" numberOfLines={1} color={on ? hazard.black : c.ink}>
                          {x.name}
                        </T>
                      </Press>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {step === 'details' && v && typeId ? (
          <View style={{ gap: 18 }}>
            <View style={[neu(c, 'raised'), { borderRadius: radii.xl, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
              {photo ? (
                <Image source={{ uri: photo.thumb }} style={{ width: 84, height: 84, borderRadius: radii.md }} />
              ) : (
                <View style={{ width: 84, height: 84, borderRadius: radii.md, backgroundColor: c.scheme === 'dark' ? '#2A2F37' : '#F6F1DC', alignItems: 'center', justifyContent: 'center' }}>
                  <VehicleArt type={typeId} width={74} colour={colour ?? undefined} />
                </View>
              )}
              <View style={{ flex: 1, gap: 4 }}>
                <T variant="stencil" style={{ textTransform: 'uppercase' }}>
                  {v.name}
                </T>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  <Pill label={RARITY[v.rarity].label} tone="neutral" />
                  {firstOfType ? <Pill label="New for your Yard!" tone="accent" icon="sparkles" /> : null}
                </View>
                {!famous ? (
                  <Press onPress={() => setStep('pick')} accessibilityRole="button">
                    <T variant="micro" tone="muted">
                      Wrong machine? Change it
                    </T>
                  </Press>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T variant="number" style={{ fontSize: 24 }}>
                  +{xpPreview}
                </T>
                <T variant="micro" tone="muted">
                  XP
                </T>
              </View>
            </View>

            {!famous ? (
              <View style={{ gap: 10 }}>
                <Field label="Give it a name" value={nickname} onChangeText={(t) => setNickname(t.slice(0, 24))} placeholder={`e.g. ${names[0] ?? 'Mighty Max'}`} hint="Named machines can be voted on and found by other hunters. +5 XP" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {names.map((n) => (
                    <Chip key={n} label={n} size="sm" icon="sparkle" selected={nickname === n} onPress={() => setNickname(n)} />
                  ))}
                </View>
              </View>
            ) : null}

            <View style={{ gap: 10 }}>
              <T variant="label" tone="muted">
                What colour is it?
              </T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {MACHINE_COLOURS.map((m) => {
                  const on = (colour ?? VEHICLE_COLOUR[typeId] ?? 'yellow') === m.id;
                  return (
                    <Press
                      key={m.id}
                      onPress={() => setColour(m.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={m.label}
                      scaleTo={0.9}
                      style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: m.swatch, borderWidth: on ? 4 : 2, borderColor: on ? c.ink : c.line, alignItems: 'center', justifyContent: 'center' }}
                    >
                      {on ? <Icon name="check" size={16} color={m.id === 'white' || m.id === 'yellow' ? '#15171B' : '#FFFFFF'} strokeWidth={3} /> : null}
                    </Press>
                  );
                })}
              </View>
              <T variant="micro" tone="muted">
                Colours count toward the Rainbow hunt.
              </T>
            </View>

            {kids.length ? (
              <View style={{ gap: 10 }}>
                <T variant="label" tone="muted">
                  Who spotted it?
                </T>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Chip label="Everyone" size="sm" icon="users" selected={!kidId} onPress={() => setKidId(null)} />
                  {kids.map((k) => (
                    <Chip key={k.id} label={k.name} size="sm" selected={kidId === k.id} onPress={() => setKidId(k.id)} />
                  ))}
                </View>
              </View>
            ) : null}

            {!famous ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, opacity: hasPeople ? 0.5 : 1 }}>
                <View style={{ flex: 1 }}>
                  <T variant="bodyStrong">Share with other hunters</T>
                  <T variant="small" tone="muted">
                    {hasPeople ? 'Off: this photo has people in it.' : nickname.trim() ? 'Others can vote on the name and find it. Location is rounded.' : 'Give it a name to share it.'}
                  </T>
                </View>
                <Toggle value={share && !hasPeople} onChange={(x) => !hasPeople && setShare(x)} label="Share with other hunters" />
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {step === 'details' && typeId ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: Math.max(insets.bottom, 16), backgroundColor: c.bg }}>
          <Button title={famous ? `Collect ${famous.nickname}` : 'Add to my Yard'} icon="hardHat" variant="accent" size="lg" full onPress={save} />
        </View>
      ) : null}
    </View>
  );
}
