import { goToMemorizedRoom, spawnCreep } from "functions";

export class roleOutsiderReserver {
    static role: string = "outsiderReserver";
    static sign: string = "Room reserved for Gemm💎"
    public static spawn(roomName: string, energy: number) {
        if (energy < 300) {
            return
        }
        var body = [] as any;
        body.push(MOVE)
        body.push(CLAIM)
        if (energy >= 600) {
            body.push(MOVE)
            body.push(CLAIM)
        }

        spawnCreep(roleOutsiderReserver.role, body, roomName)
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
                console.log(`Room ${creep.room.name} is mine, no need to reserve. Creep ${creep.name} suicide`)
                creep.suicide()
                return
            }
            if (!creep.pos.isNearTo(controllers[0].pos)) {
                creep.moveTo(controllers[0], { visualizePathStyle: debug ? { stroke: '#ffaaff' } : undefined, maxRooms: 1, reusePath: 15, maxOps: 1700 });
                return
            }
            const controllerSign = controllers[0].sign
            if (!controllerSign || controllerSign.text != roleOutsiderReserver.sign) {
                creep.signController(controllers[0], roleOutsiderReserver.sign)
            }
            creep.reserveController(controllers[0])
        }
    }
}

// roleOutsiderReserver.run = registerFNProfiler(roleOutsiderReserver.run, 'roleOutsiderReserver.run')
