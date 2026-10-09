import type { MachineColour, Rarity, VehicleTypeId } from '../domain/types';

export type VehicleGroup = 'earth' | 'lift' | 'road' | 'concrete' | 'bonus';

export interface VehicleDef {
  id: VehicleTypeId;
  name: string;
  group: VehicleGroup;
  rarity: Rarity;
  /** One kid-friendly sentence: what does it do? */
  job: string;
  facts: string[];
  /** Where you're most likely to see one. */
  lookFor: string;
  /** Words the photo identifier and search map to this type. */
  aliases: string[];
}

export const GROUPS: { id: VehicleGroup; label: string }[] = [
  { id: 'earth', label: 'Earthmovers' },
  { id: 'lift', label: 'Lifters' },
  { id: 'road', label: 'Road crew' },
  { id: 'concrete', label: 'Concrete crew' },
  { id: 'bonus', label: 'Big trucks' },
];

export const RARITY: Record<Rarity, { label: string; xp: number; color: string }> = {
  common: { label: 'Common', xp: 10, color: '#7E8796' },
  uncommon: { label: 'Uncommon', xp: 20, color: '#1F9D63' },
  rare: { label: 'Rare', xp: 40, color: '#2A63F0' },
  legendary: { label: 'Legendary', xp: 80, color: '#B4549B' },
};

export const VEHICLES: VehicleDef[] = [
  {
    id: 'excavator',
    name: 'Excavator',
    group: 'earth',
    rarity: 'common',
    job: 'Digs big holes with a bucket on the end of a long arm.',
    facts: [
      'The arm is called the boom, and the scoop is the bucket.',
      'Its top half can spin all the way around while the tracks stay still.',
      'Big ones can dig out a swimming pool in a single day.',
    ],
    lookFor: 'Building sites, new roads and anywhere there is a big hole.',
    aliases: ['digger', 'excavator', 'track excavator', 'mini digger'],
  },
  {
    id: 'bulldozer',
    name: 'Bulldozer',
    group: 'earth',
    rarity: 'common',
    job: 'Pushes huge piles of dirt and rocks with a giant blade.',
    facts: [
      'The claw on the back is a ripper. It breaks up hard ground.',
      'Its tracks spread its weight so it does not sink in mud.',
    ],
    lookFor: 'Big earthworks, new housing estates and landfill sites.',
    aliases: ['bulldozer', 'dozer', 'crawler'],
  },
  {
    id: 'backhoe',
    name: 'Backhoe loader',
    group: 'earth',
    rarity: 'common',
    job: 'Two machines in one: a scoop on the front and a digger on the back.',
    facts: [
      'The driver spins their seat around to use the digger at the back.',
      'Its legs, called stabilisers, stop it tipping while it digs.',
    ],
    lookFor: 'Roadworks, pipe repairs and farms.',
    aliases: ['backhoe', 'jcb', 'backhoe loader'],
  },
  {
    id: 'wheelLoader',
    name: 'Wheel loader',
    group: 'earth',
    rarity: 'common',
    job: 'Scoops up gravel and sand and loads it into trucks.',
    facts: ['It bends in the middle to steer.', 'Its bucket can hold as much as a small car weighs.'],
    lookFor: 'Quarries, sand yards and big building sites.',
    aliases: ['front loader', 'wheel loader', 'loader', 'payloader'],
  },
  {
    id: 'skidSteer',
    name: 'Skid steer',
    group: 'earth',
    rarity: 'uncommon',
    job: 'A tiny, mighty loader that can spin around on the spot.',
    facts: ['It turns by making one side go faster than the other.', 'It can swap its bucket for forks, brooms or drills.'],
    lookFor: 'Gardens, small sites and stables.',
    aliases: ['skid steer', 'bobcat', 'compact loader'],
  },
  {
    id: 'dumpTruck',
    name: 'Dump truck',
    group: 'earth',
    rarity: 'common',
    job: 'Carries heavy loads and tips them out by lifting its tray.',
    facts: ['A hydraulic ram pushes the tray up to dump the load.', 'Mining dump trucks have tyres taller than a grown-up.'],
    lookFor: 'Roads near building sites, quarries and new estates.',
    aliases: ['dump truck', 'tipper', 'tipper truck', 'dumper'],
  },
  {
    id: 'towerCrane',
    name: 'Tower crane',
    group: 'lift',
    rarity: 'uncommon',
    job: 'Lifts heavy things to the top of tall buildings.',
    facts: [
      'The operator climbs a ladder inside the tower to reach the cab.',
      'The heavy blocks on the short arm are counterweights that stop it tipping.',
      'Tower cranes can build themselves taller as the building grows.',
    ],
    lookFor: 'City centres and anywhere tall buildings are going up.',
    aliases: ['tower crane', 'crane'],
  },
  {
    id: 'mobileCrane',
    name: 'Mobile crane',
    group: 'lift',
    rarity: 'rare',
    job: 'A crane on wheels with an arm that slides out like a telescope.',
    facts: ['It puts down big feet called outriggers before it lifts.', 'Some can lift as much as 100 elephants.'],
    lookFor: 'Bridge works, roof jobs and big deliveries.',
    aliases: ['mobile crane', 'truck crane', 'crawler crane', 'all terrain crane'],
  },
  {
    id: 'telehandler',
    name: 'Telehandler',
    group: 'lift',
    rarity: 'uncommon',
    job: 'A stretchy forklift that reaches up high and far.',
    facts: ['Its arm telescopes out, which is where the name comes from.', 'Farmers use them to stack hay bales.'],
    lookFor: 'House building sites and farms.',
    aliases: ['telehandler', 'telescopic handler', 'manitou'],
  },
  {
    id: 'forklift',
    name: 'Forklift',
    group: 'lift',
    rarity: 'common',
    job: 'Lifts pallets with two strong forks.',
    facts: ['Many forklifts steer with their back wheels.', 'A big weight in the back stops it tipping forward.'],
    lookFor: 'Warehouses, hardware stores and delivery yards.',
    aliases: ['forklift', 'fork lift'],
  },
  {
    id: 'cherryPicker',
    name: 'Cherry picker',
    group: 'lift',
    rarity: 'uncommon',
    job: 'Lifts workers in a bucket up to high places.',
    facts: ['It was named after machines for picking fruit from tall trees.', 'Workers clip in with a harness for safety.'],
    lookFor: 'Street lights, power lines and tree trimming.',
    aliases: ['cherry picker', 'boom lift', 'aerial work platform', 'bucket truck'],
  },
  {
    id: 'roadRoller',
    name: 'Road roller',
    group: 'road',
    rarity: 'uncommon',
    job: 'Squishes new road surfaces flat and smooth with heavy drums.',
    facts: ['Some rollers vibrate to pack the ground down tighter.', 'They spray water on the drums so hot tar does not stick.'],
    lookFor: 'Fresh roadworks, car parks and new footpaths.',
    aliases: ['road roller', 'roller', 'compactor', 'steamroller'],
  },
  {
    id: 'grader',
    name: 'Motor grader',
    group: 'road',
    rarity: 'rare',
    job: 'Makes the ground perfectly flat with a long blade under its belly.',
    facts: ['The blade can tilt and turn to shape the road.', 'Graders keep dirt roads smooth after rain.'],
    lookFor: 'New roads and gravel roads.',
    aliases: ['grader', 'motor grader', 'road grader'],
  },
  {
    id: 'paver',
    name: 'Asphalt paver',
    group: 'road',
    rarity: 'rare',
    job: 'Lays a carpet of hot black asphalt to make new roads.',
    facts: ['Trucks tip hot asphalt into its front hopper.', 'The asphalt can be hotter than a pizza oven.'],
    lookFor: 'Night-time roadworks and new car parks.',
    aliases: ['paver', 'asphalt paver', 'paving machine', 'road paver'],
  },
  {
    id: 'cementMixer',
    name: 'Cement mixer',
    group: 'concrete',
    rarity: 'common',
    job: 'Keeps concrete turning in its drum so it stays runny.',
    facts: ['If the drum stopped, the concrete could set solid inside.', 'Fins inside the drum mix it like a giant whisk.'],
    lookFor: 'Building sites in the morning, when the concrete is poured.',
    aliases: ['cement mixer', 'concrete mixer', 'mixer truck', 'agitator'],
  },
  {
    id: 'concretePump',
    name: 'Concrete pump',
    group: 'concrete',
    rarity: 'rare',
    job: 'Pumps concrete through a long folding arm up to high floors.',
    facts: ['Its arm unfolds like a giant robot elbow.', 'It can reach as high as a 15-storey building.'],
    lookFor: 'Tall buildings on pouring day.',
    aliases: ['concrete pump', 'boom pump'],
  },
  {
    id: 'pileDriver',
    name: 'Pile driver',
    group: 'concrete',
    rarity: 'legendary',
    job: 'Bangs giant poles deep into the ground to hold up buildings and bridges.',
    facts: ['You can often hear it before you see it: BOOM, BOOM, BOOM.', 'The poles are called piles.'],
    lookFor: 'Bridges, piers and big tower foundations.',
    aliases: ['pile driver', 'piling rig', 'piling machine', 'drilling rig'],
  },
  {
    id: 'tractor',
    name: 'Tractor',
    group: 'bonus',
    rarity: 'common',
    job: 'Pulls heavy trailers and farm tools.',
    facts: ['The back wheels are huge to grip muddy fields.', 'Tractors can power tools through a spinning shaft called a PTO.'],
    lookFor: 'Farms, parks and country roads.',
    aliases: ['tractor'],
  },
  {
    id: 'garbageTruck',
    name: 'Garbage truck',
    group: 'bonus',
    rarity: 'common',
    job: 'Collects the rubbish and squashes it down inside.',
    facts: ['A robot arm can lift the bins all by itself.', 'A packer blade inside squeezes the rubbish to fit more in.'],
    lookFor: 'Your street on bin day.',
    aliases: ['garbage truck', 'rubbish truck', 'bin lorry', 'trash truck', 'refuse truck'],
  },
  {
    id: 'fireEngine',
    name: 'Fire engine',
    group: 'bonus',
    rarity: 'uncommon',
    job: 'Carries firefighters, ladders and water to help people.',
    facts: ['It carries its own water tank and pumps.', 'Some ladders reach higher than a 10-storey building.'],
    lookFor: 'Fire stations and open days.',
    aliases: ['fire engine', 'fire truck', 'ladder truck'],
  },
];

export const VEHICLE_BY_ID = Object.fromEntries(VEHICLES.map((v) => [v.id, v])) as Record<VehicleTypeId, VehicleDef>;

export const MACHINE_COLOURS: { id: MachineColour; label: string; swatch: string }[] = [
  { id: 'yellow', label: 'Yellow', swatch: '#FFC21A' },
  { id: 'orange', label: 'Orange', swatch: '#FF8A1F' },
  { id: 'red', label: 'Red', swatch: '#E5484D' },
  { id: 'green', label: 'Green', swatch: '#2E9E62' },
  { id: 'blue', label: 'Blue', swatch: '#2C86F0' },
  { id: 'white', label: 'White', swatch: '#F4F5F7' },
  { id: 'other', label: 'Other', swatch: '#8D94A1' },
];

/** Default body colour for illustrations. */
export const VEHICLE_COLOUR: Partial<Record<VehicleTypeId, MachineColour>> = {
  fireEngine: 'red',
  garbageTruck: 'green',
  tractor: 'green',
  cementMixer: 'orange',
  concretePump: 'orange',
};

const NAME_PARTS: Record<VehicleTypeId, string[]> = {
  excavator: ['Digger Dave', 'Sir Scoops-a-Lot', 'Diggory', 'Bucket Betty', 'Dig Dug Doug'],
  bulldozer: ['Dozer Dan', 'Pushy Pete', 'Bull Bella', 'Rocky Rumble'],
  backhoe: ['Backhoe Bob', 'Two-Face Tess', 'Scoop & Dig', 'Busy Bea'],
  wheelLoader: ['Loader Lou', 'Big Gulp', 'Gravel Grace', 'Scoopy'],
  skidSteer: ['Spinny Skid', 'Little Muscle', 'Bobby Bobcat', 'Tiny Titan'],
  dumpTruck: ['Gravel Gertie', 'Tip Top Tom', 'Dumpy Doris', 'Rumble Ruby'],
  towerCrane: ['Big Bertha', 'Craney McCraneface', 'Sky Hook Sam', 'Tall Tilly'],
  mobileCrane: ['Stretch', 'Lift-a-Lot Lola', 'Hook Hank', 'Reachy Rita'],
  telehandler: ['Stretchy Steph', 'Reach Rick', 'Tele Ted'],
  forklift: ['Forky', 'Pallet Polly', 'Lift Liam'],
  cherryPicker: ['Lady Lift', 'Cherry Cheryl', 'Up-Up Ursula'],
  roadRoller: ['Rolly Polly', 'Flat Pat', 'Squish Sid', 'Smoothie'],
  grader: ['Gary Grader', 'Flat Mat', 'Blade Runner'],
  paver: ['Hot Rod Tar', 'Pavement Pam', 'Smooth Operator'],
  cementMixer: ['Mixy McMixface', 'Spinning Sue', 'Churn Charlie', 'Twirly Shirley'],
  concretePump: ['Robo Arm', 'Pumpy', 'Long Arm Larry'],
  pileDriver: ['Thumper', 'Boom Boom Bruno', 'Bang Bang Bea'],
  tractor: ['Tractor Tim', 'Muddy Max', 'Farmer Fran'],
  garbageTruck: ['Binny', 'Rubbish Rex', 'Trashley', 'Stinky Steve'],
  fireEngine: ['Blaze', 'Sparky', 'Hose-a Rosa', 'Red Rocket'],
};

/** A few playful name suggestions for the naming step. */
export function suggestNames(typeId: VehicleTypeId, seed = Date.now()): string[] {
  const pool = NAME_PARTS[typeId] ?? ['Mighty Machine'];
  const start = Math.abs(Math.floor(seed / 1000)) % pool.length;
  return [0, 1, 2].map((i) => pool[(start + i) % pool.length]).filter((v, i, a) => a.indexOf(v) === i);
}
