const fetch = require('node-fetch')
const shipDropCache = {}

exports.run = async (client, message, args) => {
    if(!args || args.length < 1) return message.reply("Must provide a ship.");

    let rank = "S";
    if(args[args.length - 1].toUpperCase() == "A") {
        args.pop()
        rank = "A";
    } else if(args[args.length - 1].toUpperCase() == "S") {
        args.pop()
        rank = "S";
    }

    const shipName = args.join(" ");
    let ship = client.data.getShipByName(shipName);

    if(ship == undefined) return message.reply("Unknown ship");

    if(ship.remodel_from)
        ship = client.data.getShipByName(ship.remodel_from.replace("/", "")) || ship
    ship = client.data.getShipByName(ship.name);

    // Check if cached, if so show cached reply.
    let cached = shipDropCache[ship.api_id + rank];
    if(cached && cached.time + 6 * 60 * 60 * 1000 > new Date().getTime()) {
        const reply = await message.channel.send(this.getDisplayDataString(cached, message))
        if(cached.callback)
            cached.callback.push(() => this.displayData(cached, reply))
        return reply;
    }

    // Not cached, add it
    const reply = await message.channel.send(this.getDisplayDataString({ship}, message));

    const startTime = new Date();
    const dropData = {};
    cached = shipDropCache[ship.api_id + rank] = {
        "time": startTime.getTime(),
        dropData,
        ship,
        rank,
        "loading": true
    };
    cached.callback = [() => this.displayData(cached, reply)]

    this.queue(ship, rank, cached);

    return reply;
}
exports.queue = async (ship, rank, cached) => {
    const api = await (await fetch(`http://kc.piro.moe/api/routing/droplocations/${ship.api_id}/${rank}`)).json()

    for(let entry of api.entries) {
        let {map, node, difficulty, count} = entry;

        if(parseInt(map.split("-")[0]) > 20)
            map = "E-" + map.split("-")[1];

        cached.dropData[entry.map + node + difficulty] = {
            map,
            difficulty,
            node,
            rank,
            "rate0": this.percentage(entry.countZero, entry.totalZero),
            "samples0": `[${entry.countZero}/${entry.totalZero}]`,
            "rate1": this.percentage(entry.countOne, entry.totalOne),
            "samples1": `[${entry.countOne}/${entry.totalOne}]`,
            "totalDrops": count
        };
    }
    delete cached.loading;
    cached.callback.forEach(k => k());
    delete cached.callback;
}
exports.percentage = (count, total) => {
    if(total == 0) return "?.???%"
    return (count / total * 100).toFixed(3) + "%"
}
exports.displayData = (cached, reply) => {
    try {
        reply.edit(this.getDisplayDataString(cached, reply));
    } catch (error) {}
}
exports.getDisplayDataString = (cached, message) => {
    if(cached == undefined || cached.dropData == undefined || cached.loading)
        return `Loading ${cached.ship.full_name} drop data...`;

    let drops = Object.values(cached.dropData).sort((a,b) => b.totalDrops - a.totalDrops)
    if(drops.length == 0) 
        return `No ${cached.ship.full_name} drops found`;


    const totalCount = drops.length;
    drops = message.channel.type == "dm" ? drops.slice(0, 35) : drops.slice(0, 10)

    const rate0Len = Math.max(...drops.map(drop => drop.rate0.length));
    const samples0Len = Math.max(...drops.map(drop => drop.samples0.length));

    const rate1Len = Math.max(...drops.map(drop => drop.rate1.length));
    const longestMap = Math.max(...drops.map(drop => (drop.map+drop.node).length));


    const dropTable = `${"Map".padEnd(longestMap + 7)}${"Rate first".padEnd(samples0Len + rate0Len + 3)} Rate first dupe
${drops.map(drop => `${(drop.map+drop.node).padEnd(longestMap)} | ${[" ", "C", "E", "M", "H"][drop.difficulty]} | ${drop.rate0.padStart(rate0Len)} ${drop.samples0.padEnd(samples0Len)} | ${drop.rate1.padStart(rate1Len)} ${drop.samples1}`).join("\n")}`
    return `Found following drops for ${cached.ship.full_name} (${cached.rank} rank): \`\`\`
${dropTable}
\`\`\`*Please note that some smaller sample size results may be inaccurate.* 
${drops.length < totalCount ? (message.channel.type == "dm" ? `Shown top ${drops.length}/${totalCount} rows. `:`Shown top ${drops.length}/${totalCount} rows. Redo command in DM for more. `) : ""}Data from TsunDB on ${new Date(cached.time).toLocaleString("en-UK", {
    timeZone: 'GMT', 
    timeZoneName: 'short',
    hour12: false,
    hourCycle: 'h24',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
})}`;
}

exports.category = "Tools";
exports.help = () => {
    return "Gets drop list of a ship. Data from TsunDB, bot will cache results up to 6 hours. Uses <http://kc.piro.moe> API"
}
exports.usage = () => {
    return "drop <ship>"
}
exports.prefix = (client) => {
    return client.config.prefix;
}