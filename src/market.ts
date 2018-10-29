import { registerFNProfiler } from "functions";

const minimumNumberOfEnergy = 2000
const minimumNumberOfResource = 50000

export const handleMarketOrders = registerFNProfiler(function handleMarketOrders() {
    if (Memory.marketDisabled || Game.cpu.getUsed() >= Game.cpu.limit || Game.time % 10 > 0) {
        return
    }
    // there should be significantly less spawns than visible rooms so we iterate over spawns
    for (var spawnName in Game.spawns) {
        const room = Game.spawns[spawnName].room
        const terminal = room.terminal
        if (!terminal || terminal.cooldown > 0) {
            continue
        }
        const resources = _.map(terminal.store, (value, key) => {
            if (value > 0 && key != RESOURCE_ENERGY) {
                return key
            }
            return undefined
        }).filter(r => !!r)
        if (resources.length == 0) {
            continue
        }
        // find room resource
        const resource = resources[0] as ResourceConstant | undefined
        if (!resource) {
            continue
        }
        if (terminal.store.energy < minimumNumberOfEnergy || typeof terminal.store[resource] != "number") {
            continue
        }
        const resourceAmount = terminal.store[resource]
        if (!resourceAmount || resourceAmount < minimumNumberOfResource) {
            continue
        }
        var orders = Game.market.getAllOrders(order =>
            order.resourceType == resource
            && order.type == ORDER_BUY
            && order.roomName != undefined
            && Game.market.calcTransactionCost(200, room.name, order.roomName) < 400
        )
        if (orders.length > 0) {
            orders = _.sortByOrder(orders, (o) => o.price, "desc")
            const bestOrder = orders[0]
            //console.log(`Trying to fulfill buy order for ${resource} at price: ${bestOrder.price}`)
            const result = Game.market.deal(bestOrder.id, 200, room.name)
            if (result == OK) {
                console.log(`Order for ${bestOrder.resourceType} completed successfully in room ${room.name}. Order room ${bestOrder.roomName}`)
            }
        }
    }
})
