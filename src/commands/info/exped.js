const Discord = require("discord.js")

exports.run = (client, message, args) => {
    if(!args || args.length < 1) return message.reply("Must provide an expedition.")

    const expedID = args[0].toUpperCase()

    const exped = client.data.api_start2.api_mst_mission.find(k => k.api_disp_no == expedID || k.api_id == expedID)
    const extraExpedData = client.data.getExpedByID(exped.api_disp_no)

    if(exped == undefined) return message.reply("Unknown expedition.")
    const [fuel, ammo, bauxite, steel] = (extraExpedData && extraExpedData.rsc) || (exped.api_win_mat_level.map(this.winmatlevel))

    const embed = new Discord.RichEmbed()
        .setURL("https://kancolle.fandom.com/wiki/Expedition#/Expedition_Tables")
        .setTitle(`${exped.api_disp_no} ${exped.api_reset_type == 1 ? "[M] " : ""}${exped.api_damage_type == 1 ? "[D] " : ""}- ${exped.api_name} - ${this.getTime(exped.api_time)}`)

    let req = (extraExpedData && extraExpedData.fleet) || `${exped.api_deck_num} ships required, details unknown`
    if(extraExpedData && extraExpedData.fs_lvl) req += `\n${extraExpedData.fs_lvl} Lv. FS`
    if(extraExpedData && extraExpedData.fleet_lvl) req += `\n${extraExpedData.fleet_lvl} total Lv.`
    if(extraExpedData && extraExpedData.misc_req) req += `\n${extraExpedData.misc_req}`
    embed.addField("Fleet requirements", req)

    let rewards = `${fuel}×${client.config.emoji.fuel} ${ammo}×${client.config.emoji.ammo} ${bauxite}×${client.config.emoji.bauxite} ${steel}×${client.config.emoji.steel}\n`
    if(exped.api_win_item1[0] != 0)
        rewards +=  `Left Reward (RNG): ${exped.api_win_item1[1]}×${this.getItem(exped.api_win_item1[0], client)}\n`
    if(exped.api_win_item2[0] != 0)
        rewards += `Right Reward (GS): ${exped.api_win_item2[1]}×${this.getItem(exped.api_win_item2[0], client)}\n`

    embed
        .addField("Rewards", rewards, true)
        .addField("Usage", `${exped.api_use_fuel*100}% fuel - ${exped.api_use_bull*100}% ammo`, true)

    let notes = ""

    if(exped.api_sample_fleet)
        notes += `Sample fleet: ${exped.api_sample_fleet.filter(k => k > 0).map(k => client.data.misc.ShipCodes[k]).join(", ")}\n`

    if(exped.api_reset_type == 1)
        notes += "Monthly expedition\n"
    else if(exped.api_reset_type != 0)
        notes += "Unknown expedition reset type\n"

    if(exped.api_damage_type)
        notes += "You can receive damage on this expedition\n"

    embed.addField("Notes", notes.trim())
    return message.channel.send(embed)
}
exports.getItem = (item, client) => {
    switch (item) {
        case 1: return client.config.emoji.bucket
        case 2: return client.config.emoji.flamethrower
        case 3: return client.config.emoji.devmat
        case 4: return client.config.emoji.screw
        case 10: return client.config.emoji.furniture_box_s
        case 11: return client.config.emoji.furniture_box_m
        case 12: return client.config.emoji.furniture_box_l
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
exports.help = () => {
    return "Gets expedition info."
}
exports.usage = () => {
    return "exped <exped ID>"
}
exports.prefix = (client) => {
    return client.config.prefix
}
