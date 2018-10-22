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

        const extractors = creep.room.findStructureOfType<StructureExtractor>(STRUCTURE_EXTRACTOR)
        const extractor = creep.pos.findClosestByRange(extractors)
        if (!extractor) {
            const mineralMines = creep.room.find(FIND_MINERALS)
            if (mineralMines.length > 0) {
                creep.room.createConstructionSite(mineralMines[0].pos, STRUCTURE_EXTRACTOR)
            }
            return
        }
        const extractorMineral = extractor.pos.lookFor(LOOK_MINERALS)[0];

        if (creep.memory.working == false && _.sum(creep.carry) < creep.carryCapacity) {
            if (!creep.pos.isNearTo(extractor)) {
                creep.moveTo(extractor, debug ? { visualizePathStyle: { stroke: '#22ff22' } } : undefined);
            }
            if (extractor && !extractor.cooldown) {
                creep.harvest(extractorMineral)
            }
        }
        else {
            let labs: StructureLab[] = creep.room.find(FIND_MY_STRUCTURES, {
                filter: (s) => s.structureType == STRUCTURE_LAB
                // && (s.mineralType == extractorMineral.mineralType || s.mineralAmount == 0)
                // && s.mineralAmount < s.mineralCapacity
            }) as StructureLab[]
            labs = _.sortBy(labs, l => l.id)
            if (labs.length > 0 && labs[0].mineralAmount < labs[0].mineralCapacity) {
                if (creep.transfer(labs[0], extractorMineral.mineralType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(labs[0], debug ? { visualizePathStyle: { stroke: '#2222ff' }, reusePath: 20 } : undefined);
                }
                return
            }
            const terminal = this.findClosestTerminal(creep)
            if (terminal && _.sum(terminal.store) < terminal.storeCapacity / 2) {
                if (creep.transfer(terminal, extractorMineral.mineralType) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(terminal, debug ? { visualizePathStyle: { stroke: '#2222ff' }, reusePath: 20 } : undefined);
                }
            }
        }
    }

    private static findClosestTerminal(creep: Creep) {
        return creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => (s.structureType == STRUCTURE_TERMINAL)
                && _.sum(s.store) < s.storeCapacity
        }) as StructureTerminal | null;
    }
};

