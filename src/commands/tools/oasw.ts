import { AutocompleteInteraction, CommandInteraction, Message, MessageEmbed } from "discord.js"

import Command from "../../utils/Command"
import { CommandSource, SendMessage, Ship } from "../../utils/Types"
import client from "../../main"
import { getWiki, aswAtLevel, sendMessage, findFuzzyBestCandidates } from "../../utils/Utils"

export default class OASW extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Gets levels when a ship can OASW with certain equipment.",
            usage: "oasw <ship> [+<asw mod>] [=<equipment ASW>] [@<level>]",
            aliases: ["asw"],
            options: [{
                name: "ship",
                description: "Name of ship",
                type: "STRING",
                required: true,
                autocomplete: true
            }, {
                name: "level",
                description: "Ship level",
                type: "NUMBER",
                required: false
            }, {
                name: "equip",
                description: "Equipment ASW modifier",
                type: "NUMBER",
                required: false
            }, {
                name: "asw",
                description: "ASW modifier",
                type: "NUMBER",
                required: false
            }]
        })
    }

    async autocomplete(source: AutocompleteInteraction): Promise<void> {
        const targetNames = Object.values(client.data.ships).map(s => s.full_name)
        const search = source.options.getFocused().toString()

        await source.respond(findFuzzyBestCandidates(targetNames, search, 20).map(value => {
            return { name: value, value }
        }))
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        const shipName = source.options.getString("ship", true)
        const aswOffset = source.options.getNumber("asw") ?? 0
        const equipmentAsw = source.options.getNumber("equip") ?? -1
        const level = source.options.getNumber("level") ?? 0

        return this.run(source, shipName, aswOffset, equipmentAsw, level)
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (!args || args.length < 1) return sendMessage(source, "Must provide a ship name.")

        let aswOffset = 0, equipmentAsw = -1, level = 0
        for (let i = 0; i < 3; i++) {
            if (args[args.length-1].match(/@[0-9]+/)) level = parseInt(args.pop()?.slice(1) ?? "0")
            else if (args[args.length-1].match(/\+[0-9]+/)) aswOffset = parseInt(args.pop()?.slice(1) ?? "0")
            else if (args[args.length-1].match(/=[0-9]+/)) equipmentAsw = parseInt(args.pop()?.slice(1) ?? "0")
            if (args.length == 0) return sendMessage(source, "No ship entered")
        }
        const shipName = args.join(" ")

        return this.run(source, shipName, aswOffset, equipmentAsw, level)
    }

    async run(source: CommandSource, shipName: string, aswOffset: number, equipmentAsw: number, level: number): Promise<SendMessage | undefined> {
        const { data } = client

        const ship = data.getShipByName(shipName)

        if (ship == undefined) return sendMessage(source, "Unknown ship")

        const embed = new MessageEmbed()
            .setTitle(`${ship.full_name} ${aswOffset > 0 ? `+${aswOffset} ASW` : ""}`)
            .setURL(getWiki(ship.name))
            .setThumbnail(`https://raw.githubusercontent.com/KC3Kai/KC3Kai/develop/src/assets/img/ships/${ship.api_id}.png`)

        const aswRequired = this.findAswRequired(ship)
        const addLevelRow = (): MessageEmbed => embed.addField("ASW at level", `\`\`\`
At level ${level}${aswOffset > 0 ? `+${aswOffset} mod`:""}: ${aswAtLevel(ship, level) + aswOffset}${equipmentAsw > 0 ? `
With +${equipmentAsw} equipment: ${aswAtLevel(ship, level) + aswOffset + equipmentAsw}` : ""}
\`\`\``)

        if (aswRequired > 0) {
            embed.setColor("#0066ff")
                .addField("Opening ASW", `This ship requires ${aswRequired} ASW`)
            if (ship.asw_max == undefined || ship.asw == undefined || ship.asw_max == null || ship.asw == null)
                embed.addField("No data available", "ASW stats are not yet updated for this ship")
            else if (level > 0)
                addLevelRow()
            else if (equipmentAsw < 0)
                embed.addField("Equipment - Levels", this.aswEquip(ship, aswOffset))
            else
                embed.addField("Equipment - Levels", `\`\`\`
+${equipmentAsw} ASW - ${this.levelAtAsw(ship, aswRequired - aswOffset - equipmentAsw)}
\`\`\``)
        } else if (aswRequired === 0)
            embed.setColor("#00ff00")
                .addField("Opening ASW", "This ship can always OASW")
        else if (aswRequired === -2)
            embed.setColor("#ff6600")
                .addField("Opening ASW", "This ship can OASW but it's a bit complicated. General rule: +7 ASW plane and >=65 displayed ASW.")
        else if (aswRequired === -3)
            embed.setColor("#ff6600")
                .addField("Opening ASW", "This ship might be able to OASW but it's a bit complicated.")
        else
            embed.setColor("#ff0000")
                .addField("Opening ASW", "This ship is not supported or can't OASW")

        if (aswRequired <= 0 && level > 0) addLevelRow()
        if ([
        // T3 sonar
        // (+3 ASW) Kamikaze, Harukaze, Shigure, Yamakaze, Maikaze, Asashimo
            471, 476, 473, 363, 43, 243, 145, 457, 369, 122, 294, 425, 344,
            // (+2 ASW) Ushio, Ikazuchi, Yamagumo, Isokaze, Hamakaze, Kishinami
            16, 233, 407, 36, 236, 414, 328, 167, 320, 557, 170, 312, 558, 527, 686,

            // T4 sonar
            // (+1 ASW) Yuubari K2/T, Isuzu K2, Naka K2, Yura K2
            622, 623, 141, 160, 488,
            // (+3 ASW) Yuubari K2D
            624,

            // Type 3 Depth Charge Projector (Concentrated Deployment)
            // (+1 ASW) Yuubari K2D, Isuzu K2, Naka K2, Yura K2
            624, 141, 160, 488
        ].includes(ship.api_id) || [
        // T4 sonar (+1 ASW)
            "Akizuki"
        ].includes(ship.class))
            embed.addField("Warning", "This ship has bonuses for certain ASW equipment. This command does **NOT** take these into account!")

        return sendMessage(source, embed)
    }

    // https://github.com/KC3Kai/KC3Kai/blob/develop/src/library/objects/Ship.js#L2191
    findAswRequired(ship: Ship): number {
        if ([141, 478, 394, 681, 562, 689, 596, 624, 692, 893].includes(ship.api_id)) return 0
        if (ship.type === 1) return 60
        if ([2, 3, 4, 21].includes(ship.type)) return 100

        if (ship.type === 7 && ship.asw > 0) return -2
        if (ship.full_name == "Hyuuga Kai Ni") return -3
        if ([6, 10, 16, 17].includes(ship.type)) return -3

        return -99
    }
    levelAtAsw(ship: Ship, asw: number): number {
        if (ship.asw_max == false) return ship.asw
        const aswPerLevel = (ship.asw_max - ship.asw) / 99
        if (aswPerLevel <= 0) return -1
        let level = Math.ceil((asw - ship.asw) / aswPerLevel)
        if (typeof ship.remodel_level == "number" && level < ship.remodel_level)
            level = ship.remodel_level

        return level
    }
    aswEquip(ship: Ship, aswOffset: number): string {
        const aswRequired = this.findAswRequired(ship)
        let maxSlots = ship.equipment == false ? 4 : ship.equipment.length

        // Yuubari 5th slot can't equip ASW
        if ([622, 623, 624].includes(ship.api_id))
            maxSlots = 4

        let string = "```"
        for (let slots = maxSlots; slots > 0; slots--) {
            if (slots == 1) {
                string += this.generateLine([15], ship, aswRequired, aswOffset, maxSlots)
                string += this.generateLine([13], ship, aswRequired, aswOffset, maxSlots)
                string += this.generateLine([12], ship, aswRequired, aswOffset, maxSlots)
                string += this.generateLine([10], ship, aswRequired, aswOffset, maxSlots, true)
                break
            }

            const equipAsw = []
            for (let i = 0; i < slots; i++)
                equipAsw.push(12)

            let allLinesT3 = false
            while (!allLinesT3) {
                string += this.generateLine(equipAsw, ship, aswRequired, aswOffset, maxSlots)

                for (let i = slots - 1; i >= 0; i--) {
                    if (equipAsw[i] == 12) {
                        equipAsw[i] = 10
                        break
                    } else if (equipAsw[i] == 10 && i == slots - 1) {
                        equipAsw[i] = 8
                        break
                    }
                }
                allLinesT3 = equipAsw.filter(val => val == 12).length == 0
            }

            if (slots > 2) {
                string += this.generateLine(equipAsw, ship, aswRequired, aswOffset, maxSlots)
                equipAsw[equipAsw.length - 1] = 7
                equipAsw[equipAsw.length - 2] = 8
            }

            string += this.generateLine(equipAsw, ship, aswRequired, aswOffset, maxSlots, true)
        }
        return string + "```"
    }
    generateLine(equipAsw: number[], ship: Ship, aswRequired: number, aswOffset: number, maxSlots: number, force = false): string {
        const equipmentAsw = equipAsw.reduce((a, b) => a+b)
        const level = this.levelAtAsw(ship, aswRequired - aswOffset - equipmentAsw)

        if (this.levelAtAsw(ship, aswRequired - aswOffset - equipmentAsw + 2) <= ship.remodel_level && !force)
            return ""

        return `${equipAsw.map(val => {
            switch (val) {
                case 12: return "T4"
                case 10: return "T3"
                case  8: return "DC"
                case  7: return "T2"
                case 15: return "HFDF"
                case 13: return "T144"
                default: return val
            }
        }).join("/").padStart(maxSlots * 3 - 1)} - ${level}
`
    }
}
