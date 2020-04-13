import { Message, MessageEmbed, Guild } from "discord.js"

import Command from "../../utils/Command"
import emoji from "../../data/emoji.json"
import client from "../../main"
import { getWiki } from "../../utils/Utils"

interface QuestTypes {
    "A": string[]
    "B": string[]
    "C": string[]
    "D": string[]
    "E": string[]
    "F": string[]
    "G": string[]
    "W": string[]
}

const questTypes: QuestTypes = {
    "A": ["Quest_composition.png", "#419058"],
    "B": ["Quest_sortie.png", "#D95556"],
    "C": ["Quest_exercise.png", "#72B652"],
    "D": ["Quest_expedition.png", "#30AB9F"],
    "E": ["Quest_supply.png", "#30AB9F"],
    "F": ["Quest_arsenal.png", "#75513F"],
    "G": ["Quest_modernization.png", "#9D83B5"],

    "W": ["Quest_marriage.png", "#F4C6E8"]
}

export default class Quest extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Information",
            help: "Get quest information.",
            usage: "quest <quest id> OR .quest <reward/title/description>",
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        if (!args || args.length < 1) return message.reply("Must provide a quest.")
        const { data } = client

        const questId = args[0].toUpperCase()
        let quest = data.getQuestByName(questId)
        if (quest == undefined) {
            const quests = data.getQuestsByDescription(args.join(" "))
            if (quests.length == 1)
                quest = quests[0]
            else if (quests.length == 0)
                return message.reply("Unknown quest")
            else if (quests.length > 30)
                return message.reply("Too many matches")
            else
                return message.reply(`Which quest do you mean: ${quests.map(q => `**${q.label}**`).join(", ").replace(/,([^,]*)$/, " or$1")}`)
        }

        if (quest == undefined) return message.reply("Unknown quest")

        // console.log(quest)
        const embed = new MessageEmbed()
            .setTitle([quest.label ?? questId, this.cleanText(quest.title_en ?? ""), this.cleanText(quest.title)].filter(a => a).join(" | "))
            .setURL(getWiki(`Quests#${quest.label ?? questId}`, message.guild))
            .setDescription(this.parseText(quest.detail_en ?? "", message.guild))

        const type = questTypes[(quest.letter ?? quest.label ?? questId).substring(0,1) as keyof QuestTypes]
        if (type)
            embed.setThumbnail(this.getImage(type[0]))
                .setColor(type[1])

        let rewards = ""
        if ((quest.reward_fuel ?? 0) > 0 || (quest.reward_ammo ?? 0) > 0 || (quest.reward_bauxite ?? 0) > 0 || (quest.reward_steel ?? 0) > 0)
            rewards = `${emoji.fuel}×${quest.reward_fuel} ${emoji.ammo}×${quest.reward_ammo} ${emoji.steel}×${quest.reward_steel} ${emoji.bauxite}×${quest.reward_bauxite}
`
        if (quest.reward_other)
            rewards += this.parseText(quest.reward_other, message.guild)

        embed.addField("Rewards", rewards)
        if (quest.note)
            embed.addField("Notes", this.parseText(quest.note, message.guild))

        return message.channel.send(embed)
    }
    cleanText(text: string | undefined): string {
        return text == undefined ? "" : text.replace(/\[\[.*?\]\]/g, "").replace(/<.*?>/g, "")
    }
    parseText(text: string, guild?: Guild | null): string {
    // console.log(text)
        let links = text.match(/\[\[.*?\]\]/g)

        if (links)
            for (let match of links) {
                let clean = match.replace(/\[\[/, "").replace(/\]\]/, "")

                let title = clean, target = clean
                if (clean.includes("|"))
                    [target, title] = clean.split("|").map(a => a.trim())

                if (target.startsWith("File:")) {
                // title = clean.split("|").find(a => a.startsWith("link=")).replace("link=", "").replace(/_/g, " ") || title

                    const fileName = target.replace(/ /g, "_").trim()
                    text = text.replace(match, this.getEmoji(fileName))
                }

                if (target.startsWith("#"))
                    target = "Quests#" + target.substring(1)

                text = text.replace(match, `[${title}](${getWiki(target.replace(/ /g, "_").replace(/\(/g, "\\(").replace(/\)/g, "\\)"), guild)})`)
            }

        links = text.match(/\{\{[^{]*?\}\}/g)
        for (let i = 0; i < 5 && links; i++) {
            for (let match of links) {
                let clean = match.replace(/\{\{/, "").replace(/\}\}/, "")

                let title = clean.split("|")[1]
                if (clean.split("|")[0] == "color")
                    text = text.replace(match, clean.split("|")[2])

                for (let arg of clean.split("|").slice(1))
                    if (!arg.includes("=")) {
                        title = arg
                        break
                    }

                text = text.replace(match, `[${title.replace(/\//g, " ")}](${getWiki(title.replace(/ /g, "_").replace(/\(/g, "\\(").replace(/\)/g, "\\)"), guild)})`)
            }
            links = text.match(/\{\{[^{]*?\}\}/g)
        }

        return text.replace(/<br>/g, "\n").replace(/<br\/>/g, "\n").replace(/<br \/>/g, "\n").replace(/'''/g, "**").replace(/"/g, "**")
    }

    getEmoji(fileName: string): string {
        switch (fileName) {
            case "File:Furniture_box_large.jpg":
            case "File:Furniture_box_large.png":
                return emoji.furniture_box_l
            case "File:Furniture_box_medium.jpg":
            case "File:Furniture_box_medium.png":
                return emoji.furniture_box_m
            case "File:Furniture_box_small.jpg":
            case "File:Furniture_box_small.png":
                return emoji.furniture_box_s

            case "File:Development_material.png":
                return emoji.devmat
            case "File:Instant_construction_2.png":
                return emoji.flamethrower
            case "File:Improvement_Materials.png":
                return emoji.screw
            case "File:Instant_repair_2.png":
                return emoji.bucket
            case "File:Reinforcement_expansion_064_useitem.png":
                return emoji.reinforcement_expansion
            case "File:Present_box.png":
                return emoji.present_box
            case "File:Medal.png":
                return emoji.kcmedal
            case "File:Furniture_fairy.png":
                return emoji.furniture_fairy
            case "File:Food_supply_ship_mamiya.png":
                return emoji.mamiya
            case "File:Food_supply_ship_irako.png":
                return emoji.irako
            case "File:Construction_Corps_Item.png":
                return emoji.construction_corps
            case "File:Skilled_Crew_Member_Card.png":
                return emoji.skilled_crew_member
            case "File:New_Model_Gun_Mount_Improvement_Material_Card.png":
                return emoji.gun_mat
            case "File:New_Model_Aerial_Armament_Material_Card.png":
                return emoji.air_mat
            case "File:Action_Report_Card.png":
                return emoji.action_report
            case "File:Prototype_Deck_Catapult.png":
                return emoji.catapult
            case "File:Headquarters_Personnel.png":
                return emoji.headquarters_personnel
            case "File:Ranking_point_reward.png":
                return emoji.ranking_points
            default:
                return ""
        }
    }
    getImage(file: string): string {
        return `https://kancolle.fandom.com/wiki/Special:FilePath/${file.replace(/ /g, "_")}`
    }
}
