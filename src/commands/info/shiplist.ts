import { AutocompleteInteraction, CommandInteraction, Message } from "discord.js"
import client from "../../main"
import Command from "../../utils/Command"
import { CommandResponse, CommandSource, SendMessage } from "../../utils/Types"
import { findFuzzy, findFuzzyBestCandidates, sendMessage } from "../../utils/Utils"


export default class ShipList extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Information",
            help: "List ships that match certain criteria.",
            usage: "shiplist <list of categories, separated by spaces>",
            options: [{
                name: "categories",
                description: "Categories to match, separated by spaces",
                type:"STRING",
                autocomplete: true,
                required: true,
            }],
            aliases: ["sl", "shipcategory", "shipcategories", "sc"]
        })
    }

    async autocomplete(source: AutocompleteInteraction): Promise<void> {
        const targetNames = Object.keys(client.data.shiplist)
        const search = source.options.getFocused().toString().split(/\s+/)

        const last = search.pop() as string
        const responses = findFuzzyBestCandidates(targetNames, last, 20).map(value => {
            const reply = [...search, value].join(" ")
            return { name: reply, value: reply }
        }).filter((x) => x.value.split(" ").every((v, i, a) => a.indexOf(v) == i))

        if (responses.length == 1 || responses[0].value == source.options.getFocused().toString()) {
            await source.respond([...responses, ...findFuzzyBestCandidates(targetNames, "", 20 - responses.length).map(value => {
                const reply = [responses[0].value, value].join(" ")
                return { name: reply, value: reply }
            })].filter((x) => x.value.split(" ").every((v, i, a) => a.indexOf(v) == i)))
            return
        }

        await source.respond(responses)
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return await this.run(source, source.options.getString("categories", true).split(/\s+/))
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (!args || args.length < 1) return sendMessage(source, "Must provide a list of criteria.")

        return await this.run(source, args)
    }

    async run(source: CommandSource, criteriaInput: string[]): Promise<CommandResponse> {
        const { shiplist } = client.data

        const targetNames = Object.keys(shiplist)
        const criteria = criteriaInput.map(x => findFuzzy(targetNames, x))

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const ships = criteria.reduce((p, c) => p.filter(x => shiplist[c!].includes(x)), shiplist[criteria[0]!])

        if (ships.length == 0) return sendMessage(source, `No ships matching criteria: ${criteria.join(", ")}`)

        return sendMessage(source, `Ships matching ${criteria.join(", ")}: ${ships.join(", ")}`)
    }
}
