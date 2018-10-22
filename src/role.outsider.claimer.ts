import { goToMemorizedRoom, spawnCreep, registerFNProfiler } from "functions";

export class roleOutsiderClaimer {
    static role: string = "outsiderClaimer";
    static sign: string = "Room reserved for 💎Gemm💎"
    public static spawn(roomName: string) {
        var body = [] as any;
        body.push(MOVE)
        body.push(CLAIM)

        spawnCreep(roleOutsiderClaimer.role, body, roomName)
    }
    public static run(creep: Creep) {
        var debug = true

        if (goToMemorizedRoom(creep, debug)) {
            return
        }

        const controllers = creep.room.findStructureOfType<StructureController>(STRUCTURE_CONTROLLER)

        if (controllers.length > 0) {
            if (controllers[0].my) {
                // nothing to do, kill yourself
                //creep.suicide()
                return
            }
            if (!creep.pos.isNearTo(controllers[0].pos)) {
                creep.moveTo(controllers[0], { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 15, maxOps: 1500 });
                return
            }
            const controllerSign = controllers[0].sign
            if (!controllerSign || controllerSign.text != roleOutsiderClaimer.sign) {
                creep.signController(controllers[0], roleOutsiderClaimer.sign)
            }
            const status = creep.claimController(controllers[0])
            if (status == OK) {
                if (debug)
                    creep.say("Claiming")
                return
            }
            else {
                console.log(status)
            }
            // else {
            //     creep.reserveController(controllers[0])
            // }
        }
    }

}

roleOutsiderClaimer.run = registerFNProfiler(roleOutsiderClaimer.run, 'roleOutsiderClaimer.run')
