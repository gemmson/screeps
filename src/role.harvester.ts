import { findClosestNonEmptySourceInRoom, goToMemorizedRoom, createCustomCreep, spawnCreep, registerFNProfiler } from "functions";
//import profiler from "screeps-profiler"
import { harvesterRoleName } from "names";
import { roleBuilder } from "role.builder";

export class roleHarvester {
    public static role: string = harvesterRoleName
    public static spawn(energy: number, roomName: string): boolean {
        const room = Game.rooms[roomName]
        if (room && room.memory.stats.numberOfCarriers > 0) {
            return roleHarvester.spawnSpecializedHarvester(energy, roomName)
        }
        return createCustomCreep(energy, roleHarvester.role, roomName, true, 1400)
    }
    public static run(creep: Creep) {
        var debug = false
        const harvestPower = creep.getHarvestPower()

        if (creep.memory.working == true && creep.carry.energy == 0) {
            creep.memory.working = false;
        }

        if (creep.memory.working == false && creep.carry.energy + harvestPower > creep.carryCapacity) {
            creep.memory.working = true;
            if (debug)
                creep.say('Working');
        }

        if (goToMemorizedRoom(creep, debug)) {
            return
        }

        roleHarvester.transferEnergy(creep, debug)
        // harvest possible with transfer in single tick
        roleHarvester.harvestEnergy(creep, harvestPower, debug);
        delete (creep.memory as any)["canHarvest"]
    }

    private static harvestEnergy(creep: Creep, harvestPower: number, debug: boolean) {
        if ((creep.memory as any)["canHarvest"] || creep.memory.working == false && creep.carry.energy + harvestPower <= creep.carryCapacity) {
            if (creep.memory.targetId && creep.room.controller && creep.room.controller.level > 2) {
                var source = Game.getObjectById(creep.memory.targetId) as Source | null;
                if (source) {
                    if (!creep.pos.isNearTo(source)) {
                        creep.moveTo(source, { reusePath: 10, maxOps: 1700, visualizePathStyle: { stroke: '#ffffff' } });
                    }
                    else {
                        if (creep.harvest(source) == ERR_NOT_ENOUGH_ENERGY) {
                            creep.memory.working = true;
                        }
                    }
                }
            }
            else {
                // fallback to finding source without assignment
                var source: Source | null = findClosestNonEmptySourceInRoom(creep);
                if (source && creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, reusePath: 10, maxOps: 1700 });
                }
            }
        }
    }

    private static transferEnergy(creep: Creep, debug: boolean) {
        if (creep.memory.working) {
            const containersConstructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES, { filter: (s) => s.structureType == STRUCTURE_CONTAINER })
            if (containersConstructionSites.length > 0 && creep.room.controller && creep.room.controller.level > 2) {
                const closestConstructionSite = creep.pos.findClosestByRange(containersConstructionSites)
                if (closestConstructionSite && closestConstructionSite.pos.inRangeTo(creep, 2)) {
                    creep.build(closestConstructionSite)
                    return
                }
            }
            var closestEnergyTarget: StructureLink | StructureContainer | StructureSpawn | StructureExtension | null = null
            var closestLink = roleHarvester.findLinkInRange(creep)
            if (closestLink.length > 0) {
                closestEnergyTarget = closestLink[0]
            }
            if (!closestEnergyTarget) {
                closestEnergyTarget = roleHarvester.findClosestContainer(creep)
                if (closestEnergyTarget
                    && closestEnergyTarget.hits < closestEnergyTarget.hitsMax
                    && closestEnergyTarget.pos.isNearTo(creep)) {
                    creep.repair(closestEnergyTarget)
                    return
                }
            }

            if (!closestEnergyTarget || creep.room.memory.stats.numberOfCarriers == 0 && !creep.room.memory.summoningCircle) {
                closestEnergyTarget = roleHarvester.findClosestSpawnOrExtension(creep)
            }

            if (closestEnergyTarget) {
                const status = creep.transfer(closestEnergyTarget, RESOURCE_ENERGY)
                if (status == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestEnergyTarget, debug ? { visualizePathStyle: { stroke: '#ffffff' } } : undefined);
                }
                if (status == OK
                    && ("energy" in closestEnergyTarget && creep.carry.energy + closestEnergyTarget.energy <= closestEnergyTarget.energyCapacity
                        || "store" in closestEnergyTarget && creep.carry.energy + _.sum(closestEnergyTarget.store) <= closestEnergyTarget.storeCapacity)) {
                    creep.memory.working = false // multiple actions in one tick are possible
                    var memory = creep.memory as any
                    memory["canHarvest"] = true;
                }
            }
            else {
                // work as a builder
                if (creep.room.controller && creep.room.controller.level < 3) {
                    roleBuilder.run(creep)
                }
            }
        }
    }

    private static findClosestContainer(creep: Creep): StructureContainer | null {
        return creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => (s.structureType == STRUCTURE_CONTAINER)
                && s.store.energy < s.storeCapacity
        }) as StructureContainer | null;
    }

    private static findLinkInRange(creep: Creep): StructureLink[] {
        return creep.pos.findInRange(FIND_MY_STRUCTURES, 1, {
            filter: (s: StructureLink) => (s.structureType == STRUCTURE_LINK)
                && s.energy < s.energyCapacity
        }) as StructureLink[];
    }

    private static findClosestSpawnOrExtension(creep: Creep) {
        return creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => ((s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN)
                && s.energy < s.energyCapacity)
            //|| (s.structureType == STRUCTURE_CONTAINER && _.sum(s.store) < s.storeCapacity)
        }) as StructureExtension | StructureSpawn | null;
    }

    private static spawnSpecializedHarvester(energy: number, roomName: string): boolean {
        if (energy < 300) {
            return false
        }
        var energyToSpend = Math.min(energy, 1600);
        var body = new Array<BodyPartConstant>();
        energyToSpend -= 50
        body.push(MOVE)
        energyToSpend -= 50
        body.push(CARRY)
        energyToSpend -= 100
        body.push(WORK)
        energyToSpend -= 100
        body.push(WORK)
        var numberOfBodyParts = Math.floor(energyToSpend / 250) // 200=Work x2 + 50 move

        for (let i = 0; i < numberOfBodyParts; i++) {
            body.push(WORK)
            body.push(WORK)
            body.push(MOVE)
            energyToSpend -= 250
        }
        while (body.length < 50) {
            if (energyToSpend < 50) {
                break
            }
            energyToSpend -= 50;
            body.push(MOVE)
        }
        return spawnCreep(roleHarvester.role, body.reverse(), roomName, true)
    }
};

roleHarvester.run = registerFNProfiler(roleHarvester.run, 'roleHarvester.run')
