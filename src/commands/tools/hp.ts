import { Message } from "discord.js"

import Command from "../../utils/Command"
import client from "../../main"
import { calculatePostCap } from "../../utils/Utils"
import { Ship } from "../../utils/Types"

export default class HP extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Gets HP values of a ship, before and after marriage, with and without modding.",
            usage: "hp <ship>"
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        const { data } = client
        if (!args || args.length < 1) return message.reply("Must provide a ship name.")

        const shipName = args.join(" ")
        const ship = data.getShipByName(shipName)

        if (ship == undefined) return message.reply("Unknown ship")
        // console.log(ship)

        return message.channel.send(`HP values of **${ship.full_name}**:\`\`\`
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
