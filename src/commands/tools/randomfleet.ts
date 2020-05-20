import { Message, MessageAttachment } from "discord.js"
import fetch from "node-fetch"
import log4js from "log4js"
import { join } from "path"
import { generate, configure, DeckBuilder, DeckBuilderFleet, DeckBuilderShip } from "@tibowl/node-gkcoi"

import client from "../../main"
import Command from "../../utils/Command"
import { aswAtLevel, evasionAtLevel, losAtLevel } from "../../utils/Utils"
import { MapEntry, MapEntries, FleetData } from "../../utils/Types"

const Logger = log4js.getLogger("randomfleet")

const path = join(__dirname, "../../../src/data/")
const cache = join(path, "cache")
configure({ cacheDir: cache })
Logger.info(`Caching in ${cache}`)

const entriesCache: { [key: string]: MapEntry[] } = {}

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
  - Limited to last 15 days for normal maps
- Generates an image out of that fleet

- Nothing can be guaranteed on these fleets on how they will route/perform
Uses <http://kc.piro.moe> API, images rendered using a fork of にしくま's gkcoi`,
            usage: "randomfleet <map> <node>",
            aliases: ["rng", "imretardedpleasedonthelp", "imretardedplsdonthelp"]
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        if (!args || args.length < 1 || args.length > 2) return message.reply(`Usage: \`${this.usage}\``)
        const { data } = client

        if (args[0].includes("-") && !args[0].match(/-\d$/))
            args[0] = args[0].replace(/-\d/, "$& ")
        else if (!args[0].match(/E\d$/))
            args[0] = args[0].replace(/E\d/i, "$& ")

        args = args.join(" ").toUpperCase().split(" ")

        let map = args[0]
        if (map.startsWith("E-")) map = map.replace("E", data.eventID().toString())
        else if (map.startsWith("E")) map = map.replace("E", data.eventID() + "-")
        if (map.split("-").length != 2) return message.reply("Invalid map!")

        if (args.length !== 2)
            return message.reply("Missing node!")

        let node = args[1]
        const mapInfo = await data.getMapInfo(map)
        if (Object.keys(mapInfo.route).length == 0) return message.reply("Invalid/unknown map!")
        if (Object.entries(mapInfo.route).filter(e => e[1][1].toUpperCase() == node).length == 0)
            return message.reply("Invalid/unknown node!")

        const edges = Object.entries(mapInfo.route).filter(e => e[1][1].toUpperCase() == node).map(e => e[0])

        const fleetData = await this.randomFleet(map, edges, node)
        if (fleetData == undefined) return message.channel.send("Not enough samples recently, again later")

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

        return message.channel.send(`Selected fleet for ${map} ${node}`, attachment)
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
        const entries = await this.getEntries(map, edges)

        if (entries.length == 0) return undefined

        const entry = entries[Math.floor(Math.random() * entries.length)]
        const data: DeckBuilder = {
            hqlv: entry.hqLvl,
            theme: "dark",
            lang: "en",
            cmt: `Random fleet for ${map}${node}
${this.getEventDescription(entry)}
ID: ${entry.id}
${new Date(entry.datetime + "Z").toLocaleString("en-UK", {
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

    private async getEntries(map: string, edges: string[]): Promise<MapEntry[]> {
        const cached = entriesCache[map + edges.join(",")]
        if (cached) return cached

        const dateFilter = (+map.split("-")[0]) < 10 ? `&start=${this.recent()}` : ""

        const entries: MapEntry[] = []
        for (const edge of edges) {
            Logger.info(`Caching entries of ${map} / ${edge}`)
            const comps: MapEntries = await (await fetch(`http://kc.piro.moe/api/routing/entries/${map}?edgeId=${edge}${dateFilter}&perPage=50`)).json()
            entries.push(...comps.entries)
        }
        entriesCache[map + edges.join(",")] = entries
        setTimeout(() => {
            delete entriesCache[map + edges.join(",")]
        }, 60 * 60 * 1000)

        return entries
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
