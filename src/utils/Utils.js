const fetch = require("node-fetch")
const Discord = require("discord.js")
const Logger = require("log4js").getLogger("Utils")

exports.displayShip = (ship) => {
    const embed = new Discord.RichEmbed()
        .setTitle([`No. ${ship.id} (api id: ${ship.api_id})`,ship.full_name, ship.japanese_name, /*ship.reading,*/ ship.rarity_name].filter(a => a).join(" | "))

    if(typeof ship.api_id == "number")
        embed.setURL(`https://kancolle.fandom.com/wiki/${ship.name.replace(/ /g, "_")}`)
            .setThumbnail(`https://raw.githubusercontent.com/KC3Kai/KC3Kai/develop/src/assets/img/ships/${ship.api_id}.png`)
    // TODO rarity color? .setColor("#")

    embed.setDescription(`${ship.class_description} | ${ship.ship_type}`)

    embed.addField("Stats", `\`\`\`asciidoc
HP        :: ${ship.hp} [${ship.hp_married}] (cap ${ship.hp_max})
Firepower :: ${ship.firepower} (${ship.firepower_max})
Torpedo   :: ${ship.torpedo} (${ship.torpedo_max})
AA        :: ${ship.aa} (${ship.aa_max})
Armor     :: ${ship.armor} (${ship.armor_max})
Luck      :: ${ship.luck} (${ship.luck_max})
ASW       :: ${ship.asw} (${ship.asw_max}) [${ship.asw_ring}]
Evasion   :: ${ship.evasion} (${ship.evasion_max}) [${ship.evasion_ring}]
LOS       :: ${ship.los} (${ship.los_max}) [${ship.los_ring}]
Speed     :: ${ship.speed_name}
Range     :: ${ship.range_name}
Fuel      :: ${ship.fuel}
Ammo      :: ${ship.ammo}
Mod       :: ${ship.mods}
Scrap     :: ${ship.scraps}
\`\`\``)

    if(ship.equipment)
        embed.addField("Equipment", ship.equipment_text ? ship.equipment_text : "No equipment slots")

    if(ship.remodel_text)
        embed.addField("Remodel", ship.remodel_text)

    return embed
}

exports.calculatePostCap = (atk, currenthp, maxhp, armor, calculatedDamage = calculateDamagesDone(atk, currenthp, armor, maxhp)) => {
    let sum = 0
    let dmgsDealth = calculatedDamage.damages
    for(let posdmg in dmgsDealth)
        sum += dmgsDealth[posdmg]
    let stages = {
        "sunk" : 0,
        "taiha" : 0,
        "chuuha" : 0,
        "shouha" : 0,
        "ok" : 0,
        "overkill" : 0,
        "normal" : 0,
        "scratch" : 0,
        "hps" : []
    }
    for(let posdmg in dmgsDealth) {
        let ch = dmgsDealth[posdmg], afterhp = currenthp - posdmg
        if(ch == 0) continue
        stages.hps[afterhp] = ch/sum
        if(afterhp <= 0)
            stages.sunk += ch/sum
        else if(afterhp <= .25 * maxhp)
            stages.taiha += ch/sum
        else if(afterhp <= .50 * maxhp)
            stages.chuuha += ch/sum
        else if(afterhp <= .75 * maxhp)
            stages.shouha += ch/sum
        else
            stages.ok += ch/sum

        stages.minhp = compare.min(stages.minhp, afterhp < 0 ? 0 : afterhp)
        stages.mindmg = compare.min(stages.mindmg, posdmg)
        stages.maxhp = compare.max(stages.maxhp, afterhp < 0 ? 0 : afterhp)
        stages.maxdmg = compare.max(stages.maxdmg, posdmg)
    }
    stages.overkill += calculatedDamage.overkill / sum
    stages.normal += calculatedDamage.normal / sum
    stages.scratch += calculatedDamage.scratch / sum
    return stages
}
function calculateDamagesDone(atk, currenthp, armor, maxhp, overkillprot = currenthp > 0.25 * maxhp && maxhp < 200) {
    let dmgtype = {
        "scratch" : 0,
        "normal" : 0,
        "overkill" : 0
    }
    let damages = {}
    for(let arm = 0; arm < armor; arm++) {
        let dmg = Math.floor((atk - (0.7 * armor + arm * 0.6)))

        if(dmg >= currenthp && overkillprot) { // Overkill protection
            let possibledmg = []
            for(let hpRoll = 0; hpRoll < currenthp; hpRoll++)
                possibledmg.push(Math.floor(0.5 * currenthp + 0.3 * hpRoll))
            for(let posdmg of possibledmg)
                damages[posdmg] = (damages[posdmg] || 0) + (1.0 / possibledmg.length)
            dmgtype.overkill = (dmgtype.overkill || 0) + 1.0
        } else if(dmg < 1) { // Scratch
            let possibledmg = []
            for(let hpRoll = 0; hpRoll < currenthp; hpRoll++)
                possibledmg.push(Math.floor(0.06 * currenthp + 0.08 * hpRoll))
            for(let posdmg of possibledmg)
                damages[posdmg] = (damages[posdmg] || 0) + (1.0 / possibledmg.length)
            dmgtype.scratch = (dmgtype.scratch || 0) + 1.0
        } else {
            damages[dmg] = (damages[dmg] || 0) + 1.0
            dmgtype.normal = (dmgtype.normal || 0) + 1.0
        }
    }
    dmgtype.damages = damages
    return dmgtype
}
const compare = {
    min: function(a, b) {
        if(isNaN(a)) return b
        if(isNaN(b)) return a
        if(a == 0 || b == 0)
            return 0
        return Math.min(a||b, b||a)
    },
    max: function(a, b) {
        if(isNaN(a)) return b
        if(isNaN(b)) return a
        return Math.max(a||b, b||a)
    }
}

const shipDropCache = {}
exports.dropTable = async (message, args, db = "tsundb") => {
    if(!args || args.length < 1) return message.reply("Must provide a ship.")
    const { data } = global

    let rank = "S"
    if(args[args.length - 1].toUpperCase() == "A") {
        args.pop()
        rank = "A"
    } else if(args[args.length - 1].toUpperCase() == "S") {
        args.pop()
        rank = "S"
    }

    const shipName = args.join(" ")
    let ship = data.getShipByName(shipName)

    if(ship == undefined) return message.reply("Unknown ship")

    if(ship.remodel_from)
        ship = data.getShipByName(ship.remodel_from.replace("/", "")) || ship
    ship = data.getShipByName(ship.name)

    // Check if cached, if so show cached reply.
    const cached = shipDropCache[db + ship.api_id + rank]
    if(cached && cached.time + 6 * 60 * 60 * 1000 > new Date().getTime()) {
        const reply = await message.channel.send(this.getDisplayDataString(cached, message, db))
        if(cached.callback)
            cached.callback.push(() => this.displayData(cached, reply, db))
        return reply
    }

    const startTime = new Date()
    const dropData = {}

    // Not cached, add it
    const newcached = shipDropCache[db + ship.api_id + rank] = {
        "time": startTime.getTime(),
        dropData,
        ship,
        rank,
        "loading": true
    }
    const reply = await message.channel.send(this.getDisplayDataString({ship}, message, db))
    newcached.callback = [() => this.displayData(newcached, reply, db)]

    this.queue(ship, rank, newcached, db)

    return reply
}
function getDropBaseLink(ship, rank, db) {
    switch (db) {
        case "tsundb":
            return `http://kc.piro.moe/api/routing/droplocations/${ship.api_id}/${rank}`

        case "poi":
        default:
            return `https://db.kcwiki.org/drop/ship/${ship.api_id}/${rank}.json`
    }
}
exports.queue = async (ship, rank, cached, db = "tsundb") => {
    const api = await (await fetch(getDropBaseLink(ship, rank, db))).json()

    if(db == "tsundb") {
        for(let entry of api.entries) {
            let {map, node, difficulty, count} = entry

            if(parseInt(map.split("-")[0]) > 20)
                map = "E-" + map.split("-")[1]

            cached.dropData[entry.map + node + difficulty] = {
                map,
                difficulty,
                node,
                rank,
                "rate0": this.percentage(entry.countZero, entry.totalZero),
                "samples0": `[${entry.countZero}/${entry.totalZero}]`,
                "rate1": this.percentage(entry.countOne, entry.totalOne),
                "samples1": `[${entry.countOne}/${entry.totalOne}]`,
                "rateTotal": this.percentage(entry.count, entry.total),
                "samplesTotal": `[${entry.count}/${entry.total}]`,
                "totalDrops": count
            }
        }
    } else if(db == "poi") {
        for(let location in api.data) {
            const entry = api.data[location]

            let [world, map, node, difficulty] = location.split("-")

            node = node.replace("(Boss)", "").trim()
            if(parseInt(world) > 20)
                map = `E-${map}`
            else
                map = `${world}-${map}`

            cached.dropData[entry.map + node + difficulty] = {
                map,
                difficulty: [" ", "丁", "丙", "乙", "甲"].indexOf(difficulty || " "),
                node,
                rank,
                "rateTotal": `${parseFloat(entry.rate).toFixed(3)}%`,
                "samplesTotal": `[${entry.totalCount} dropped]`,
                "totalDrops": entry.totalCount
            }
        }
    }
    delete cached.loading
    cached.generateTime = api.generateTime
    cached.callback.forEach(k => k())
    delete cached.callback
}
exports.percentage = (count, total) => {
    if(total == 0) return "?.???%"
    return (count / total * 100).toFixed(3) + "%"
}
exports.displayData = (cached, reply, db) => {
    try {
        reply.edit(this.getDisplayDataString(cached, reply, db))
    } catch (error) {
        Logger.error(error)
    }
}
exports.getDisplayDataString = (cached, message, db) => {
    if(cached == undefined || cached.dropData == undefined || cached.loading)
        return `Loading ${cached.ship.full_name} drop data...`

    let drops = Object.values(cached.dropData).sort((a,b) => b.totalDrops - a.totalDrops)
    if(drops.length == 0)
        return `No ${cached.ship.full_name} drops found`

    const totalCount = drops.length
    drops = message.channel.type == "dm" ? drops.slice(0, 35) : drops.slice(0, 10)


    let dropTable = this.createTable(
        { 0: "Map", 4: "Rate" },
        drops.map(drop => [drop.map+drop.node, "|", ["/", "C", "E", "M", "H"][drop.difficulty], "|", `${drop.rateTotal} ${drop.samplesTotal}`]),
        [PAD_END, PAD_END, PAD_END, PAD_END, PAD_END]
    )

    if(db == "tsundb")
        if(!(drops.map(drop => drop.samples0).filter(k => k != "[0/0]").length == 0 && drops.map(drop => drop.samples1).filter(k => k != "[0/0]").length == 0))
            dropTable = this.createTable(
                {
                    0: "Map",
                    4: "Rate first",
                    7: "Rate first dupe"
                }, drops.map(drop => [drop.map+drop.node, "|", ["/", "C", "E", "M", "H"][drop.difficulty], "|", drop.rate0, drop.samples0, "|", drop.rate1, drop.samples1]),
                [PAD_END, PAD_END, PAD_END, PAD_END, PAD_START, PAD_END, PAD_END, PAD_START, PAD_END]
            )

    return `Found following drops for ${cached.ship.full_name} (${cached.rank} rank): \`\`\`
${dropTable}
\`\`\`*Please note that some smaller sample size results may be inaccurate.* 
${drops.length < totalCount ? (message.channel.type == "dm" ? `Shown top ${drops.length}/${totalCount} rows. `:`Shown top ${drops.length}/${totalCount} rows. Redo command in DM for more. `) : ""}Data from ${db == "tsundb" ? `TsunDB on ${new Date(cached.time).toLocaleString("en-UK", {
    timeZone: "GMT",
    timeZoneName: "short",
    hour12: false,
    hourCycle: "h24",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
})}` : `poi-statistics on ${cached.generateTime}`}`
}

const PAD_END = 1
const PAD_START = 0
exports.PAD_END = PAD_END
exports.PAD_START = PAD_START

exports.createTable = (names, rows, pads = [PAD_END]) => {
    const maxColumns = Math.max(...rows.map(row => row.length))
    let title = "", currentInd = 0

    for (let i = 0; i < maxColumns; i++) {
        const maxLength = Math.max(...rows.map(row => row.length > i ? (row[i]||"").length : 0), (names && names[i]) ? names[i].length : 0)

        if(names && names[i])
            title = title.padEnd(currentInd) + names[i]
        currentInd += 1 + maxLength

        rows.forEach(row => {
            if (row.length <= i) return

            const padEnd = pads.length > i ? pads[i] : pads[pads.length - 1]
            row[i] = padEnd ? row[i].padEnd(maxLength) : row[i].padStart(maxLength)
        })
    }

    const table = rows.map(row => row.join(" ").replace(/\s+$/, ""))
    if(names)
        return [title, ...table].join("\n")
    else
        return table.join("\n")
}
exports.sendToChannels = (channels, ...args) => {
    const messages = []
    for(const channel of channels) {
        const chanObj = global.client.channels.get(channel)
        if(chanObj)
            messages.push(chanObj.send(...args))
    }

    return Promise.all(messages)
}
