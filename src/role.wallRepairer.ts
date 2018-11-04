import { rechargeAtClosestEnergySource, createCustomCreep, registerFNProfiler } from "functions";
import { roleRepairer } from "role.repairer";
import { maxEnergyForSpawnPerRoom } from "consts";

export class roleWallRepairer {
    public static role: string = "wallrepairer"
    public static spawn(energy: number, roomName?: string) {
        createCustomCreep(energy, roleWallRepairer.role, roomName, true, maxEnergyForSpawnPerRoom)
    }
    /** @param {Creep} creep **/
    public static run(creep: Creep) {
        var debug = false;

        if (creep.memory.working && creep.carry.energy == 0) {
            delete creep.memory.data
            creep.memory.working = false;
            if (debug)
                creep.say('Restoring');
        }
        if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            var structures = this.findStructuresToRepairOrderedByLowestHits(creep)
            if (structures.length > 0) {
                creep.memory.data = structures[0].id;
                creep.memory.working = true;
            }
        }

        if (creep.memory.working == false && creep.carry.energy < creep.carryCapacity) {
            rechargeAtClosestEnergySource(creep);
        }
        else if (creep.memory.working && creep.memory.data) {
            var status = creep.repair(Game.getObjectById(creep.memory.data) as any);
            if (status == ERR_NOT_IN_RANGE) {
                creep.moveTo(Game.getObjectById(creep.memory.data) as any, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 15, maxOps: 1700 });
            }
        }
        else {
            // nothing to repair -> act as regular repairer
            roleRepairer.run(creep);
        }
    }

    private static findStructuresToRepairOrderedByLowestHits(creep: Creep) {
        var structures = creep.room.find(FIND_STRUCTURES, {
            filter: (s) =>
                (s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL)
                && s.hits < Math.min(s.hitsMax, NUKE_DAMAGE[0] + 1000000)
        }
        );

        // sort asc by hits
        structures.sort((a, b) => a.hits - b.hits);
        return structures;
    }
};

roleWallRepairer.run = registerFNProfiler(roleWallRepairer.run, 'roleWallRepairer.run')
