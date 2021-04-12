import { Message } from "discord.js"

import Command from "../../utils/Command"

export default class Salt extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "What's the chance to not get a X% drop in Y runs",
            usage: "salt <drop rate> <runs>",
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        if (!args || args.length !== 2) return message.reply(`Usage: ${this.usage}`)

        // eslint-disable-next-line prefer-const
        let [dropRateStr, runsStr] = args
        dropRateStr = dropRateStr.replace(/%$/, "")

        if (!dropRateStr.match(/^[0-9]{0,2}(|\.[0-9]+)$/)) return message.reply(`Usage: ${this.usage}`)
        if (!runsStr.match(/^[0-9]{0,6}(|\.[0-9]+)$/)) return message.reply(`Usage: ${this.usage}`)

        const dropRate = parseFloat(dropRateStr)
        const runs = parseFloat(runsStr)
        const rate = 1 - ((1-(dropRate/100))**runs)
        return message.channel.send(`**~${(rate*100).toLocaleString(undefined, {
            "minimumFractionDigits": 1,
            "maximumSignificantDigits": 4
        })}%** to get a ${dropRate.toLocaleString()}% drop in ${runs.toLocaleString()} runs`)
    }
}
