import { findClosestNonEmptySourceInRoom, goToMemorizedRoom, spawnCreep, registerFNProfiler } from "functions";

export class roleOutsiderHarvester {
    static GoToTargetRoom: number = 0;
    static role: string = "outsiderHarvester";

    public static spawn(energy: number, roomName: string, onlySpawnInTargetRoom?: boolean) {
        if (energy < 300) {
            return
        }
        var energyToSpend = Math.min(energy, 1700);
        var body = new Array<BodyPartConstant>();
        energyToSpend -= 50
        body.push(CARRY)
        energyToSpend -= 50
        body.push(CARRY)
        body.push(MOVE)
        energyToSpend -= 50
        body.push(MOVE)
        energyToSpend -= 50
        while (body.length < 50) {
            if (energyToSpend < 100) {
                break
            }
            energyToSpend -= 100;
            body.push(WORK)

            if (energyToSpend < 50) {
                break
            }
            energyToSpend -= 50;
            body.push(MOVE)
        }
        spawnCreep(roleOutsiderHarvester.role, body.reverse(), roomName, onlySpawnInTargetRoom)
    }

    public static run(creep: Creep) {
        var debug = false

        //manageWorkingState(creep, debug);
        // go to workingRoom
        if (goToMemorizedRoom(creep, debug)) {
            return
        }

        var source = findClosestNonEmptySourceInRoom(creep);
        if (!source) {
            // transfer all remaining energy to closest container
            return
        }
        const isNearSource = creep.pos.isNearTo(source)

        if (!isNearSource) {
            creep.moveTo(source, { visualizePathStyle: debug ? { stroke: '#ffffff' } : undefined, maxRooms: 1, reusePath: 15 });
            return
        }

        //creep.memory.working = false // debug
        // if (creep.memory.working && creep.carry.energy == 0) {
        //     creep.memory.working = false;
        // }
        const harvestPower = creep.getHarvestPower()

        let status = null;
        const pos = source.pos;
        const constructionSites = creep.room.lookForAtArea(LOOK_CONSTRUCTION_SITES, pos.y - 2, pos.x - 2, pos.y + 2, pos.x + 2, true)
        const containerConstructionSites = _.filter(constructionSites, (s) => s.constructionSite.structureType == STRUCTURE_CONTAINER)
        if (containerConstructionSites.length > 0 && creep.carry.energy > 0) {
            if (creep.build(containerConstructionSites[0].constructionSite) == ERR_NOT_IN_RANGE) {
                creep.moveTo(containerConstructionSites[0].constructionSite, { reusePath: 20, ignoreRoads: true })
            }
        }
        //need to build container at this creep pos
        else {
            const structures = creep.room.lookForAtArea(LOOK_STRUCTURES, pos.y - 2, pos.x - 2, pos.y + 2, pos.x + 2, true)
            let containers = _.filter(structures, (s) => s.structure.structureType == STRUCTURE_CONTAINER)
            if (containers.length == 0) {
                // create container site
                creep.say("creatingContainer")
                creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER)
            }
            else {
                // container exists
                const closestEnergyTarget = _.min(containers, c => (c.structure as StructureContainer).store.energy).structure
                if (closestEnergyTarget) {
                    if (closestEnergyTarget.hits < closestEnergyTarget.hitsMax) {
                        if (debug)
                            creep.say("repair")
                        if (creep.repair(closestEnergyTarget) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(closestEnergyTarget, debug ? { reusePath: 20, ignoreRoads: true, visualizePathStyle: { stroke: '#ffffff' } } : undefined);
                        }
                    } else {
                        status = creep.transfer(closestEnergyTarget, RESOURCE_ENERGY)
                        if (status == ERR_NOT_IN_RANGE) {
                            creep.moveTo(closestEnergyTarget, debug ? { reusePath: 20, ignoreRoads: true, visualizePathStyle: { stroke: '#ffffff' } } : undefined);
                        }
                    }
                }
            }
        }
        //if (status == OK || (creep.memory.working == false && creep.carry.energy + harvestPower <= creep.carryCapacity)) {
        if (status == OK || (creep.carry.energy + harvestPower <= creep.carryCapacity)) {
            creep.harvest(source);
            // console.log(`status: ${status}`)
        } else {
            creep.memory.working = true;
        }
    }


};

roleOutsiderHarvester.run = registerFNProfiler(roleOutsiderHarvester.run, 'roleOutsiderHarvester.run')
