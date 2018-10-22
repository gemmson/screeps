import profiler from 'screeps-profiler';

function handleLinksInRooms() {
    if (!Memory.links) {
        Memory.links = {}
    }
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName]

        if (!room.controller || room.controller.level < 5 || !room.controller.my || !Memory.roomsWithStorage || !Memory.roomsWithStorage.find((x) => x == roomName)) {
            // room has no storage, do nothing for now
            continue
        }
        const storage = room.findStructureOfType<StructureStorage>(STRUCTURE_STORAGE)
        if (storage.length == 0) {
            return
        }
        const sources = room.find(FIND_SOURCES)
        const links = room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_LINK }) as StructureLink[]
        const storageLink = storage[0].pos.findClosestByRange(links)
        // const controllerLink = room.controller.pos.findClosestByRange(links)
        if (storageLink) {
            Memory.links[roomName] = storageLink.id;
            links.forEach(link => {
                if (link.id == storageLink.id) {
                    // maybe send to controller link
                }
                else {
                    if (link.energy > 0 && link.cooldown == 0 && storageLink.energy < storageLink.energyCapacity - 1) {
                        link.transferEnergy(storageLink)
                    }
                }
            });
        }
    }
}

export const handleLinks = profiler.registerFN(handleLinksInRooms, 'handleLinks');
