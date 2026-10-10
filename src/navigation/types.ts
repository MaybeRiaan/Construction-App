import type { NavigatorScreenParams } from '@react-navigation/native';
import type { VehicleTypeId } from '../domain/types';

export type TabParamList = {
  Explore: undefined;
  Saved: undefined;
  Hunt: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Place: { id: string };
  VibeCheck: { id: string };
  Search: { ask?: boolean } | undefined;
  Filters: undefined;
  Spot: { foundOf?: string } | undefined;
  SpotDetail: { id: string };
  Celebrate: undefined;
  Yard: undefined;
  Vehicle: { id: VehicleTypeId };
  Challenges: undefined;
  Fame: undefined;
  Leaderboard: undefined;
  Kids: undefined;
  Business: undefined;
  About: undefined;
  AddPlace: undefined;
  Scout: undefined;
  Review: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
