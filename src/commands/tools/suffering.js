const { createCanvas } = require("canvas")
const { Attachment } = require("discord.js")
const Utils = require("../../utils/Utils.js")

exports.run = async (message, args) => {
    if(!args || args.length < 1) return message.channel.send("Overkill HP chart: https://i.imgur.com/hVwdRbo.png")
    const { data, config } = global

    let [hp, armor, attack] = args
    let maxhp = hp
    if(hp.includes("/"))
        [hp, maxhp] = hp.split("/")

    let ship = undefined
    if(isNaN(hp = parseInt(hp))) {
        if(!isNaN(args[args.length - 1]))
            attack = args.pop()

        ship = data.getShipByName(args.join(" "))
        hp = maxhp = ship.hp
        armor = ship.armor_max
    }

    if(isNaN(hp = parseInt(hp)) || hp <= 4 || (hp > 1000 || (hp > 200 && armor == undefined))) return message.reply("Invalid/unrealistic hp.")
    if(isNaN(maxhp = parseInt(maxhp)) || maxhp <= 4 || (maxhp > 1000 || (maxhp > 200 && armor == undefined)) || hp > maxhp) return message.reply("Invalid/unrealistic maximum hp.")

    // Create overkill bar
    if(armor == undefined) {
        const calculated = Utils.calculatePostCap(9999, hp, maxhp, 1)
        return message.channel.send(`${calculated.sunk ? `Sunk: ${(calculated.sunk * 100).toFixed(2)}% / `: ""}${config.emoji.taiha}: ${(calculated.taiha * 100).toFixed(2)}% / ${config.emoji.chuuha}: ${(calculated.chuuha * 100).toFixed(2)}% / ${config.emoji.shouha}: ${(calculated.shouha * 100).toFixed(2)}%
HP remaining: ${calculated.minhp}~${calculated.maxhp} / ${maxhp}`, createBar(calculated))
    }

    if(isNaN(armor = parseInt(armor)) || armor <= 4 || armor > 450) return message.reply("Invalid/unrealistic armor.")

    // Create suffering chart
    if(attack == undefined)
        return message.channel.send(maxhp >= 200 ? "**Assuming abyssal**" : `${ship ? `Suffering chart for **${ship.full_name}** (unmarried)` : ""}`, createGraph(hp, maxhp, armor))

    if(isNaN(attack = parseInt(attack)) || attack < 0 || attack > 10000) return message.reply("Invalid/unrealistic attack.")

    // Create attack bar
    const calculated = Utils.calculatePostCap(attack, hp, maxhp, armor)
    return message.channel.send(`${maxhp >= 200 ? "**Assuming abyssal**\n" : `${ship ? `Suffering bar for **${ship.full_name}** (unmarried) against an attack with post-cap power of **${attack}**
` : ""}`}${calculated.sunk ? `Sunk: ${(calculated.sunk * 100).toFixed(2)}% / `: ""}${config.emoji.taiha}: ${(calculated.taiha * 100).toFixed(2)}% / ${config.emoji.chuuha}: ${(calculated.chuuha * 100).toFixed(2)}% / ${config.emoji.shouha}: ${(calculated.shouha * 100).toFixed(2)}% / Green: ${(calculated.ok * 100).toFixed(2)}%
HP remaining: ${calculated.minhp}~${calculated.maxhp} / ${maxhp} (${calculated.mindmg}~${calculated.maxdmg} dmg)
${calculated.overkill || calculated.scratch ? `
${calculated.overkill ? `Overkill: ${(calculated.overkill * 100).toFixed()}%
` : ""}${calculated.scratch ? `Scratch: ${(calculated.scratch * 100).toFixed()}%` : ""}` : ""}`.trim(), createBar(calculated))

}
function createBar(calculated) {
    const bar = createCanvas(400, 10)
    const ctx = bar.getContext("2d")
    let prev = 0
    ctx.fillStyle = "#e51616"
    ctx.fillRect(prev, 0, calculated.taiha * bar.width, 10)
    prev += calculated.taiha * bar.width
    ctx.fillStyle = "#e5a416"
    ctx.fillRect(prev, 0, calculated.chuuha * bar.width, 10)
    prev += calculated.chuuha * bar.width
    ctx.fillStyle = "#d1d100"
    ctx.fillRect(prev, 0, calculated.shouha * bar.width, 10)
    prev += calculated.shouha * bar.width
    ctx.fillStyle = "#2fd30a"
    ctx.fillRect(prev, 0, calculated.ok * bar.width, 10)
    prev += calculated.ok * bar.width

    return new Attachment(bar.toBuffer(), "Bar.png")
}
function createGraph(hp, maxhp, armor) {
    const graphmax = Math.min(Math.ceil(1.3 * armor + hp) + 2, 450)
    const graphmin = Math.min(Math.max(1, Math.floor(0.7 * armor) - 2), 250)

    const canvas = createCanvas(960, 540)
    const context = canvas.getContext("2d")
    const width = canvas.width - 30
    const height = canvas.height - 25

    context.fillStyle = "rgba(255, 255, 255, .5)"
    context.fillRect(0, 0, canvas.width, canvas.height)

    for(let val = graphmin; val < graphmax; val++) {
        const stages = Utils.calculatePostCap(val, hp, maxhp, armor)

        // console.log(stages);
        let prev = 0

        context.fillStyle = "#2fd30a"
        context.fillRect(width / (graphmax - graphmin) * (val - graphmin), prev, width / (graphmax - graphmin), stages.ok * height)
        prev += stages.ok * height
        context.fillStyle = "#d1d100"
        context.fillRect(width / (graphmax - graphmin) * (val - graphmin), prev, width / (graphmax - graphmin), stages.shouha * height)
        prev += stages.shouha * height
        context.fillStyle = "#e5a416"
        context.fillRect(width / (graphmax - graphmin) * (val - graphmin), prev, width / (graphmax - graphmin), stages.chuuha * height)
        prev += stages.chuuha * height
        context.fillStyle = "#e51616"
        context.fillRect(width / (graphmax - graphmin) * (val - graphmin), prev, width / (graphmax - graphmin), stages.taiha * height)
        prev += stages.taiha * height
        if(val % 5 == 0) {
            context.fillStyle = "#000000"
            context.save()
            context.translate(width / (graphmax - graphmin) * (val - graphmin) + (width / (graphmax - graphmin)) / 2, height + 14)
            context.rotate(-Math.PI/2)
            context.textAlign = "center"
            context.fillText(val, 0, 3)
            context.restore()
        }
        context.fillStyle = "#000000"
        context.fillRect(width / (graphmax - graphmin) * (val - graphmin), 0, 1, height)
    }
    context.fillStyle = "#000000"
    context.fillRect(width, 0, 1, height+1)
    for(let percentage of [1, .75, .5, .25, 0]) {
        context.fillRect(0, percentage * height, width, 1)
        context.fillText(percentage * 100 + "%", width + 3, (1-percentage) * height)
    }
    return new Attachment(canvas.toBuffer(), `Suffering chart ${hp} of ${maxhp} with ${armor} armor.png`)
}

exports.category = "Tools"
exports.help = `Show suffering stats for a ship/attack or given HP/armor/attack combination.
    - When only hp given, assuming overkill.
    - When no attack given, gives an attack suffering chart.
    - When given a ship, assumes unmarried and full hp.
    - When given maxhp > 200, assuming abyssal (no overkill).
    - Attacks are assumed post-cap.

For more features, use the web version at <https://flatisjustice.moe/dmgsuffer>`
exports.usage = "suffering <hp(/maxhp)> [armor] [attack] OR .suffering <ship> [attack]"
exports.prefix = global.config.prefix
