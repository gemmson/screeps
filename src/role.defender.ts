import { defendersFlagName } from "names";
import { maxEnergyForSpawnPerRoom } from "consts";
import { spawnCreep } from "functions";

export class roleDefender {
    public static role: string = "defender"

    public static spawn(energy: number, roomName: string) {
        if (energy < 300) {
            return
        }
        var energyToSpend = Math.min(energy, maxEnergyForSpawnPerRoom);
        var body = Array<BodyPartConstant>();
        while (body.length < 50) {
            if (energyToSpend < 80) {
                break
            }
            energyToSpend -= 80;
            body.push(ATTACK)

            if (energyToSpend < 50) {
                break
            }
            energyToSpend -= 50;
            body.push(MOVE);

            // if (energyToSpend < 10) {
            //     break
            // }
            // energyToSpend -= 10;
            // body.push(TOUGH);
        }
        spawnCreep(roleDefender.role, _.sortByOrder(body, (s) => s, "desc"), roomName, true)
    }

    /** @param {Creep} creep **/
    public static run(creep: Creep) {
        var debug = true;

        // if (creep.memory['working'] === undefined) {
        //     creep.memory["working"] = false;
        // }

        if (creep.memory.working) {
            if (!creep.memory.targetId) {
                creep.memory.working = false;
            }
            else {
                const target = Game.getObjectById(creep.memory.targetId)
                if (!target) {
                    delete creep.memory.targetId
                }
            }

        }

        var attackFlags = _.map(Game.flags, (s) => s).filter((x) => x && x.name.startsWith("dattack"))
        if (attackFlags.length > 0) {
            if (creep.room.name != attackFlags[0].pos.roomName) {
                creep.moveTo(attackFlags[0], { visualizePathStyle: { stroke: '#ffaaaa' } })
                return
            }
        }

        var defendersFlags = _.map(Game.flags, (s) => s).filter((x) => x && x.room && x.room.name == creep.room.name && x.name.startsWith("def"))
        const defendersFlag = defendersFlags.length > 0 ? defendersFlags[0] : null;

        var enemyBuilding = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_SPAWN })
        // if (!enemyBuilding) {
        //     enemyBuilding = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES)
        // }
        if (enemyBuilding && creep.room.controller && !creep.room.controller.safeMode) {
            creep.memory.targetId = enemyBuilding.id
            creep.memory.working = true
        }
        else {
            var enemy = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS)
            if (enemy && enemy.room == creep.room && creep.room.controller && (!creep.room.controller.safeMode || creep.room.controller.my)) {
                creep.memory.working = true;
                creep.memory.targetId = enemy.id;

            }
        }

        if (creep.memory.working == false) {

            if (defendersFlag && defendersFlag.room && defendersFlag.room.name == creep.room.name) {
                const status = creep.moveTo(defendersFlag, debug ? { visualizePathStyle: { stroke: '#aaaaff' } } : undefined)
            }
        }

        if (creep.memory.working) {
            const target = Game.getObjectById(creep.memory.targetId) as Creep | Structure
            if (target) {
                if (creep.attack(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaaaa' } });
                }
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaaaa' } });
            }
        }
        else {
            // nothing to repair -> act as regular wall repairer maybe ?
            //roleWallRepairer.run(creep);
        }
    }
};

// roleDefender.run = registerFNProfiler(roleDefender.run, "roleDefender.run")
