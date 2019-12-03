const Discord = require("discord.js")
const Utils = require("../../utils/Utils.js")

const questTypes = {
    "A": ["Quest_composition.png", "#419058"],
    "B": ["Quest_sortie.png", "#D95556"],
    "C": ["Quest_exercise.png", "#72B652"],
    "D": ["Quest_expedition.png", "#30AB9F"],
    "E": ["Quest_supply.png", "#30AB9F"],
    "F": ["Quest_arsenal.png", "#75513F"],
    "G": ["Quest_modernization.png", "#9D83B5"],

    "W": ["Quest_marriage.png", "#F4C6E8"]
}

exports.run = (message, args) => {
    if(!args || args.length < 1) return message.reply("Must provide a quest.")
    const { data, config } = global

    const questId = args[0].toUpperCase()
    let quest = data.getQuestByName(questId)
    if(quest == undefined) {
        const quests = data.getQuestsByDescription(args.join(" "))
        if(quests.length == 1)
            quest = quests[0]
        else if (quests.length == 0)
            return message.reply("Unknown quest")
        else if(quests.length > 30)
            return message.reply("Too many matches")
        else
            return message.reply(`Which quest do you mean: ${quests.map(q => `**${q.label}**`).join(", ").replace(/,([^,]*)$/, " or$1")}`)
    }

    if(quest == undefined) return message.reply("Unknown quest")

    // console.log(quest)
    const embed = new Discord.RichEmbed()
        .setTitle([quest.label || questId, this.cleanText(quest.title_en), this.cleanText(quest.title)].filter(a => a).join(" | "))
        .setURL(Utils.getWiki(`Quests#${quest.label || questId}`, message.guild))
        .setDescription(this.parseText(quest.detail_en, message.guild))

    const type = questTypes[(quest.label || questId).substring(0,1)] || questTypes[quest.letter]
    if(type)
        embed.setThumbnail(this.getImage(type[0]))
            .setColor(type[1])

    let rewards = ""
    if(quest.reward_fuel > 0 || quest.reward_ammo > 0 || quest.reward_bauxite > 0 || quest.reward_steel > 0)
        rewards = `${config.emoji.fuel}×${quest.reward_fuel} ${config.emoji.ammo}×${quest.reward_ammo} ${config.emoji.steel}×${quest.reward_steel} ${config.emoji.bauxite}×${quest.reward_bauxite}
`
    if(quest.reward_other)
        rewards += this.parseText(quest.reward_other, message.guild)

    embed.addField("Rewards", rewards)
    if(quest.note)
        embed.addField("Notes", this.parseText(quest.note, message.guild))

    return message.channel.send(embed)
}
exports.cleanText = (text) => {
    return text.replace(/\[\[.*?\]\]/g, "").replace(/<.*?>/g, "")
}
exports.parseText = (text, guild) => {
    // console.log(text)
    let links = text.match(/\[\[.*?\]\]/g)

    if(links)
        for (let match of links) {
            let clean = match.replace(/\[\[/, "").replace(/\]\]/, "")

            let title = clean, target = clean
            if(clean.includes("|"))
                [target, title] = clean.split("|").map(a => a.trim())

            if(target.startsWith("File:")) {
                // title = clean.split("|").find(a => a.startsWith("link=")).replace("link=", "").replace(/_/g, " ") || title

                const fileName = target.replace(/ /g, "_").trim()
                text = text.replace(match, this.getEmoji(fileName))
            }

            if(target.startsWith("#"))
                target = "Quests#" + target.substring(1)

            text = text.replace(match, `[${title}](${Utils.getWiki(target.replace(/ /g, "_").replace(/\(/g, "\\(").replace(/\)/g, "\\)"), guild)})`)
        }

    links = text.match(/\{\{[^{]*?\}\}/g)
    for(let i = 0; i < 5 && links; i++) {
        for (let match of links) {
            let clean = match.replace(/\{\{/, "").replace(/\}\}/, "")

            let title = clean.split("|")[1]
            if(clean.split("|")[0] == "color")
                text = text.replace(match, clean.split("|")[2])

            for(let arg of clean.split("|").slice(1))
                if(!arg.includes("=")) {
                    title = arg
                    break
                }

            text = text.replace(match, `[${title.replace(/\//g, " ")}](${Utils.getWiki(title.replace(/ /g, "_").replace(/\(/g, "\\(").replace(/\)/g, "\\)"), guild)})`)
        }
        links = text.match(/\{\{[^{]*?\}\}/g)
    }

    return text.replace(/<br>/g, "\n").replace(/<br\/>/g, "\n").replace(/<br \/>/g, "\n").replace(/'''/g, "**").replace(/"/g, "**")
}

exports.getEmoji = (fileName) => {
    const {config} = global
    switch(fileName) {
        case "File:Furniture_box_large.jpg":
        case "File:Furniture_box_large.png":
            return config.emoji.furniture_box_l
        case "File:Furniture_box_medium.jpg":
        case "File:Furniture_box_medium.png":
            return config.emoji.furniture_box_m
        case "File:Furniture_box_small.jpg":
        case "File:Furniture_box_small.png":
            return config.emoji.furniture_box_s

        case "File:Development_material.png":
            return config.emoji.devmat
        case "File:Instant_construction_2.png":
            return config.emoji.flamethrower
        case "File:Improvement_Materials.png":
            return config.emoji.screw
        case "File:Instant_repair_2.png":
            return config.emoji.bucket
        case "File:Reinforcement_expansion_064_useitem.png":
            return config.emoji.reinforcement_expansion
        case "File:Present_box.png":
            return config.emoji.present_box
        case "File:Medal.png":
            return config.emoji.kcmedal
        case "File:Furniture_fairy.png":
            return config.emoji.furniture_fairy
        case "File:Food_supply_ship_mamiya.png":
            return config.emoji.mamiya
        case "File:Food_supply_ship_irako.png":
            return config.emoji.irako
        case "File:Construction_Corps_Item.png":
            return config.emoji.construction_corps
        case "File:Skilled_Crew_Member_Card.png":
            return config.emoji.skilled_crew_member
        case "File:New_Model_Gun_Mount_Improvement_Material_Card.png":
            return config.emoji.gun_mat
        case "File:New_Model_Aerial_Armament_Material_Card.png":
            return config.emoji.air_mat
        case "File:Action_Report_Card.png":
            return config.emoji.action_report
        case "File:Prototype_Deck_Catapult.png":
            return config.emoji.catapult
        case "File:Headquarters_Personnel.png":
            return config.emoji.headquarters_personnel
        case "File:Ranking_point_reward.png":
            return config.emoji.ranking_points
        default:
            return ""
    }
}
exports.getImage = (file) => {
    return `https://kancolle.fandom.com/wiki/Special:FilePath/${file.replace(/ /g, "_")}`
}
exports.category = "Information"
exports.help = "Get quest information."
exports.usage = "quest <quest id> OR .quest <reward/title/description>"
exports.prefix = global.config.prefix
