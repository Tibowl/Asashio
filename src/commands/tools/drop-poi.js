const fetch = require("node-fetch")
const shipDropCache = {}

exports.run = async (client, message, args) => {
    if(!args || args.length < 1) return message.reply("Must provide a ship.")

    let rank = "S"
    if(args[args.length - 1].toUpperCase() == "A") {
        args.pop()
        rank = "A"
    } else if(args[args.length - 1].toUpperCase() == "S") {
        args.pop()
        rank = "S"
    }

    const shipName = args.join(" ")
    let ship = client.data.getShipByName(shipName)

    if(ship == undefined) return message.reply("Unknown ship")

    if(ship.remodel_from)
        ship = client.data.getShipByName(ship.remodel_from.replace("/", "")) || ship
    ship = client.data.getShipByName(ship.name)

    // Check if cached, if so show cached reply.
    const cached = shipDropCache[ship.api_id + rank]
    if(cached && cached.time + 6 * 60 * 60 * 1000 > new Date().getTime()) {
        const reply = await message.channel.send(this.getDisplayDataString(cached, message))
        if(cached.callback)
            cached.callback.push(() => this.displayData(cached, reply))
        return reply
    }

    const startTime = new Date()
    const dropData = {}

    // Not cached, add it
    const newcached = shipDropCache[ship.api_id + rank] = {
        "time": startTime.getTime(),
        dropData,
        ship,
        rank,
        "loading": true
    }
    const reply = await message.channel.send(this.getDisplayDataString({ship}, message))
    newcached.callback = [() => this.displayData(newcached, reply)]

    this.queue(ship, rank, newcached)

    return reply
}
exports.queue = async (ship, rank, cached) => {
    // TODO catch errors
    const api = await (await fetch(`https://db.kcwiki.org/drop/ship/${ship.api_id}/${rank}.json`)).json()

    for(let location in api.data) {
        const entry = api.data[location]

        let [world, map, node, difficulty] = location.split("-")

        node = node.replace("(Boss)", "").trim()
        if(parseInt(world) > 20)
            map = `E-${map}`

        cached.dropData[entry.map + node + difficulty] = {
            map,
            difficulty,
            node,
            rank,
            "rateTotal": `${parseFloat(entry.rate).toFixed(3)}%`,
            "samplesTotal": `[${entry.totalCount} dropped]`,
            "totalDrops": entry.totalCount
        }
    }
    delete cached.loading
    cached.generateTime = api.generateTime
    cached.callback.forEach(k => k())
    delete cached.callback
}
exports.displayData = (cached, reply) => {
    try {
        reply.edit(this.getDisplayDataString(cached, reply))
    } catch (error) {
        console.error(error)
    }
}
exports.getDisplayDataString = (cached, message) => {
    if(cached == undefined || cached.dropData == undefined || cached.loading)
        return `Loading ${cached.ship.full_name} drop data...`

    let drops = Object.values(cached.dropData).sort((a,b) => b.totalDrops - a.totalDrops)
    if(drops.length == 0)
        return `No ${cached.ship.full_name} drops found`

    const totalCount = drops.length
    drops = message.channel.type == "dm" ? drops.slice(0, 35) : drops.slice(0, 10)


    const rateTotalLen = Math.max(...drops.map(drop => drop.rateTotal.length))
    const longestMap = Math.max(...drops.map(drop => (drop.map+drop.node).length))

    let dropTable = `${"Map".padEnd(longestMap + 7)}Rate
${drops.map(drop => `${(drop.map+drop.node).padEnd(longestMap)} | ${[" ", "C", "E", "M", "H"][["", "丁", "丙", "乙", "甲"].indexOf(drop.difficulty)]} | ${drop.rateTotal.padStart(rateTotalLen)} ${drop.samplesTotal}`).join("\n")}`

    return `Found following drops for ${cached.ship.full_name} (${cached.rank} rank): \`\`\`
${dropTable}
\`\`\`*Please note that some smaller sample size results may be inaccurate.* 
${drops.length < totalCount ? (message.channel.type == "dm" ? `Shown top ${drops.length}/${totalCount} rows. `:`Shown top ${drops.length}/${totalCount} rows. Redo command in DM for more. `) : ""}Data from poi-statistics on ${cached.generateTime}`
}

exports.category = "Tools"
exports.help = () => {
    return "Gets drop list of a ship. Data from poi-statistics, bot will cache results up to 6 hours."
}
exports.usage = () => {
    return "drop-poi <ship>"
}
exports.prefix = (client) => {
    return client.config.prefix
}
