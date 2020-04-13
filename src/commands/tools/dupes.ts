import { Message } from "discord.js"
import fetch from "node-fetch"

import Command from "../../utils/Command"
import client from "../../main"
import { createTable, PAD_END, percentage } from "../../utils/Utils"

export default class Dupes extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Tools",
            help: "Gets dupes list of a drop. Uses <http://kc.piro.moe> API",
            usage: "dupes <ship> <map> <node> [difficulty: H/M/E/C] [rank: S/A]",
            aliases: ["dupe"]
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        if (!args || args.length < 2) return message.reply(`Invalid amount of arguments! Usage: \`${this.usage}\``)
        const { data } = client

        let map: string | undefined
        let node: string | undefined
        let difficulty: string | undefined = "H"
        let rank: string | undefined = "S"

        for (let i = args.length - 1; i > 0; i--) {
            args[i] = args[i].replace(/^E(\d[a-zA-Z0-9]+)$/i, "E-$1")

            if (args[i].includes("-")) {
                if (!args[i].match(/-\d$/)) {
                    args[i] = args[i].replace(/-\d/,"$& ")
                    args = args.join(" ").split(" ")
                }

                if (args.length == i + 4)
                    rank = args.pop()?.toUpperCase()
                if (args.length == i + 3) {
                    const arg = args.pop()?.toUpperCase()
                    if (arg == "S" || arg == "A")
                        rank = arg
                    else
                        difficulty = arg
                }

                if (args.length != i + 2)
                    return message.reply("Invalid arguments!")

                node = args.pop()?.toUpperCase()
                map = args.pop()?.toUpperCase()

                break
            }
        }
        if (map == undefined) return message.reply("Invalid arguments!")
        if (rank == undefined) return message.reply("Invalid arguments!")
        if (node == undefined) return message.reply("Invalid arguments!")
        if (difficulty == undefined) return message.reply("Invalid arguments!")

        if (map.startsWith("E-")) map = map.replace("E", data.eventID().toString())
        if (map.startsWith("E")) map = map.replace("E", data.eventID() + "-")
        if (map.split("-").length != 2) return message.reply("Invalid map!")

        const isEvent = map.split("-")[0].length > 1

        let difficultyID = ["/", "C", "E", "M", "H"].indexOf(difficulty)
        if (difficultyID <= 0 && isEvent) return message.reply("Invalid difficulty!")
        if (!isEvent) difficultyID = 0

        if (!["S", "A", "B"].includes(rank)) return message.reply("Invalid rank!")


        const shipName = args.join(" ")
        let ship = data.getShipByName(shipName)

        if (ship == undefined) return message.reply("Unknown ship")

        if (typeof ship.remodel_from == "string")
            ship = data.getShipByName(ship.remodel_from.replace("/", "")) || ship
        ship = data.getShipByName(ship.name)


        const mapInfo = await data.getMapInfo(map)
        if (Object.keys(mapInfo.route).length == 0) return message.reply("Invalid/unknown map!")

        const edges = Object.entries(mapInfo.route).filter(e => e[1][1].toUpperCase() == node).map(e => e[0])
        const api = await (await fetch(`http://kc.piro.moe/api/routing/drops?map=${map}&edges=${edges.join(",")}${isEvent ? `&minDiff=${difficultyID}&maxDiff=${difficultyID}`:""}&cleared=-1&ranks=${rank}&ship=${ship.api_id}`)).json()

        let dupes = api.dupes.map((dupe: { owned: number, drops: number, total: number }) => [`${dupe.owned}→${dupe.owned+1}`, percentage(dupe.drops, dupe.total), `[${dupe.drops}/${dupe.total}]`])
        let msg = ""

        if (message.channel.type != "dm" && dupes.length > 5) {
            dupes = dupes.slice(0, 5)
            msg = "\nLimited to 5 entries, repeat command in DM for full table."
        } else if (dupes.length > 25) {
            dupes = dupes.slice(0, 25)
            msg = "\nLimited to 25 entries."
        }

        return message.channel.send(`${ship.full_name} dupes in ${map}${node}${isEvent ? ` on ${difficulty}`:""} with rank ${rank}\`\`\`\n${createTable(
            ["Dupes", "Rate", "Drops"],
            dupes,
            [PAD_END]
        )}\n\`\`\`\nData provided by TsunDB.${msg}`)
    }
}
