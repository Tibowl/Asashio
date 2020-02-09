const Discord = require("discord.js")
const Utils = require("../../utils/Utils.js")

exports.run = (message, args) => {
    if(!args || args.length < 1) return message.reply("Must provide an expedition.")
    const { data, config } = global

    const expedID = args[0].toUpperCase()

    const exped = data.api_start2.api_mst_mission.find(k => k.api_disp_no == expedID || k.api_id == expedID)
    if(exped == undefined) return message.reply("Unknown expedition.")

    const extraExpedData = data.getExpedByID(exped.api_disp_no)
    const [fuel, ammo, steel, bauxite] = (extraExpedData && extraExpedData.rsc) || (exped.api_win_mat_level.map(this.winmatlevel))

    const embed = new Discord.RichEmbed()
        .setURL(Utils.getWiki("Expedition#/Expedition_Tables", message.guild))
        .setTitle(`${exped.api_disp_no} ${exped.api_reset_type == 1 ? "[M] " : ""}${exped.api_damage_type == 1 ? "[D] " : ""}- ${exped.api_name} - ${this.getTime(exped.api_time)}`)

    let req = (extraExpedData && extraExpedData.fleet) || `${exped.api_deck_num} ships required, details unknown`
    if(extraExpedData && extraExpedData.fs_lvl) req += `\n${extraExpedData.fs_lvl} Lv. FS`
    if(extraExpedData && extraExpedData.fleet_lvl) req += `\n${extraExpedData.fleet_lvl} total Lv.`
    if(extraExpedData && extraExpedData.misc_req) req += `\n${extraExpedData.misc_req}`
    embed.addField("Fleet requirements", req)

    let rewards = `${config.emoji.fuel}×${fuel} ${config.emoji.ammo}×${ammo} ${config.emoji.steel}×${steel} ${config.emoji.bauxite}×${bauxite}\n`
    if(exped.api_win_item1[0] != 0)
        rewards +=  `Left Reward (RNG): ${exped.api_win_item1[1]}×${this.getItem(exped.api_win_item1[0])}\n`
    if(exped.api_win_item2[0] != 0)
        rewards += `Right Reward (GS): ${exped.api_win_item2[1]}×${this.getItem(exped.api_win_item2[0])}\n`

    embed
        .addField("Rewards", rewards, true)
        .addField("Usage", `${exped.api_use_fuel*100}% fuel - ${exped.api_use_bull*100}% ammo`, true)

    let notes = ""

    if(exped.api_sample_fleet)
        notes += `Sample fleet: ${exped.api_sample_fleet.filter(k => k > 0).map(k => data.misc.ShipCodes[k]).join(", ")}\n`

    if(exped.api_reset_type == 1)
        notes += "Monthly expedition\n"
    else if(exped.api_reset_type != 0)
        notes += "Unknown expedition reset type\n"

    if(exped.api_damage_type)
        notes += "You can receive damage on this expedition\n"

    embed.addField("Notes", notes.trim())
    return message.channel.send(embed)
}
exports.getItem = (item) => {
    const {config} = global
    switch (item) {
        case 1: return config.emoji.bucket
        case 2: return config.emoji.flamethrower
        case 3: return config.emoji.devmat
        case 4: return config.emoji.screw
        case 10: return config.emoji.furniture_box_s
        case 11: return config.emoji.furniture_box_m
        case 12: return config.emoji.furniture_box_l
        case 59: return config.emoji.irako
        default: return `Unknown item ${item}`
    }
}
exports.winmatlevel = (k) => {
    switch (k) {
        case 0: return 0
        case 1: return "1~250"
        case 2: return "250~500"
        case 3: return "500~750"
        case 4: return "750+"
        default: return "?"
    }
}
exports.getTime = (time) => `${(Math.floor(time / 60) + "").padStart(2, "0")}h${((time % 60) + "").padStart(2, "0")}m`
exports.category = "Information"
exports.help = "Gets expedition info."
exports.usage = "exped <exped ID>"
exports.prefix = global.config.prefix
