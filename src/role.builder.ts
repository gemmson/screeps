import { roleUpgrader } from "role.upgrader"
import { rechargeAtClosestEnergySource, manageWorkingState, goToMemorizedRoom, createCustomCreep, findClosestNonEmptySourceInRoom } from "functions";

export class roleBuilder {
    public static role: string = "builder"
    public static spawn(energy: number, roomName?: string) {
        createCustomCreep(energy, roleBuilder.role, roomName, true)
    }
    /** @param {Creep} creep **/
    public static run(creep: Creep) {
        var debug = false;

        manageWorkingState(creep, debug);

        if (goToMemorizedRoom(creep, debug)) {
            return
        }

        if (creep.memory.working && creep.carry.energy == 0) {
            delete creep.memory.targetId
        }

        if (creep.memory.working == false && creep.carry.energy < creep.carryCapacity) {
            const droppedResourceEnergy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, { filter: (s) => s.resourceType == RESOURCE_ENERGY });
            if (droppedResourceEnergy && creep.memory.working == false && creep.carry.energy < creep.carryCapacity) {
                if (creep.pickup(droppedResourceEnergy) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(droppedResourceEnergy, { reusePath: 10, maxOps: 1500, visualizePathStyle: { stroke: '#ffffff' } });
                }
                return;
            }
            if (!rechargeAtClosestEnergySource(creep)) {
                const source = findClosestNonEmptySourceInRoom(creep)
                if (!source) {
                    return
                }
                const status = creep.harvest(source)
                if (status == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { reusePath: 15, maxOps: 1500, visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined })
                }
            }
            else if (Game.time % 5 == 0) { //prevent camping close to source blocking way
                creep.moveInRandomDirection()
            }
        } else {
            var priorityFlags = _.filter(Game.flags, f => f.name.startsWith("prio"))
            var allSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
            let sites = Array<ConstructionSite>()
            if (priorityFlags.length > 0) {
                const priorityFlag = priorityFlags[0]
                if (priorityFlag) {
                    sites = allSites.filter(s => s.pos.isEqualTo(priorityFlag.pos))
                    if (sites.length > 0)
                        creep.memory.targetId = sites[0].id
                }
            }
            if (!creep.memory.targetId) {
                if (sites.length == 0)
                    sites = allSites.filter((s) => s.structureType == STRUCTURE_SPAWN)
                if (sites.length == 0)
                    sites = allSites.filter((s) => s.structureType == STRUCTURE_EXTENSION);
                if (sites.length == 0)
                    sites = allSites.filter((s) => s.structureType == STRUCTURE_LINK);
                if (sites.length == 0)
                    sites = allSites.filter((s) => s.structureType == STRUCTURE_CONTAINER);
                if (sites.length == 0)
                    sites = allSites.filter((s) => s.structureType == STRUCTURE_TOWER);
                if (sites.length == 0)
                    sites = allSites.filter((s) => s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART);
                if (sites.length == 0)
                    sites = allSites.filter((s) => s.structureType == STRUCTURE_ROAD);
                if (sites.length == 0)
                    sites = allSites.filter((s) => s.structureType == STRUCTURE_STORAGE);
                if (sites.length == 0)
                    sites = allSites

                if (sites.length > 0) {
                    // sites.sort((a, b) => a.pos.getRangeTo(creep.pos) - b.pos.getRangeTo(creep.pos))
                    // sites.sort((a, b) => a.progressTotal - b.progressTotal)
                    // sites.sort((a, b) => b.progress - a.progress);
                    sites = _.sortByAll(sites, x => -x.progress, x => x.pos.getRangeTo(creep.pos))
                    creep.memory.targetId = sites[0].id
                }
            }
            if (creep.memory.targetId) {
                const target = Game.getObjectById(creep.memory.targetId) as ConstructionSite | null
                if (target) {
                    if ("progress" in target && target.progress < target.progressTotal) {
                        if (creep.build(target) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(target, { reusePath: 10, maxOps: 1700, visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined });
                        }
                    }
                }
                else {
                    delete creep.memory.targetId
                }
            } else {
                // nothing to build -> act as upgrader
                roleUpgrader.run(creep);
            }
        }
    }
};

// roleBuilder.run = registerFNProfiler(roleBuilder.run, "roleBuilder.run")
