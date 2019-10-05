const { createCanvas } = require("canvas")
const { Attachment } = require("discord.js")
const cachedMaps = {}

exports.run = async (message, args) => {
    if(!global.config.admins.includes(message.author.id)) return
    if(!args || args.length < 1) return message.reply("Must provide a map.")

    const map = args[0]
    if(!map.includes("-") || map.split("-").length !== 2 || map.split("-").filter(a => isNaN(parseInt(a))).length > 0) return message.reply("Invalid map.")

    if(cachedMaps[map] !== undefined) return message.channel.send(cachedMaps[map])
    const [worldid, mapid] = map.split("-").map(a => parseInt(a))
    if(worldid < 0 || (worldid > 10 && worldid < 40) || worldid > 60 || mapid >= 10 || mapid < 0) return

    const attachment = await this.genMap(map)
    return message.channel.send(attachment)
}

exports.genMap = async (map) => {
    const apiParsed = await global.data.getMapInfo(map)

    const canvas = createCanvas(1200, 720)
    const ctx = canvas.getContext("2d")

    ctx.fillStyle = "rgba(255, 255, 255, .5)"
    ctx.fillRect(0, 0, 1200, 720)

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
        ctx.strokeText(node || "/", x, y - 10)
        ctx.lineWidth = 1
        ctx.fillText(node || "/", x, y - 10)
    }
    const attachment = new Attachment(canvas.toBuffer(), `${map}.png`)
    cachedMaps[map] = attachment
    return attachment
}

exports.category = "hidden"
exports.help = "Renders a map. WIP"
exports.usage = "map <world-map>"
exports.prefix = global.config.prefix
