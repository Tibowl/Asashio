import { CommandInteraction, Message } from "discord.js"

import Command from "../../utils/Command"
import { CommandSource, SendMessage } from "../../utils/Types"
import { sendMessage } from "../../utils/Utils"

export default class Pepper extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "How many runs needed for X% drop reaches Y% chance",
            usage: "pepper <rate percentage> <wanted chance>",
            options: [{
                name: "droprate",
                description: "X% drop",
                type: "NUMBER",
                required: true
            }, {
                name: "wantedrate",
                description: "X% wanted chance",
                type: "NUMBER",
                required: true
            }]
        })
    }
    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        const dropRate = source.options.getNumber("droprate", true)
        const chance = source.options.getNumber("wantedrate", true)

        return this.run(source, dropRate, chance)
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (!args || args.length !== 2) return sendMessage(source, `Usage: \`${this.usage}\``)

        let [dropRateStr, chanceStr] = args
        dropRateStr = dropRateStr.replace(/%$/, "")
        chanceStr = chanceStr.replace(/%$/, "")

        if (!dropRateStr.match(/^[0-9]{0,2}(|\.[0-9]+)$/)) return sendMessage(source, `Usage: \`${this.usage}\``)
        if (!chanceStr.match(/^[0-9]{0,2}(|\.[0-9]+)$/)) return sendMessage(source, `Usage: \`${this.usage}\``)

        const dropRate = parseFloat(dropRateStr)
        const chance = parseFloat(chanceStr)

        return this.run(source, dropRate, chance)
    }

    async run(source: CommandSource, dropRate: number, chance: number): Promise<SendMessage | undefined> {
        const runs = Math.log(1 - (chance/100)) / Math.log(1 - (dropRate/100))
        return sendMessage(source, `**~${runs.toLocaleString(undefined, {
            "maximumFractionDigits": 1,
            "maximumSignificantDigits": 4
        })}** runs needed to have a ${chance.toLocaleString()}% chance to get a ${dropRate.toLocaleString()}% drop`)
    }
}
