import { maxEnergyForSpawnPerRoom } from "consts";
import { spawnCreep } from "functions";

export class roleRanger {
    public static role: string = "ranger"

    public static spawn(energy: number, roomName: string) {
        if (energy < 300) {
            return
        }
        var energyToSpend = Math.min(energy, maxEnergyForSpawnPerRoom);
        var body = Array<BodyPartConstant>();
        while (body.length < 50) {
            if (energyToSpend < 150) {
                break
            }
            energyToSpend -= 150;
            body.push(RANGED_ATTACK)

            if (energyToSpend < 50) {
                break
            }
            energyToSpend -= 50;
            body.push(MOVE);
        }
        return spawnCreep(roleRanger.role, _.sortByOrder(body, (s) => s, "desc"), roomName, true)
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

        var attackFlags = _.map(Game.flags, (s) => s).filter((x) => x && x.name.startsWith("range"))
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
            if (enemies.length > 0 && (!creep.room.controller || creep.room.controller && !creep.room.controller.safeMode)) {
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
            const lowHits = creep.hits / creep.hitsMax < 0.7
            const target = Game.getObjectById(creep.memory.targetId) as Creep | Structure | null
            let enemyCreep: Creep | null = null
            if (target) {
                if ("body" in target) {
                    enemyCreep = target
                }
                const rangeToTarget = creep.pos.getRangeTo(target)
                if (rangeToTarget > 3 && !lowHits) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#aaffaa' } });
                }
                creep.rangedAttack(target)
                if (rangeToTarget < 3 || lowHits ||
                    (rangeToTarget < 3
                        && enemyCreep
                        && enemyCreep.getActiveBodyparts(ATTACK) > 0
                        && enemyCreep.getActiveBodyparts(RANGED_ATTACK) == 0)) {
                    //move away - simple way
                    // const directionToFromTargetToCreep = target.pos.getDirectionTo(creep)
                    // creep.move(directionToFromTargetToCreep)

                    //cpu intensive
                    // would be better to memorize terrain once
                    roleRanger.runAway(creep, target, lowHits);
                }
            }
        }
        else {
            if (attackFlags.length > 0 && !creep.pos.isEqualTo(attackFlags[0].pos)) {
                creep.moveTo(attackFlags[0], { visualizePathStyle: { stroke: '#ffaaaa' } })
            }
        }
    }

    private static runAway(creep: Creep, target: Creep | Structure<StructureConstant>, lowHits: boolean) {
        const area = creep.room.lookForAtArea(LOOK_TERRAIN, creep.pos.y - 1, creep.pos.x - 1, creep.pos.y + 1, creep.pos.x + 1, true);
        const plains = area.filter(x => x.terrain == "plain");
        let possibleMoveOverPlain = false;
        let minDistance = lowHits ? 4 : 3
        let furthestDistance = 0
        let furthestPos = { x: 25, y: 25 }
        for (let p in plains) {
            const pos = plains[p];
            const rangeToPos = target.pos.getRangeTo(pos.x, pos.y)
            if (rangeToPos >= minDistance) {
                if (rangeToPos > furthestDistance) {
                    furthestDistance = rangeToPos
                    furthestPos = pos
                }
                possibleMoveOverPlain = true;
            }
        }
        if (!possibleMoveOverPlain) {
            for (let p in area) {
                const pos = area[p];
                const rangeToPos = target.pos.getRangeTo(pos.x, pos.y)
                if (rangeToPos >= minDistance) {
                    if (rangeToPos > furthestDistance) {
                        furthestDistance = rangeToPos
                        furthestPos = pos
                    }
                }
            }
        }
        if (furthestDistance >= minDistance) {
            creep.moveTo(furthestPos.x, furthestPos.y, { visualizePathStyle: { stroke: '#aaffaa' } });
        }
    }
};
