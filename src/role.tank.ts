import { maxEnergyForSpawnPerRoom } from "consts";
import { spawnCreep } from "functions";

interface TankData {
    prevTickHits: number
    hitsLoss: number
}

export class roleTank {
    public static role: string = "tank"

    public static spawn(energy: number, roomName: string) {
        if (energy < 1500) {
            return
        }
        var energyToSpend = Math.min(energy, 1500);
        var body = Array<BodyPartConstant>();
        while (body.length < 50) {
            if (energyToSpend < 150) {
                break
            }
            energyToSpend -= 10;
            body.push(TOUGH)

            if (energyToSpend < 50) {
                break
            }
            energyToSpend -= 50;
            body.push(MOVE);
        }
        return spawnCreep(roleTank.role, _.sortByOrder(body, (s) => s, "desc"), roomName, false)
    }

    /** @param {Creep} creep **/
    public static run(creep: Creep) {
        var debug = true;

        if (!creep.memory.data) {
            creep.memory.data = {
                prevTickHits: creep.hits
            } as TankData
        }
        const tankData = creep.memory.data as TankData
        const hitsLossPerTick = tankData.prevTickHits - creep.hits

        if (creep.hits == creep.hitsMax) {
            creep.memory.working = false
        }

        if (hitsLossPerTick / creep.hitsMax > 0.4 || creep.hits / creep.hitsMax < 0.3) {
            creep.memory.working = true
        }

        if (creep.memory.working) {
            roleTank.moveToSafe(creep);
        }
        else {
            roleTank.moveToTankFlag(creep);
        }

        var memoryData = (creep.memory.data as TankData)
        memoryData.prevTickHits = creep.hits
        memoryData.hitsLoss = hitsLossPerTick
    }

    private static moveToSafe(creep: Creep) {
        var healFlags = _.map(Game.flags, (s) => s).filter((x) => x && x.name.startsWith("heal"));
        creep.moveTo(healFlags[0], { visualizePathStyle: { stroke: '#00ff00' } });
    }

    private static moveToTankFlag(creep: Creep) {
        var tankFlags = _.map(Game.flags, (s) => s).filter((x) => x && x.name.startsWith("tank"));
        if (tankFlags.length > 0) {
            if (creep.room.name != tankFlags[0].pos.roomName) {
                creep.moveTo(tankFlags[0], { visualizePathStyle: { stroke: '#ff00ff' } });
            }
            else if (!creep.pos.isEqualTo(tankFlags[0].pos)) {
                creep.moveTo(tankFlags[0], { visualizePathStyle: { stroke: '#ff00ff' }, reusePath: 1 });
            }
        }
    }
};
