import { CommandInteraction, Message } from "discord.js"

import Command from "../../utils/Command"
import { CommandSource, SendMessage } from "../../utils/Types"
import { sendMessage } from "../../utils/Utils"

export default class Salt extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "What's the chance to not get a X% drop in Y runs",
            usage: "salt <drop rate> <runs>",
            options: [{
                name: "droprate",
                description: "X% drop",
                type: "NUMBER",
                required: true
            }, {
                name: "runs",
                description: "Amount of runs",
                type: "INTEGER",
                required: true
            }]
        })
    }
    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        const dropRate = source.options.getNumber("droprate", true)
        const runs = source.options.getInteger("runs", true)

        return this.run(source, dropRate, runs)
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (!args || args.length !== 2) return sendMessage(source, `Usage: ${this.usage}`)

        // eslint-disable-next-line prefer-const
        let [dropRateStr, runsStr] = args
        dropRateStr = dropRateStr.replace(/%$/, "")

        if (!dropRateStr.match(/^[0-9]{0,2}(|\.[0-9]+)$/)) return sendMessage(source, `Usage: ${this.usage}`)
        if (!runsStr.match(/^[0-9]{0,6}(|\.[0-9]+)$/)) return sendMessage(source, `Usage: ${this.usage}`)

        const dropRate = parseFloat(dropRateStr)
        const runs = parseFloat(runsStr)

        return this.run(source, dropRate, runs)
    }

    async run(source: CommandSource, dropRate: number, runs: number): Promise<SendMessage | undefined> {
        const rate = 1 - ((1-(dropRate/100))**runs)
        return sendMessage(source, `**~${(rate*100).toLocaleString(undefined, {
            "minimumFractionDigits": 1,
            "maximumSignificantDigits": 4
        })}%** to get a ${dropRate.toLocaleString()}% drop in ${runs.toLocaleString()} runs`)
    }
}
