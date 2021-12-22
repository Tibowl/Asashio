import { CommandInteraction, Message } from "discord.js"
import Command from "../../utils/Command"
import client from "../../main"
import { CommandSource, SendMessage } from "../../utils/Types"
import { sendMessage } from "../../utils/Utils"

export default class Experience extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Get experience needed to reach a target level (defaults to 99 or max level)",
            usage: "experience <current level[(+ or -)current xp offset]> [target level]",
            aliases: ["xp", "exp"],
            options: [{
                name: "current",
                description: "Current level[(+ or -)current xp offset]",
                type: "STRING",
                required: true,
            }, {
                name: "target",
                description: "Target level (defaults to 99/max level)",
                type: "NUMBER",
                required: false,
            }]
        })
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return this.run(source, source.options.getString("current", true), source.options.getNumber("target"))
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (!args || args.length < 1) return sendMessage(source, `Usage: \`${this.usage}\``)
        const [currentLevel, targetLevel]: number[] | string[] = args
        return this.run(source, currentLevel, targetLevel)
    }

    async run(source: CommandSource, level: string, target?: string | number | null): Promise<SendMessage | undefined> {
        const { data } = client

        let xpOffset = 0, currentLevel = 0, targetLevel = 99
        try {
            if (level.includes("+") || level.includes("-")) {
                const split = level.split(/[+-]/)
                if (split.length > 2) return sendMessage(source, "Invalid arguments")
                const [lvl, offset] = split
                xpOffset = parseInt(offset)
                if (level.includes("-") && xpOffset > 0)
                    xpOffset = -xpOffset

                currentLevel = parseInt(lvl)
            } else
                currentLevel = parseInt(level)

            if (target)
                if (typeof target == "string")
                    targetLevel = parseInt(target)
                else
                    targetLevel = target
            else if (currentLevel > 99)
                targetLevel = data.getMaxLevel()
            else
                targetLevel = 99
        } catch (e) {
            return sendMessage(source, "Not a number")
        }

        if (!isFinite(xpOffset))
            return sendMessage(source, "Invalid offset")

        if (!isFinite(currentLevel))
            return sendMessage(source, "Current level is not a number")
        if (currentLevel > data.getMaxLevel())
            return sendMessage(source, `Current level is too large (max: ${data.getMaxLevel()})`)
        if (currentLevel < 1)
            return sendMessage(source, "Current level too small")

        if (!isFinite(targetLevel))
            return sendMessage(source, "Target level is not a number")
        if (targetLevel > data.getMaxLevel())
            return sendMessage(source, `Target level is too large (max: ${data.getMaxLevel()})`)
        if (targetLevel < 1)
            return sendMessage(source, "Target level too small")

        if (currentLevel > targetLevel)
            [currentLevel, targetLevel] = [targetLevel, currentLevel]

        const currentXP = data.levels_exp[currentLevel - 1] + xpOffset
        const targetXP = data.levels_exp[targetLevel - 1]
        const diffXP = targetXP - currentXP
        const progress = currentXP / targetXP * 100

        return sendMessage(source, `From **${currentLevel}** (${currentXP.toLocaleString()} XP) to **${targetLevel}** (${targetXP.toLocaleString()} XP) you need **${diffXP.toLocaleString()}** XP (Progress: ${progress.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}%)`)
    }
}
