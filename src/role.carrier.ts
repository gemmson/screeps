import { goToMemorizedRoom, spawnCreep, registerFNProfiler } from "functions";

export class roleCarrier {
    static role: string = "carrier";
    public static spawn(energy: number, roomName?: string): boolean {
        if (energy < 300) {
            return false
        }
        var energyToSpend = Math.min(energy, 1200);
        var body = [] as any;
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
        return spawnCreep(roleCarrier.role, body, roomName, true)
    }
    public static run(creep: Creep) {
        var debug = false

        if (goToMemorizedRoom(creep, debug)) {
            return
        }

        if (creep.memory.working == true && _.sum(creep.carry) == 0) {
            if (debug)
                creep.say('Load');
            creep.memory.working = false;
            delete creep.memory.data
            delete creep.memory.targetId
        }
        if (creep.memory.working == false && _.sum(creep.carry) == creep.carryCapacity) {
            creep.memory.working = true;
            if (debug)
                creep.say('Unload');
        }

        const droppedResourceEnergy = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, { filter: (s) => s.resourceType == RESOURCE_ENERGY });
        if (droppedResourceEnergy && creep.memory.working == false && creep.carry.energy < creep.carryCapacity) {
            if (creep.pickup(droppedResourceEnergy) == ERR_NOT_IN_RANGE) {
                creep.moveTo(droppedResourceEnergy, { reusePath: 10, maxOps: 1500, visualizePathStyle: { stroke: '#ffffff' } });
            }
            return;
        }

        const tombstones = creep.room.find(FIND_TOMBSTONES, { filter: (s) => _.sum(s.store) > 0 })
        if (tombstones.length > 0 && _.sum(creep.carry) < creep.carryCapacity) {
            let closestTombstone = creep.pos.findClosestByRange(tombstones)
            closestTombstone = closestTombstone ? closestTombstone : tombstones[0]

            if (!creep.memory.working) {
                creep.memory.data = closestTombstone.id
                delete creep.memory.targetId
            }
        }

        var closestNonEmptyEnergyDeposit = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: (s) =>
                (s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN)
                && s.energy < s.energyCapacity,
            maxRooms: 1,
            ignoreRoads: true // with equal number of carry and move we can ignore roads
        })

        if (creep.memory.working == false) { // load resources for carry
            if (!creep.memory.data && !creep.memory.targetId) {
                // find target
                const tombstones = creep.room.find(FIND_TOMBSTONES, { filter: (s) => _.sum(s.store) > 0 })
                if (tombstones.length > 0) {
                    let closestTombstone = creep.pos.findClosestByRange(tombstones)
                    closestTombstone = closestTombstone ? closestTombstone : tombstones[0]
                    creep.memory.data = closestTombstone.id
                } else {
                    let containers = Array<Structure>();
                    containers = creep.room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_LINK && s.energy > 50 && s.id == Memory.links[creep.room.name] }) as Structure[]
                    if (containers.length > 0) {
                        // no need to use find, use link closest to storage from memory
                        //creep.memory.targetId = (creep.pos.findClosestByRange(containers) as StructureLink).id
                        creep.memory.targetId = Memory.links[creep.room.name]
                        if (debug)
                            creep.say("found link")
                    } else {
                        containers = creep.room.find(FIND_STRUCTURES, { filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && s.store.energy > 50 }) as Structure[]
                        // containers = _.sortByOrder(containers, (s: StructureContainer) => s.store.energy, "desc")
                        const closestNonEmptyContainer = creep.pos.findClosestByPath(containers)
                        if (closestNonEmptyContainer) {
                            containers = [closestNonEmptyContainer]
                        }
                    }
                    if (!creep.memory.targetId) {
                        if (containers.length > 0) {
                            creep.memory.data = containers[0].id;
                        } else {
                            containers = creep.room.find(FIND_STRUCTURES, { filter: (s) => (s.structureType == STRUCTURE_STORAGE) && s.store.energy > 50 }) as Structure[]
                            if (containers.length > 0 && closestNonEmptyEnergyDeposit != null) {
                                creep.memory.targetId = containers[0].id
                            }
                        }
                    }
                }
                // creep.memory.data = target
            }
            // target assigned
            if (creep.memory.data) {
                delete creep.memory.targetId
                const container = Game.getObjectById(creep.memory.data) as StructureContainer | Tombstone | null;
                if (!container) {
                    delete creep.memory.data
                    return
                }
                const resource = _.findKey(container.store, (r) => r > 0) as ResourceConstant | undefined
                if (resource) {
                    const status = creep.withdraw(container, resource)
                    if (status == ERR_NOT_IN_RANGE) {
                        creep.moveTo(container, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 15, maxOps: 1700 });
                    }
                }
                else {
                    delete creep.memory.data
                }
            } else if (creep.memory.targetId) {
                const linkOrStorage = Game.getObjectById(creep.memory.targetId) as StructureLink | StructureStorage | null
                if (!linkOrStorage
                    || ("energy" in linkOrStorage && linkOrStorage.energy == 0)
                    || ("store" in linkOrStorage && linkOrStorage.store.energy == 0)) {
                    delete creep.memory.targetId
                    return
                }
                const status = creep.withdraw(linkOrStorage, RESOURCE_ENERGY)
                if (status == ERR_NOT_IN_RANGE) {
                    creep.moveTo(linkOrStorage, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 15, maxOps: 1700 });
                }
            }
        }
        else if (creep.memory.working) {
            delete creep.memory.data
            if (closestNonEmptyEnergyDeposit == null) {
                closestNonEmptyEnergyDeposit = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (s) =>
                        (s.structureType == STRUCTURE_STORAGE)
                        && _.sum(s.store) < s.storeCapacity
                })
            }
            if (closestNonEmptyEnergyDeposit && creep.carry.energy > 0) {
                const status = creep.transfer(closestNonEmptyEnergyDeposit, RESOURCE_ENERGY)
                if (status == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestNonEmptyEnergyDeposit, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 15, maxOps: 1700 });
                }
                return
            }
            let containers = creep.room.find(FIND_STRUCTURES, { filter: (s) => (s.structureType == STRUCTURE_STORAGE) && _.sum(s.store) < s.storeCapacity }) as StructureStorage[]
            if (containers.length > 0) {
                const resource = _.findKey(creep.carry, (r) => r > 0) as ResourceConstant | undefined
                if (resource) {
                    const status = creep.transfer(containers[0], resource)
                    if (status == ERR_NOT_IN_RANGE) {
                        creep.moveTo(containers[0], { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 15, maxOps: 1700 });
                    }
                }
            }
            else {
                // const resource = _.findKey(creep.carry, (r) => r > 0) as ResourceConstant | undefined
                // if (resource) {
                //     creep.drop(resource)
                // }
                if (creep.carry.energy / creep.carryCapacity < 0.3) {
                    creep.memory.working = false
                }
            }
        }
    }
};

roleCarrier.run = registerFNProfiler(roleCarrier.run, 'roleCarrier.run')
