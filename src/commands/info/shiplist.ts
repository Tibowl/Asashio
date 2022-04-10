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
        const search = source.options.getFocused().toString().split(/\s+/)

        const last = search.pop() as string
        const responses = findFuzzyBestCandidates(this.getTargetNames(search), last, 20).map(value => {
            const reply = [...search, value].join(" ")
            return { name: reply, value: reply }
        })

        if (responses.length == 1 || responses[0].value == source.options.getFocused().toString()) {
            await source.respond([...responses, ...findFuzzyBestCandidates(this.getTargetNames(responses[0].value.split(/ +/)), "", 20 - responses.length).map(value => {
                const reply = [responses[0].value, value].join(" ")
                return { name: reply, value: reply }
            })])
            return
        }

        await source.respond(responses)
    }

    getTargetNames(others: string[]): string[] {
        const targetNames = Object.keys(client.data.shiplist)
        if (others.length > 0)
            targetNames.push(...Object.values(client.data.misc.ShipCodes))

        const criteria = this.mapCriteria(others)

        return targetNames.filter(x => !criteria.includes(x) && this.getMatches([...criteria, x]).length > 0)
    }

    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return await this.run(source, source.options.getString("categories", true).split(/\s+/))
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (!args || args.length < 1) return sendMessage(source, "Must provide a list of criteria.")

        return await this.run(source, args)
    }

    async run(source: CommandSource, criteriaInput: string[]): Promise<CommandResponse> {
        const criteria = this.mapCriteria(criteriaInput)
        const ships = this.getMatches(criteria)

        if (ships.length == 0) return sendMessage(source, `No ships matching criteria: ${criteria.join(", ")}`)

        return sendMessage(source, `Ships matching ${criteria.join(", ")}: ${ships.join(", ")}`)
    }

    private mapCriteria(criteriaInput: string[]): string[] {
        const targetNames = [...Object.keys(client.data.shiplist), ...Object.values(client.data.misc.ShipCodes)]

        return criteriaInput.map(x => findFuzzy(targetNames, x) as string)
    }

    private getMatches(criteria: string[]) {
        const { shiplist, misc, ships } = client.data


        function getShips(c: string): string[] {
            const type = Object.entries(misc.ShipCodes)
                .find(k => k[1].toUpperCase() === c.toUpperCase())?.[0] ?? 0

            if (type == 0)
                return shiplist[c]
            else
                return Object.values(ships).filter(ship => ship.type == +type).map(s => s.full_name)
        }

        return criteria.reduce((p, c) => p.filter(x => getShips(c).includes(x)), getShips(criteria[0]))
    }
}
