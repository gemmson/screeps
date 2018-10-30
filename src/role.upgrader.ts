import { rechargeAtClosestEnergySource, manageWorkingState, goToMemorizedRoom, createCustomCreep, findClosestNonEmptySourceInRoom, findClosestStorageOrContainer } from "functions";
import { upgraderRoleName } from "names";

export class roleUpgrader {
    public static role: string = upgraderRoleName
    public static spawn(energy: number, roomName?: string) {
        createCustomCreep(energy, roleUpgrader.role, roomName, true, 3000)
    }
    /** @param {Creep} creep **/
    public static run(creep: Creep) {
        var debug = false;
        manageWorkingState(creep, debug);

        if (goToMemorizedRoom(creep, debug)) {
            return
        }

        if (creep.memory.working == false && creep.carry.energy < creep.carryCapacity) {
            let containerWithEnergy
            if (!creep.memory.targetId) {
                const controllerLinks = creep.room.structures.filter(s => s != null && s.structureType == STRUCTURE_LINK && s.room.controller && s.pos.getRangeTo(s.room.controller) <= 3) as StructureLink[]
                if (controllerLinks.length > 0 && controllerLinks[0].energy > 0) {
                    containerWithEnergy = controllerLinks[0]
                } else {
                    containerWithEnergy = findClosestStorageOrContainer(creep)
                }
                if (containerWithEnergy) {
                    creep.memory.targetId = containerWithEnergy.id
                }
            }
            containerWithEnergy = Game.getObjectById(creep.memory.targetId) as StructureContainer | StructureLink | StructureStorage | null
            if (containerWithEnergy) {
                const status = creep.withdraw(containerWithEnergy, RESOURCE_ENERGY)
                if (status == ERR_NOT_IN_RANGE) {
                    creep.moveTo(containerWithEnergy, { reusePath: 15, maxOps: 1700 })
                } else if (status == ERR_NOT_ENOUGH_ENERGY) {
                    delete creep.memory.targetId
                }
            }
            else if (creep.room.findStructureOfType<StructureContainer>(STRUCTURE_CONTAINER).length == 0
                || creep.room.memory.stats.numberOfHarvesters < creep.room.getNumberOfSpotsNearbySources()) {
                const source = findClosestNonEmptySourceInRoom(creep)
                if (!source) {
                    return
                }
                const status = creep.harvest(source)
                if (status == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { reusePath: 15, maxOps: 1700 })
                }
            }
        }
        else {
            delete creep.memory.targetId
            if (creep.room.controller) {
                if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, { range: 3, visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 15, maxOps: 1700 });
                }
                // if (status == 0)
                //     creep.moveInRandomDirection()
            }
        }
    }
};

// roleUpgrader.run = registerFNProfiler(roleUpgrader.run, 'roleUpgrader.run')
