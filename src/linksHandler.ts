import profiler from 'screeps-profiler';

function handleLinksInRooms() {
    if (!Memory.links) {
        Memory.links = {}
    }
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName]

        if (!room.controller || room.controller.level < 5 || !room.controller.my || !room.storage) {
            // room has no storage, do nothing for now
            continue
        }
        const storage = room.storage
        //const sources = room.sources
        const links = room.find(FIND_MY_STRUCTURES, { filter: (s) => s.structureType == STRUCTURE_LINK }) as StructureLink[]
        const storageLink = storage.pos.findClosestByRange(links) // cache
        const controllerLinks = room.controller.pos.findInRange(links, 3)
        const controllerLink = controllerLinks.length > 0 ? controllerLinks[0] : null
        if (storageLink) {
            Memory.links[roomName] = storageLink.id;
            links.forEach(link => {
                if (link.id == storageLink.id || (controllerLink && link.id == controllerLink.id)) {

                }
                else {
                    if (link.energy > 0 && link.cooldown == 0) {
                        if (controllerLink && controllerLink.energy < controllerLink.energyCapacity - 5 && storage.store.energy >= 300000) {
                            link.transferEnergy(controllerLink)
                        } else if (storageLink.energy < storageLink.energyCapacity - 5) {
                            link.transferEnergy(storageLink)
                        } else if (controllerLink && controllerLink.energy < controllerLink.energyCapacity - 5) {
                            link.transferEnergy(controllerLink)
                        }
                    }
                }
            });
        }
    }
}

export const handleLinks = profiler.registerFN(handleLinksInRooms, 'handleLinks');
