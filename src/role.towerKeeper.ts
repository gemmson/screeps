import { rechargeAtClosestEnergySource, createCustomCreep, registerFNProfiler } from "functions";
import { roleRepairer } from "role.repairer";
import { maxEnergyForSpawnPerRoom } from "consts";

export class roleTowerKeeper {
    public static role: string = "towerkeeper"
    public static spawn(energy: number, roomName?: string) {
        createCustomCreep(energy, roleTowerKeeper.role, roomName, true, maxEnergyForSpawnPerRoom)
    }
    /** @param {Creep} creep **/
    public static run(creep: Creep) {
        var debug = false;
        if (debug) {
            creep.say("TowerKeep")
        }
        // if (creep.memory['working'] === undefined) {
        //     creep.memory["working"] = false;
        // }

        if (creep.memory.working == true && creep.carry.energy == 0) {
            creep.memory.working = false;
            if (debug)
                creep.say('Harvest');
            delete creep.memory.targetId;
        }
        if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
        }

        if (creep.memory.working == false) {
            rechargeAtClosestEnergySource(creep);
        }
        else {
            if (!creep.memory.targetId) {
                var towers = creep.room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity }) as StructureTower[];
                if (towers.length > 0) {
                    towers.sort((a, b) => a.energy - b.energy);
                    creep.memory.targetId = towers[0].id
                }
            }
            if (creep.memory.targetId) {
                var targetTower = Game.getObjectById(creep.memory.targetId) as StructureTower;
                if (!targetTower || targetTower.energy == targetTower.energyCapacity) {
                    delete creep.memory.targetId;
                    return;
                }
                if (creep.transfer(targetTower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetTower, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 15, maxOps: 1500, maxRooms: 1 });
                }
            }
            // needs fix for constant switching between roles and deleting targetId
            // else if (creep.room.find(FIND_HOSTILE_CREEPS, { filter: c => !Memory.allies.includes(c.owner.username) }).length == 0) {
            //     roleRepairer.run(creep)
            // }
        }
    }
};

roleTowerKeeper.run = registerFNProfiler(roleTowerKeeper.run, 'roleTowerKeeper.run')
