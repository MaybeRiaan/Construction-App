/**
 * Sample community content for the demo town: machines other families have
 * named, and a weekly leaderboard. Everything here is marked `sample` and is
 * replaced by real shared data when a backend is connected.
 */
import { offset } from '../domain/geo';
import type { LatLng, LeaderboardEntry, Spot, VehicleTypeId } from '../domain/types';

const SAMPLE_SPOTS: [id: string, type: VehicleTypeId, name: string, x: number, y: number, team: string, votes: number, area: string, daysAgo: number][] = [
  ['digger-dave', 'excavator', 'Digger Dave', 980, -380, 'Team Dino', 48, 'Bridge works', 1],
  ['big-bertha', 'towerCrane', 'Big Bertha', 450, 1900, 'The Mud Pies', 61, 'New library build', 3],
  ['thumper', 'pileDriver', 'Thumper', 1060, -470, 'Little Diggers Crew', 37, 'Bridge works', 2],
  ['rolly-polly', 'roadRoller', 'Rolly Polly', -1600, 1200, 'Puddle Jumpers', 52, 'Orbit Ave roadworks', 4],
  ['mixy', 'cementMixer', 'Mixy McMixface', 2300, 700, 'Team Rocket Kids', 73, 'Mill Lane', 2],
  ['gertie', 'dumpTruck', 'Gravel Gertie', -2400, -1300, 'The Mud Pies', 29, 'Southgate estate', 6],
  ['scoops', 'wheelLoader', 'Sir Scoops-a-Lot', 3700, -1700, 'Hard Hat Harriets', 33, 'Station yard', 5],
  ['lady-lift', 'cherryPicker', 'Lady Lift', -300, 2600, 'Team Dino', 21, 'Ladder St', 8],
  ['stretch', 'mobileCrane', 'Stretch', 1150, -300, 'Puddle Jumpers', 44, 'Bridge works', 1],
  ['dozer-dan', 'bulldozer', 'Dozer Dan', -3800, 3200, 'Kestrel Crew', 26, 'Kestrel Heights estate', 9],
  ['gary', 'grader', 'Gary Grader', 4600, -3000, 'Little Diggers Crew', 18, 'Rail trail', 12],
  ['blaze', 'fireEngine', 'Blaze', -800, 2200, 'Team Rocket Kids', 39, 'Fire station', 7],
  ['binny', 'garbageTruck', 'Binny', -200, -1500, 'Hard Hat Harriets', 15, 'Southgate', 3],
  ['tele-ted', 'telehandler', 'Tele Ted', 2900, 2300, 'Kestrel Crew', 12, 'Foundry St', 10],
];

export function demoCommunitySpots(center: LatLng): { spots: Spot[]; votes: Record<string, number> } {
  const votes: Record<string, number> = {};
  const spots = SAMPLE_SPOTS.map(([id, typeId, nickname, x, y, teamName, v, area, daysAgo]): Spot => {
    const spotId = `sample:${id}`;
    votes[spotId] = v;
    return {
      id: spotId,
      typeId,
      nickname,
      coordinate: offset(center, x, y),
      createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
      ownerId: `sample:${teamName}`,
      teamName,
      isPublic: true,
      sample: true,
      area,
    };
  });
  return { spots, votes };
}

export const SAMPLE_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'sample:Team Dino', teamName: 'Team Dino', xp: 1840, spots: 64, types: 17, sample: true },
  { id: 'sample:The Mud Pies', teamName: 'The Mud Pies', xp: 1620, spots: 58, types: 16, sample: true },
  { id: 'sample:Puddle Jumpers', teamName: 'Puddle Jumpers', xp: 1390, spots: 47, types: 15, sample: true },
  { id: 'sample:Team Rocket Kids', teamName: 'Team Rocket Kids', xp: 1210, spots: 41, types: 14, sample: true },
  { id: 'sample:Little Diggers Crew', teamName: 'Little Diggers Crew', xp: 980, spots: 33, types: 12, sample: true },
  { id: 'sample:Hard Hat Harriets', teamName: 'Hard Hat Harriets', xp: 760, spots: 26, types: 11, sample: true },
  { id: 'sample:Kestrel Crew', teamName: 'Kestrel Crew', xp: 540, spots: 19, types: 9, sample: true },
];

/**
 * A drive through Riverbend used to simulate movement during a hunt in the
 * demo (metres from centre). It passes the bridge works, the new library
 * build and the Mill Lane site, so there is plenty to spot.
 */
export const DEMO_ROUTE: [number, number][] = [
  [-150, 250], [300, 120], [800, -120], [1000, -330], [1300, -250], [1900, 150], [2300, 650],
  [2600, 1200], [1900, 1650], [1250, 1750], [600, 1850], [100, 1500], [-600, 1300],
  [-1200, 1150], [-1650, 900], [-1500, 400], [-900, 300], [-400, 260], [-150, 250],
];
