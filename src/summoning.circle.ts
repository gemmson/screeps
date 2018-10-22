import { roleSummoner, SummonerMemory } from "role.summoner";
import { getRandomName } from "functions";

export class SummoningCircle implements ISummoningCircle {
    spawners: ISummoningCircleSpawner[]
    extensions: StructureExtension[];
    summoners: Creep[]
    energySource: StructureLink | StructureContainer | null;
    heart: Flag
    room: Room
    memory: ISummoningCircleMemory

    private readonly allDirections: DirectionConstant[] = [TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT]

    constructor(roomName: string) {
        if (!Memory.rooms[roomName].summoningCircle) {
            console.log(`Initializing summoning circle in ${roomName}`)
            Memory.rooms[roomName].summoningCircle = {
                summoningHeartFlagName: SummoningCircle.getSummoningFlagInRoom(roomName).name,
                extensionsIds: [],
                spawners: [],
                energySourceId: undefined,
                summonersIds: []
            }
        }
        const room = Game.rooms[roomName]
        const roomMemory = room.memory
        this.heart = Game.flags[roomMemory.summoningCircle.summoningHeartFlagName]
        this.room = room
        this.memory = roomMemory.summoningCircle
        if (room.controller) {
            this.spawners = roomMemory.summoningCircle.spawners.map<ISummoningCircleSpawner>(function (s) {
                let spawner: ISummoningCircleSpawner = {
                    spawner: Game.getObjectById(s.spawnerId),
                    extensions: s.extensionsIds.map(extId => Game.getObjectById<StructureExtension>(extId)).filter(x => x != null) as StructureExtension[],
                    summoners: s.summonersIds.map(id => Game.getObjectById<Creep>(id)).filter(x => x != null) as Creep[]
                }
                return spawner
            })
            this.extensions = roomMemory.summoningCircle.extensionsIds.map(extId => Game.getObjectById<StructureExtension>(extId)).filter(x => x != null) as StructureExtension[]
            this.summoners = roomMemory.summoningCircle.summonersIds.map(id => Game.getObjectById<Creep>(id)).filter(x => x != null) as Creep[]
            this.energySource = Game.getObjectById<StructureLink | StructureContainer>(roomMemory.summoningCircle.energySourceId)
        } else {
            this.spawners = []
            this.extensions = []
            this.summoners = []
            this.energySource = null
        }
    }

    public saveToMemory() {
        this.memory.spawners = this.spawners.map<ISummoningCircleSpawnerMemory>(function (s) {
            return {
                spawnerId: s.spawner ? s.spawner.id : undefined,
                extensionsIds: s.extensions.map(x => x.id),
                summonersIds: s.summoners.map(x => x.id)
            }
        })
        this.memory.extensionsIds = this.extensions.map(s => s.id)
        this.memory.summonersIds = this.summoners.map(s => s.id)
        this.memory.energySourceId = this.energySource ? this.energySource.id : undefined
    }

    public bindObjects() {
        if (!this.energySource || Game.time % 100 == 0) {
            const energyContainers = this.heart.pos.look().filter(s => s.structure && (s.structure.structureType == STRUCTURE_LINK || s.structure.structureType == STRUCTURE_CONTAINER))
            if (energyContainers.length > 0) {
                this.energySource = energyContainers[0].structure as StructureLink | StructureContainer
            }
        }
        if (this.memory.spawners.length == 0 || Game.time % 100 == 0) {
            console.log(`Binding new objects for summoning circle in ${this.room.name}`)
            const spawners: ISummoningCircleSpawner[] = []
            const spawns = this.heart.pos.findInRange(FIND_MY_SPAWNS, 2)
            if (spawns.length > 0) {
                spawns.forEach(s => {
                    spawners.push({
                        spawner: s,
                        extensions: s.pos.findInRange(FIND_MY_STRUCTURES, 2, { filter: (str: AnyOwnedStructure) => str.structureType == STRUCTURE_EXTENSION }) as StructureExtension[],
                        summoners: s.pos.findInRange(FIND_MY_CREEPS, 1, { filter: (c: Creep) => c.memory.role == roleSummoner.role })
                    })
                })
            }
            this.spawners = spawners
        }
    }

    public handleSummoners() {
        let recalculate = false
        for (var spawnerName in this.spawners) {
            //console.log(`Handling spawner: ${spawnerName}`)
            const s = this.spawners[spawnerName]
            if (s.spawner) {
                if (s.summoners.length < 2) {
                    //need to spawn summoners, inner first
                    if (s.summoners.length == 0) {
                        this.spawnSummoner(s, true)
                        recalculate = true
                    } else {
                        const summonerMemory = s.summoners[0].memory.data as SummonerMemory
                        this.spawnSummoner(s, !summonerMemory.inner)
                        recalculate = true
                    }
                }
            }
        }
        if (recalculate) {
            this.spawners = []
        }
    }

    private spawnSummoner(s: ISummoningCircleSpawner, inner: boolean): ScreepsReturnCode {
        if (!s.spawner || !this.energySource) {
            return ERR_INVALID_TARGET
        }
        var body = new Array<BodyPartConstant>()
        body.push(CARRY)
        body.push(CARRY)
        body.push(CARRY)

        const name = getRandomName(`${this.room.name} ${roleSummoner.role}`);
        const creepMemory: SummonerMemory = {
            extensionsIds: s.extensions.filter(e => inner ?
                (e.pos.getRangeTo(this.heart) < 3)
                : (e.pos.getRangeTo(this.heart) >= 3)
            ).map(x => x.id),
            inner,
            energySourceId: inner ? this.energySource.id : s.spawner.id,
            spawnId: s.spawner.id
        }
        const spawnDirection = inner ? s.spawner.pos.getDirectionTo(this.heart) : this.heart.pos.getDirectionTo(s.spawner)

        if (!s.spawner.memory.allowedDirections) {
            s.spawner.memory.allowedDirections = this.allDirections
        }
        s.spawner.memory.allowedDirections = _.filter(s.spawner.memory.allowedDirections, d => d != spawnDirection)

        const status = s.spawner.spawnCreep(body, name, {
            memory: {
                role: roleSummoner.role,
                room: this.room.name,
                homeRoom: this.room.name,
                working: false,
                data: creepMemory
            },
            directions: [spawnDirection],
        })
        return status
    }

    public static summoningHeartExistInRoom(roomName: string): boolean {
        if (Memory.rooms[roomName] && Memory.rooms[roomName].summoningCircle && Memory.rooms[roomName].summoningCircle.summoningHeartFlagName) {
            return Memory.rooms[roomName].summoningCircle.summoningHeartFlagName in Game.flags
        }
        const flag = SummoningCircle.getSummoningFlagInRoom(roomName);
        return !!flag
    }

    public static getSummoningFlagInRoom(roomName: string): Flag {
        const flags = _.filter(Game.flags, f => f.room && f.room.name == roomName && f.name.startsWith("sh"));
        return flags[0]
    }
}

export function manageSummons() {
    for (const roomName in Game.rooms) {
        //const room = Game.rooms[roomName]
        if (SummoningCircle.summoningHeartExistInRoom(roomName)) {
            const summoningCircle = new SummoningCircle(roomName)
            summoningCircle.bindObjects()

            summoningCircle.handleSummoners()

            summoningCircle.saveToMemory()
        }
    }
}
