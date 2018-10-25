// example declaration file - remove these and add your own custom typings

// memory extension samples
interface CreepMemory {
  data?: any;
  role: string;
  room?: string;
  homeRoom: string;
  state?: number;
  targetId?: string;
  working: boolean;
}

interface Memory {
  uuid: number;
  log: any;
  roomsWithStorage: Array<string>;
  links: Link;
  assignments: Assignment;
  map: RoomMap;
  maxEnergyCapacityInRooms: number
  allies: string[]
}

interface RoomMap {
  [name: string]: string
}

interface Link {
  [name: string]: string;
}

interface Assignment {
  [assignmentTarget: string]: string;
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any;
  }
}

interface Creep {
  sayHello: () => void
  moveInRandomDirection: () => void
  getHarvestPower: () => number
  optimalMoveToXY(x: number, y: number, opts?: MoveToOpts): CreepMoveReturnCode | ERR_NO_PATH | ERR_INVALID_TARGET;
  optimalMoveTo(target: RoomPosition | { pos: RoomPosition }, opts?: MoveToOpts): CreepMoveReturnCode | ERR_NO_PATH | ERR_INVALID_TARGET | ERR_NOT_FOUND;
}

interface Room extends RoomInternal {
  findStructureOfType<K extends AnyStructure>(structureType: StructureConstant): K[]
  calculateStats(): void
  getTerrain(): RoomTerrain
  getNumberOfSpotsNearbySources(): number
  getSummoningCircle(): ISummoningCircle
  sources: Source[]
}

interface RoomInternal {
  _sources: Source[]
}

interface RoomMemory extends RoomMemoryInternal {
  stats: RoomStats,
  summoningCircle: ISummoningCircleMemory
  spawns: StructureSpawn[]
}

interface RoomMemoryInternal {
  _sourceIds: string[]
}

interface RoomStats {
  numberOfCreeps: number
  previousNumberOfCreeps: number
  numberOfCreepsHasChanged: boolean
  numberOfCarriers: number
  numberOfHarvesters: number
  numberOfTicksWithFullEnergy: number
  numberOfTicksWithoutFullEnergy: number
  totalHarvestPower: number
}

interface ISummoningCircleMemory {
  spawners: ISummoningCircleSpawnerMemory[]
  extensionsIds: string[]
  energySourceId: string | undefined
  summonersIds: string[]
  summoningHeartFlagName: string
}

interface ISummoningCircle {
  spawners: ISummoningCircleSpawner[]
  extensions: StructureExtension[]
  energySource: StructureLink | StructureContainer | null
  summoners: Creep[]
  heart: Flag
  room: Room
  memory: ISummoningCircleMemory
}

interface ISummoningCircleSpawner {
  spawner: StructureSpawn | null
  extensions: StructureExtension[]
  summoners: Creep[]
}

interface ISummoningCircleSpawnerMemory {
  spawnerId: string | undefined
  extensionsIds: string[]
  summonersIds: string[]
}

interface Source {
  getNumberOfNearbyFreeSpots: () => number
}

interface SpawnMemory {
  allowedDirections?: DirectionConstant[]
}

interface StructureObserver {
  observing: string | undefined;
  _observeRoom: (roomName: string) => ScreepsReturnCode
}
