import { maxEnergyForSpawnPerRoom } from "consts";
import { spawnCreep } from "functions";

export class roleAttacker {
    public static role: string = "attacker"

    public static spawn(energy: number, roomName: string) {
        if (energy < 300) {
            return
        }
        var energyToSpend = Math.min(energy, maxEnergyForSpawnPerRoom);
        var body = Array<BodyPartConstant>();
        // body.push(TOUGH)
        // body.push(TOUGH)
        // energyToSpend -= 20
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
        }// screeps.com/s/uwqvZG
        spawnCreep(roleAttacker.role, _.sortByOrder(body, (s) => s, "desc"), roomName, true)
    }

    /** @param {Creep} creep **/
    public static run(creep: Creep) {
        var debug = true;

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

        var attackFlags = _.map(Game.flags, (s) => s).filter((x) => x && x.name.startsWith("attack"))
        if (attackFlags.length > 0) {
            if (creep.room.name != attackFlags[0].pos.roomName) {
                creep.moveTo(attackFlags[0], { visualizePathStyle: { stroke: '#ffaaaa' } })
                return
            }
            // if (!creep.pos.isEqualTo(attackFlags[0].pos)) {
            //     creep.moveTo(attackFlags[0], { visualizePathStyle: { stroke: '#ffaaaa' } })
            // }
        }

        var enemyBuildings = creep.room.find(FIND_HOSTILE_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_TOWER })
        if (enemyBuildings.length > 0 && creep.room.controller && !creep.room.controller.safeMode) {
            const closestTower = _.find(enemyBuildings, s => s.structureType == STRUCTURE_TOWER)
            if (closestTower) {
                creep.memory.targetId = closestTower.id
            }
            else {
                const closestBuilding = creep.pos.findClosestByPath(enemyBuildings)
                if (closestBuilding)
                    creep.memory.targetId = closestBuilding.id
            }
            creep.memory.working = true
        }
        else {
            var enemies = creep.room.find(FIND_HOSTILE_CREEPS)
            if (enemies.length > 0 && creep.room.controller && !creep.room.controller.safeMode) {
                const enemiesWithHealParts = _.filter(enemies, c => c.getActiveBodyparts(HEAL) > 0)
                if (enemiesWithHealParts.length > 0) {
                    const closestEnemyWithAttackParts = creep.pos.findClosestByPath(enemiesWithHealParts)
                    if (closestEnemyWithAttackParts)
                        creep.memory.targetId = closestEnemyWithAttackParts.id
                }
                const enemiesWithAttackParts = _.filter(enemies, c => c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK))
                if (enemiesWithAttackParts.length > 0) {
                    const closestEnemyWithAttackParts = creep.pos.findClosestByPath(enemiesWithAttackParts)
                    if (closestEnemyWithAttackParts)
                        creep.memory.targetId = closestEnemyWithAttackParts.id
                }
                const closestEnemyCreep = creep.pos.findClosestByPath(enemies)
                if (closestEnemyCreep) {
                    creep.memory.targetId = closestEnemyCreep.id;
                }
                creep.memory.working = true;
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
            if (attackFlags.length > 0 && !creep.pos.isEqualTo(attackFlags[0].pos)) {
                creep.moveTo(attackFlags[0], { visualizePathStyle: { stroke: '#ffaaaa' } })
            }
        }
    }
};
