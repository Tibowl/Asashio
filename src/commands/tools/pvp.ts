import { Message } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"

export default class PvP extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Get experience you get from given ship lvls",
            usage: "pvp <flagship level> [escort level=0]",
            aliases: ["pvpxp", "pvpexp"]
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        if (!args || args.length < 1) return message.reply(`Usage: \`${this.usage}\``)
        const { data } = client

        let flagshipLevel = 0, escortLevel = 0
        try {
            flagshipLevel = parseInt(args[0])

            if (args[1])
                escortLevel = parseInt(args[1] ?? 1)
            else
                escortLevel = 0
        } catch (e) {
            return message.reply("Not a number")
        }

        if (!isFinite(flagshipLevel))
            return message.reply("Flagship level is not a number")
        if (flagshipLevel > data.getMaxLevel())
            return message.reply(`Flagship level is too large (max: ${data.getMaxLevel()})`)
        if (flagshipLevel < 1)
            return message.reply("Flagship level too small")

        if (!isFinite(escortLevel))
            return message.reply("Escort level is not a number")
        if (escortLevel > data.getMaxLevel())
            return message.reply(`Escort level is too large (max: ${data.getMaxLevel()})`)
        if (escortLevel < 0)
            return message.reply("Escort level too small")

        const flagshipXP = data.levels_exp[flagshipLevel - 1]
        const escortXP = data.levels_exp[(escortLevel||1) - 1]

        const precapMin = Math.floor(flagshipXP / 100 + escortXP / 300)
        const precapMax = precapMin + 3

        const baseMin = this.postcap(precapMin)
        const baseMax = this.postcap(precapMax)

        return message.channel.send(`A pvp with flagship level **${flagshipLevel}**${escortLevel > 0 ? ` and escort level **${escortLevel}**` : ""} gives **${this.range(Math.floor(baseMin), Math.floor(baseMax))}** base XP, **${this.range(Math.floor(baseMin * 1.2), Math.floor(baseMax * 1.2))}** for an S rank`)
    }

    postcap(precap: number): number {
        if (precap <= 500)
            return precap
        return Math.floor(500 + Math.sqrt(precap - 500))
    }

    range(min: number, max: number): number | string {
        if (min != max)
            return `${min}~${max}`
        return min
    }
}
