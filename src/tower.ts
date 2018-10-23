import { registerFNProfiler } from "functions";

export const towerAttack = registerFNProfiler(function towerAttack() {
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName]

        if (room.controller) {
            const spawnWithNonFullHits = room.find(FIND_MY_SPAWNS, { filter: s => s.hits < s.hitsMax })
            if (spawnWithNonFullHits.length > 0) {
                room.controller.activateSafeMode()
            }
        }

        const towers = room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_TOWER && s.energy > 0 }) as StructureTower[];

        var hostiles = room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length > 0) {
            const hostileName = hostiles[0].owner.username;
            var message = `User ${hostileName} spotted in room ${roomName}`;
            if (hostileName != "Invader") {
                Game.notify(message);
            }
            Memory["message"] = `${message} at ${new Date().toISOString()}`
            towers.forEach(tower => {
                var enemies = room.find(FIND_HOSTILE_CREEPS);
                if (enemies.length > 0) {
                    var enemyToAttack = _.sortByOrder(enemies, (c: Creep) => c.hits)[0]
                    if (tower.pos.getRangeTo(enemyToAttack) < 15 || tower.energy / tower.energyCapacity > 0.7)
                        tower.attack(enemyToAttack);
                }

            });
            return
        } else {
            var myCreeps = room.find(FIND_MY_CREEPS, { filter: c => c.hits < c.hitsMax })
            if (myCreeps.length > 0) {
                myCreeps.sort((a, b) => a.hits - b.hits)
                towers.forEach(t => {
                    if (t.energy / t.energyCapacity > 0.5)
                        t.heal(myCreeps[0])
                })
            }
        }

        const structuresToRepair = _.sortBy(
            room.find(FIND_STRUCTURES, {
                filter: (s) => (s.structureType != STRUCTURE_WALL
                    //&& s.structureType != STRUCTURE_RAMPART
                )
                    && s.hits + TOWER_POWER_REPAIR < s.hitsMax
                    && s.hits / s.hitsMax <= 0.8
                    && (s.structureType != STRUCTURE_RAMPART || s.hits < 5000)
            }),
            (s) => s.hits)

        if (towers.length > 0 && structuresToRepair.length > 0) {
            const closestTower = structuresToRepair[0].pos.findClosestByRange(towers.filter(t => t.energy / t.energyCapacity >= 0.7))
            if (closestTower)
                closestTower.repair(structuresToRepair[0])
        }
    }
}
)
