import { Message, MessageAttachment } from "discord.js"
import fetch from "node-fetch"
import log4js from "log4js"
import { generate, DeckBuilder, DeckBuilderFleet, DeckBuilderShip } from "@tibowl/node-gkcoi"

import client from "../../main"
import Command from "../../utils/Command"
import { aswAtLevel, evasionAtLevel, losAtLevel } from "../../utils/Utils"

const Logger = log4js.getLogger("randomfleet")

const entriesCache: { [key: string]: Entry[] } = {}

type ShipID = "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7"
type ItemID = "i1" | "i2" | "i3" | "i4" | "i5"

export interface MapEntries {
    entryCount: number
    pageCount:  number
    perPage:    number
    entries:    Entry[]
}

export interface Entry {
    id:              number
    map:             string
    hqLvl:           number
    cleared?:        boolean
    fleet1:          string[]
    fleet1data:      FleetData[]
    fleet2:          string[]
    fleet2data:      FleetData[]
    sortiedFleet:    number
    fleetSpeed:      number
    edgeId:          number[]
    los:             number[]
    datetime:        string
    fleetIds:        number[]
    fleetLevel:      number
    fleetOneEquips:  number[]
    fleetOneExSlots: number[]
    fleetOneTypes:   number[]
    fleetTwoEquips:  number[]
    fleetTwoExSlots: number[]
    fleetTwoTypes:   number[]
    radars:          number
    radarShips:      number
    radars5los:      number
    radarShips5los:  number
    nodeInfo:        string
}

export interface FleetData {
    id:      number
    name:    string
    name_en: string
    level:   number
    type:    number
    speed:   number
    equip:   number[]
    stars:   number[]
    ace:     number[]
    exslot:  number
}

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

        const fleetData = await this.randomFleet(map, edges)
        if (fleetData == undefined) return message.channel.send("Not enough samples recently, again later")

        const canvas = await generate(fleetData)
        const attachment = new MessageAttachment(canvas.toBuffer(), `${map}.png`)

        return message.channel.send(`Selected fleet for ${map} ${node}`, attachment)
    }

    async randomFleet(map: string, edges: string[]): Promise<DeckBuilder | undefined> {
        const entries = await this.getEntries(map, edges)

        if (entries.length == 0) return undefined

        const entry = entries[Math.floor(Math.random() * entries.length)]
        const data: DeckBuilder = {
            "hqlv": entry.hqLvl,
            "theme": "dark",
            "lang": "en",
        }

        const f1 = this.getFleet(entry.fleet1data)
        const f2 = this.getFleet(entry.fleet2data)

        if (f1) data.f1 = f1
        if (f2) data.f2 = f2

        return data
    }

    private async getEntries(map: string, edges: string[]): Promise<Entry[]> {
        const cached = entriesCache[map + edges.join(",")]
        if (cached) return cached

        const dateFilter = (+map.split("-")[0]) < 10 ? `&start=${this.recent()}` : ""

        const entries: Entry[] = []
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
        for (const i in fleetData) {
            const ship = fleetData[i]
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

            for (const i in ship.equip.filter((k: number) => k > 0)) {
                t.items["i" + (+i+1) as ItemID] = {
                    id: ship.equip[i],
                    rf: ship.stars[i] <= 0 ? undefined : ship.stars[i],
                    mas: ship.ace[i] <= 0 ? undefined : ship.ace[i]
                }
            }
            if (ship.exslot != -1) {
                t.items.ix = {
                    id: ship.exslot
                }
            }

            fleet["s"+(+i+1) as ShipID] = t
        }
        return fleet
    }

    recent(): string {
        const lm = new Date()
        lm.setUTCDate(lm.getUTCDate() - 15)
        return lm.toISOString().split("T")[0]
    }
}
