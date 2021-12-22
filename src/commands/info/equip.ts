import { Message, MessageEmbed, CommandInteraction, AutocompleteInteraction } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"
import DataManager from "../../utils/DataManager"
import { findFuzzyBestCandidates, getWiki, sendMessage } from "../../utils/Utils"
import { CommandResponse, CommandSource, Equipment, SendMessage } from "../../utils/Types"

export default class Equip extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Information",
            help: "Get equip information.",
            usage: "equip <equip>",
            aliases: ["item", "equipment", "eq"],
            options: [{
                name: "name",
                description: "Name of equipment",
                type:"STRING",
                autocomplete: true,
                required: true,
            }]
        })
    }

    async autocomplete(source: AutocompleteInteraction): Promise<void> {
        const targetNames = Object.values(client.data.equips).map(s => s.name)
        const search = source.options.getFocused().toString()

        await source.respond(findFuzzyBestCandidates(targetNames, search, 20).map(value => {
            return { name: value, value }
        }))
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return await this.run(source, source.options.getString("name", true))
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (!args || args.length < 1) return source.reply("Must provide an equip name.")

        return await this.run(source, args.join(" "))
    }

    async run(source: CommandSource, equipName: string): Promise<CommandResponse> {
        const { data } = client

        const equips = data.getEquipByName(equipName)

        if (equips == undefined || equips.length == 0 || equips.length > 15) return sendMessage(source, "Unknown equip")
        // console.log(equip)

        if (equips.length == 1)
            return sendMessage(source, this.displayEquip(equips[0], data))

        return sendMessage(source, `Multiple equipment matched:
${equips.map(e => `[${e.id}] ${e.name}`).join("\n")}`)
    }
    stats = {
        "firepower": "Firepower",
        "torpedo": "Torpedo",
        "aa": "AA",
        "armor": "Armor",

        "bombing": "Bombing",

        "shelling_accuracy": "Accuracy",
        "asw": "ASW",
        "evasion": "Evasion",
        "los": "LoS",

        "flight_cost": "Flight Cost",
        "flight_range": "Flight Range",
    }
    displayEquip(equip: Equipment, data: DataManager): MessageEmbed {
        const title = [`No. ${equip.id}`, equip.name, equip.japanese_name].filter(a => a).join(" | ")
        const embed = new MessageEmbed()
            .setTitle(title)
            .setURL(getWiki(equip.name))
            .setThumbnail(data.getEquipLink(equip.id))
        // TODO rarity color? .setColor("#")

        const equipStats = []
        for (const entry of Object.entries(this.stats))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((equip as any)[entry[0]] !== false && (equip as any)[entry[0]] !== undefined)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                equipStats.push([entry[1], (equip as any)[entry[0]]])

        if (equip.range != false)
            equipStats.push(["Range", data.misc.RangeNames[equip.range]])
        equipStats.push(["Rarity", data.misc.EquipmentRarityNames[equip.rarity]])
        equipStats.push(["Scrap", [equip.scrap_fuel || 0, equip.scrap_ammo || 0, equip.scrap_steel || 0, equip.scrap_bauxite || 0]])
        equipStats.push(["Improvable", equip.improvements !== false && equip.improvements !== undefined ? "yes" : "no"])

        const longestName = equipStats.map(k => k[0].length).reduce((a, b) => Math.max(a, b), 0)

        embed.addField("Stats", `\`\`\`asciidoc
${equipStats.map(stat => `${stat[0].padEnd(longestName, " ")} :: ${stat[1]}`).join("\n")}
\`\`\``)

        if (equip.improvements !== false && equip.improvements !== undefined) {
            const into = Object.keys(equip.improvements._products).filter(k => k != "false").map(k => `→ ${k}`).join("\n")
            let text = into.length > 1 ? into : ""
            text += `\nCheck [akashi-list](https://akashi-list.me/#w${String(equip.id).padStart(3, "0")}) for more information`
            embed.addField("Improvements", text.trim())
        }

        if (title.length < 25) embed.addField("\u200b", "\u200b")

        return embed
    }
}
