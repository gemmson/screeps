import { spawnCreep, registerFNProfiler } from "functions";

export class roleImporter {
    static role: string = "importer";
    public static spawn(energy: number, roomName: string) {
        if (energy < 300) {
            return
        }
        var energyToSpend = Math.min(energy, 2500)
        var body = Array<BodyPartConstant>();
        while (true) {
            if (energyToSpend < 50) {
                break
            }
            energyToSpend -= 50;
            body.push(MOVE)

            if (energyToSpend < 50) {
                break
            }
            energyToSpend -= 50;
            body.push(CARRY)
        }
        spawnCreep(roleImporter.role, body, roomName)
    }
    public static run(creep: Creep) {
        var debug = false

        if (creep.memory.working == true && creep.carry.energy == 0) {
            if (debug)
                creep.say('Harvest');
            // if (creep.ticksToLive && creep.ticksToLive < 200) {
            //     creep.suicide()
            // }
            creep.memory.working = false;
            delete creep.memory.targetId

        }
        if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
            delete creep.memory.targetId
            if (debug)
                creep.say('Working');
        }

        if (creep.memory.working == false) {

            if (!creep.memory.targetId) {
                // const containers = creep.room.find(FIND_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store.energy > 0 }) as StructureContainer[]
                // if (containers.length > 0 && creep.memory.working == false) {
                //     creep.memory.targetId = _.sortByOrder(containers, (s: StructureContainer) => s.store.energy, "desc")[0].id
                // }
                let storages = _.filter(Game.rooms, r => r.storage).map(r => r.storage) as StructureStorage[]
                if (storages.length > 1) {
                    storages = _.sortBy(storages, s => s.store.energy)
                    const minimumNumberOfEnergy = _.min(storages, s => s.store.energy).store.energy
                    const storagesWithMinimumAmountOfEnergy = storages.filter(s => s.store.energy <= minimumNumberOfEnergy)
                    const storageWithHighestEnergy = storages[storages.length - 1]
                    if (storagesWithMinimumAmountOfEnergy.includes(storageWithHighestEnergy)) {
                        //all storages have 0 energy
                        return
                    } else {
                        creep.memory.targetId = storageWithHighestEnergy.id
                    }
                }
            }

            const storage = Game.getObjectById(creep.memory.targetId) as StructureStorage | null;
            if (storage && storage.store.energy > 0) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    const status = creep.moveTo(storage, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 50, ignoreRoads: true });
                    if (status != OK) {
                        if (debug)
                            creep.say("move er" + status)
                    }
                }
            }
            else {
                //select new container that is not empty
                delete creep.memory.targetId
            }
        }
        else {
            // if (goToRoomByName(creep, creep.memory.homeRoom)) {
            //     delete creep.memory.targetId
            //     return
            // }

            if (!creep.memory.targetId) {
                let storages = _.filter(Game.rooms, r => r.storage).map(r => r.storage) as StructureStorage[]
                if (storages.length > 1) {
                    storages = _.sortBy(storages, s => s.store.energy)
                    const minimumNumberOfEnergy = _.min(storages, s => s.store.energy).store.energy
                    const storagesWithMinimumAmountOfEnergy = storages.filter(s => s.store.energy <= minimumNumberOfEnergy)
                    const storageWithHighestEnergy = storages[storages.length - 1]
                    if (storagesWithMinimumAmountOfEnergy.includes(storageWithHighestEnergy)) {
                        //all storages have 0 energy
                        return
                    } else {
                        const closestStorage = _.min(storagesWithMinimumAmountOfEnergy, s => Game.map.getRoomLinearDistance(creep.room.name, s.room.name))
                        creep.memory.targetId = closestStorage.id
                    }
                }
            }
            //let closestStorage = Game.spawns[spawnName].room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_STORAGE })[0]
            if (creep.memory.targetId) {
                let closestStorage = Game.getObjectById<StructureStorage>(creep.memory.targetId) //Game.structures[creep.memory.targetId]
                if (closestStorage && creep.transfer(closestStorage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    let status = creep.moveTo(closestStorage, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 50, ignoreRoads: true });
                    if (status != OK) {
                        if (debug)
                            creep.say("move er" + status)
                    }
                }
            }
        }
    }
};

roleImporter.run = registerFNProfiler(roleImporter.run, 'roleImporter.run')
