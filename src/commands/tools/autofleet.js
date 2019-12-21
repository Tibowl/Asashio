const fetch = require("node-fetch")
const Logger = require("log4js").getLogger("autofleet")

exports.run = async (message, args) => {
    if(!args || args.length < 1 || args.length > 2) return message.reply(`Usage: \`${this.usage}\``)
    const { data } = global

    if (args[0].includes("-") && !args[0].match(/-\d$/))
        args[0] = args[0].replace(/-\d/,"$& ")
    else if (!args[0].match(/E\d$/))
        args[0] = args[0].replace(/E\d/,"$& ")

    args = args.join(" ").split(" ")

    let map = args[0].toUpperCase()
    if(map.startsWith("E-")) map = map.replace("E", data.eventID())
    else if(map.startsWith("E")) map = map.replace("E", data.eventID() + "-")
    if(map.split("-").length != 2) return message.reply("Invalid map!")

    if(args.length !== 2) return message.reply("Missing node!" + args.join("/"))
    let node = args[1]
    const mapInfo = await data.getMapInfo(map)
    if(Object.keys(mapInfo.route).length == 0) return message.reply("Invalid/unknown map!")

    const edges = Object.entries(mapInfo.route).filter(e => e[1][1].toUpperCase() == node).map(e => e[0])

    return message.channel.send(`Generated autofleet for ${map} ${node}\n${await this.autoFleet(map, edges)}`)
}
exports.autoFleet = async (map, edges) => {
    /*
        How it works:
        1. Grab top fleets
        2. Grab top ships from fleets
        3. Fill top fleet spots with top ships randomly
    */


    const allComps = await getAllComps(map, edges)
    const bestComp = allComps.sort((a,b) => b.count - a.count)[0]

    const { fleet1Comp, fleet2Comp, fleetTypes } = bestComp
    //console.log("Found fleet: ", fleet1Comp, fleet2Comp)

    const allShips = await getTopShips(map, edges, fleet1Comp, fleet2Comp)
    const bestShips = allShips.sort((a,b) => b.count - a.count)

    const usedShips = []
    const ships1 = [], ships2 = []

    let entireFleet = [...fleet1Comp, ...fleet2Comp]
    let fleet1 = [...fleet1Comp], fleet2 = [...fleet2Comp]
    //console.log(entireFleet)

    for(let shipsAdded = 0; shipsAdded < fleet1Comp.length + fleet2Comp.length; shipsAdded++) {
        // Select random ship class
        let typeToFill = entireFleet[Math.floor(Math.random() * entireFleet.length)]

        // Select random fleet to add in, watch out for
        let fleet = Math.floor(Math.random() * 2) + 1
        if (fleet2.includes(typeToFill) && !fleet1.includes(typeToFill))
            fleet = 2
        else if (fleet1.includes(typeToFill) && !fleet2.includes(typeToFill))
            fleet = 1

        // Force handling of FS first
        if (shipsAdded == 0 && fleet1Comp.length > 0) {
            typeToFill = fleet1Comp[0]
            fleet = 1
        } else if (shipsAdded == 1 && fleet2Comp.length > 0) {
            typeToFill = fleet2Comp[0]
            fleet = 2
        }

        // Select ship
        const ship = bestShips.find(k => k.class == typeToFill && !usedShips.includes(k.id))

        // Fill ship in fleet
        if (fleet == 1) {
            fleet1.splice(fleet1.indexOf(typeToFill), 1)
            ships1.push(ship)
        } else {
            fleet2.splice(fleet2.indexOf(typeToFill), 1)
            ships2.push(ship)
        }

        // Fill ship in used ships (assuming no dupes), remove type from total
        usedShips.push(ship.id)
        entireFleet.splice(entireFleet.indexOf(typeToFill), 1)
    }
    return `\`\`\`
Fleet Composition:
    Fleet Type: ${fleetTypes.map(k => ["Single", "CTF", "STF", "TCF"][k]).join(", ")}
    Main fleet: ${fleet1Comp.join(", ")}
    Escort fleet: ${fleet2Comp.join(", ")}
Ships to use:
    Main fleet: ${ships1.map(k => k.name).join(", ")}
    Escort fleet: ${ships2.map(k => k.name).join(", ")}
\`\`\``
}

const constants = "include=&exclude=&minGauge=1&maxGauge=4&minGaugeLevel=0&maxGaugeLevel=9999&minEdges=0&maxEdges=99&minLos=-40&maxLos=999&minRadars=0&maxRadars=60&minRadarShips=0&maxRadarShips=12&minSpeed=5&maxSpeed=20&nodes=&edges=&fleetType=-1&losType=1&radarType=0&difficulty=4&showEdgeIds=false&showLbasDistance=true&showMapBackground=true&retreats=true&cleared=-1&useMainFs=true&useEscortFs=true&allComp=&start="

const compsCache = {}
async function getAllComps(map, edges) {
    if(compsCache[map] && compsCache[map][edges.join(",")])
        return compsCache[map][edges.join(",")]
    Logger.info(`Caching top comps of ${map} ${edges.join(",")}`)

    const allComps = []
    for (const edge of edges) {
        const comps = await (await fetch(`http://kc.piro.moe/api/routing/comps/${map}/${edge}?${constants}&mainComp=&escortComp=&compsLimit=50&keepCompMainFlagships=true&keepCompEscortFlagships=true&keepCompFleetTypes=true`)).json()
        if (comps.result)
            for (const result of comps.result) {
                const found = allComps.find(k => k.fleet1Comp.join(",") == result.fleet1Comp.join(",")
                    && k.fleet2Comp.join(",") == result.fleet2Comp.join(",")
                    && k.fleetTypes[0] == result.fleetTypes[0])
                if (found)
                    found.count += result.count
                else
                    allComps.push(result)
            }
    }
    if(!compsCache[map])
        compsCache[map] = {}
    compsCache[map][edges.join(",")] = allComps
    setTimeout(() => {
        delete compsCache[map][edges.join(",")]
    }, 12 * 60 * 60 * 1000)
    return allComps
}

const shipsCache = {}
async function getTopShips(map, edges, fleet1Comp, fleet2Comp) {
    if(shipsCache[map] && shipsCache[map][edges.join(",")] && shipsCache[map][edges.join(",")][fleet1Comp.join(",") + fleet2Comp.join(",")])
        return shipsCache[map][edges.join(",")][fleet1Comp.join(",") + fleet2Comp.join(",")]

    Logger.info(`Caching top ships of ${map} ${edges.join(",")}`)
    const allShips = []
    for (const edge of edges) {
        const ships = await (await fetch(`http://kc.piro.moe/api/routing/edges/${map}/${edge}?${constants}&mainComp=${fleet1Comp.join("%20")}&escortComp=${fleet2Comp.join("%20")}`)).json()
        if (ships.topships)
            for (const result of ships.topships) {
                const found = allShips.find(k => k.id == result.id)
                if (found)
                    found.count += result.count
                else
                    allShips.push(result)
            }
    }
    if(!shipsCache[map])
        shipsCache[map] = {}
    if(!shipsCache[map][edges.join(",")])
        shipsCache[map][edges.join(",")] = {}
    shipsCache[map][edges.join(",")][fleet1Comp.join(",") + fleet2Comp.join(",")] = allShips
    setTimeout(() => {
        delete shipsCache[map][edges.join(",")][fleet1Comp.join(",") + fleet2Comp.join(",")]
    }, 12 * 60 * 60 * 1000)

    return allShips
}

// eslint-disable-next-line no-console
//;(async () => console.log(await this.autoFleet("46-5", [10])))()

exports.category = "Tools"
exports.help = `Automatically generates a fleet.
How it works:
- Picks fleet composition (ignoring fleet order except FS) that reached given node the most
- Looks for most used ships with said fleet comp
- First fills main fleet FS, then escort fleet FS, then randomly fills the remaining slots

- Nothing can be guaranteed on these fleets on how they will route/perform
Uses <http://kc.piro.moe> API`
exports.usage = "autofleet <map> <boss node>"
exports.prefix = global.config.prefix
exports.aliases = ["spoonfeed", "imretardedpleasehelp"]
