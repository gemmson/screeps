import { spawnCreep, registerFNProfiler } from "functions";

export class roleOutsiderCarrier {
    static role: string = "outsiderCarrier";
    public static spawn(energy: number, roomName: string) {
        if (energy < 100) {
            console.log("Not enough energy to spawn")
            return
        }
        var energyToSpend = energy
        var body = Array<BodyPartConstant>();
        while (true) {
            if (energyToSpend < 50) {
                break
            }
            energyToSpend -= 50;
            body.push(MOVE)

            if (energyToSpend < 50) {
                break
            }
            energyToSpend -= 50;
            body.push(CARRY)
        }
        spawnCreep(roleOutsiderCarrier.role, body, roomName)
    }
    public static run(creep: Creep) {
        var debug = true
        if (debug)
            creep.say("C")

        // if (creep.memory.working == true && creep.carry.energy == 0) {
        //     if (debug)
        //         creep.say('Harvest');
        //     creep.memory.working = false;
        //     delete creep.memory.targetId
        // }
        // if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
        //     if (debug)
        //         creep.say('Working');
        //     creep.memory.working = true;
        //     delete creep.memory.targetId
        // }

        if (!creep.memory.room) {
            creep.say("No room :(")
            return
        }
        let room = Game.rooms[creep.memory.room]

        // const flags = _.filter(Game.flags, f => f.name == "test")
        // const start = _.filter(Game.flags, f => f.name == "start")
        // const end = _.filter(Game.flags, f => f.name == "end")

        // if (flags.length > 0) {
        //     creep.moveTo(flags[0])
        //     return
        // }

        // if (creep.pos.isEqualTo(end[0].pos)) {
        //     creep.memory.working = true
        // }

        // if (creep.pos.isEqualTo(start[0].pos)) {
        //     creep.memory.working = false
        // }

        if (room && (!creep.memory.pathToTarget || !creep.memory.pathToHome)) {
            const start = _.filter(Game.flags, f => f.name == "start")
            const end = _.filter(Game.flags, f => f.name == "end")
            // no path yet has been found
            console.log("finding path")
            // const containers = room.structures.filter(s => s.structureType == STRUCTURE_CONTAINER) as StructureContainer[]
            if (start.length > 0 && end.length > 0) {
                creep.memory.pathToTarget = start[0].pos.findPathTo(end[0]) //getPathTo(creep.pos, containers[0].pos).path
                creep.memory.pathToHome = end[0].pos.findPathTo(start[0])
                creep.memory.step = 0
                console.log(JSON.stringify(creep.memory.pathToTarget))
            }
        }



        //if (creep.memory.working == false) {
        if (!room) {
            // can't see target room, may need to use below function
            // if (goToMemorizedRoom(creep, debug)) {
            //     return
            // }
        }

        // let container
        // if (!creep.memory.targetId) {
        //     const containers = room.structures.filter((s) => s.structureType == STRUCTURE_CONTAINER && s.store.energy > 0) as StructureContainer[]
        //     if (containers.length > 0) {
        //         creep.memory.targetId = _.sortByOrder(containers, (s) => s.store.energy, "desc")[0].id
        //         container = containers[0]
        //     }
        // } else {
        //     container = Game.getObjectById(creep.memory.targetId) as StructureContainer | null;
        // }

        // if (container && container.store.energy > 0) {
        //     if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        // const status = creep.moveTo(container, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 50 });
        // if (status != OK) {
        //     if (debug)
        //         creep.say("move er" + status)
        // }

        if (creep.memory.pathToTarget && creep.memory.pathToHome && creep.memory.step != undefined) {
            // if (creep.memory.path.length - 1 <= creep.memory.step) {
            //     creep.memory.step = 0
            // }
            const path = creep.memory.working ? creep.memory.pathToHome : creep.memory.pathToTarget
            let pathStepIndex = _.findIndex(path, step => step.x == creep.pos.x && step.y == creep.pos.y)
            if (pathStepIndex < 0) {
                creep.moveTo(new RoomPosition(path[0].x, path[0].y, creep.room.name))
                return
            }
            if (pathStepIndex >= path.length - 1) {
                creep.say("path end")
                creep.memory.working = !creep.memory.working
                return
            }
            const pathStep = path[pathStepIndex + 1]

            //console.log(`creep pos: ${creep.pos} pos: ${pos}`)
            const status = creep.move(pathStep.direction)
            creep.say(status.toString())


            // if (creep.pos.isEqualTo(pos)) {
            //     creep.say("reverse")
            //     creep.memory.path = creep.memory.path.reverse();
            //     return
            // }

            // if (status == ERR_NOT_FOUND) {
            //     //delete creep.memory.path
            // }
            // let pathPos = creep.memory.path[creep.memory.step]
            // let pos = new RoomPosition(pathPos.x, pathPos.y, pathPos.roomName)
            // if (pos.isEqualTo(creep.pos)) {
            //     //creep.memory.step = creep.memory.step + 1
            //     pathPos = creep.memory.path[creep.memory.step]
            //     pos = new RoomPosition(pathPos.x, pathPos.y, pathPos.roomName)
            // }
            // console.log(`step: ${creep.memory.step} step.pos ${JSON.stringify(pathPos)} dir: ${creep.pos.getDirectionTo(pos)}`)
            // const status = creep.move(creep.pos.getDirectionTo(pos))
            // creep.say(status.toString())
            // if (status == 0) {
            //     creep.memory.step = creep.memory.step + 1
            // }
            //}
            //         }
            //     }
            //     else {
            //         //select new container that is not empty
            //         delete creep.memory.targetId
            //     }
            // }
            // else {
            //     // if (goToRoomByName(creep, creep.memory.homeRoom)) {
            //     //     delete creep.memory.targetId
            //     //     return
            //     // }

            //     if (!creep.memory.targetId) {
            //         const storage = creep.room.storage
            //         if (storage) {
            //             creep.memory.targetId = storage.id
            //         }
            //     }
            //     //let closestStorage = Game.spawns[spawnName].room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_STORAGE })[0]
            //     if (creep.memory.targetId) {
            //         let closestStorage = Game.structures[creep.memory.targetId]
            //         if (closestStorage && creep.transfer(closestStorage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            //             let status = creep.moveTo(closestStorage, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 50 });
            //             if (status != OK) {
            //                 if (debug)
            //                     creep.say("move er" + status)
            //             }
            //         }
            //     }
        }
    }
};

roleOutsiderCarrier.run = registerFNProfiler(roleOutsiderCarrier.run, 'roleOutsiderCarrier.run')
