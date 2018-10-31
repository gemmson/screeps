import { goToMemorizedRoom, spawnCreep, registerFNProfiler, goToRoomByName } from "functions";

export class roleOutsiderEnergyCarrier {
    static role: string = "outsiderEnergyCarrier";
    public static spawn(energy: number, roomName: string) {
        if (energy < 300) {
            return
        }
        var energyToSpend = energy
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
            if (energyToSpend < 50) {
                break
            }
            energyToSpend -= 50;
            body.push(CARRY)
        }
        spawnCreep(roleOutsiderEnergyCarrier.role, body, roomName)
    }
    public static run(creep: Creep) {
        var debug = false

        if (creep.memory.working == true && creep.carry.energy == 0) {
            if (debug)
                creep.say('Harvest');
            if (creep.ticksToLive && creep.ticksToLive < 200) {
                creep.suicide()
            }
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
            if (goToMemorizedRoom(creep, debug)) {
                return
            }

            if (!creep.memory.targetId) {
                const containers = creep.room.find(FIND_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store.energy > 0 }) as StructureContainer[]
                if (containers.length > 0 && creep.memory.working == false) {
                    creep.memory.targetId = _.sortByOrder(containers, (s: StructureContainer) => s.store.energy, "desc")[0].id
                }
            }

            const container = Game.getObjectById(creep.memory.targetId) as StructureContainer | StructureStorage | null;
            if (container && container.structureType == STRUCTURE_CONTAINER && container.store.energy > 0) {
                if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    const status = creep.moveTo(container, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 50 });
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
            if (goToRoomByName(creep, creep.memory.homeRoom)) {
                delete creep.memory.targetId
                return
            }

            if (!creep.memory.targetId) {
                const storage = creep.room.storage
                if (storage) {
                    creep.memory.targetId = storage.id
                }
            }
            //let closestStorage = Game.spawns[spawnName].room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_STORAGE })[0]
            if (creep.memory.targetId) {
                let closestStorage = Game.structures[creep.memory.targetId]
                if (closestStorage && creep.transfer(closestStorage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    let status = creep.moveTo(closestStorage, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 50 });
                    if (status != OK) {
                        if (debug)
                            creep.say("move er" + status)
                    }
                }
            }
        }
    }
};

roleOutsiderEnergyCarrier.run = registerFNProfiler(roleOutsiderEnergyCarrier.run, 'roleOutsiderEnergyCarrier.run')
