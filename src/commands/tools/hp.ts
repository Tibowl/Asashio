import { AutocompleteInteraction, CommandInteraction, Message } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"
import { calculatePostCap, findFuzzyBestCandidates, sendMessage } from "../../utils/Utils"
import { CommandSource, SendMessage, Ship } from "../../utils/Types"

export default class HP extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Gets HP values of a ship, before and after marriage, with and without modding.",
            usage: "hp <ship>",
            options: [{
                name: "ship",
                description: "Ship name to search",
                type: "STRING",
                required: true,
                autocomplete: true
            }]
        })
    }

    async autocomplete(source: AutocompleteInteraction): Promise<void> {
        const targetNames = Object.values(client.data.ships).map(s => s.full_name)
        const search = source.options.getFocused().toString()

        await source.respond(findFuzzyBestCandidates(targetNames, search, 20).map(value => {
            return { name: value, value }
        }))
    }


    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return this.run(source, source.options.getString("ship", true))
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (!args || args.length < 1) return sendMessage(source, "Must provide a ship name.")
        return this.run(source, args.join(" "))
    }

    async run(source: CommandSource, shipName: string): Promise<SendMessage | undefined> {
        const { data } = client

        const ship = data.getShipByName(shipName)

        if (ship == undefined) return sendMessage(source, "Unknown ship")
        // console.log(ship)

        return sendMessage(source, `HP values of **${ship.full_name}**:\`\`\`
 unmarried: ${this.generateLine(ship, false)}

   married: ${this.generateLine(ship, true)}
\`\`\``)
    }

    generateLine(ship: Ship, married: boolean): string {
        const f = (hp: number): string => `${hp%12?`4N+${hp%4}`:"12N+0"} (Overkill: ${(calculatePostCap(9999, hp, hp, 1).taiha * 100).toFixed(1)}% Taiha)`
        // eslint-disable-next-line prefer-const
        let { hp, hp_max } = ship
        if (married)
            hp = Math.min(hp_max, hp + [4, 4, 4, 5, 6, 7, 7, 8, 8, 9][Math.floor(hp/10)])

        const maxMod = Math.min(hp_max - hp, 2)
        let line = `${hp} ${f(hp)}`

        for (let i = 1; i <= maxMod; i++)
            line += `
modernized: ${hp + i} ${f(hp + i)}`

        return line
    }
}
