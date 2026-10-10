import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AddPlaceScreen } from '../screens/contribute/AddPlaceScreen';
import { ReviewScreen } from '../screens/contribute/ReviewScreen';
import { ScoutScreen } from '../screens/contribute/ScoutScreen';
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { FiltersScreen } from '../screens/explore/FiltersScreen';
import { SearchScreen } from '../screens/explore/SearchScreen';
import { CelebrateScreen } from '../screens/hunt/CelebrateScreen';
import { ChallengesScreen } from '../screens/hunt/ChallengesScreen';
import { FameScreen } from '../screens/hunt/FameScreen';
import { HuntScreen } from '../screens/hunt/HuntScreen';
import { LeaderboardScreen } from '../screens/hunt/LeaderboardScreen';
import { SpotDetailScreen } from '../screens/hunt/SpotDetailScreen';
import { SpotScreen } from '../screens/hunt/SpotScreen';
import { VehicleScreen } from '../screens/hunt/VehicleScreen';
import { YardScreen } from '../screens/hunt/YardScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { PlaceScreen } from '../screens/place/PlaceScreen';
import { VibeCheckScreen } from '../screens/place/VibeCheckScreen';
import { AboutScreen } from '../screens/profile/AboutScreen';
import { BusinessScreen } from '../screens/profile/BusinessScreen';
import { KidsScreen } from '../screens/profile/KidsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SavedScreen } from '../screens/saved/SavedScreen';
import { useSettings } from '../state/settings';
import { useTheme } from '../theme/ThemeProvider';
import { presentation, Stack } from './stack';
import { TabBar } from './TabBar';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  const { c } = useTheme();
  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.bg } }}>
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Hunt" component={HuntScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { c } = useTheme();
  const onboarded = useSettings((s) => s.onboarded);
  const card = presentation('card', c.bg);
  const modal = presentation('modal', c.bg);
  return (
    <Stack.Navigator initialRouteName={onboarded ? 'Tabs' : 'Onboarding'} screenOptions={card}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={presentation('fade', c.bg)} />
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="Place" component={PlaceScreen} />
      <Stack.Screen name="VibeCheck" component={VibeCheckScreen} options={modal} />
      <Stack.Screen name="Search" component={SearchScreen} options={presentation('fade', c.bg)} />
      <Stack.Screen name="Filters" component={FiltersScreen} options={presentation('sheet', c.bg)} />
      <Stack.Screen name="Spot" component={SpotScreen} options={modal} />
      <Stack.Screen name="Celebrate" component={CelebrateScreen} options={presentation('fade', '#15171B')} />
      <Stack.Screen name="SpotDetail" component={SpotDetailScreen} />
      <Stack.Screen name="Yard" component={YardScreen} />
      <Stack.Screen name="Vehicle" component={VehicleScreen} />
      <Stack.Screen name="Challenges" component={ChallengesScreen} />
      <Stack.Screen name="Fame" component={FameScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="Kids" component={KidsScreen} />
      <Stack.Screen name="Business" component={BusinessScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="AddPlace" component={AddPlaceScreen} options={modal} />
      <Stack.Screen name="Scout" component={ScoutScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />
    </Stack.Navigator>
  );
}
