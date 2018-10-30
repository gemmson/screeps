import profiler from 'screeps-profiler';
import { maxEnergyForSpawnPerRoom } from "consts";
import { harvesterRoleName, upgraderRoleName } from 'names';

export const nameof = <T>(name: keyof T) => name;

export function findClosestNonEmptySourceInRoom(creep: Creep): Source | null {
    var sourcesWithEnergy = creep.room.find(FIND_SOURCES, { filter: s => s.energy > 0 })
    return creep.pos.findClosestByPath(sourcesWithEnergy)
}

export function registerFNProfiler<X>(fn: X, name?: string): X {
    if (typeof fn == "function") {
        return profiler.registerFN(fn, name) as any
    }
    throw new Error("Cannot register profiler. Argument is not a function")
}

export const findClosestStorageOrContainer = function findClosestStorageOrContainer(creep: Creep): StructureStorage | StructureLink | null {
    // if (Memory.links[creep.room.name]) {
    //     var link = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_LINK && s.energy > 0 && Memory.links[creep.room.name] == s.id }) as StructureLink | null
    //     if (link) {
    //         return link
    //     }
    // }
    const containers = creep.room.structures.filter(s => (((
        s.structureType == STRUCTURE_STORAGE || s.structureType == STRUCTURE_CONTAINER) && s.store.energy > 100)
        // || Memory.links[creep.room.name] && s.structureType == STRUCTURE_LINK && s.energy > 0 && Memory.links[creep.room.name] == s.id
    )
    )
    let links: StructureLink[] = []
    if (Memory.links[creep.room.name]) {
        const linksResult = creep.room.structures.filter(s => s.structureType == STRUCTURE_LINK && s.energy > 100 && Memory.links[creep.room.name] == s.id) as StructureLink[]
        if (linksResult)
            links = linksResult
    }
    const target = creep.pos.findClosestByPath(containers.concat(links))
    // var target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    //     filter: (s) => (
    //         s.structureType == STRUCTURE_STORAGE || s.structureType == STRUCTURE_CONTAINER) && s.store.energy > 0
    // }) as StructureStorage | StructureLink | null;
    return target as StructureStorage | StructureLink | null;
}

export const rechargeAtClosestEnergySource = function rechargeAtClosestEnergySource(creep: Creep): boolean {
    const storageWithEnergy = findClosestStorageOrContainer(creep)
    if (storageWithEnergy) {
        const status = creep.withdraw(storageWithEnergy, RESOURCE_ENERGY)
        if (status == ERR_NOT_IN_RANGE) {
            creep.moveTo(storageWithEnergy, { maxOps: 1200, reusePath: 10 })
        }
        return true
    }
    return false
    // var source = findClosestNonEmptySourceInRoom(creep);
    // if (source && creep.harvest(source) == ERR_NOT_IN_RANGE) {
    //     creep.moveTo(source, debug ? { visualizePathStyle: { stroke: '#ffffff' } } : undefined);
    // }
}

export const numberOfCreepsInRole = function numberOfCreepsInRole(role: string, room?: string) {
    return _.sum(Game.creeps, (c) => (c.memory.role === role && (!room || c.memory.room == room)) ? 1 : 0);
}

export const createCustomCreep = function createCustomCreep(energy: number, role: string, roomName?: string, onlySpawnInTargetRoom?: boolean, maxEnergy?: number): boolean {
    if (energy < 300) {
        return false
    }
    const maxEnergyToSpend = maxEnergy ? maxEnergy : maxEnergyForSpawnPerRoom
    var energyToSpend = Math.min(energy, maxEnergyToSpend);
    var numberOfBodyParts = Math.floor(energyToSpend / 200) // 100=Work + 50 carry + 50 move
    var body = Array<BodyPartConstant>();
    for (let i = 0; i < numberOfBodyParts; i++) {
        body.push(CARRY)
        body.push(WORK)
        body.push(MOVE)
        energyToSpend -= 200
    }
    // better to have more MOVE to avoid fatigue - maybe
    // if (energyToSpend >= 100) {
    //     body.push(WORK)
    //     energyToSpend -= 100
    // }
    let i = numberOfBodyParts
    while (energyToSpend > 0 && i-- > 0) {
        body.push(MOVE)
        energyToSpend -= 50;
    }
    return spawnCreep(role, body, roomName, onlySpawnInTargetRoom);
}

export const spawnCreep = function spawnCreep(role: string, body: BodyPartConstant[], roomName?: string, onlySpawnInTargetRoom?: boolean): boolean {
    const energy = bodyCost(body)
    const name = getRandomName(`${roomName ? `${roomName} ` : ''}${role}`);
    let freeSpawners = getFreeSpawners(energy, roomName);
    if (freeSpawners.length == 0 && !onlySpawnInTargetRoom) {
        // no spawner in target room, choose any spawner
        freeSpawners = getFreeSpawners(energy);
        freeSpawners = freeSpawners.filter(s => s.energy >= s.energyCapacity * 0.75)
    }
    if (freeSpawners.length > 0) {
        const status = freeSpawners[0].spawnCreep(body, name, {
            memory: { role, room: roomName, working: false, homeRoom: freeSpawners[0].room.name },
            directions: freeSpawners[0].memory.allowedDirections
        })
        if (status == OK) {
            let spawnName = freeSpawners[0].room.name
            Memory["activeSpawners"] = { [spawnName]: true }
            console.log(`### Spawned ${name} creep with energy: ${energy} using spawner: ${freeSpawners[0].name} ###`);
            freeSpawners[0].room.memory.stats.numberOfTicksWithoutFullEnergy = 0;
            return true
        }
        else {
            //console.log(`Not enough energy to spawn ${role} in ${roomName}`)
            return false
        }
    }
    return false
}

export function getMyUsername(): string {
    for (var spawnName in Game.spawns) {
        return Game.spawns[spawnName].owner.username
    }
    throw new Error("Cannot get my username, no spawns found")
}

export function bodyCost(body: BodyPartConstant[]) {
    if (body.length == 0) {
        return 0
    }
    return body.reduce(function (cost, part) {
        return cost + BODYPART_COST[part];
    }, 0);
}

const getFreeSpawners = function getFreeSpawners(energy: number, roomName?: string): StructureSpawn[] {
    let freeSpawners = _.filter(Game.spawns, (s) => !s.spawning
        && !Memory["activeSpawners"][s.name]
        && s.room.energyAvailable >= energy
        && (!roomName || s.room.name == roomName));
    freeSpawners = _.sortByOrder(freeSpawners, (s: StructureSpawn) => s.energy, "desc")
    if (!roomName)
        return freeSpawners.filter(s => s.room.memory.stats.numberOfTicksWithFullEnergy > 15)
    //freeSpawners = _.sortBy(freeSpawners, (s) => Game.map.getRoomLinearDistance(roomName, s.room.name))
    return freeSpawners
}

export function manageWorkingState(creep: Creep, debug: boolean) {
    // if (creep.memory['working'] == undefined) {
    //     creep.memory["working"] = false;
    // }
    if (creep.memory.working == true && creep.carry.energy == 0) {
        creep.memory.working = false;
        if (debug)
            creep.say('Harvest');
    }
    if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
        creep.memory.working = true;
        if (debug)
            creep.say('Working');
    }
}

export const goToMemorizedRoom = registerFNProfiler(function goToMemorizedRoom(creep: Creep, debug?: boolean) {
    if (!creep.memory.room) {
        delete creep.memory.data
        return false
    }
    return goToRoomByName(creep, creep.memory.room)
})

export const goToRoomByName = registerFNProfiler(function goToRoomByName(creep: Creep, roomName: string, debug?: boolean) {
    if (creep.room.name != roomName) {
        try {
            if (!creep.memory.data || (creep.memory.data as RoomPosition).roomName != creep.room.name) {
                const exitToTargetRoom = creep.room.findExitTo(roomName)
                //console.log(`game.room[memory]: ${JSON.stringify(Game.rooms[creep.memory.room])}`)
                if (exitToTargetRoom != ERR_NO_PATH && exitToTargetRoom != ERR_INVALID_ARGS) {
                    const exitToTargetRoomPosition = creep.pos.findClosestByPath(exitToTargetRoom) // maybe filter if position is not blocked
                    if (exitToTargetRoomPosition) {
                        creep.memory.data = exitToTargetRoomPosition
                    }
                }
            }
        } catch (error) {
            creep.say("Error:Room")
            console.log(error)
        }
        if (creep.memory.data) {
            const roomPos = creep.memory.data as RoomPosition
            const pos = new RoomPosition(roomPos.x, roomPos.y, roomPos.roomName)
            const status = creep.moveTo(pos, { reusePath: 35, maxRooms: 1, visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined });
        }

        return true
    }
    // needs test
    delete creep.memory.data
    return false;
})

var names1 = ["Jackson", "Aiden", "Liam", "Lucas", "Noah", "Mason", "Jayden", "Ethan", "Jacob", "Jack", "Caden", "Logan", "Benjamin", "Michael", "Caleb", "Ryan", "Alexander", "Elijah", "James", "William", "Oliver", "Connor", "Matthew", "Daniel", "Luke", "Brayden", "Jayce", "Henry", "Carter", "Dylan", "Gabriel", "Joshua", "Nicholas", "Isaac", "Owen", "Nathan", "Grayson", "Eli", "Landon", "Andrew", "Max", "Samuel", "Gavin", "Wyatt", "Christian", "Hunter", "Cameron", "Evan", "Charlie", "David", "Sebastian", "Joseph", "Dominic", "Anthony", "Colton", "John", "Tyler", "Zachary", "Thomas", "Julian", "Levi", "Adam", "Isaiah", "Alex", "Aaron", "Parker", "Cooper", "Miles", "Chase", "Muhammad", "Christopher", "Blake", "Austin", "Jordan", "Leo", "Jonathan", "Adrian", "Colin", "Hudson", "Ian", "Xavier", "Camden", "Tristan", "Carson", "Jason", "Nolan", "Riley", "Lincoln", "Brody", "Bentley", "Nathaniel", "Josiah", "Declan", "Jake", "Asher", "Jeremiah", "Cole", "Mateo", "Micah", "Elliot"]
var names2 = ["Sophia", "Emma", "Olivia", "Isabella", "Mia", "Ava", "Lily", "Zoe", "Emily", "Chloe", "Layla", "Madison", "Madelyn", "Abigail", "Aubrey", "Charlotte", "Amelia", "Ella", "Kaylee", "Avery", "Aaliyah", "Hailey", "Hannah", "Addison", "Riley", "Harper", "Aria", "Arianna", "Mackenzie", "Lila", "Evelyn", "Adalyn", "Grace", "Brooklyn", "Ellie", "Anna", "Kaitlyn", "Isabelle", "Sophie", "Scarlett", "Natalie", "Leah", "Sarah", "Nora", "Mila", "Elizabeth", "Lillian", "Kylie", "Audrey", "Lucy", "Maya", "Annabelle", "Makayla", "Gabriella", "Elena", "Victoria", "Claire", "Savannah", "Peyton", "Maria", "Alaina", "Kennedy", "Stella", "Liliana", "Allison", "Samantha", "Keira", "Alyssa", "Reagan", "Molly", "Alexandra", "Violet", "Charlie", "Julia", "Sadie", "Ruby", "Eva", "Alice", "Eliana", "Taylor", "Callie", "Penelope", "Camilla", "Bailey", "Kaelyn", "Alexis", "Kayla", "Katherine", "Sydney", "Lauren", "Jasmine", "London", "Bella", "Adeline", "Caroline", "Vivian", "Juliana", "Gianna", "Skyler", "Jordyn"]

export function getRandomName(prefix: string) {
    var name, isNameTaken, tries = 0;
    do {
        var nameArray = Math.random() > .5 ? names1 : names2;
        name = nameArray[Math.floor(Math.random() * nameArray.length)];

        if (tries > 3) {
            name += nameArray[Math.floor(Math.random() * nameArray.length)];
        }

        tries++;
        isNameTaken = Game.creeps[name] !== undefined;
    } while (isNameTaken);

    return prefix + " " + name;
}

Creep.prototype.sayHello = function () {
    // In prototype functions, 'this' usually has the value of the object calling
    // the function. In this case that is whatever creep you are
    // calling '.sayHello()' on.
    this.say("Hello!");
};

Room.prototype.calculateStats = function () {
    if (!this.memory.stats) {
        this.memory.stats = {
            numberOfTicksWithoutFullEnergy: 0,
            numberOfTicksWithFullEnergy: 0,
            totalHarvestPower: 1000,
            numberOfCarriers: 0,
            numberOfHarvesters: 0,
            numberOfCreeps: 0,
            previousNumberOfCreeps: 0,
            numberOfCreepsHasChanged: false
        }
    }
    if (this.energyAvailable === this.energyCapacityAvailable && this.energyCapacityAvailable > 0) {
        this.memory.stats.numberOfTicksWithFullEnergy++
        this.memory.stats.numberOfTicksWithoutFullEnergy = 0
    }
    else {
        this.memory.stats.numberOfTicksWithFullEnergy = 0
        this.memory.stats.numberOfTicksWithoutFullEnergy++
    }
    this.memory.stats.previousNumberOfCreeps = this.memory.stats.numberOfCreeps
    const numberOfCreeps = this.find(FIND_MY_CREEPS)
    if (this.memory.stats.numberOfCreeps != numberOfCreeps.length) {
        this.memory.stats.numberOfCreeps = numberOfCreeps.length
        this.memory.stats.numberOfCreepsHasChanged = true
    } else {
        this.memory.stats.numberOfCreepsHasChanged = false;
    }
    runEveryXTicks(10, () => {
        const harvestersInRoom = _.filter(Game.creeps, c => c.memory.role == harvesterRoleName && c.room.name == this.name)
        let totalHarvestPower = harvestersInRoom.reduce((sum, creep) => sum + creep.getHarvestPower(), 0)
        this.memory.stats.totalHarvestPower = totalHarvestPower
    });
}

export function runEveryXTicks(numberOfTicks: number, callbackFn: () => void) {
    if (Game.time % numberOfTicks == 0) {
        callbackFn()
    }
}


Creep.prototype.moveInRandomDirection = function () {
    var directions = [
        TOP,
        TOP_RIGHT,
        RIGHT,
        BOTTOM_RIGHT,
        BOTTOM,
        BOTTOM_LEFT,
        LEFT,
        TOP_LEFT
    ]
    let index = getRandomIndex(directions)
    let i = 9
    let status = this.move(directions[index])
    while (i-- > 0 && status < 0) {
        let direction = (index++) % directions.length;
        status = this.move(directions[direction])
    }
}

Creep.prototype.getHarvestPower = function () {
    return this.body.filter(x => x.type == WORK).length * HARVEST_POWER
}


Creep.prototype.optimalMoveToXY = function moveTo(x: number, y: number, opts?: MoveToOpts): CreepMoveReturnCode | ERR_NO_PATH | ERR_INVALID_TARGET {
    return this.moveTo(x, y, opts)
}

Creep.prototype.optimalMoveTo = function moveTo(target: RoomPosition | { pos: RoomPosition }, opts?: MoveToOpts): CreepMoveReturnCode | ERR_NO_PATH | ERR_INVALID_TARGET | ERR_NOT_FOUND {
    // let targetPos: RoomPosition
    // if (target && 'pos' in target) {
    //     targetPos = target.pos
    // }
    // else {
    //     targetPos = target
    // }
    // let path = this.room.findPath(this.pos, targetPos, { maxOps: 1000 });
    // const lastStep = path[path.length - 1]
    // const lastStepPos = new RoomPosition(lastStep.x, lastStep.y, this.room.name)
    // if (!path.length || !targetPos.isEqualTo(lastStepPos)) {
    //     path = this.room.findPath(this.pos, targetPos, {
    //         maxOps: 1000, ignoreDestructibleStructures: true
    //     });
    // }
    // if (path.length) {
    //     this.move(path[0].direction);
    // }
    return this.moveTo(target)
}


Room.prototype.findStructureOfType = function <K extends AnyStructure>(structureType: StructureConstant) {
    return this.find(FIND_STRUCTURES, { filter: (s) => s.structureType == structureType }) as K[]
}

Room.prototype.getNumberOfSpotsNearbySources = function getNumberOfSpotsNearbySources(): number {
    return this.find(FIND_SOURCES).reduce((sum, source) => sum + source.getNumberOfNearbyFreeSpots(), 0)
}

function getRandomIndex(array: Array<any>) {
    return Math.round(Math.random() * (array.length - 1));
}

Source.prototype.getNumberOfNearbyFreeSpots = function getNumberOfNearbyFreeSpots(): number {
    const terrain = this.room.getTerrain()
    let numberOfFreeSpots = 0

    for (var i = -1; i < 2; i++) {
        for (var j = -1; j < 2; j++) {
            if (terrain.get(this.pos.x + i, this.pos.y + j) != TERRAIN_MASK_WALL) {
                numberOfFreeSpots++
            }
        }
    }
    return numberOfFreeSpots
}

if (!StructureObserver.prototype._observeRoom) {
    StructureObserver.prototype._observeRoom = StructureObserver.prototype.observeRoom;
    StructureObserver.prototype.observeRoom = function (roomName) {
        if (this.observing)
            return ERR_BUSY;
        let observeResult = this._observeRoom.apply(this, roomName);
        if (observeResult === OK)
            this.observing = roomName;
        return observeResult;
    };
}

Object.defineProperty(Source.prototype, nameof<Source>('memory'), {
    configurable: true,
    get: function () {
        if (_.isUndefined(Memory.sourcesMemory)) {
            Memory.sourcesMemory = {};
        }
        if (!_.isObject(Memory.sourcesMemory)) {
            return undefined;
        }
        return Memory.sourcesMemory[this.id] =
            Memory.sourcesMemory[this.id] || {};
    },
    set: function (value) {
        if (_.isUndefined(Memory.sourcesMemory)) {
            Memory.sourcesMemory = {};
        }
        if (!_.isObject(Memory.sourcesMemory)) {
            throw new Error('Could not set source memory');
        }
        Memory.sourcesMemory[this.id] = value;
    }
});

Object.defineProperty(Room.prototype, nameof<Room>("sources"), {
    get: function (): Source[] {
        const self = this as Room
        // If we dont have the value stored locally
        if (!self._sources) {
            // If we dont have the value stored in memory
            if (!self.memory._sourceIds) {
                // Find the sources and store their id's in memory,
                // NOT the full objects
                this.memory._sourceIds = self.find(FIND_SOURCES)
                    .map(source => source.id);
            }
            // Get the source objects from the id's in memory and store them locally
            self._sources = this.memory._sourceIds.map((id: string) => Game.getObjectById(id));
        }
        // return the locally stored value
        return self._sources;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, nameof<Room>("structures"), {
    get: function (): AnyStructure[] {
        const self = this as Room
        if (!self._structures) {
            if (!self.memory._structureIds || Game.time % 100 == 0) {
                this.memory._structureIds = self.find(FIND_STRUCTURES).map(structure => structure.id);
                // doesn't work
                //this.memory._structureIds = _.filter(Game.structures, s => s.room && s.room.name == self.name).map(structure => structure.id);
            }
            self._structures = this.memory._structureIds.map((id: string) => Game.getObjectById(id));
        }
        // return the locally stored value
        return self._structures;
    },
    enumerable: false,
    configurable: true
});

Object.defineProperty(Room.prototype, nameof<Room>("mineral"), {
    get: function (): Mineral | undefined {
        const self = this as Room
        if (!self._mineral) {
            if (!self.memory._mineralId) {
                const minerals = self.find(FIND_MINERALS)
                self.memory._mineralId = minerals.length > 0 ? minerals[0].id : undefined
            }
            const mineral = Game.getObjectById<Mineral>(self.memory._mineralId)
            self._mineral = mineral != null ? mineral : undefined
        }
        return self._mineral;
    },
    enumerable: false,
    configurable: true
});
