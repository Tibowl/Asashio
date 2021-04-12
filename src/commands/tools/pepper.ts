import { Message } from "discord.js"

import Command from "../../utils/Command"

export default class Pepper extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "How many runs needed for X% drop reaches Y% chance",
            usage: "pepper <rate percantage> <wanted chance>"
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        if (!args || args.length !== 2) return message.reply(`Usage: \`${this.usage}\``)

        let [dropRateStr, chanceStr] = args
        dropRateStr = dropRateStr.replace(/%$/, "")
        chanceStr = chanceStr.replace(/%$/, "")

        if (!dropRateStr.match(/^[0-9]{0,2}(|\.[0-9]+)$/)) return message.reply(`Usage: \`${this.usage}\``)
        if (!chanceStr.match(/^[0-9]{0,2}(|\.[0-9]+)$/)) return message.reply(`Usage: \`${this.usage}\``)

        const dropRate = parseFloat(dropRateStr)
        const chance = parseFloat(chanceStr)
        const runs = Math.log(1 - (chance/100)) / Math.log(1 - (dropRate/100))
        return message.channel.send(`**~${runs.toLocaleString(undefined, {
            "maximumFractionDigits": 1,
            "maximumSignificantDigits": 4
        })}** runs needed to have a ${chance.toLocaleString()}% chance to get a ${dropRate.toLocaleString()}% drop`)
    }
}
