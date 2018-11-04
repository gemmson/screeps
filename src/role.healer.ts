import { maxEnergyForSpawnPerRoom } from "consts";
import { spawnCreep } from "functions";

export class roleHealer {
    public static role: string = "healer"

    public static spawn(energy: number, roomName: string) {
        if (energy < 300) {
            return
        }
        var energyToSpend = energy //Math.min(energy, 1800);
        var body = Array<BodyPartConstant>();
        // energyToSpend -= 250;
        // body.push(HEAL)
        energyToSpend -= 50;
        if (energy <= 800) {
            if (energyToSpend >= 250) {
                energyToSpend -= 250;
                body.push(HEAL)
            }
            if (energyToSpend >= 250) {
                energyToSpend -= 250;
                body.push(HEAL)
            }
        } else {
            var numberOfBodyParts = Math.floor(energyToSpend / 550) // 500=HEAL x2 + 50 move

            for (let i = 0; i < numberOfBodyParts; i++) {
                body.push(HEAL)
                body.push(HEAL)
                body.push(MOVE)
                energyToSpend -= 550
            }
            let i = numberOfBodyParts - 1;
            while (body.length < 50 && i-- > 0) {
                if (energyToSpend < 50) {
                    break
                }
                energyToSpend -= 50;
                body.push(MOVE);
            }
        }
        body = _.sortByOrder(body, b => b, "desc")
        body.push(MOVE);
        return spawnCreep(roleHealer.role, body, roomName, false)
    }

    /** @param {Creep} creep **/
    public static run(creep: Creep) {
        var debug = true;

        // if (creep.memory.working) {
        //     if (!creep.memory.targetId) {
        //         creep.memory.working = false;
        //     }
        //     else {
        //         const target = Game.getObjectById(creep.memory.targetId)
        //         if (!target) {
        //             delete creep.memory.targetId
        //         }
        //     }

        // }

        var healFlags = _.map(Game.flags, (s) => s).filter((x) => x && x.name.startsWith("heal"))
        if (healFlags.length > 0) {
            if (!creep.memory.working) {
                if (creep.room.name != healFlags[0].pos.roomName) {
                    creep.moveTo(healFlags[0], { visualizePathStyle: { stroke: '#00ffff' } })
                    return
                }
                if (!creep.pos.inRangeTo(healFlags[0].pos, 1)) {
                    creep.moveTo(healFlags[0], { visualizePathStyle: { stroke: '#00ffff' }, maxRooms: 1 })
                }
            }
        }

        const woundedCreep = creep.pos.findClosestByPath(FIND_MY_CREEPS, { filter: c => c.hits < c.hitsMax })
        if (woundedCreep) {
            creep.memory.working = true
            const rangeToTarget = creep.pos.getRangeTo(woundedCreep)
            if (rangeToTarget <= 1) {
                creep.heal(woundedCreep)
            } else if (rangeToTarget <= 3) {
                creep.rangedHeal(woundedCreep)
            }
            if (rangeToTarget > 0) {
                creep.moveTo(woundedCreep, { maxRooms: 1, visualizePathStyle: { stroke: '#00ffff' } })
            }
        } else {
            creep.memory.working = false
        }
    }
};
