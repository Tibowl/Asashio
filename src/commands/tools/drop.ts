import { AutocompleteInteraction, CommandInteraction, Message } from "discord.js"
import client from "../../main"
import Command from "../../utils/Command"
import { Rank, SendMessage } from "../../utils/Types"
import { dropTable, findFuzzyBestCandidates, parseDropArgs, sendMessage } from "../../utils/Utils"

export default class Drop extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Gets drop list of a ship. Data from TsunDB, bot will cache results up to 6 hours. Uses <http://kc.piro.moe> API",
            shortHelp: "Gets drop list of a ship. Data from TsunDB.",
            usage: "drop <ship> [rank: S/A]",
            aliases: ["locate", "droprate", "droprates"],
            options: [{
                name: "ship",
                description: "Name of ship",
                type: "STRING",
                autocomplete: true,
                required: true
            }, {
                name: "rank",
                description: "Name of ship",
                type: "STRING",
                choices: [{
                    name: "S",
                    value: "S"
                }, {
                    name: "A",
                    value: "A"
                }]
            }]
        })
    }

    async autocomplete(source: AutocompleteInteraction): Promise<void> {
        const targetNames = Object.values(client.data.ships).filter(x => x.remodel_level == false).map(s => s.full_name)
        const search = source.options.getFocused().toString()

        await source.respond(findFuzzyBestCandidates(targetNames, search, 20).map(value => {
            return { name: value, value }
        }))
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        const ship = source.options.getString("ship", true)
        const rank = (source.options.getString("rank") ?? "S") as Rank
        return dropTable(source, client.data.getShipByName(ship), rank, "tsundb")
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        const response = parseDropArgs(args)
        if (typeof response == "string")
            return sendMessage(source, response)

        return dropTable(source, response.ship, response.rank, "tsundb")
    }
}
