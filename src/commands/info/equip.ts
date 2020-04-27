import { Message, MessageEmbed, Guild } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"
import DataManager from "../../utils/DataManager"
import { getWiki } from "../../utils/Utils"
import { Equipment } from "../../utils/Types"

export default class Equip extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Information",
            help: "Get equip information.",
            usage: "equip <equip>",
            aliases: ["item", "equipment"]
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        if (!args || args.length < 1) return message.reply("Must provide an equip name.")
        const { data } = client

        const equipName = args.join(" ")
        const equip = data.getEquipByName(equipName)

        if (equip == undefined) return message.reply("Unknown equip")
        // console.log(equip)

        const embed = this.displayEquip(equip, data, message.guild)
        return message.channel.send(embed)
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
    displayEquip(equip: Equipment, data: DataManager, guild?: Guild|null): MessageEmbed {
        const title = [`No. ${equip.id}`, equip.name, equip.japanese_name].filter(a => a).join(" | ")
        const embed = new MessageEmbed()
            .setTitle(title)
            .setURL(getWiki(equip.name, guild))
            .setThumbnail(data.getEquipLink(equip.id))
        // TODO rarity color? .setColor("#")

        let equipStats = []
        for (let entry of Object.entries(this.stats))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((equip as any)[entry[0]] !== false && (equip as any)[entry[0]] !== undefined)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                equipStats.push([entry[1], (equip as any)[entry[0]]])

        if (equip.range != false)
            equipStats.push(["Range", data.misc.RangeNames[equip.range]])
        equipStats.push(["Rarity", data.misc.EquipmentRarityNames[equip.rarity]])
        equipStats.push(["Scrap", [equip.scrap_fuel || 0, equip.scrap_ammo || 0, equip.scrap_steel || 0, equip.scrap_bauxite || 0]])
        equipStats.push(["Improvable", equip.improvements !== false && equip.improvements !== undefined ? "yes" : "no"])

        let longestName = equipStats.map(k => k[0].length).reduce((a,b) => Math.max(a,b),0)

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
