const { createCanvas, Image } = require("canvas")
const { Attachment } = require("discord.js")
const fetch = require("node-fetch")
const cachedMaps = {}

exports.run = async (message, args) => {
    if(!args || args.length < 1) return message.reply("Must provide a map.")

    let map = args[0]
    if(map.startsWith("E-")) map = map.replace("E", global.data.eventID())
    if(map.startsWith("E")) map = map.replace("E", global.data.eventID() + "-")
    if(map.split("-").length != 2) return message.reply("Invalid map!")

    if(map.split("-").filter(a => isNaN(parseInt(a))).length > 0) return message.reply("Invalid map.")


    if(cachedMaps[map] !== undefined) return message.channel.send(cachedMaps[map])

    const mapInfo = await global.data.getMapInfo(map)
    if(Object.keys(mapInfo.route).length == 0) return message.reply("Invalid/unknown map!")

    const attachment = await this.genMap(map, mapInfo)
    return message.channel.send(attachment)
}

exports.genMap = async (map, apiParsed) => {
    const img = new Image
    img.src = `http://kc.piro.moe/api/assets/images/backgrounds/${map}`
    await new Promise((resolve) => img.onload = resolve)

    const lbas = await (await fetch(`http://kc.piro.moe/api/routing/lbasdistance/${map}`)).json()

    const canvas = createCanvas(1200, 720)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(img, 0, 0)

    for(let edge in apiParsed.route) {
        const route = apiParsed.route[edge]
        const from = apiParsed.spots[route[0]], to = apiParsed.spots[route[1]]
        if(from == undefined || to == undefined) continue
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
    for(let node in apiParsed.spots) {
        const [x, y] = apiParsed.spots[node]
        ctx.fillStyle = "rgba(128, 255, 0, .7)"
        ctx.beginPath()
        ctx.arc(x, y, 5, 0, 2 * Math.PI, false)
        ctx.fill()
        ctx.fillStyle = "rgba(128, 255, 0, 1)"
        ctx.strokeStyle = "rgba(0, 0, 0, 1)"
        ctx.miterLimit = 2
        ctx.lineJoin = "circle"
        ctx.lineWidth = 7

        const text = lbas.result[node || "/"] ? `${node} (${lbas.result[node]})` : (node || "/")
        ctx.strokeText(text, x, y - 10)
        ctx.lineWidth = 1
        ctx.fillText(text, x, y - 10)
    }
    const attachment = new Attachment(canvas.toBuffer(), `${map}.png`)
    cachedMaps[map] = attachment
    return attachment
}

exports.category = "Information"
exports.help = "Renders a map, with ranges."
exports.usage = "map <world-map>"
exports.prefix = global.config.prefix
exports.aliases = ["rangemap", "lbasmap", "ranges"]
