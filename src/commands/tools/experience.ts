import { Message } from "discord.js"
import Command from "../../utils/Command"
import client from "../../main"

export default class Experience extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Get experience needed to reach a target level (defaults to 99 or max level)",
            usage: "experience <current level[(+ or -)current xp offset]> [target level]",
            aliases: ["xp", "exp"],
        })
    }

    run(message: Message, args: string[]): Promise<Message | Message[]> {
        if(!args || args.length < 1) return message.reply(`Usage: \`${this.usage}\``)
        const { data } = client

        let [currentLevel, targetLevel]: number[] | string[] = args
        let xpOffset = 0
        try {
            if(currentLevel.includes("+") || currentLevel.includes("-")) {
                const split = currentLevel.split(/[+-]/)
                if(split.length > 2) return message.reply("Invalid arguments")
                const [lvl, offset] = split
                xpOffset = parseInt(offset)
                if(currentLevel.includes("-") && xpOffset > 0)
                    xpOffset = -xpOffset

                currentLevel = parseInt(lvl)
            } else
                currentLevel = parseInt(currentLevel)

            if(targetLevel)
                targetLevel = parseInt(targetLevel)
            else if (currentLevel > 99)
                targetLevel = data.getMaxLevel()
            else
                targetLevel = 99
        } catch (e) {
            return message.reply("Not a number")
        }
        if(!isFinite(xpOffset))
            return message.reply("Invalid offset")

        if(!isFinite(currentLevel))
            return message.reply("Current level is not a number")
        if(currentLevel > data.getMaxLevel())
            return message.reply(`Current level is too large (max: ${data.getMaxLevel()})`)
        if(currentLevel < 1)
            return message.reply("Current level too small")

        if(!isFinite(targetLevel))
            return message.reply("Target level is not a number")
        if(targetLevel > data.getMaxLevel())
            return message.reply(`Target level is too large (max: ${data.getMaxLevel()})`)
        if(targetLevel < 1)
            return message.reply("Target level too small")

        if(currentLevel > targetLevel)
            [currentLevel, targetLevel] = [targetLevel, currentLevel]

        const currentXP = data.levels_exp[currentLevel - 1] + xpOffset
        const targetXP = data.levels_exp[targetLevel - 1]
        const diffXP = targetXP - currentXP
        const progress = currentXP / targetXP * 100

        return message.channel.send(`From **${currentLevel}** (${currentXP.toLocaleString()} XP) to **${targetLevel}** (${targetXP.toLocaleString()} XP) you need **${diffXP.toLocaleString()}** XP (Progress: ${progress.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}%)`)
    }
}
