import { goToMemorizedRoom, spawnCreep, registerFNProfiler, goToRoomByName } from "functions";

export class roleControllerDestroyer {
    static role: string = "controllerDestroyer";
    static sign: string = "Room reserved for Gemm💎"
    public static spawn(roomName: string, energy: number) {
        if (energy < 650) {
            return
        }
        var energyToSpend = energy
        var body = [] as any;
        while (body.length < 50) {
            if (energyToSpend < 650) {
                break
            }
            body.push(MOVE)
            body.push(CLAIM)
            energyToSpend -= 650
        }
        spawnCreep(roleControllerDestroyer.role, body, roomName)
    }
    public static run(creep: Creep) {
        var debug = true

        if (creep.memory.working == false) {
            if (goToMemorizedRoom(creep, debug)) {
                return
            }

            const controller = creep.room.controller
            if (controller) {
                if (controller.my) {
                    // nothing to do
                    creep.say("💤")
                    return
                }
                if (!creep.pos.isNearTo(controller.pos)) {
                    creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffaaff' }, maxRooms: 1, reusePath: 5 });
                    return
                }
                const controllerSign = controller.sign
                if (!controllerSign || controllerSign.text != roleControllerDestroyer.sign) {
                    creep.signController(controller, roleControllerDestroyer.sign)
                }
                const status = creep.attackController(controller)
                if (status == OK) {
                    if (!Memory.warMap) {
                        Memory.warMap = {}
                    }
                    Memory.warMap[creep.room.name] = { attackControllerMinimalTick: Game.time + CONTROLLER_ATTACK_BLOCKED_UPGRADE }
                    creep.memory.working = true
                }
            }
        } else {
            // find my closest room
            if (!goToRoomByName(creep, creep.memory.homeRoom)) {
                //in home room, suicide to save some energy or die trying!
                if (creep.room.storage && !creep.pos.isNearTo(creep.room.storage)) {
                    creep.moveTo(creep.room.storage)
                    return
                }
                creep.suicide()
            }
        }
    }
}

roleControllerDestroyer.run = registerFNProfiler(roleControllerDestroyer.run, 'roleControllerDestroyer.run')
