import { rechargeAtClosestEnergySource, manageWorkingState, goToMemorizedRoom, createCustomCreep, findClosestNonEmptySourceInRoom, findClosestStorageOrContainer } from "functions";
import { upgraderRoleName } from "names";

export class roleUpgrader {
    public static role: string = upgraderRoleName
    public static spawn(energy: number, roomName?: string) {
        createCustomCreep(energy, roleUpgrader.role, roomName, true, 1600)
    }
    /** @param {Creep} creep **/
    public static run(creep: Creep) {
        var debug = false;
        manageWorkingState(creep, debug);

        if (goToMemorizedRoom(creep, debug)) {
            return
        }

        if (creep.memory.working == false && creep.carry.energy < creep.carryCapacity) {
            const containerWithEnergy = findClosestStorageOrContainer(creep)
            if (containerWithEnergy) {
                const status = creep.withdraw(containerWithEnergy, RESOURCE_ENERGY)
                if (status == ERR_NOT_IN_RANGE) {
                    creep.moveTo(containerWithEnergy, { reusePath: 15, maxOps: 1700 })
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
            if (creep.room.controller) {
                if (!creep.pos.inRangeTo(creep.room.controller, 2)) {
                    creep.moveTo(creep.room.controller, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 15, maxOps: 1700 });
                }
                const status = creep.upgradeController(creep.room.controller)
                // if (status == 0)
                //     creep.moveInRandomDirection()
            }
        }
    }
};

// roleUpgrader.run = registerFNProfiler(roleUpgrader.run, 'roleUpgrader.run')
