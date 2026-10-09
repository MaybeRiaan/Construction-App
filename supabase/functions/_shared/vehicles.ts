/** Machine types the game knows. Keep in sync with src/data/vehicles.ts and the vehicle_types table. */
export const VEHICLES: [id: string, description: string][] = [
  ['excavator', 'excavator / digger with an arm and bucket'],
  ['bulldozer', 'bulldozer / dozer with a front blade'],
  ['backhoe', 'backhoe loader: loader bucket at the front, digger arm at the back'],
  ['wheelLoader', 'wheel loader / front loader'],
  ['skidSteer', 'skid steer / bobcat compact loader'],
  ['dumpTruck', 'dump truck / tipper'],
  ['towerCrane', 'tower crane'],
  ['mobileCrane', 'mobile crane on a truck or crawler'],
  ['telehandler', 'telehandler / telescopic handler'],
  ['forklift', 'forklift'],
  ['cherryPicker', 'cherry picker / boom lift / bucket truck'],
  ['roadRoller', 'road roller / compactor'],
  ['grader', 'motor grader'],
  ['paver', 'asphalt paver'],
  ['cementMixer', 'cement / concrete mixer truck'],
  ['concretePump', 'concrete pump with folding boom'],
  ['pileDriver', 'pile driver / piling rig'],
  ['tractor', 'tractor'],
  ['garbageTruck', 'garbage / rubbish truck'],
  ['fireEngine', 'fire engine / fire truck'],
];

export const COLOURS = ['yellow', 'orange', 'red', 'green', 'blue', 'white', 'other'];
