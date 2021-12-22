import { configure, DeckBuilder, DeckBuilderFleet, DeckBuilderShip, generate } from "@tibowl/node-gkcoi"
import { CommandInteraction, Message, MessageAttachment } from "discord.js"
import log4js from "log4js"
import fetch from "node-fetch"
import { join } from "path"
import emoji from "../../data/emoji.json"
import client from "../../main"
import Command from "../../utils/Command"
import { CommandSource, FleetData, MapEntries, MapEntry, SendMessage } from "../../utils/Types"
import { aswAtLevel, evasionAtLevel, losAtLevel, sendMessage, updateMessage } from "../../utils/Utils"


const Logger = log4js.getLogger("randomfleet")

const path = join(__dirname, "../../../src/data/")
const cache = join(path, "cache")
configure({ cacheDir: cache })
Logger.info(`Caching in ${cache}`)

const entriesCache: { [key: string]: {
    entries: MapEntry[][]
    edgeCounts: number[]
} } = {}
type ShipID = "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7"
type ItemID = "i1" | "i2" | "i3" | "i4" | "i5" | "ix"

export default class RandomFleet extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: `Random fleet for a map.
How it works:
- Picks a random entry in TsunDB for this map:
  - Only lastest 50 for each incoming edge are considered
  - These 50 are weighted by the amount of total entries for the edge
  - Limited to last 15 days for normal maps
- Generates an image out of that fleet

- Nothing can be guaranteed on these fleets on how they will route/perform
Uses <http://kc.piro.moe> API, images rendered using a fork of にしくま's gkcoi`,
            usage: "randomfleet <map> <node>",
            aliases: ["rng", "imretardedpleasedonthelp", "imretardedplsdonthelp"],
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
        if (!args || args.length < 1 || args.length > 2) return sendMessage(source, `Usage: \`${this.usage}\``)
        return this.run(source, args.join(" "))
    }

    async run(source: CommandSource, arg: string): Promise<SendMessage | undefined> {
        const { data } = client

        let args = arg.split(/ +/)
        if (args[0].includes("-") && !args[0].match(/-\d$/))
            args[0] = args[0].replace(/-\d/, "$& ")
        else if (!args[0].match(/E\d$/))
            args[0] = args[0].replace(/E\d/i, "$& ")

        args = args.join(" ").toUpperCase().split(" ")

        let map = args[0]
        if (map.startsWith("E-")) map = map.replace("E", data.eventID().toString())
        else if (map.startsWith("E")) map = map.replace("E", data.eventID() + "-")
        if (map.split("-").length != 2) return sendMessage(source, "Invalid map!")

        if (args.length !== 2)
            return sendMessage(source, "Missing node!")

        const node = args[1]
        const mapInfo = await data.getMapInfo(map)
        if (Object.keys(mapInfo.route).length == 0) return sendMessage(source, "Invalid/unknown map!")
        if (Object.entries(mapInfo.route).filter(e => e[1][1].toUpperCase() == node).length == 0)
            return sendMessage(source, "Invalid/unknown node!")

        const edges = Object.entries(mapInfo.route).filter(e => e[1][1].toUpperCase() == node).map(e => e[0])

        const reply = await sendMessage(source, `${emoji.loading} Loading...`)
        this.randomFleet(map, edges, node).then(async fleetData => {
            if (!reply) return
            if (fleetData == undefined) {
                await updateMessage(reply, "Not enough samples recently, again later")
                return
            }

            Logger.info(`Rendering image for ${map} ${node}...`)
            const canvas = await generate(fleetData, {
                start2Data: {
                    api_result: 200,
                    api_result_msg: "OK",
                    api_data: client.data.api_start2
                }
            })
            Logger.info(`Rendered image for ${map} ${node}`)
            const attachment = new MessageAttachment(canvas.toBuffer(), `${map} ${node}.png`)

            return updateMessage(reply, { content: `Selected fleet for ${map} ${node}`, files: [attachment] })
        }).catch(e => Logger.error(e))

        return reply
    }

    getEventDescription(entry: MapEntry): string {
        let description = ""

        if (entry.difficulty !== undefined) description += `
Difficulty: ${["/", "C", "E", "M", "H"][entry.difficulty]}
`
        if (entry.gaugeNum !== undefined) description += `Gauge #${entry.gaugeNum}
`
        // gaugeType: 2 = HP; 3 = TP
        if (entry.currentMapHp !== undefined && entry.maxMapHp !== undefined && entry.gaugeType !== undefined)
            description += `Gauge ${entry.gaugeType === 3 ? "TP" :"HP"}: ${entry.currentMapHp}/${entry.maxMapHp}
`

        return description
    }

    async randomFleet(map: string, edges: string[], node: string): Promise<DeckBuilder | undefined> {
        const samples = await this.getEntries(map, edges)

        if (samples.edgeCounts.length == 0) return undefined

        const sum = samples.edgeCounts.reduce((acc, el) => acc+el, 0)
        if (sum == 0) return undefined

        const target = Math.random() * sum
        let acc = 0

        const edgeEntries = samples.entries[samples.edgeCounts.filter(el => (acc = acc + el) <= target).length]

        const entry = edgeEntries[Math.floor(Math.random() * edgeEntries.length)]
        const data: DeckBuilder = {
            hqlv: entry.hqLvl,
            theme: "dark",
            lang: "en",
            cmt: `Random fleet for ${map}${node}
${this.getEventDescription(entry)}
ID: ${entry.id}
${new Date(entry.datetime + "Z").toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short"
    })}`
        }

        const f1 = this.getFleet(entry.fleet1data)
        const f2 = this.getFleet(entry.fleet2data)

        if (f1) data.f1 = f1
        if (f2) data.f2 = f2

        return data
    }

    private async getEntries(map: string, edges: string[]): Promise<{
        entries: MapEntry[][]
        edgeCounts: number[]
    }> {
        const cached = entriesCache[map + edges.join(",")]
        if (cached) return cached

        const dateFilter = (+map.split("-")[0]) < 10 ? `&start=${this.recent()}` : ""

        const entries: MapEntry[][] = []
        const edgeCounts: number[] = []
        for (const edge of edges) {
            Logger.info(`Caching entries of ${map} / ${edge}`)
            const comps: MapEntries = await (await fetch(`http://kc.piro.moe/api/routing/entries/${map}?edgeId=${edge}${dateFilter}&perPage=50`)).json()
            entries.push(comps.entries ?? [])
            edgeCounts.push(comps.entryCount ?? 0)
        }
        entriesCache[map + edges.join(",")] = { entries, edgeCounts }
        setTimeout(() => {
            delete entriesCache[map + edges.join(",")]
        }, 60 * 60 * 1000)

        return entriesCache[map + edges.join(",")]
    }

    getFleet(fleetData: FleetData[]): DeckBuilderFleet | undefined {
        if (fleetData == undefined || fleetData.length == 0) return undefined

        const fleet: DeckBuilderFleet = {}
        for (const ind in fleetData) {
            const ship = fleetData[ind]
            const shipData = client.data.getShipById(ship.id)

            const t: DeckBuilderShip = {
                id: ship.id,
                lv: ship.level,

                hp: (ship.level > 99 ? shipData?.hp_married : shipData?.hp) ?? -1,

                fp: shipData?.firepower_max || 0,
                tp: shipData?.torpedo_max || 0,
                aa: shipData?.aa_max || 0,
                ar: shipData?.armor_max || 0,
                asw: shipData !== undefined ? aswAtLevel(shipData, ship.level) : -1,
                ev: shipData !== undefined ? evasionAtLevel(shipData, ship.level) : -1,
                los: shipData !== undefined ? losAtLevel(shipData, ship.level) : -1,
                luck: shipData?.luck || 0,

                items: {}
            }

            const keys: ItemID[] = ["i1", "i2", "i3", "i4", "i5", "ix"]

            let i
            for (i = 0; i < ((shipData?.equipment) ? shipData?.equipment.length : ship.equip.length); i++) {
                if (ship.equip[i] < 0) continue
                t.items[keys[i]] = {
                    id: ship.equip[i],
                    rf: ship.stars[i] <= 0 ? undefined : ship.stars[i],
                    mas: ship.ace[i] <= 0 ? undefined : ship.ace[i]
                }
            }

            if (ship.exslot != -1) {
                // Logger.info(shipData?.full_name, ship.exslot, i, keys[i])
                t.items[keys[i]] = {
                    id: ship.exslot
                }
            }

            fleet["s"+(+ind+1) as ShipID] = t
        }
        return fleet
    }

    recent(): string {
        const lm = new Date()
        lm.setUTCDate(lm.getUTCDate() - 15)
        return lm.toISOString().split("T")[0]
    }
}
