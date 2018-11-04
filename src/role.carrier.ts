import { goToMemorizedRoom, spawnCreep, registerFNProfiler } from "functions";

export class roleCarrier {
    static readonly role: string = "carrier";
    static readonly terminalMaxEnergy = 20000;
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
            if (debug)
                creep.say('Unload');
            creep.memory.working = true;
            delete creep.memory.data
            delete creep.memory.targetId
        }

        // maybe disable that for cpu
        const droppedResourceEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: (s) => s.resourceType == RESOURCE_ENERGY && s.amount > 200 });
        if (droppedResourceEnergy && creep.memory.working == false && creep.carry.energy < creep.carryCapacity) {
            if (creep.pickup(droppedResourceEnergy) == ERR_NOT_IN_RANGE) {
                creep.moveTo(droppedResourceEnergy, { reusePath: 10, maxOps: 1700, maxRooms: 1, visualizePathStyle: { stroke: '#ffffff' } });
            }
            return;
        }

        if (creep.memory.working == false) { // load resources for carry
            if (!creep.memory.data && !creep.memory.targetId) {
                // find target
                const tombstones = creep.room.find(FIND_TOMBSTONES, { filter: (s) => _.sum(s.store) > 0 })
                if (tombstones.length > 0) {
                    let closestTombstone = creep.pos.findClosestByPath(tombstones)
                    closestTombstone = closestTombstone ? closestTombstone : tombstones[0]
                    creep.memory.data = closestTombstone.id
                } else {
                    let containers = Array<Structure>();
                    // find link
                    //containers = creep.room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_LINK && s.energy > 50 && s.id == Memory.links[creep.room.name] }) as Structure[]
                    //containers = creep.room.structures.filter(s=>s.structureType == STRUCTURE_LINK && s.energy > 50 && s.id == Memory.links[creep.room.name])
                    var storageLink = Memory.links[creep.room.name] ? Game.getObjectById<StructureLink>(Memory.links[creep.room.name]) : null
                    if (storageLink && storageLink.energy > 50) {
                        creep.memory.targetId = Memory.links[creep.room.name]
                    } else {
                        // no link - find container
                        //containers = creep.room.find(FIND_STRUCTURES, { filter: (s) => (s.structureType == STRUCTURE_CONTAINER) && s.store.energy > 50 }) as Structure[]
                        containers = creep.room.structures.filter(s => s.structureType == STRUCTURE_CONTAINER && s.store.energy > 50)
                        // containers = _.sortByOrder(containers, (s: StructureContainer) => s.store.energy, "desc")
                        const closestNonEmptyContainer = creep.pos.findClosestByPath(containers)
                        if (closestNonEmptyContainer) {
                            creep.memory.data = closestNonEmptyContainer.id;
                        }
                    }
                    if (!creep.memory.targetId) {
                        //containers = creep.room.find(FIND_STRUCTURES, { filter: (s) => (s.structureType == STRUCTURE_STORAGE) && s.store.energy > 50 }) as Structure[]
                        var storage = creep.room.storage
                        var nonEmptyEnergyDeposits = creep.room.structures.filter(s =>
                            (s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN)
                            && s.energy < s.energyCapacity)
                        // take energy out of storage only if there is other energy deposit to transfer to
                        if (storage && nonEmptyEnergyDeposits.length > 0) {
                            creep.memory.targetId = storage.id
                        }
                    }
                }
            }
            // creep.memory.data = target
            // target assigned
            // Order is
            // 1. tombstones assigned to .data
            // 2. link assigned to targetId, no data so the else if will handle that
            // 3. container assigned to .data, assigned only if there were no tombstones
            // 4. storage assigned to targetId, no tombstones, links nor containers with energy found
            if (creep.memory.data) {
                // delete probably not needed as there should be no targetId when data is present
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
                        creep.moveTo(container, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 15, maxOps: 1700, maxRooms: 1 });
                    }
                } else { // no more resources, find another target
                    delete creep.memory.data
                }
            } else if (creep.memory.targetId) {
                const linkOrStorage = Game.getObjectById(creep.memory.targetId) as StructureLink | StructureStorage | null
                if (!linkOrStorage
                    || (linkOrStorage instanceof StructureLink && linkOrStorage.energy == 0)
                    || (linkOrStorage instanceof StructureStorage && linkOrStorage.store.energy == 0)) {
                    delete creep.memory.targetId
                    return
                }

                const status = creep.withdraw(linkOrStorage, RESOURCE_ENERGY)
                if (status == ERR_NOT_IN_RANGE) {
                    creep.moveTo(linkOrStorage, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 15, maxOps: 1700, maxRooms: 1 });
                }
            }
        }
        else {
            let closestNonEmptyDeposit: Structure | null = null
            if (!creep.memory.targetId) {
                // look for energy deposit
                closestNonEmptyDeposit = this.findClosestNonEmptyDeposit(creep)
                if (closestNonEmptyDeposit) {
                    creep.memory.targetId = closestNonEmptyDeposit.id
                }
            }

            if (!closestNonEmptyDeposit && creep.memory.targetId) {
                closestNonEmptyDeposit = Game.getObjectById<Structure>(creep.memory.targetId)
            }

            if (closestNonEmptyDeposit) {
                if (((closestNonEmptyDeposit instanceof StructureExtension || closestNonEmptyDeposit instanceof StructureSpawn)
                    && closestNonEmptyDeposit.energy == closestNonEmptyDeposit.energyCapacity)
                    || ((closestNonEmptyDeposit instanceof StructureTerminal)
                        && (_.sum(closestNonEmptyDeposit.store) == closestNonEmptyDeposit.storeCapacity
                            || closestNonEmptyDeposit.store.energy >= roleCarrier.terminalMaxEnergy))) {
                    delete creep.memory.targetId
                    closestNonEmptyDeposit = this.findClosestNonEmptyDeposit(creep)
                    if (closestNonEmptyDeposit) {
                        creep.memory.targetId = closestNonEmptyDeposit.id
                    }
                }
                if (closestNonEmptyDeposit && creep.carry.energy > 0) {
                    const status = creep.transfer(closestNonEmptyDeposit, RESOURCE_ENERGY)
                    if (status == ERR_NOT_IN_RANGE) {
                        creep.moveTo(closestNonEmptyDeposit, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 15, maxOps: 1700, maxRooms: 1 });
                    }
                    return
                }
                // let containers = creep.room.find(FIND_STRUCTURES, { filter: (s) => (s.structureType == STRUCTURE_STORAGE) && _.sum(s.store) < s.storeCapacity }) as StructureStorage[]
                // if (containers.length > 0) {
                const storage = creep.room.storage
                if (storage) {
                    const resource = _.findKey(creep.carry, (r) => r > 0) as ResourceConstant | undefined
                    if (resource) {
                        const status = creep.transfer(storage, resource)
                        if (status == ERR_NOT_IN_RANGE) {
                            creep.moveTo(storage, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 15, maxOps: 1700, maxRooms: 1 });
                        }
                    }
                }
            }
            else {
                delete creep.memory.targetId
                if (creep.carry.energy / creep.carryCapacity < 0.3) {
                    creep.memory.working = false
                }
            }
        }
    }

    private static findClosestNonEmptyDeposit(creep: Creep) {
        let closestNonEmptyDeposit: Structure | null = null
        var nonEmptyEnergyDeposits = creep.room.structures.filter(s =>
            (s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN)
            && s.energy < s.energyCapacity)
        closestNonEmptyDeposit = nonEmptyEnergyDeposits.length > 0 ? creep.pos.findClosestByPath(nonEmptyEnergyDeposits) : null
        // no empty extension or spawn to fill, try terminal
        if (!closestNonEmptyDeposit && creep.room.terminal) {
            const terminal = creep.room.terminal
            closestNonEmptyDeposit = terminal.store.energy < roleCarrier.terminalMaxEnergy && _.sum(terminal.store) < terminal.storeCapacity ? terminal : null
        }
        if (!closestNonEmptyDeposit && creep.room.storage) {
            closestNonEmptyDeposit = creep.room.storage
        }
        return closestNonEmptyDeposit
    }
};

roleCarrier.run = registerFNProfiler(roleCarrier.run, 'roleCarrier.run')
