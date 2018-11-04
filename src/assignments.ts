import { roleHarvester } from "role.harvester";
import profiler from 'screeps-profiler';

export function handleTasksAssignment() {
    removeDeadAssignments()
    assignSourcesToHarvesters()
}

function removeDeadAssignments() {
    if (!Memory.assignments) {
        Memory.assignments = {}
    }
    for (const assignment in Memory.assignments) {
        const object = Game.getObjectById(Memory.assignments[assignment])
        if (!object) {
            delete Memory.assignments[assignment]
        }
    }
}
function assignSourcesToHarvesters() {
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        const sources = room.sources
        const harvesters = room.find(FIND_MY_CREEPS, { filter: (c) => c.memory.role == roleHarvester.role && !c.memory.targetId })
        harvesters.forEach((creep) => {
            for (let i = 0; i < sources.length; i++) {
                if (!Memory.assignments[sources[i].id]) {
                    creep.memory.targetId = sources[i].id
                    Memory.assignments[sources[i].id] = creep.id
                    break
                }
            }
        })
    }
}

// export const handleTasksAssignment = profiler.registerFN(handleTasksAssignmentFn, 'handleTasksAssignment');
