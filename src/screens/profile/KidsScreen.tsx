import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AvatarId } from '../../domain/types';
import { useSettings } from '../../state/settings';
import { neu } from '../../theme/neu';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';
import { Avatar, AVATARS } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { Field } from '../../ui/Field';
import { IconButton } from '../../ui/IconButton';
import { Press } from '../../ui/Press';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { T } from '../../ui/Text';

export function KidsScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const kids = useSettings((s) => s.kids);
  const addKid = useSettings((s) => s.addKid);
  const updateKid = useSettings((s) => s.updateKid);
  const removeKid = useSettings((s) => s.removeKid);
  const [name, setName] = useState('');
  const [age, setAge] = useState(4);
  const [avatar, setAvatar] = useState<AvatarId>('cat');

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title="Kids" />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40, gap: 16 }} keyboardShouldPersistTaps="handled">
        <T variant="body" tone="muted">
          Kids don’t get accounts. Their names stay on this phone and are only used to show who spotted what.
        </T>
        {kids.map((k) => (
          <View key={k.id} style={[neu(c, 'raised'), { borderRadius: radii.lg, padding: 14, gap: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar id={k.avatar} size={44} />
              <View style={{ flex: 1 }}>
                <T variant="h3">{k.name}</T>
                <T variant="small" tone="muted">
                  Age {k.age}
                </T>
              </View>
              <IconButton icon="trash" label={`Remove ${k.name}`} size={38} onPress={() => removeKid(k.id)} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
              {Array.from({ length: 13 }, (_, i) => i).map((a) => (
                <Chip key={a} label={a === 0 ? 'Baby' : String(a)} size="sm" selected={k.age === a} onPress={() => updateKid(k.id, { age: a })} />
              ))}
            </ScrollView>
          </View>
        ))}
        <View style={[neu(c, 'insetSm'), { borderRadius: radii.lg, padding: 16, gap: 14 }]}>
          <T variant="h3">Add a kid</T>
          <Field value={name} onChangeText={setName} placeholder="Name or nickname" accessibilityLabel="Name" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
            {Array.from({ length: 13 }, (_, i) => i).map((a) => (
              <Chip key={a} label={a === 0 ? 'Baby' : String(a)} size="sm" selected={age === a} onPress={() => setAge(a)} />
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {AVATARS.map((a) => (
              <Press key={a.id} onPress={() => setAvatar(a.id)} accessibilityRole="radio" accessibilityState={{ selected: avatar === a.id }} accessibilityLabel={a.id}>
                <Avatar id={a.id} size={38} ring={avatar === a.id ? c.ink : undefined} />
              </Press>
            ))}
          </View>
          <Button
            title="Add"
            icon="plus"
            disabled={!name.trim()}
            onPress={() => {
              addKid(name.slice(0, 20), age, avatar);
              setName('');
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
