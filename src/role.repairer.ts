import { roleBuilder } from "role.builder";
import { rechargeAtClosestEnergySource, manageWorkingState, createCustomCreep } from "functions";

export class roleRepairer {
    public static role: string = "repairer"
    public static spawn(energy: number, roomName?: string) {
        createCustomCreep(energy, roleRepairer.role, roomName, true)
    }
    /** @param {Creep} creep **/
    public static run(creep: Creep) {
        var debug = false;
        manageWorkingState(creep, debug)

        if (creep.memory.working == false && creep.carry.energy < creep.carryCapacity) {
            rechargeAtClosestEnergySource(creep);
        }

        if (creep.memory.working && creep.carry.energy == 0) {
            delete creep.memory.targetId
        }

        if (!creep.memory.targetId) {
            var structures = creep.room.find(FIND_STRUCTURES, {
                filter: (s) =>
                    s.hits < s.hitsMax
                    && s.structureType != STRUCTURE_WALL
                    && s.structureType != STRUCTURE_CONTROLLER
            }
            );
            structures.sort((a, b) => a.hits / a.hitsMax - b.hits / b.hitsMax)
            if (structures.length > 0) {
                creep.memory.targetId = structures[0].id
            }
        }
        if (creep.memory.working && creep.memory.targetId) {
            const target = Game.getObjectById(creep.memory.targetId) as Structure | null
            if (target) {
                var status = creep.repair(target);
                if (status == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 15, maxOps: 1700 });
                }
            } else {
                delete creep.memory.targetId
            }
        }
        else {
            // nothing to repair -> act as builder
            roleBuilder.run(creep);
        }
    }
};

// roleRepairer.run = registerFNProfiler(roleRepairer.run, 'roleRepairer.run')
