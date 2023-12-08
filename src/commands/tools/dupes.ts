import { AutocompleteInteraction, CommandInteraction, Message } from "discord.js"
import log4js from "log4js"
import fetch from "node-fetch"
import client from "../../main"
import Command from "../../utils/Command"
import emoji from "../../data/emoji.json"
import { CommandSource, SendMessage, WebResult } from "../../utils/Types"
import { createTable, fetchKcnav, findFuzzyBestCandidates, PAD_END, percentage, sendMessage, updateMessage } from "../../utils/Utils"

const Logger = log4js.getLogger("dupes")


export default class Dupes extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Gets dupes list of a drop. Uses <https://tsunkit.net> API",
            usage: "dupes <ship> <map> <node> [difficulty: H/M/E/C] [rank: S/A]",
            aliases: ["dupe"],
            options: [{
                name: "ship",
                description: "Ship name to search",
                type: "STRING",
                required: true,
                autocomplete: true
            }, {
                name: "map",
                description: "Map to search",
                type: "STRING",
                required: true
            },  {
                name: "node",
                description: "Node to check",
                type: "STRING",
                required: true
            },  {
                name: "difficulty",
                description: "Difficulty to check, defaults to H",
                type: "STRING",
                choices: [{
                    name: "H",
                    value: "H"
                }, {
                    name: "M",
                    value: "M"
                }, {
                    name: "E",
                    value: "E"
                }, {
                    name: "C",
                    value: "C"
                }]
            },  {
                name: "rank",
                description: "Rank to check, defaults to S",
                type: "STRING",
                choices: [{
                    name: "S",
                    value: "S"
                }, {
                    name: "A",
                    value: "A"
                }, {
                    name: "B",
                    value: "B"
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
        const map = source.options.getString("map", true)
        const node = source.options.getString("node", true)
        const shipName = source.options.getString("ship", true)
        const difficulty = source.options.getString("difficulty") ?? "H"
        const rank = source.options.getString("rank") ?? "S"
        return this.run(source, map, node, difficulty, rank, shipName)
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (!args || args.length < 2) return sendMessage(source, `Invalid amount of arguments! Usage: \`${this.usage}\``)
        let map: string | undefined
        let node: string | undefined
        let difficulty: string | undefined = "H"
        let rank: string | undefined = "S"

        for (let i = args.length - 1; i > 0; i--) {
            args[i] = args[i].replace(/^E(\d[a-zA-Z0-9]?)$/i, "E-$1")

            if (args[i].includes("-")) {
                if (!args[i].match(/-\d$/)) {
                    args[i] = args[i].replace(/-\d/, "$& ")
                    args = args.join(" ").split(" ")
                }

                if (args.length == i + 4)
                    rank = args.pop()?.toUpperCase()
                if (args.length == i + 3) {
                    const arg = args.pop()?.toUpperCase()
                    if (arg == "S" || arg == "A"|| arg == "B")
                        rank = arg
                    else
                        difficulty = arg
                }

                if (args.length != i + 2)
                    return sendMessage(source, "Invalid arguments!")

                node = args.pop()?.toUpperCase()
                map = args.pop()?.toUpperCase()

                break
            }
        }

        const shipName = args.join(" ")

        if (map == undefined) return sendMessage(source, "Invalid arguments!")
        if (rank == undefined) return sendMessage(source, "Invalid arguments!")
        if (node == undefined) return sendMessage(source, "Invalid arguments!")
        if (difficulty == undefined) return sendMessage(source, "Invalid arguments!")
        if (shipName == undefined) return sendMessage(source, "Invalid arguments!")

        return this.run(source, map, node, difficulty, rank, args.join(" "))
    }

    async run(source: CommandSource, map: string, node: string, difficulty: string, rank: string, shipName: string): Promise<SendMessage | undefined> {
        const { data } = client
        if (map.startsWith("E-")) map = map.replace("E", data.eventID().toString())
        if (map.startsWith("E")) map = map.replace("E", data.eventID() + "-")
        if (map.split("-").length != 2) return sendMessage(source, "Invalid map!")

        const isEvent = map.split("-")[0].length > 1

        let difficultyID = ["/", "C", "E", "M", "H"].indexOf(difficulty)
        if (difficultyID <= 0 && isEvent) return sendMessage(source, "Invalid difficulty!")
        if (!isEvent) difficultyID = 0

        if (!["S", "A", "B"].includes(rank)) return sendMessage(source, "Invalid rank!")

        let ship = data.getShipByName(shipName)

        if (ship == undefined) return sendMessage(source, "Unknown ship")

        if (typeof ship.remodel_from == "string")
            ship = data.getShipByName(ship.remodel_from.replace("/", "")) ?? ship
        ship = data.getShipByName(ship.name)


        const mapInfo = await data.getMapInfo(map)
        if (Object.keys(mapInfo.route).length == 0) return sendMessage(source, "Invalid/unknown map!")

        const reply = await sendMessage(source, `${emoji.loading} Loading...`)

        const edges = Object.entries(mapInfo.route).filter(e => e[1][1].toUpperCase() == node).map(e => e[0])
        fetchKcnav(`/api/routing/maps/${map}/edges/${edges.join(",")}/drops?${isEvent ? `minDiff=${difficultyID}&maxDiff=${difficultyID}&`:""}cleared=-1&ranks=${rank}&ship=${ship.api_id}`)
            .then(async data => data.json() as Promise<WebResult<{dupes: {owned: number, drops: number, total: number}[]}>>)
            .then(async api => {
                if (api.error)
                    throw new Error("Error occurred while fetching dupe data.")
                let dupes = api.result.dupes.map(dupe => [`${dupe.owned}→${dupe.owned+1}`, percentage(dupe.drops, dupe.total), `[${dupe.drops}/${dupe.total}]`])
                let msg = ""

                if (source.channel?.type != "DM" && dupes.length > 5) {
                    dupes = dupes.slice(0, 5)
                    msg = "\nLimited to 5 entries, repeat command in DM for full table."
                } else if (dupes.length > 25) {
                    dupes = dupes.slice(0, 25)
                    msg = "\nLimited to 25 entries."
                }

                if (reply)
                    await updateMessage(reply, `${ship.full_name} dupes in ${map}${node}${isEvent ? ` on ${difficulty}`:""} with rank ${rank}\`\`\`\n${createTable(
                        ["Dupes", "Rate", "Drops"],
                        dupes,
                        [PAD_END]
                    )}\n\`\`\`\nData provided by TsunDB.${msg}`)
            })
            .catch(e => Logger.error(e))

        return reply
    }
}
