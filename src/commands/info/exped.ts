import { AutocompleteInteraction, CommandInteraction, Message, MessageEmbed } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"
import emoji from "../../data/emoji.json"
import { findFuzzyBestCandidates, getWiki, sendMessage } from "../../utils/Utils"
import { CommandResponse, CommandSource, SendMessage } from "../../utils/Types"

export default class Exped extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Information",
            help: "Gets expedition info.",
            usage: "exped <exped ID>",
            aliases: ["expedition"],
            options: [{
                name: "expedid",
                description: "Expedition ID",
                type:"STRING",
                autocomplete: true,
                required: true,
            }]
        })
    }

    async autocomplete(source: AutocompleteInteraction): Promise<void> {
        const targetNames = client.data.api_start2.api_mst_mission?.map(s => s.api_disp_no ?? s.api_id.toString()) ?? ["No expedition data loaded"]
        const search = source.options.getFocused().toString()

        await source.respond(findFuzzyBestCandidates(targetNames, search, 20).map(value => {
            return { name: value, value }
        }))
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return await this.run(source, source.options.getString("expedid", true).toUpperCase())
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (!args || args.length < 1) return sendMessage(source, "Must provide an expedition.")

        return await this.run(source, args[0].toUpperCase())
    }

    async run(source: CommandSource, expedID: string): Promise<CommandResponse> {
        const { data } = client

        const exped = data.api_start2.api_mst_mission?.find(k => k.api_disp_no == expedID || k.api_id == parseInt(expedID))
        if (exped == undefined) return sendMessage(source, "Unknown expedition.")

        const extraExpedData = data.getExpedByID(exped.api_disp_no)
        const [fuel, ammo, steel, bauxite] = (extraExpedData?.rsc) ?? (exped.api_win_mat_level.map(this.winmatlevel))

        const embed = new MessageEmbed()
            .setURL(getWiki("Expedition#/Expedition_Tables"))
            .setTitle(`${exped.api_disp_no} ${exped.api_reset_type == 1 ? "[M] " : ""}${this.getDamage(exped.api_damage_type)}- ${exped.api_name} - ${this.getTime(exped.api_time)}`)

        let req = (extraExpedData?.fleet) ?? `${exped.api_deck_num} ships required, details unknown`
        if (extraExpedData?.fs_lvl) req += `\n${extraExpedData.fs_lvl} Lv. FS`
        if (extraExpedData?.fleet_lvl) req += `\n${extraExpedData.fleet_lvl} total Lv.`
        if (extraExpedData?.misc_req) req += `\n${extraExpedData.misc_req}`
        embed.addField("Fleet requirements", req)

        let rewards = `${emoji.fuel}×${fuel} ${emoji.ammo}×${ammo} ${emoji.steel}×${steel} ${emoji.bauxite}×${bauxite}\n`
        if (exped.api_win_item1[0] != 0)
            rewards +=  `Left Reward (RNG): ${exped.api_win_item1[1]}×${this.getItem(exped.api_win_item1[0])}\n`
        if (exped.api_win_item2[0] != 0)
            rewards += `Right Reward (GS): ${exped.api_win_item2[1]}×${this.getItem(exped.api_win_item2[0])}\n`

        embed
            .addField("Rewards", rewards, true)
            .addField("Usage", `${exped.api_use_fuel*100}% fuel - ${exped.api_use_bull*100}% ammo`, true)

        let notes = ""

        if (exped.api_sample_fleet)
            notes += `Sample fleet: ${exped.api_sample_fleet.filter(k => k > 0).map(k => data.misc.ShipCodes[k]).join(", ")}\n`

        if (exped.api_reset_type == 1)
            notes += "Monthly expedition\n"
        else if (exped.api_reset_type != 0)
            notes += "Unknown expedition reset type\n"

        if (exped.api_damage_type == 1)
            notes += "You can receive damage on this expedition\n"
        else if (exped.api_damage_type == 2)
            notes += "You can receive *heavy* damage on this expedition\n"
        else if (exped.api_damage_type != 0)
            notes += `Unknown damage type ${exped.api_damage_type}\n`

        embed.addField("Notes", notes.trim())
        return sendMessage(source, embed)
    }

    getDamage(d: number): string {
        switch (d) {
            case 0: return ""
            case 1: return "[D] "
            case 2: return "[D+] "
            default: return `[D${d}?] `
        }
    }

    getItem(item: number): string {
        switch (item) {
            case 1: return emoji.bucket
            case 2: return emoji.flamethrower
            case 3: return emoji.devmat
            case 4: return emoji.screw
            case 10: return emoji.furniture_box_s
            case 11: return emoji.furniture_box_m
            case 12: return emoji.furniture_box_l
            case 59: return emoji.irako
            default: return `Unknown item ${item}`
        }
    }

    winmatlevel(k: number): string {
        switch (k) {
            case 0: return "0"
            case 1: return "1~250"
            case 2: return "250~500"
            case 3: return "500~750"
            case 4: return "750+"
            default: return "?"
        }
    }

    getTime(time: number): string {
        return `${(Math.floor(time / 60) + "").padStart(2, "0")}h${((time % 60) + "").padStart(2, "0")}m`
    }
}
