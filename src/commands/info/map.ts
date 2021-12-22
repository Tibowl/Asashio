import { createCanvas, Image } from "canvas"
import { CommandInteraction, Message, MessageAttachment } from "discord.js"
import log4js from "log4js"
import fetch from "node-fetch"
import emoji from "../../data/emoji.json"
import client from "../../main"
import Command from "../../utils/Command"
import { CommandResponse, CommandSource, MapInfo, SendMessage } from "../../utils/Types"
import { sendMessage, updateMessage } from "../../utils/Utils"


const Logger = log4js.getLogger("map")
const cachedMaps: {[key: string]: MessageAttachment} = {}

export default class Map extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Information",
            help: "Renders a map, with ranges.",
            usage: "map <world-map>",
            aliases: ["rangemap", "lbasmap", "ranges"],
            options: [{
                name: "mapid",
                description: "ID of map",
                type:"STRING",
                required: true,
            }]
        })
    }
    async runInteraction(source: CommandInteraction): Promise<SendMessage | undefined> {
        return await this.run(source, source.options.getString("mapid", true))
    }

    async runMessage(source: Message, args: string[]): Promise<SendMessage | undefined> {
        if (!args || args.length < 1) return sendMessage(source, "Must provide a map.")

        return await this.run(source, args[0])
    }

    async run(source: CommandSource, map: string): Promise<CommandResponse> {
        const { data } = client

        if (map.startsWith("E-")) map = map.replace("E", data.eventID().toString())
        if (map.startsWith("E")) map = map.replace("E", data.eventID() + "-")
        if (map.split("-").length != 2) return sendMessage(source, "Invalid map!")

        if (map.split("-").filter(a => isNaN(parseInt(a))).length > 0) return sendMessage(source, "Invalid map.")

        if (cachedMaps[map] !== undefined) return sendMessage(source, `Map ${map}`, { files: [cachedMaps[map]] })

        const mapInfo = await data.getMapInfo(map)
        if (Object.keys(mapInfo.route).length == 0) return sendMessage(source, "Invalid/unknown map!")
        const reply = await sendMessage(source, `${emoji.loading} Loading...`)

        if (reply)
            this.genMap(map, mapInfo)
                .then(async attachment => updateMessage(reply, { content: `Map ${map}`, files: [attachment] }))
                .catch(e => Logger.error(e))
        return reply
    }

    async genMap(map: string, apiParsed: MapInfo): Promise<MessageAttachment> {
        const img = new Image
        img.src = `http://kc.piro.moe/api/assets/images/backgrounds/${map}`
        await new Promise((resolve) => {
            img.onload = (): void => resolve(null)
        })

        const lbas = await (await fetch(`http://kc.piro.moe/api/routing/lbasdistance/${map}`)).json()

        const canvas = createCanvas(1200, 720)
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0)

        for (const edge in apiParsed.route) {
            const route = apiParsed.route[edge]
            if (route[0] == undefined || route[1] == undefined) continue
            const from = apiParsed.spots[route[0]], to = apiParsed.spots[route[1]]
            if (from == undefined || to == undefined) continue
            const [xFrom, yFrom] = from, [xTo, yTo] = to
            ctx.beginPath()
            ctx.strokeStyle = "rgba(0, 0, 0, 1)"
            ctx.moveTo(xFrom, yFrom)
            ctx.lineTo(xTo, yTo)
            ctx.lineWidth = 15
            ctx.stroke()
        }

        ctx.fillStyle = "rgba(128, 255, 0, 1)"
        ctx.font = "30px Georgia"
        ctx.textAlign = "center"
        for (const node in apiParsed.spots) {
            const [x, y] = apiParsed.spots[node]
            ctx.fillStyle = "rgba(128, 255, 0, .7)"
            ctx.beginPath()
            ctx.arc(x, y, 5, 0, 2 * Math.PI, false)
            ctx.fill()
            ctx.fillStyle = "rgba(128, 255, 0, 1)"
            ctx.strokeStyle = "rgba(0, 0, 0, 1)"
            ctx.miterLimit = 2
            ctx.lineJoin = "round"
            ctx.lineWidth = 7

            const text = lbas.result[node ?? "/"] ? `${node} (${(lbas.result[node] as {distance: number}[]).map(x => x.distance).join("/")})` : (node ?? "/")
            ctx.strokeText(text, x, y - 10)
            ctx.lineWidth = 1
            ctx.fillText(text, x, y - 10)
        }
        const attachment = new MessageAttachment(canvas.toBuffer(), `${map}.png`)
        cachedMaps[map] = attachment
        return attachment
    }
}
