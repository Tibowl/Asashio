import { CommandInteraction, Message } from "discord.js"
import log4js from "log4js"
import fetch from "node-fetch"
import emoji from "../../data/emoji.json"
import client from "../../main"
import Command from "../../utils/Command"
import { CommandSource, SendMessage } from "../../utils/Types"
import { sendMessage, updateMessage } from "../../utils/Utils"


const Logger = log4js.getLogger("autofleet")

interface CompCandidate {
    count: number
    fleet1Comp: string[]
    fleet2Comp: string[]
    fleetTypes: number[]

    [key: string]: unknown
}

interface ShipCandidate {
    count: number
    class: string
    id: number

    [key: string]: unknown
}

interface ShipCandidates {
    "main": ShipCandidate[]
    "escort": ShipCandidate[]
}

type FleetNum = "main" | "escort"
const firstFleet: FleetNum = "main"
const secondFleet: FleetNum = "escort"

const shipsCache: { [key: string]: { [key: string]: { [key: string]: ShipCandidates } } } = {},
      compsCache: { [key: string]: { [key: string]: CompCandidate[] } } = {},
      constants = "difficulty=4&useMainFs=true&useEscortFs=true&allComp=&start="

export default class AutoFleet extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: `Automatically generates a fleet.
How it works:
- Picks fleet composition (ignoring fleet order except FS) that reached given node the most
- Looks for most used ships with said fleet comp
- First fills main fleet FS, then escort fleet FS, then randomly fills the remaining slots

- Nothing can be guaranteed on these fleets on how they will route/perform
Uses <http://kc.piro.moe> API`,
            usage: "autofleet <map-boss node>",
            aliases: ["spoonfeed", "imretardedpleasehelp", "imretardedplshelp"],
            options: [{
                name: "mapnode",
                description: "Map and node",
                type: "STRING",
                required: true
            }]
        })
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return this.run(source, source.options.getString("mapnode", true))
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        return this.run(source, args.join(" "))
    }

    async run(source: CommandSource, arg: string): Promise<SendMessage | undefined> {
        const args = arg.toUpperCase().split(/ +/)
        if (!args || args.length < 1 || args.length > 2) return sendMessage(source, `Usage: \`${this.usage}\``)
        const { data } = client

        if (args[0].includes("-") && !args[0].match(/-\d$/))
            args[0] = args[0].replace(/-\d/, "$& ")
        else if (!args[0].match(/E\d$/))
            args[0] = args[0].replace(/E\d/i, "$& ")

        let map = args[0]
        if (map.startsWith("E-")) map = map.replace("E", data.eventID().toString())
        else if (map.startsWith("E")) map = map.replace("E", data.eventID() + "-")
        if (map.split("-").length != 2) return sendMessage(source, "Invalid map!")

        if (args.length !== 2)
            return sendMessage(source, "Missing node!")
        const node = args[1]

        const reply = await sendMessage(source, `${emoji.loading} Loading...`)
        data.getMapInfo(map).then(async mapInfo => {
            if (!reply) return
            if (Object.keys(mapInfo.route).length == 0) {
                await updateMessage(reply, "Invalid/unknown map!")
                return
            }
            if (Object.entries(mapInfo.route).filter(e => e[1][1].toUpperCase() == node).length == 0) {
                await updateMessage(reply, "Invalid/unknown node!")
                return
            }

            const edges = Object.entries(mapInfo.route).filter(e => e[1][1].toUpperCase() == node).map(e => e[0])
            await updateMessage(reply, `Generated autofleet for ${map} ${node}\n${await this.autoFleet(map, edges)}`)
        }).catch(e => Logger.error(e))
        return reply
    }

    autoFleet = async (map: string, edges: string[]): Promise<string> => {
        /*
            How it works:
            1. Grab top fleets
            2. Grab top ships from fleets
            3. Fill top fleet spots with top ships randomly
        */

        const allComps = await this.getAllComps(map, edges)
        if (allComps.length == 0) return "Couldn't find a comp!"
        const bestComp = allComps.sort((a, b) => b.count - a.count)[0]

        const { fleet1Comp, fleet2Comp, fleetTypes } = bestComp
        // console.log("Found fleet: ", fleet1Comp, fleet2Comp)

        const allShips = await this.getTopShips(map, edges, fleet1Comp, fleet2Comp)

        const usedShips: number[] = []
        const ships1 = [], ships2 = []

        const entireFleet = [...fleet1Comp, ...fleet2Comp]
        const fleet1 = [...fleet1Comp], fleet2 = [...fleet2Comp]
        // console.log(entireFleet)

        for (let shipsAdded = 0; shipsAdded < fleet1Comp.length + fleet2Comp.length; shipsAdded++) {
            // Select random ship class
            let typeToFill = entireFleet[Math.floor(Math.random() * entireFleet.length)]

            // Select random fleet to add in, watch out for

            let fleet: FleetNum = [firstFleet, secondFleet][Math.floor(Math.random() * 2)]

            if (fleet2.includes(typeToFill) && !fleet1.includes(typeToFill))
                fleet = secondFleet
            else if (fleet1.includes(typeToFill) && !fleet2.includes(typeToFill))
                fleet = firstFleet

            // Force handling of FS first
            if (shipsAdded == 0 && fleet1Comp.length > 0) {
                typeToFill = fleet1Comp[0]
                fleet = firstFleet
            } else if (shipsAdded == 1 && fleet2Comp.length > 0) {
                typeToFill = fleet2Comp[0]
                fleet = secondFleet
            }

            // Select ship
            const ship = allShips[fleet]
                .sort((a, b) => b.count - a.count)
                .find((k) => k.class == typeToFill && !usedShips.includes(k.id))

            if (ship == undefined) continue

            // Fill ship in fleet
            if (fleet === firstFleet) {
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
    Node reached count with comp: ${bestComp.count}
    Fleet Type: ${fleetTypes.map(k => ["Single", "CTF", "STF", "TCF"][k]).join(", ")}
    Main fleet: ${fleet1Comp.join(", ")}${fleet2Comp.length > 0 ? `
    Escort fleet: ${fleet2Comp.join(", ")}` : ""}
Ships to use:
    Main fleet: ${ships1.map(k => `${k.name_en} (x${k.count})`).join(", ")}${fleet2Comp.length > 0 ? `
    Escort fleet: ${ships2.map(k => `${k.name_en} (x${k.count})`).join(", ")}` : ""}
\`\`\``
    }
    // include=&exclude=&minGauge=1&maxGauge=4&minGaugeLevel=0&maxGaugeLevel=9999&minEdges=0&maxEdges=99&minLos=-40&maxLos=999&minRadars=0&maxRadars=60&minRadarShips=0&maxRadarShips=12&minSpeed=5&maxSpeed=20&nodes=&edges=&fleetType=-1&losType=1&radarType=0& &showEdgeIds=false&showLbasDistance=true&showMapBackground=true&retreats=true&cleared=-1

    async getAllComps(map: string, edges: string[]): Promise<CompCandidate[]> {
        if (compsCache[map] && compsCache[map][edges.join(",")])
            return compsCache[map][edges.join(",")]
        Logger.info(`Caching top comps of ${map} ${edges.join(",")}`)

        const allComps: CompCandidate[] = []
        for (const edge of edges) {
            try {
                const comps = await (await fetch(`http://kc.piro.moe/api/routing/comps/${map}/${edge}?${constants}&mainComp=&escortComp=&compsLimit=50&keepCompMainFlagships=true&keepCompEscortFlagships=true&keepCompFleetTypes=true`)).json()
                if (comps.result)
                    for (const result of comps.result) {
                        const found = allComps.find(k =>
                            k.fleet1Comp.join(",") == result.fleet1Comp.join(",") &&
                            k.fleet2Comp.join(",") == result.fleet2Comp.join(",") &&
                            k.fleetTypes[0] == result.fleetTypes[0])
                        if (found)
                            found.count += result.count
                        else
                            allComps.push(result)
                    }
            } catch (error) {
                Logger.error(`Gathering comps for ${map} - ${edge} failed`)
            }
        }
        if (!compsCache[map])
            compsCache[map] = {}
        compsCache[map][edges.join(",")] = allComps
        setTimeout(() => {
            delete compsCache[map][edges.join(",")]
        }, 12 * 60 * 60 * 1000)
        return allComps
    }

    async getTopShips(map: string, edges: string[], fleet1Comp: string[], fleet2Comp: string[]): Promise<ShipCandidates> {
        if (shipsCache[map] && shipsCache[map][edges.join(",")] && shipsCache[map][edges.join(",")][fleet1Comp.join(",") + fleet2Comp.join(",")])
            return shipsCache[map][edges.join(",")][fleet1Comp.join(",") + fleet2Comp.join(",")]

        Logger.info(`Caching top ships of ${map} ${edges.join(",")}`)
        const allShips: ShipCandidates = { "main": [], "escort": [] }
        for (const edge of edges) {
            try {
                const fetched = await fetch(`http://kc.piro.moe/api/routing/edges/${map}/${edge}?${constants}&mainComp=${fleet1Comp.join("%20")}&escortComp=${fleet2Comp.join("%20")}`)
                if (fetched.status == 204) continue
                const ships = await fetched.json()
                if (!ships.topships) continue
                const check = (fleet: FleetNum): void => {
                    if (!ships.topships[fleet]) return
                    for (const result of ships.topships[fleet]) {
                        const found = allShips[fleet].find(k => k.id == result.id)
                        if (found)
                            found.count += result.count
                        else
                            allShips[fleet].push(result)
                    }
                }

                check("main")
                check("escort")
            } catch (error) {
                Logger.error(`Gathering fleets for ${map} - ${edge} failed`)
                Logger.error(error)
            }
        }
        if (!shipsCache[map])
            shipsCache[map] = {}
        if (!shipsCache[map][edges.join(",")])
            shipsCache[map][edges.join(",")] = {}
        shipsCache[map][edges.join(",")][fleet1Comp.join(",") + fleet2Comp.join(",")] = allShips
        setTimeout(() => {
            delete shipsCache[map][edges.join(",")][fleet1Comp.join(",") + fleet2Comp.join(",")]
        }, 12 * 60 * 60 * 1000)

        return allShips
    }
}

// eslint-disable-next-line no-console
// ;(async () => console.log(await this.autoFleet("46-5", [10])))()
