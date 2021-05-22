import fetch from "node-fetch"
import { Guild, Message, TextChannel, StringResolvable, MessageEmbed, MessageAttachment } from "discord.js"
import log4js from "log4js"
import client from "./../main"
import { Rank, Cached, DBType, Cache, DropData, NameTable, padding, DamageType, Damages, Stages, Ship, ShipExtended } from "./Types"
import emoji from "../data/emoji.json"

const Logger = log4js.getLogger("Utils")

export const PAD_START = 0
export const PAD_END = 1


export function getWiki(page: string, guild?: Guild|null): string {
    if (guild && guild.id == "165107190980542464")
        return `https://en.kancollewiki.net/${page.replace(/ /g, "_")}`

    return `https://kancolle.fandom.com/wiki/${page.replace(/ /g, "_")}`
}

export function createTable(names: NameTable | undefined, rows: StringResolvable[], pads: padding[] = [PAD_END]): string {
    const maxColumns = Math.max(...rows.map(row => row.length))
    let title = "", currentInd = 0

    for (let i = 0; i < maxColumns; i++) {
        if (names && names[i])
            title = title.padEnd(currentInd) + names[i]

        const maxLength = Math.max(...rows.map(row => row.length > i ? (row[i]?.toString() ?? "").length : 0), (names && names[i + 1]) ? (title.length - currentInd) : 0)
        currentInd += 1 + maxLength

        rows.forEach(row => {
            if (row.length <= i) return

            const padEnd = pads.length > i ? pads[i] : pads[pads.length - 1]
            row[i] = padEnd ? row[i].toString().padEnd(maxLength) : row[i].toString().padStart(maxLength)
        })
    }

    const table = rows.map(row => row.join(" ").replace(/\s+$/, ""))
    if (names)
        return [title, ...table].join("\n")
    else
        return table.join("\n")
}

export function handleShip(ship: ShipExtended): ShipExtended {
    const { data } = client

    ship.hp_married = Math.min(ship.hp_max, ship.hp + [4, 4, 4, 5, 6, 7, 7, 8, 8, 9][Math.floor(ship.hp/10)])
    ship.ship_type = `${data.misc.ShipTypes[ship.type]} (${data.misc.ShipCodes[ship.type]})`

    for (const key of ["asw", "evasion", "los"]) {
        if (ship[key] != undefined && ship[`${key}_max`] != undefined)
            ship[`${key}_ring`] = ship[key] + Math.floor((ship[`${key}_max`] - ship[key]) / 99 * data.getMaxLevel())
        else
            ship[`${key}_ring`] = "??"
        if (ship[key] == undefined) ship[key] = "??"
        if (ship[`${key}_max`] == undefined) ship[`${key}_max`] = "??"
    }

    for (const key of ["firepower", "torpedo", "aa", "armor", "luck", "asw", "evasion", "los"]) {
        if (ship[key] === false) ship[key] = 0
        if (ship[`${key}_max`] === false) ship[`${key}_max`] = 0
    }

    ship.speed_name = data.misc.SpeedNames[ship.speed]
    ship.range_name = data.misc.RangeNames[ship.range]
    ship.rarity_name = data.misc.RarityNames[ship.rarity]

    ship.mods = [ship.firepower_mod || 0, ship.torpedo_mod || 0, ship.aa_mod || 0, ship.armor_mod || 0].join("/")
    ship.scraps = [ship.scrap_fuel || 0, ship.scrap_ammo || 0, ship.scrap_steel || 0, ship.scrap_bauxite || 0].join("/")

    if (ship.equipment) {
        ship.aircraft = ship.equipment.map(equip => equip.size).reduce((a, b) => a + b, 0)
        ship.equipment_text = ship.equipment.map(equip => `• ${ship.aircraft > 0 ? `${equip.size}${emoji.plane} `:""}${equip.equipment == undefined ? "??" : equip.equipment ? equip.equipment : "None"}${(equip.stars && equip.stars > 0) ? ` ${emoji.star}+${equip.stars}`:""}`).join("\n")
    }

    if (ship.remodel_level) {
        ship.remodel_text = "Remodel requires: "
        const requirements = [`Lv.${ship.remodel_level}.`]
        const k = (remodel: number|true): number => remodel == true ? 1 : remodel

        if (ship.remodel_ammo) requirements.push(`${ship.remodel_ammo}×${emoji.ammo}`)
        if (ship.remodel_steel) requirements.push(`${ship.remodel_steel}×${emoji.steel}`)
        if (ship.remodel_development_material) requirements.push(`${k(ship.remodel_development_material)}×${emoji.devmat}`)
        if (ship.remodel_construction_material) requirements.push(`${k(ship.remodel_construction_material)}×${emoji.flamethrower}`)
        if (ship.remodel_blueprint) requirements.push(`${k(ship.remodel_blueprint)}×${emoji.blueprint}`)
        if (ship.remodel_report) requirements.push(`${k(ship.remodel_report)}×${emoji.action_report}`)
        if (ship.remodel_catapult) requirements.push(`${k(ship.remodel_catapult)}×${emoji.catapult}`)
        if (ship.remodel_gunmat) requirements.push(`${k(ship.remodel_gunmat)}×${emoji.gun_mat}`)
        if (ship.remodel_airmat) requirements.push(`${k(ship.remodel_airmat)}×${emoji.air_mat}`)

        ship.remodel_text += requirements.join(", ")
    } else
        ship.remodel_text = "Lv.1"

    ship.class_description = `${ship.class}${ship.class_number === false ? "" : ` Class #${ship.class_number}`}`
    return ship
}

export function displayShip(ship: ShipExtended, guild?: Guild | null): MessageEmbed {
    const embed = new MessageEmbed()
        .setTitle([`No. ${ship.id} (api id: ${ship.api_id})`, ship.full_name, ship.japanese_name, /* ship.reading,*/ ship.rarity_name].filter(a => a).join(" | "))

    if (typeof ship.api_id == "number")
        embed.setURL(getWiki(ship.name, guild))
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

    if (ship.equipment)
        embed.addField("Equipment", ship.equipment_text ? ship.equipment_text : "No equipment slots")

    if (ship.remodel_text)
        embed.addField("Remodel", ship.remodel_text)

    return embed
}

export function aswAtLevel(ship: Ship, level: number): number {
    if (ship.asw_max == false) return 0
    return Math.floor(ship.asw + ((ship.asw_max - ship.asw) * level / 99))
}

export function evasionAtLevel(ship: Ship, level: number): number {
    if (ship.evasion_max == false) return 0
    return Math.floor(ship.evasion + ((ship.evasion_max - ship.evasion) * level / 99))
}

export function losAtLevel(ship: Ship, level: number): number {
    if (ship.los_max == false) return 0
    return Math.floor(ship.los + ((ship.los_max - ship.los) * level / 99))
}

const compare = {
    min: (a: number, b: number): number => {
        if (isNaN(a)) return b
        if (isNaN(b)) return a
        if (a == 0 || b == 0)
            return 0
        return Math.min(a || b, b || a)
    },
    max: (a: number, b: number): number => {
        if (isNaN(a)) return b
        if (isNaN(b)) return a
        return Math.max(a || b, b || a)
    }
}


const calculateDamagesDone = (atk: number, currenthp: number, armor: number, maxhp: number, overkillprot = currenthp > 0.25 * maxhp && maxhp < 200): DamageType => {
    const dmgtype: DamageType = {
        "scratch": 0,
        "normal": 0,
        "overkill": 0,
        "damages": []
    }
    const damages: Damages = {}
    for (let arm = 0; arm < armor; arm++) {
        const dmg = Math.floor((atk - (0.7 * armor + arm * 0.6)))

        if (dmg >= currenthp && overkillprot) { // Overkill protection
            const possibledmg = []
            for (let hpRoll = 0; hpRoll < currenthp; hpRoll++)
                possibledmg.push(Math.floor(0.5 * currenthp + 0.3 * hpRoll))
            for (const posdmg of possibledmg)
                damages[posdmg] = (damages[posdmg] ?? 0) + (1.0 / possibledmg.length)
            dmgtype.overkill = (dmgtype.overkill ?? 0) + 1.0
        } else if (dmg < 1) { // Scratch
            const possibledmg = []
            for (let hpRoll = 0; hpRoll < currenthp; hpRoll++)
                possibledmg.push(Math.floor(0.06 * currenthp + 0.08 * hpRoll))
            for (const posdmg of possibledmg)
                damages[posdmg] = (damages[posdmg] ?? 0) + (1.0 / possibledmg.length)
            dmgtype.scratch = (dmgtype.scratch ?? 0) + 1.0
        } else {
            damages[dmg] = (damages[dmg] ?? 0) + 1.0
            dmgtype.normal = (dmgtype.normal ?? 0) + 1.0
        }
    }
    dmgtype.damages = damages
    return dmgtype
}

export function calculatePostCap(atk: number, currenthp: number, maxhp: number, armor: number, calculatedDamage = calculateDamagesDone(atk, currenthp, armor, maxhp)): Stages {
    let sum = 0
    const dmgsDealth: Damages = calculatedDamage.damages
    for (const posdmg in dmgsDealth)
        sum += dmgsDealth[posdmg]

    const stages: Stages = {
        "sunk": 0,
        "taiha": 0,
        "chuuha": 0,
        "shouha": 0,
        "ok": 0,
        "overkill": 0,
        "normal": 0,
        "scratch": 0,
        "hps": [],
        "minhp": 9999,
        "maxhp": 0,
        "mindmg": 9999,
        "maxdmg": 0
    }

    for (const posdmg in dmgsDealth) {
        const ch = dmgsDealth[posdmg], afterhp = currenthp - (+posdmg)
        if (ch == 0) continue
        stages.hps[afterhp] = ch / sum
        if (afterhp <= 0)
            stages.sunk += ch / sum
        else if (afterhp <= .25 * maxhp)
            stages.taiha += ch / sum
        else if (afterhp <= .50 * maxhp)
            stages.chuuha += ch / sum
        else if (afterhp <= .75 * maxhp)
            stages.shouha += ch / sum
        else
            stages.ok += ch / sum

        stages.minhp = compare.min(stages.minhp, afterhp < 0 ? 0 : afterhp)
        stages.mindmg = compare.min(stages.mindmg, +posdmg)
        stages.maxhp = compare.max(stages.maxhp, afterhp < 0 ? 0 : afterhp)
        stages.maxdmg = compare.max(stages.maxdmg, +posdmg)
    }
    stages.overkill += calculatedDamage.overkill / sum
    stages.normal += calculatedDamage.normal / sum
    stages.scratch += calculatedDamage.scratch / sum
    return stages
}

const shipDropCache: Cached = {}
function getDisplayDropString(cached: Cache, message: Message | Message[] | undefined, db: DBType, notice = true, single = true): string {
    if (cached.error) return "An error has occured while fetching data. Try again later, if it still fails, try to contact me (see `.credits`)."
    let drops = Object.values(cached.dropData).sort((a, b) => b.totalDrops - a.totalDrops)
    if (drops.length == 0)
        return `No ${cached.rank} rank **${cached.ship.full_name}** drops found`

    if (message && !(message instanceof Message)) message = message[0]

    const totalCount = drops.length
    drops = (message && message.channel.type == "dm" && single) ? drops.slice(0, 35) : drops.slice(0, 10)

    let dropTable = createTable(
        { 0: "Map", 4: "Rate" },
        drops.map(drop => [drop.map + drop.node, "|", ["/", "C", "E", "M", "H"][drop.difficulty], "|", `${drop.rateTotal} ${drop.samplesTotal}`]),
        [PAD_END, PAD_END, PAD_END, PAD_END, PAD_END]
    )

    if (db == "tsundb")
        if (!(drops.map(drop => drop.samples0).filter(k => k != "[0/0]").length == 0 && drops.map(drop => drop.samples1).filter(k => k != "[0/0]").length == 0)) {
            drops = drops.slice(0, 20)
            dropTable = createTable(
                {
                    0: "Map",
                    4: "Rate first",
                    6: " ",
                    7: "Rate first dupe",
                    9: " ",
                    10: "Rate >1 dupe"
                }, drops.map(drop => [
                    drop.map + drop.node, "|",
                    ["/", "C", "E", "M", "H"][drop.difficulty], "|",
                    drop.rate0, drop.samples0, "|",
                    drop.rate1, drop.samples1, "|",
                    drop.rateRem, drop.samplesRem
                ]),
                [PAD_END, PAD_END, PAD_END, PAD_END, PAD_START, PAD_END, PAD_END, PAD_START, PAD_END, PAD_END, PAD_START, PAD_END]
            )
        }

    let dropString = `Found following drops for **${cached.ship.full_name}** (${cached.rank} rank): \`\`\`
${dropTable}\`\`\``

    // Add small drop size notice
    if (notice) {
        dropString += `*Please note that some smaller sample size results may be inaccurate.*
`
    }

    // Add rows shown notice
    if (drops.length < totalCount) {
        if (message && message.channel.type == "dm" && single) {
            dropString += `Shown top ${drops.length}/${totalCount} rows. `
        } else {
            dropString += `Shown top ${drops.length}/${totalCount} rows. Redo a .drop command in DM for more. `
        }
    }

    // Add data notice
    if (notice) {
        dropString += `Data from ${db == "tsundb" ? `TsunDB on ${new Date(cached.time).toLocaleString("en-UK", {
            timeZone: "GMT",
            timeZoneName: "short",
            hour12: false,
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })}` : `poi-statistics on ${cached.generateTime}`}`
    }
    return dropString
}

function getDisplayDataString(cached: Cache, message: Message | Message[], db: DBType, notice = false, oldCache?: Cache): string {
    if (cached == undefined || cached.dropData == undefined || cached.loading) {
        if (!(oldCache == undefined || oldCache.dropData == undefined || oldCache.loading)) {
            return `${emoji.loading} Updating ${cached.ship.full_name} drop data... Old data:

${getDisplayDropString(oldCache, message, db)}`
        }

        return `${emoji.loading} Loading ${cached.ship.full_name} drop data...`
    }

    return getDisplayDropString(cached, message, db, notice)
}

const displayData = async (cached: Cache, reply: Message | Message[], db: DBType): Promise<void> => {
    try {
        if (!(reply instanceof Message)) reply = reply[0]

        await reply.edit(getDisplayDataString(cached, reply, db, true))
    } catch (error) {
        Logger.error(error)
    }
}

const getDropBaseLink = (ship: Ship, rank: string, db: DBType): string => {
    switch (db) {
        case "tsundb":
            return `http://kc.piro.moe/api/routing/quickdrops?shipId=${ship.api_id}&ranks=${rank}&includeOldEvents=false`

        case "poi":
            return `https://db.kcwiki.org/drop/ship/${ship.api_id}/${rank}.json`
    }
}

export function percentage(count: number, total: number): string {
    if (total === 0) return "?.???%"
    return (count / total * 100).toFixed(3) + "%"
}

const queue = async (ship: Ship, rank: Rank, cached: Cache, db: DBType = "tsundb"): Promise<{ [key: string]: DropData }> => {
    const api = await (await fetch(getDropBaseLink(ship, rank, db))).json()
    if (api.error) {
        Logger.error(`An error has occured while fetching drop ${ship.api_id}/${rank} @ ${db}: ${api.error}`)
        delete cached.loading
        cached.error = true
        Promise.all(cached.callback?.map(async k => k()) ?? []).catch(Logger.error)
        delete cached.callback
        return {}
    }

    if (db == "tsundb") {
        for (const entry of api.result) {
            // eslint-disable-next-line prefer-const
            let { map, node, difficulty } = entry

            if (parseInt(map.split("-")[0]) > 20) {
                // Ignore old event IDs
                if (map.split("-")[0] != client.data.eventID()) continue
                map = "E-" + map.split("-")[1]
            }
            difficulty = difficulty ?? 0

            const drops_zero = entry.drops_zero ?? 0, runs_zero = entry.runs_zero ?? 0
            const drops_one = entry.drops_one ?? 0, runs_one = entry.runs_one ?? 0
            const drops = entry.drops ?? 0, runs = entry.runs ?? 0
            const remaining = drops - drops_one - drops_zero, remainingRuns = runs - runs_one - runs_zero

            const dropData: DropData = {
                map,
                difficulty,
                node,
                rank,
                "rate0": percentage(drops_zero, runs_zero),
                "samples0": `[${drops_zero}/${runs_zero}]`,
                "rate1": percentage(drops_one, runs_one),
                "samples1": `[${drops_one}/${runs_one}]`,
                "rateTotal": percentage(drops, runs),
                "samplesTotal": `[${drops}/${runs}]`,
                "rateRem": percentage(remaining, remainingRuns),
                "samplesRem": `[${remaining}/${remainingRuns}]`,
                "totalDrops": entry.drops ?? 0
            }
            cached.dropData[entry.map + node + difficulty] = dropData
        }
    } else if (db == "poi") {
        for (const location in api.data) {
            const entry = api.data[location]

            // eslint-disable-next-line prefer-const
            let [world, map, node, difficulty] = location.split("-")

            node = node.replace("(Boss)", "").trim()
            if (parseInt(world) > 20)
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
    Promise.all(cached.callback?.map(async k => k()) ?? []).catch(Logger.error)
    delete cached.callback

    return cached.dropData
}

export async function dropTable(message: Message, args: string[], db: DBType = "tsundb"): Promise<Message | Message[]> {
    if (!args || args.length < 1) return message.reply("Must provide a ship.")

    let rank: Rank = "S"
    if (args[args.length - 1].toUpperCase() == "A") {
        args.pop()
        rank = "A"
    } else if (args[args.length - 1].toUpperCase() == "S") {
        args.pop()
        rank = "S"
    }

    const shipName = args.join(" ")
    let ship = client.data.getShipByName(shipName)

    if (ship == undefined) return message.reply("Unknown ship")

    if (ship.remodel_from && typeof ship.remodel_from == "string")
        ship = client.data.getShipByName(ship.remodel_from.replace("/", "")) ?? ship
    ship = client.data.getShipByName(ship.name)

    // Check if cached, if so show cached reply.
    const cached = shipDropCache[db + ship.api_id + rank]
    if (cached && cached.time + 1 * 60 * 60 * 1000 > new Date().getTime()) {
        const reply = await message.channel.send(getDisplayDataString(cached, message, db, true))
        if (cached.callback)
            cached.callback.push(async () => displayData(cached, reply, db))
        return reply
    }

    const startTime = new Date()
    const dropData = {}

    // Not cached, add it
    const newcached: Cache = shipDropCache[db + ship.api_id + rank] = {
        time: startTime.getTime(),
        dropData,
        ship,
        rank,
        loading: true,
        callback: []
    }
    const reply = await message.channel.send(getDisplayDataString(newcached, message, db, true, cached))
    newcached.callback?.push(async () => displayData(newcached, await reply, db))
    queue(ship, rank, newcached, db).catch(Logger.error)
    return reply
}

export async function specialDrops(message: Message, ships: string[], db: DBType = "tsundb"): Promise<Message | Message[]> {
    let reply = undefined
    const caches: Cache[] = []
    for (const name of ships) {
        const ship = client.data.getShipByName(name)

        for (const rank of (["S", "A"] as Rank[])) {

            // Check if cached, if so show cached reply.
            const cached = shipDropCache[db + ship.api_id + rank]
            if (cached && cached.time + 2 * 60 * 60 * 1000 > new Date().getTime()) {
                caches.push(cached)
                if (cached.callback) {
                    if (!reply) reply = await message.channel.send(`${emoji.loading} Loading...`)
                    await new Promise<void>((resolve) => cached.callback?.push(async () => await resolve()))
                }
                continue
            }

            const startTime = new Date()
            const dropData = {}

            // Not cached, add it
            const newcached: Cache = shipDropCache[db + ship.api_id + rank] = {
                time: startTime.getTime(),
                dropData,
                ship,
                rank,
                loading: true,
                callback: []
            }
            Logger.info(`Caching ${rank} drops for ${ship.full_name}...`)
            if (!reply) reply = await message.channel.send(`${emoji.loading} Loading...`)
            await queue(ship, rank, newcached, db)
            caches.push(newcached)
        }
    }

    const out = `${caches.filter(f => !(f.rank == "A" && Object.values(f.dropData).length == 0)).map((cached) => getDisplayDropString(cached, message, db, false, false).trim().replace(/\n+$/, "")).join("\r\n")}
*Please note that some smaller sample size results may be inaccurate.*
See \`.drop <ship>\` for more information.`

    if (out.length > 1900) {
        if (message.channel.type !== "dm" && reply)
            await reply.edit("This list is too long and thus can only be used in DMs.")
        else if (reply)
            await reply.delete()
        else
            reply = []

        await message.author.send(out, { split: {
            maxLength: 1900,
            char: "\r"
        } })
    } else if (reply)
        await reply.edit(out)
    else
        reply = message.channel.send(out)

    return reply
}


export async function sendToChannels(channels: string[] | undefined, content?: StringResolvable, embed?: MessageEmbed | MessageAttachment): Promise<PromiseSettledResult<Message | Message[]>[]> {
    const messages = []
    if (!channels) return Promise.all([])

    for (const channel of channels) {
        try {
            const chanObj = await client.channels.fetch(channel)
            if (chanObj && chanObj instanceof TextChannel)
                if (embed == undefined)
                    messages.push(chanObj.send(content))
                else
                    messages.push(chanObj.send(content, embed))
        } catch (error) {
            Logger.error("An error occured while fetching channels for sentToChannels", error)
        }
    }

    return Promise.allSettled(messages)
}

export async function changeName(guilds: Guild[], check: (guild: Guild) => boolean, name: string): Promise<void> {
    for (let i = 0; i < guilds.length; i++) {
        const guild = guilds[i]

        if (!check(guild)) continue
        Logger.info(`Changing name in ${guild.name} to ${name}`)
        await guild.me?.setNickname(name)
        await new Promise(res => setTimeout(res, 30000))
    }
}

export function shiftDate(date: Date, time: number): Date {
    date.setUTCDate(date.getUTCDate() + time)
    return date
}
export function shiftMonth(date: Date, time: number): Date {
    date.setUTCMonth(date.getUTCMonth() + time)
    return date
}
export function shiftHour(date: Date, time: number): Date {
    date.setUTCHours(date.getUTCHours() + time)
    return date
}
export function shiftMinute(date: Date, time: number): Date {
    date.setUTCMinutes(date.getUTCMinutes() + time)
    return date
}
