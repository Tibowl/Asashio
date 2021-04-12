import { Message } from "discord.js"
import Command from "../../utils/Command"
import client from "../../main"

interface CutIns {
    [key: string]: CutIn
}

interface CutIn {
    name:  string
    value: number
}

const cutins: CutIns = {
    trl: {
        name: "Torpedo-Radar-Lookout (DD only)",
        value: 150
    },
    gci: {
        name: "Gun Cut-In",
        value: 140
    },
    mgci: {
        name: "Mixed Gun Cut-In",
        value: 130
    },
    gtr: {
        name: "Gun-Torpedo-Radar (DD only)",
        value: 130
    },
    tci: {
        name: "Torpedo Cut-In",
        value: 122
    },
    mtci: {
        name: "Mixed Torpedo Cut-In",
        value: 115
    }
}

export default class NB extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: `Show night battle cutin rates.
    - When only cut-in type provided, shows list of bonuses.
    - Available types: 
        - ${Object.entries(cutins).map(([k, v]) => `\`${k}\`: ${v.name}`).join("\n        - ")}`,
            usage: "nb <cutin> [level] [luck]"
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        if (!args || args.length < 1) return message.reply(`Usage: \`${this.usage}\`
Available types: ${Object.entries(cutins).map(([k, v]) => `\`${k}\`: ${v.name}`).join(", ")}`)
        const { data } = client

        const cutinType = args[0].toLowerCase()
        const cutin = cutins[cutinType]

        if (cutin == undefined) return message.reply("Unknown cutin")

        if (args.length == 1) {
            const format = (base: number): string => (base / cutin.value * 100).toFixed(2).padStart(5)
            return message.channel.send(`For level/luck specific stats use \`nb ${cutinType} <level> <luck>\`

**${cutin.name}** (base value: ${cutin.value})
\`\`\`diff
Bonuses:
+${format(15)}% | Flagship
+${format(18)}% | Chuuha
+${format(7)}% | Allied Searchlight
+    ?% | Allied L. Searchlight
+${format(4)}% | Allied Star Shell
+${format(5)}% | Skilled Lookouts
Penalties:
-${format(5)}% | Enemy Searchlight
-    ?% | Enemy L. Searchlight
-${format(10)}% | Enemy Star Shell \`\`\``)
        }

        if (args.length < 3) return message.reply(`Usage: \`nb ${cutinType} <level> <luck>\``)

        const level = parseInt(args[1])
        const luck = parseInt(args[2])

        if (isNaN(level) || level < 0 || level > data.getMaxLevel() + 50) return message.reply("Invalid/unrealistic level.")
        if (isNaN(luck) || luck < 0 || luck > 200) return message.reply("Invalid/unrealistic luck.")

        let base = 0
        if (luck < 50)
            base = Math.floor(15 + luck + 0.75 * Math.sqrt(level))
        else
            base = Math.floor(65 + Math.sqrt(luck - 50) + 0.8 * Math.sqrt(level))

        return message.channel.send(`The base cut-in rate is **${(base/cutin.value*100).toFixed(2)}%** for a level **${level}** ship with **${luck}** luck. See \`nb ${cutinType}\` for bonus information.`)
    }
}
