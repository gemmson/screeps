import { roleHarvester } from 'role.harvester';
import { roleUpgrader } from 'role.upgrader';
import { roleBuilder } from 'role.builder';
import { roleRepairer } from "role.repairer";
import { roleWallRepairer } from "role.wallRepairer";
import { roleDefender } from "role.defender";
import { roleTowerKeeper } from "role.towerKeeper";
import { roleOutsiderHarvester } from "role.outsider.harvester";
import { roleOutsiderEnergyCarrier } from "role.outsider.energyCarrier";
import { roleOutsiderClaimer } from "role.outsider.claimer";
import { createCustomCreep, numberOfCreepsInRole, getMyUsername, registerFNProfiler } from 'functions';
import { maxEnergyForSpawnPerRoom } from 'consts';
import { roleMiner } from 'role.miner';
import { roleOutsiderReserver } from 'role.outsider.reserver';
import { roleAttacker } from 'role.attacker';
import { roleCarrier } from 'role.carrier';
import { roleRanger } from 'role.ranger';
import { roleHealer } from 'role.healer';
import { roleTank } from 'role.tank';
import { roleSummoner } from 'role.summoner';
import { roleOutsiderCarrier } from 'role.outsider.carrier';

export function cleanUpMemory() {
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
        }
    }
}

export function runScreepsRoles() {
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.role == roleHarvester.role) {
            roleHarvester.run(creep);
        }
        else if (creep.memory.role == roleSummoner.role) {
            roleSummoner.run(creep);
        }
        else if (creep.memory.role == roleCarrier.role) {
            roleCarrier.run(creep)
        }
        else if (creep.memory.role == roleTowerKeeper.role) {
            roleTowerKeeper.run(creep);
        }
        else if (creep.memory.role == roleUpgrader.role) {
            roleUpgrader.run(creep);
        }
        else if (creep.memory.role == roleBuilder.role) {
            roleBuilder.run(creep);
        }
        else if (creep.memory.role == roleAttacker.role) {
            roleAttacker.run(creep)
        }
        else if (creep.memory.role == roleRanger.role) {
            roleRanger.run(creep)
        }
        else if (creep.memory.role == roleTank.role) {
            roleTank.run(creep)
        }
        else if (creep.memory.role == roleHealer.role) {
            roleHealer.run(creep)
        }
        else if (creep.memory.role == roleDefender.role) {
            roleDefender.run(creep);
        }
        else if (creep.memory.role == roleRepairer.role) {
            roleRepairer.run(creep);
        }
        else if (creep.memory.role == roleWallRepairer.role) {
            roleWallRepairer.run(creep);
        }
        else if (creep.memory.role == roleOutsiderHarvester.role) {
            roleOutsiderHarvester.run(creep);
        }
        else if (creep.memory.role == roleOutsiderEnergyCarrier.role) {
            roleOutsiderEnergyCarrier.run(creep);
        }
        else if (creep.memory.role == roleOutsiderCarrier.role) {
            roleOutsiderCarrier.run(creep);
        }
        else if (creep.memory.role == roleOutsiderClaimer.role) {
            roleOutsiderClaimer.run(creep);
        }
        else if (creep.memory.role == roleOutsiderReserver.role) {
            roleOutsiderReserver.run(creep)
        }
        else if (creep.memory.role == roleMiner.role) {
            roleMiner.run(creep)
        }
    }
}


const minNumberOfHarvesters = 2;
const minNumberOfUpgraders = 1;
const minNumberOfBuilders = 1;
const minNumberOfTowerKeepers = 1
const minNumberOfRepairers = 1;
const minNumberOfWallRepairers = 1
const minimumNumberOfDefenders = 1;
const minimumNumberOfAttackers = 1;
const minimumNumberOfEnergyCarriers = 2
const minimumNumberOfOutsiderHarvesters = 2
const minimumNumberOfOutsiderEnergyCarriers = 2
const minimumNumberOfMiners = 1

let minNumberOfHealers = 0
let minNumberOfTanks = 0
let minNumberOfAttackers = 0
let minNumberOfRangers = 0

export const manageSpawning = registerFNProfiler(function manageSpawning() {
    Memory["activeSpawners"] = {}

    if (Game.time % 10 == 0) {
        Memory.roomsWithStorage = []
        Memory.maxEnergyCapacityInRooms = _.max(Game.rooms, (r) => r.energyCapacityAvailable).energyCapacityAvailable
    }

    if (Game.time % 5 == 0) {
        // var flags = _.map(Game.flags, (s) => s).filter((x) => x && x.name.startsWith("attack"))
        // if (flags.length > 0) {
        //     minNumberOfAttackers = 1
        // }
        minNumberOfTanks = getMinNumberOfUnitsBasedOnFlag("tank", 2)
        minNumberOfHealers = getMinNumberOfUnitsBasedOnFlag("heal", 5);
        minNumberOfRangers = getMinNumberOfUnitsBasedOnFlag("range", 1);
        minNumberOfAttackers = getMinNumberOfUnitsBasedOnFlag("attack", 1)
    }

    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName]
        Memory.map[roomName] = "visible"


        room.calculateStats();
        let visualCurrentLine = 0
        room.visual.text(`Energy: ${room.energyAvailable}/${room.energyCapacityAvailable}`, 0, visualCurrentLine++, { align: 'left' })
        room.visual.text(`# of ticks at full/not full energy: ${room.memory.stats.numberOfTicksWithFullEnergy}/${room.memory.stats.numberOfTicksWithoutFullEnergy}`, 0, visualCurrentLine++, { align: 'left' })
        room.visual.text(`harvester power: ${room.memory.stats.totalHarvestPower}`, 0, visualCurrentLine++, { align: 'left' })
        room.visual.text(`number of creeps ${room.memory.stats.numberOfCreeps}`, 0, visualCurrentLine++, { align: 'left' })

        if (room.storage) {
            Memory["roomsWithStorage"].push(roomName)
        }

        if (room.memory.stats.previousNumberOfCreeps <= room.memory.stats.numberOfCreeps && Game.time % 50 && room.memory.stats.totalHarvestPower >= 22) {
            // save cpu
            continue
        }

        if (room.find(FIND_SOURCES).length == 0) {
            // room has no sources, skip it
            continue;
        }

        const structures = room.find(FIND_STRUCTURES)

        const towers = structures.filter(s => s.structureType == STRUCTURE_TOWER)
        const numberOfHarvesters = numberOfCreepsInRole(roleHarvester.role, roomName);
        const numberOfUpgraders = numberOfCreepsInRole(roleUpgrader.role, roomName)
        const numberOfBuilders = numberOfCreepsInRole(roleBuilder.role, roomName)
        const numberOfCarriers = numberOfCreepsInRole(roleCarrier.role, roomName)
        const numberOfAttackers = numberOfCreepsInRole(roleAttacker.role)
        const numberOfRangers = numberOfCreepsInRole(roleRanger.role)
        const numberOfHealers = numberOfCreepsInRole(roleHealer.role)
        const numberOfTanks = numberOfCreepsInRole(roleTank.role)
        const numberOfTicksWithFullEnergyPerUpgrader = 20

        room.memory.stats.numberOfCarriers = numberOfCarriers
        room.memory.stats.numberOfHarvesters = numberOfHarvesters

        const roomSpawner = room.find(FIND_MY_SPAWNS)
        if (roomSpawner.length > 0 && room.controller && room.controller.my) {
            // room has its own spawner
            Memory["map"][roomName] = "my + spawner"
            var defenderCreep = _.filter(Game.creeps, (c) => c.memory.role == roleDefender.role && c.room.name == roomName);
            const numberOfFullContainers = room.find(FIND_STRUCTURES, { filter: s => s.structureType == STRUCTURE_CONTAINER && s.store.energy == s.storeCapacity }).length

            if (_.filter(Game.creeps, (c) => c.room.name == roomName).length < minNumberOfHarvesters) {
                roleHarvester.spawn(300, roomName)
            }
            if (numberOfHarvesters == 0) {
                if (!roleHarvester.spawn(room.energyCapacityAvailable, roomName))
                    roleHarvester.spawn(room.energyAvailable, roomName)
            }
            if (numberOfHarvesters < minNumberOfHarvesters) {
                roleHarvester.spawn(Math.min(room.energyCapacityAvailable, 1000), roomName)
            }
            else if (numberOfHarvesters >= minNumberOfHarvesters && room.memory.stats.totalHarvestPower < 22 && numberOfHarvesters < room.getNumberOfSpotsNearbySources()) {
                if (room.memory.stats.numberOfTicksWithoutFullEnergy > 100) {
                    roleHarvester.spawn(room.energyAvailable, roomName)
                } else {
                    roleHarvester.spawn(Math.min(room.energyCapacityAvailable, 1000), roomName)
                }
            }
            // else if (room.findStructureOfType<StructureContainer>(STRUCTURE_CONTAINER).length > 0 && numberOfCreepsInRole(roleEnergyCarrier.role, roomName) < 0) {
            //     if (!roleEnergyCarrier.spawn(room.energyCapacityAvailable, roomName))
            //         roleEnergyCarrier.spawn(room.energyAvailable, roomName)
            // }
            else if ((structures.some(s => s.structureType == STRUCTURE_CONTAINER) || structures.some(s => s.structureType == STRUCTURE_LINK))
                && numberOfCarriers == 0
                && room.memory.stats.numberOfTicksWithoutFullEnergy > 150) {
                roleCarrier.spawn(room.energyAvailable, roomName)
            }
            else if ((structures.some(s => s.structureType == STRUCTURE_CONTAINER) || structures.some(s => s.structureType == STRUCTURE_LINK))
                && numberOfCarriers < (room.controller.level > 6 ? 1 : minimumNumberOfEnergyCarriers)) {
                roleCarrier.spawn(room.energyCapacityAvailable, roomName)
            }
            else if (numberOfFullContainers > 1
                && numberOfCarriers < 3) {
                roleCarrier.spawn(room.energyCapacityAvailable, roomName)
            }
            else if (numberOfUpgraders < minNumberOfUpgraders
                && room.memory.stats.numberOfTicksWithFullEnergy > 40
                && numberOfUpgraders < (room.storage != undefined && ((room.storage) as StructureStorage).store.energy > 100000 ? 4111 : 1)
                || numberOfFullContainers > 1 && numberOfUpgraders < 6) {
                roleUpgrader.spawn(room.energyCapacityAvailable, roomName)
            }
            else if (room.find(FIND_MY_CONSTRUCTION_SITES).length > 0
                && (numberOfCreepsInRole(roleBuilder.role, roomName) < minNumberOfBuilders
                    || ((true || !_.contains(Memory.roomsWithStorage, room.name) || (room.storage != undefined && ((room.storage) as StructureStorage).store.energy > 100000))
                        && room.memory.stats.numberOfTicksWithFullEnergy > numberOfBuilders * numberOfTicksWithFullEnergyPerUpgrader + 20
                        && numberOfBuilders < 4))) {
                roleBuilder.spawn(room.energyCapacityAvailable, roomName)
            }
            else if (towers.length > 0
                && numberOfCreepsInRole(roleTowerKeeper.role, roomName) < minNumberOfTowerKeepers) {
                roleTowerKeeper.spawn(room.energyCapacityAvailable, roomName)
            }
            else if (numberOfAttackers < minNumberOfAttackers) {
                roleAttacker.spawn(room.energyCapacityAvailable, roomName)
            }
            else if (numberOfRangers < minNumberOfRangers) {
                roleRanger.spawn(room.energyCapacityAvailable, roomName)
            }
            else if (numberOfHealers < minNumberOfHealers) {//healFlags.length) {
                roleHealer.spawn(room.energyCapacityAvailable, roomName)
            }
            else if (numberOfTanks < minNumberOfTanks) {// tankFlags.length) {
                roleTank.spawn(room.energyCapacityAvailable, roomName)
            }
            else if (room.find(FIND_STRUCTURES, { filter: (s) => s.hits < s.hitsMax && s.structureType != STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART })
                && numberOfCreepsInRole(roleRepairer.role, roomName) + numberOfCreepsInRole(roleTowerKeeper.role, roomName) < minNumberOfRepairers) {
                // structures requiring repair exist in room
                roleRepairer.spawn(room.energyCapacityAvailable, roomName)
            }
            // create defenders
            else if ((!room.controller.safeMode || room.controller.safeMode < 100) && numberOfCreepsInRole(roleDefender.role, roomName) < minimumNumberOfDefenders) {
                roleDefender.spawn(room.energyCapacityAvailable, roomName)
            }
            else if ((!room.controller.safeMode || room.controller.safeMode < 100) && defenderCreep && defenderCreep[0] && defenderCreep[0].ticksToLive && (defenderCreep[0].ticksToLive as number) < 200 && numberOfCreepsInRole(roleDefender.role, roomName) <= minimumNumberOfDefenders - towers.length) {
                roleDefender.spawn(room.energyCapacityAvailable, roomName)
            }
            else if (structures.some(s => s.structureType == STRUCTURE_WALL)
                && (room.controller.level > 2 || room.memory.stats.numberOfTicksWithFullEnergy > 15)
                && numberOfCreepsInRole(roleWallRepairer.role, roomName) < minNumberOfWallRepairers) {
                roleWallRepairer.spawn(room.energyCapacityAvailable, roomName)
            }
            else if (structures.some(s => s.structureType == STRUCTURE_EXTRACTOR)
                && numberOfCreepsInRole(roleMiner.role, roomName) < minimumNumberOfMiners
                && room.terminal && _.sum(room.terminal.store) - room.terminal.store.energy < room.terminal.storeCapacity / 2) {
                roleMiner.spawn(room.energyCapacityAvailable, roomName)
            }
            else if (room.storage && room.storage.store.energy > room.storage.storeCapacity / 2 && numberOfCreepsInRole(roleUpgrader.role, roomName) < 8
                && room.memory.stats.numberOfTicksWithFullEnergy > 50) {
                roleUpgrader.spawn(room.energyCapacityAvailable, roomName)
            }
        }
        else {
            // room with no spawner
            if (room.controller) {
                if (room.controller.my) {
                    Memory["map"][roomName] = "my without spawner"
                    if (numberOfCreepsInRole(roleBuilder.role, roomName) < 2 && Memory.maxEnergyCapacityInRooms) {
                        createCustomCreep(Memory.maxEnergyCapacityInRooms, roleBuilder.role, roomName, false, maxEnergyForSpawnPerRoom)
                    }
                    else if (numberOfCreepsInRole(roleUpgrader.role, roomName) < minNumberOfUpgraders && Memory.maxEnergyCapacityInRooms) {
                        createCustomCreep(Memory.maxEnergyCapacityInRooms, roleUpgrader.role, roomName, false, maxEnergyForSpawnPerRoom)
                    }
                    // TODO automatic spawner building
                } else if (room.controller.reservation && room.controller.reservation.username == getMyUsername()) {
                    Memory["map"][roomName] = "reserved"
                    const numberOfSources = room.sources.length
                    var flags = _.map(Game.flags, (s) => s).filter((x) => x && x.name.startsWith("ignore") && x.pos.roomName == roomName)
                    if (Memory.roomsWithStorage.length == 0 || flags.length > 0) {
                        continue
                    }

                    if (numberOfCreepsInRole(roleOutsiderHarvester.role, roomName) < numberOfSources && Memory.maxEnergyCapacityInRooms) {
                        roleOutsiderHarvester.spawn(Math.min(Memory.maxEnergyCapacityInRooms, 1700), roomName)
                    }
                    else if (numberOfCreepsInRole(roleOutsiderEnergyCarrier.role, roomName) < numberOfSources * 2 && Memory.maxEnergyCapacityInRooms) {
                        roleOutsiderEnergyCarrier.spawn(Math.min(Memory.maxEnergyCapacityInRooms, 2500), roomName)
                    }
                }
            }
        }
    }

    let claimFlag = Game.flags["claim"]
    if (claimFlag) {
        const claimers = _.filter(Game.creeps, (c) => c.memory.role == roleOutsiderClaimer.role)
        if (claimers.length == 0) {
            roleOutsiderClaimer.spawn(claimFlag.pos.roomName)
        }
    }
    for (var flagName in Game.flags) {
        if (flagName.startsWith("reserve")) {
            const flag = Game.flags[flagName]
            const reservers = _.filter(Game.creeps, (c) => c.memory.role == roleOutsiderReserver.role && c.memory.room == flag.pos.roomName)
            if (reservers.length == 0 && Memory.roomsWithStorage.length > 0) {
                const room = Game.rooms[flag.pos.roomName]
                if (room && room.controller && room.controller.reservation && room.controller.reservation.ticksToEnd > 4000) {
                    // skip reservation for visible room with high reservation
                    continue
                }
                roleOutsiderReserver.spawn(flag.pos.roomName, Memory.maxEnergyCapacityInRooms)
            }
        }
    }

    function getMinNumberOfUnitsBasedOnFlag(flagName: string, defaultNumberOfUnits: number): number {
        var numberOfUnits = 0
        var healFlags = _.map(Game.flags, (s) => s).filter((x) => x && x.name.startsWith(flagName));
        if (healFlags.length > 0) {
            const flagNameParts = healFlags[0].name.split(";");
            if (flagNameParts.length > 1) {
                numberOfUnits = parseInt(flagNameParts[1]);
            }
            else {
                numberOfUnits = defaultNumberOfUnits;
            }
        }
        else {
            numberOfUnits = 0;
        }
        return numberOfUnits
    }
}
)
