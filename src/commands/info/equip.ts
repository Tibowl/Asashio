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
            aliases: ["item", "equipment", "eq"]
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        if (!args || args.length < 1) return message.reply("Must provide an equip name.")
        const { data } = client

        const equipName = args.join(" ")
        const equips = data.getEquipByName(equipName)

        if (equips == undefined || equips.length == 0 || equips.length > 15) return message.reply("Unknown equip")
        // console.log(equip)

        if (equips.length == 1)
            return message.channel.send(this.displayEquip(equips[0], data, message.guild))

        const reply = await message.channel.send(`Multiple equipment matched, please respond number:
${equips.map((e, i) => `${i+1}: [${e.id}] ${e.name}`).join("\n")}`)

        message.channel.awaitMessages((m: Message) => {
            if (m.author.id !== message.author.id) return false
            if (!m.content.match(/\d+/)) return false
            const i = +m.content
            if (i > equips.length || i <= 0) return false
            return true
        }, { max: 1, time: 30000 }).then(async (msgs) => {
            const m = msgs.first()
            if (m == undefined) {
                await reply.edit("Reply timed out")
                return
            }

            const i = +m.content
            await reply.edit(`Selected result #${i}:`, this.displayEquip(equips[i-1], data, message.guild))
        }).catch(async () => reply.edit("Reply timed out"))
        return reply
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
