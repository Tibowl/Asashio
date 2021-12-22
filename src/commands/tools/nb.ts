import { CommandInteraction, Message } from "discord.js"
import Command from "../../utils/Command"
import client from "../../main"
import { CommandSource, SendMessage } from "../../utils/Types"
import { sendMessage } from "../../utils/Utils"

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
            usage: "nb <cutin> [level] [luck]",
            options: [{
                name: "cutin",
                description: "Cutin",
                type: "STRING",
                choices: Object.entries(cutins).map(([k, v]) => {
                    return {
                        name: v.name,
                        value: k
                    }
                }),
                required: true,
            }, {
                name: "level",
                description: "Level",
                type: "NUMBER",
                required: false,
            }, {
                name: "luck",
                description: "Luck",
                type: "NUMBER",
                required: false,
            }]
        })
    }
    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        const cutinType = source.options.getString("cutin", true)
        const level = source.options.getNumber("level")
        const luck = source.options.getNumber("luck")

        const cutin = cutins[cutinType.toLowerCase()]
        if (level == undefined)
            return this.runCutin(source, cutin, cutinType)

        if (luck == undefined)
            return sendMessage(source, `Usage: \`nb ${cutinType} <level> <luck>\``)

        return this.runCalc(source, level, luck, cutin, cutinType)
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (!args || args.length < 1) return sendMessage(source, `Usage: \`${this.usage}\`
Available types: ${Object.entries(cutins).map(([k, v]) => `\`${k}\`: ${v.name}`).join(", ")}`)

        const cutinType = args[0].toLowerCase()
        const cutin = cutins[cutinType]

        if (cutin == undefined) return sendMessage(source, "Unknown cutin")
        if (args.length == 1)
            return this.runCutin(source, cutin, cutinType)

        if (args.length < 3) return sendMessage(source, `Usage: \`nb ${cutinType} <level> <luck>\``)

        const level = parseInt(args[1])
        const luck = parseInt(args[2])

        return this.runCalc(source, level, luck, cutin, cutinType)
    }

    async runCutin(source: CommandSource, cutin: CutIn, cutinType: string): Promise<SendMessage | undefined> {
        const format = (base: number): string => (base / cutin.value * 100).toFixed(2).padStart(5)
        return sendMessage(source, `For level/luck specific stats use \`nb ${cutinType} <level> <luck>\`

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

    async runCalc(source: CommandSource, level: number, luck: number, cutin: CutIn, cutinType: string): Promise<SendMessage | undefined> {
        const { data } = client

        if (isNaN(level) || level < 0 || level > data.getMaxLevel() + 50) return sendMessage(source, "Invalid/unrealistic level.")
        if (isNaN(luck) || luck < 0 || luck > 200) return sendMessage(source, "Invalid/unrealistic luck.")

        let base = 0
        if (luck < 50)
            base = Math.floor(15 + luck + 0.75 * Math.sqrt(level))
        else
            base = Math.floor(65 + Math.sqrt(luck - 50) + 0.8 * Math.sqrt(level))

        return sendMessage(source, `The base cut-in rate is **${(base/cutin.value*100).toFixed(2)}%** for a level **${level}** ship with **${luck}** luck. See \`nb ${cutinType}\` for bonus information.`)
    }
}
