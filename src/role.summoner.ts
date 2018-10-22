import { registerFNProfiler, getRandomName } from "functions";

export interface SummonerMemory {
    inner: boolean
    extensionsIds: string[]
    energySourceId: string
    spawnId: string
}

export class roleSummoner {
    static role: string = "summoner";

    public static run(creep: Creep) {
        var debug = false

        const memory = creep.memory.data as SummonerMemory
        const energySource = Game.getObjectById<StructureLink | StructureContainer>(memory.energySourceId)
        const extensions = memory.extensionsIds.map<StructureExtension | null>(x => Game.getObjectById(x)).filter((s: StructureExtension | null) => s != null) as StructureExtension[]
        const spawn = Game.getObjectById<StructureSpawn>(memory.spawnId)
        if (!energySource) {
            creep.say("No energy")
            return
        }
        if (creep.carry.energy == 0) {
            if (debug)
                creep.say("Recharge")
            if (energySource != null) {
                creep.withdraw(energySource, RESOURCE_ENERGY)
            }
            else {
                creep.say("Invalid s")
            }
        }
        else {
            if (spawn && spawn.energy < spawn.energyCapacity && spawn.id != energySource.id) {
                if (debug)
                    creep.say("Transfer")
                creep.transfer(spawn, RESOURCE_ENERGY)
            } else {
                const extensionsToFill = extensions.filter(e => e.energy < e.energyCapacity)
                if (extensionsToFill.length > 0) {
                    if (debug)
                        creep.say("Transfer")
                    creep.transfer(extensionsToFill[0], RESOURCE_ENERGY)
                }
            }
        }
    }
};

roleSummoner.run = registerFNProfiler(roleSummoner.run, 'roleSummoner.run')
