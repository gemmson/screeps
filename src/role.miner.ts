import { goToMemorizedRoom, createCustomCreep } from "functions";

export class roleMiner {
    public static role: string = "miner"
    public static spawn(energy: number, roomName?: string) {
        createCustomCreep(energy, roleMiner.role, roomName, true, 1600)
    }
    public static run(creep: Creep) {
        var debug = false

        if (goToMemorizedRoom(creep, debug)) {
            return
        }
        const mineral = creep.room.mineral
        if (!mineral) {
            return
        }
        const extractors = creep.room.structures.filter(s => s.structureType == STRUCTURE_EXTRACTOR) as StructureExtractor[]
        if (extractors.length == 0) {
            creep.room.createConstructionSite(mineral.pos, STRUCTURE_EXTRACTOR)
            return
        }
        const extractor = extractors[0]
        //const extractorMineral = extractor.pos.lookFor(LOOK_MINERALS)[0];

        if (creep.memory.working == false && _.sum(creep.carry) < creep.carryCapacity) {
            if (!creep.pos.isNearTo(extractor)) {
                creep.moveTo(extractor, debug ? { visualizePathStyle: { stroke: '#22ff22' } } : undefined);
            }
            if (extractor && !extractor.cooldown) {
                creep.harvest(mineral)
            }
        }
        else {
            let labs: StructureLab[] = creep.room.structures.filter(s => s.structureType == STRUCTURE_LAB
                // && (s.mineralType == extractorMineral.mineralType || s.mineralAmount == 0)
                // && s.mineralAmount < s.mineralCapacity
            ) as StructureLab[]
            labs = _.sortBy(labs, l => l.id) // select one lab by semi random lowest id
            if (labs.length > 0 && labs[0].mineralAmount < labs[0].mineralCapacity) {
                if (creep.transfer(labs[0], mineral.mineralType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(labs[0], debug ? { visualizePathStyle: { stroke: '#2222ff' }, reusePath: 20 } : undefined);
                }
                return
            }
            const terminal = creep.room.terminal
            if (terminal && _.sum(terminal.store) < terminal.storeCapacity / 2) {
                if (creep.transfer(terminal, mineral.mineralType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(terminal, debug ? { visualizePathStyle: { stroke: '#2222ff' }, reusePath: 20 } : undefined);
                }
            }
        }
    }
};

