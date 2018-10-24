import { goToMemorizedRoom, spawnCreep, registerFNProfiler, goToRoomByName } from "functions";

export class roleOutsiderEnergyCarrier {
    static role: string = "outsiderEnergyCarrier";
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
        spawnCreep(roleOutsiderEnergyCarrier.role, body, roomName)
    }
    public static run(creep: Creep) {
        var debug = false

        if (creep.memory.working == true && creep.carry.energy == 0) {
            if (debug)
                creep.say('Harvest');
            creep.memory.working = false;
            //delete (creep.memory as any)["_move"]
        }
        if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
            delete creep.memory.targetId
            //delete (creep.memory as any)["_move"]
            if (debug)
                creep.say('Working');
        }
        let room: Room | undefined
        if (creep.memory.room) {
            room = Game.rooms[creep.memory.room]
        }
        if (!room) {
            if (creep.memory.working == false) {
                if (goToMemorizedRoom(creep, debug)) {
                    return
                }
            }
        }
        else {
            if (!creep.memory.targetId) {
                const containers = room.find(FIND_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_CONTAINER && s.store.energy > 0 }) as StructureContainer[]
                if (containers.length > 0 && creep.memory.working == false) {
                    creep.memory.targetId = _.sortByOrder(containers, (s: StructureContainer) => s.store.energy, "desc")[0].id
                }
            }

            if (creep.memory.working == false && creep.memory.targetId) {
                const container = Game.getObjectById(creep.memory.targetId) as StructureContainer | StructureStorage | null;
                if (container && container.structureType == STRUCTURE_CONTAINER && container.store.energy > 0) {
                    if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        const status = creep.moveTo(container, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 50, noPathFinding: true });
                        if (status != OK && status != ERR_TIRED) {
                            if (debug)
                                creep.say("new path" + status)
                            creep.moveTo(container, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 10 });
                        }
                    }
                }
                else {
                    delete creep.memory.targetId
                }
            }
            else if (creep.memory.working && room.name) {
                if (creep.memory.data) {
                    if (!goToRoomByName(creep, creep.memory.homeRoom)) {
                        delete creep.memory.targetId
                    }
                }
                if (!creep.memory.targetId) {
                    // const roomsWithStorage = _.map(Memory.roomsWithStorage, (r) => r)
                    // let closestRoom: string;
                    // // if (roomsWithStorage.find(r => r == creep.memory.homeRoom)) {
                    // //     closestRoom = creep.memory.homeRoom
                    // // } else {
                    // closestRoom = roomsWithStorage[0]
                    // //}
                    // if (roomsWithStorage.length > 0) {
                    //     if (roomsWithStorage.length > 1) {
                    //         let closestDistance = Game.map.getRoomLinearDistance(creep.room.name, closestRoom)
                    //         roomsWithStorage.forEach((roomName) => {
                    //             const storage = Game.rooms[roomName].storage
                    //             if (storage &&
                    //                 creep.room.name
                    //                 && Game.rooms[roomName]
                    //                 && Game.map.getRoomLinearDistance(creep.room.name, roomName) < closestDistance
                    //                 && _.sum(storage.store) < storage.storeCapacity) {
                    //                 closestRoom = roomName
                    //             }
                    //         })
                    //     }
                    const storage = Game.rooms[creep.memory.homeRoom].storage
                    if (storage) {
                        creep.memory.targetId = storage.id
                    }
                }
            }
            //let closestStorage = Game.spawns[spawnName].room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_STORAGE })[0]
            if (creep.memory.targetId) {
                delete creep.memory.data
                let closestStorage = Game.structures[creep.memory.targetId]
                if (closestStorage && creep.transfer(closestStorage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    let status = creep.moveTo(closestStorage, debug ? { visualizePathStyle: { stroke: '#ffffff' }, reusePath: 50, noPathFinding: true } : undefined);
                    if (status != OK && status != ERR_TIRED) {
                        if (debug)
                            creep.say("new path" + status)
                        creep.moveTo(closestStorage, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 10 });
                    }
                    if (status == ERR_NO_PATH) {
                        // creep is lost, go home
                        goToRoomByName(creep, creep.memory.homeRoom)
                    }
                }
            }
        }
    }
};

roleOutsiderEnergyCarrier.run = registerFNProfiler(roleOutsiderEnergyCarrier.run, 'roleOutsiderEnergyCarrier.run')
