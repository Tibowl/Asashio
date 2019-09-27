const Discord = require("discord.js")
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

exports.run = (client, message, args) => {
    if(!args || args.length < 1) return message.reply("Must provide a quest.")

    const questId = args[0].toUpperCase()
    let quest = client.data.getQuestByName(questId)
    if(quest == undefined) {
        const quests = client.data.getQuestsByDescription(args.join(" "))
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
        .setTitle([quest.label || questId, quest.title_en, quest.title].filter(a => a).join(" | "))
        .setURL(`https://kancolle.fandom.com/wiki/Quests#${questId}`)
        .setDescription(this.parseText(quest.detail_en, client))

    const type = questTypes[(quest.label || questId).substring(0,1)] || questTypes[quest.letter]
    if(type)
        embed.setThumbnail(this.getImage(type[0]))
            .setColor(type[1])

    let rewards = ""
    if(quest.reward_fuel > 0 || quest.reward_ammo > 0 || quest.reward_bauxite > 0 || quest.reward_steel > 0)
        rewards = `${quest.reward_fuel}×${client.config.emoji.fuel} ${quest.reward_ammo}×${client.config.emoji.ammo} ${quest.reward_bauxite}×${client.config.emoji.bauxite} ${quest.reward_steel}×${client.config.emoji.steel}
`
    if(quest.reward_other)
        rewards += this.parseText(quest.reward_other, client)

    embed.addField("Rewards", rewards)
    if(quest.note)
        embed.addField("Notes", this.parseText(quest.note, client))

    return message.channel.send(embed)
}

exports.parseText = (text, client) => {
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
                text = text.replace(match, this.getEmoji(fileName, client))
            }

            if(target.startsWith("#"))
                target = "Quests#" + target

            text = text.replace(match, `[${title}](https://kancolle.fandom.com/wiki/${target.replace(/ /g, "_").replace(/\(/g, "\\(").replace(/\)/g, "\\)")})`)
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

            text = text.replace(match, `[${title.replace(/\//g, " ")}](https://kancolle.fandom.com/wiki/${title.replace(/ /g, "_").replace(/\(/g, "\\(").replace(/\)/g, "\\)")})`)
        }
        links = text.match(/\{\{[^{]*?\}\}/g)
    }

    return text.replace(/<br>/g, "\n").replace(/<br\/>/g, "\n").replace(/<br \/>/g, "\n").replace(/'''/g, "**").replace(/"/g, "**")
}

exports.getEmoji = (fileName, client) => {
    switch(fileName) {
        case "File:Furniture_box_large.jpg":
        case "File:Furniture_box_large.png":
            return client.config.emoji.furniture_box_l
        case "File:Furniture_box_medium.jpg":
        case "File:Furniture_box_medium.png":
            return client.config.emoji.furniture_box_m
        case "File:Furniture_box_small.jpg":
        case "File:Furniture_box_small.png":
            return client.config.emoji.furniture_box_s

        case "File:Development_material.png":
            return client.config.emoji.devmat
        case "File:Instant_construction_2.png":
            return client.config.emoji.flamethrower
        case "File:Improvement_Materials.png":
            return client.config.emoji.screw
        case "File:Instant_repair_2.png":
            return client.config.emoji.bucket
        case "File:Reinforcement_expansion_064_useitem.png":
            return client.config.emoji.reinforcement_expansion
        case "File:Present_box.png":
            return client.config.emoji.present_box
        case "File:Medal.png":
            return client.config.emoji.kcmedal
        case "File:Furniture_fairy.png":
            return client.config.emoji.furniture_fairy
        case "File:Food_supply_ship_mamiya.png":
            return client.config.emoji.mamiya
        case "File:Food_supply_ship_irako.png":
            return client.config.emoji.irako
        case "File:Construction_Corps_Item.png":
            return client.config.emoji.construction_corps
        case "File:Skilled_Crew_Member_Card.png":
            return client.config.emoji.skilled_crew_member
        case "File:New_Model_Gun_Mount_Improvement_Material_Card.png":
            return client.config.emoji.gun_mat
        case "File:New_Model_Aerial_Armament_Material_Card.png":
            return client.config.emoji.air_mat
        case "File:Action_Report_Card.png":
            return client.config.emoji.action_report
        case "File:Prototype_Deck_Catapult.png":
            return client.config.emoji.catapult
        case "File:Headquarters_Personnel.png":
            return client.config.emoji.headquarters_personnel
        case "File:Ranking_point_reward.png":
            return client.config.emoji.ranking_points
        default:
            return ""
    }
}
exports.getImage = (file) => {
    return `https://kancolle.fandom.com/wiki/Special:FilePath/${file.replace(/ /g, "_")}`
}
exports.category = "Information"
exports.help = () => {
    return "Get quest information."
}
exports.usage = () => {
    return "quest <quest id> OR .quest <reward/title/description>"
}
exports.prefix = (client) => {
    return client.config.prefix
}
