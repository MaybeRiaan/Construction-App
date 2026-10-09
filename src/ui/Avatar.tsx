import { View } from 'react-native';
import type { AvatarId } from '../domain/types';
import { Icon, type IconName } from './Icon';

export const AVATARS: { id: AvatarId; icon: IconName; bg: string }[] = [
  { id: 'rocket', icon: 'rocket', bg: '#FFC21A' },
  { id: 'cat', icon: 'cat', bg: '#F2711C' },
  { id: 'dog', icon: 'dog', bg: '#2E9E62' },
  { id: 'bird', icon: 'bird', bg: '#2C86F0' },
  { id: 'fish', icon: 'fish', bg: '#0F9C8F' },
  { id: 'rabbit', icon: 'rabbit', bg: '#E8457A' },
  { id: 'turtle', icon: 'turtle', bg: '#7556F2' },
  { id: 'panda', icon: 'panda', bg: '#4A5363' },
];

export const AVATAR_BY_ID = Object.fromEntries(AVATARS.map((a) => [a.id, a])) as Record<AvatarId, (typeof AVATARS)[number]>;

export function Avatar({ id, size = 40, ring }: { id: AvatarId; size?: number; ring?: string }) {
  const a = AVATAR_BY_ID[id] ?? AVATARS[0];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: a.bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 3 : 0,
        borderColor: ring,
      }}
    >
      <Icon name={a.icon} size={size * 0.52} color={a.id === 'rocket' ? '#15171B' : '#FFFFFF'} strokeWidth={2.2} />
    </View>
  );
}
