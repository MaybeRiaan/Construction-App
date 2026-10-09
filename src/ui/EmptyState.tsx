import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Surface } from './Surface';
import { T } from './Text';

export function EmptyState({ icon, title, body, action, onAction }: { icon: IconName; title: string; body: string; action?: string; onAction?: () => void }) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingVertical: 28, gap: 12 }}>
      <Surface depth="raised" radius={36} style={{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
        <Icon name={icon} size={30} color={c.inkSoft} />
      </Surface>
      <T variant="h3" center>
        {title}
      </T>
      <T variant="body" tone="muted" center style={{ maxWidth: 300 }}>
        {body}
      </T>
      {action ? <Button title={action} onPress={onAction} variant="primary" size="md" style={{ marginTop: 8 }} /> : null}
    </View>
  );
}
