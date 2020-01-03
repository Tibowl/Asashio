const Discord = require("discord.js")
const Utils = require("../../utils/Utils.js")

exports.run = (message, args) => {
    if(!args || args.length < 1) return message.reply("Must provide an equip name.")
    const data = global.data

    const equipName = args.join(" ")
    const equip = data.getEquipByName(equipName)

    if(equip == undefined) return message.reply("Unknown equip")
    // console.log(equip)

    const embed = this.displayEquip(equip, data, message.guild)
    return message.channel.send(embed)
}

const stats = {
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
exports.displayEquip = (equip, data, guild = false) => {
    const embed = new Discord.RichEmbed()
        .setTitle([`No. ${equip.id}`, equip.name, equip.japanese_name].filter(a => a).join(" | "))
        .setURL(Utils.getWiki(equip.name, guild))
        .setThumbnail(data.getEquipLink(equip.id))
        // TODO rarity color? .setColor("#")

    let improvable = equip.improvements !== false && equip.improvements !== undefined

    let equipStats = []
    for(let entry of Object.entries(stats))
        if(equip[entry[0]] !== false && equip[entry[0]] !== undefined)
            equipStats.push([entry[1], equip[entry[0]]])

    if(equip.range != false)
        equipStats.push(["Range", data.misc.RangeNames[equip.range]])
    equipStats.push(["Rarity", data.misc.EquipmentRarityNames[equip.rarity]])
    equipStats.push(["Scrap", [equip.scrap_fuel || 0, equip.scrap_ammo || 0, equip.scrap_steel || 0, equip.scrap_bauxite || 0]])
    equipStats.push(["Improvable", improvable ? "yes" : "no"])

    let longestName = equipStats.map(k => k[0].length).reduce((a,b) => Math.max(a,b),0)

    embed.addField("Stats", `\`\`\`asciidoc
${equipStats.map(stat => `${stat[0].padEnd(longestName, " ")} :: ${stat[1]}`).join("\n")}
\`\`\``)

    if(improvable) {
        const into = Object.keys(equip.improvements._products).filter(k => k != "false").map(k => `• ${k}`).join("\n")
        let text = into.length > 1 ? into : ""
        text += `\nCheck [akashi-list](https://akashi-list.me/#w${String(equip.id).padStart(3, "0")}) for more information`
        embed.addField("Improvements", text.trim())
    }

    if(embed.title.length < 25) embed.addBlankField(true)

    return embed
}


exports.category = "Information"
exports.help = "Get equip information."
exports.usage = "equip <equip>"
exports.prefix = global.config.prefix
exports.aliases = ["item", "equipment"]
