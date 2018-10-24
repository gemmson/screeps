import { towerAttack } from "tower";
import { roleOutsiderClaimer } from "role.outsider.claimer";
import { runScreepsRoles, cleanUpMemory, manageSpawning } from "loops";
import profiler from 'screeps-profiler';
import { handleLinks } from "linksHandler";
import { roleUpgrader } from "role.upgrader";
import { handleTasksAssignment } from "assignments";
import { roleAttacker } from "role.attacker";
import { roleRanger } from "role.ranger";
import { roleTank } from "role.tank";
import { roleHealer } from "role.healer";
import { manageSummons } from "summoning.circle";

profiler.enable()

Memory.allies = [
    "MiloszeS",
    "Taedh"
]

const g = (global as any);


g["createClaimer"] = function (room: string) {
    roleOutsiderClaimer.spawn(room)
}
g["createAttacker"] = function (room: string, energy: number) {
    roleAttacker.spawn(energy, room)
}

g["createUpgrader"] = function (room: string, energy: number) {
    roleUpgrader.spawn(energy, room)
}

g["createRanger"] = function (room: string, energy: number) {
    roleRanger.spawn(energy, room)
}

g["createTank"] = function (room: string, energy: number) {
    roleTank.spawn(energy, room)
}

g["createHealer"] = function (room: string, energy: number) {
    roleHealer.spawn(energy, room)
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = function () {
    profiler.wrap(
        () => {
            //console.log(`Current game tick is ${Game.time}`);

            // Automatically delete memory of missing creeps
            cleanUpMemory();

            Memory["map"] = {}

            manageSummons();
            manageSpawning()
            towerAttack();
            handleLinks();
            handleTasksAssignment();
            runScreepsRoles();
        })
}
