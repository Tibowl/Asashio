exports.run = async (client, message, args) => {
    const now = new Date();
    if(args && args.length > 0) {
        const shipName = args.join(" ");
        const ship = client.data.getBirthdayByName(shipName);
        if(ship == undefined)
            return message.channel.send("Cannot find ship!");

        const next = new Date(now);
        next.setUTCHours(15, 0, 0, 0);
        if(next.getTime() > now.getTime()) next.shiftDate(1);

        while(!(ship.Day == next.getUTCDate() + 1 && ship.Month == next.getUTCMonth() + 1))
            next.shiftDate(1);
        return message.channel.send(`**${ship.Name}**'s birthday is in ${this.getDateLine(next, now)}`)
    }
    
    const birthdays = []
    let lastDate = now.getTime();
    for(let i = 0; i < 5; i++) {
        const next = client.timerManager.getNextBirthdayDate(lastDate);

        birthdays.push(`${client.timerManager.getShipsOnBirthday(next)
            .map(s => `**${s}**`)
            .join(", ")
            .replace(/,([^,]*)$/, " and$1")} in ${this.getDateLine(next, now)}`)
        lastDate = next.getTime() + 10000;
    }
    
    return message.channel.send(`Upcoming birthdays:\n` + birthdays.join("\n"));
}
exports.getDateLine = (next, now) => `**${this.timeLeft(next.getTime() - now)}** @ ${next.toLocaleString("en-UK", {
    timeZone: "Asia/Tokyo", 
    hour12: false,
    hourCycle: 'h24',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
})}`
exports.timeLeft = (diff) => {
    let result = [], originalTime = diff / 1000;

    diff /= 1000; // convert to s
    if(diff >= 24*60*60) {
        result.push(Math.floor(diff / 24 / 60 / 60) + "d")
        diff -= Math.floor(diff / 24 / 60 / 60) * 24 * 60 * 60;
    }
    
    if(diff >= 60*60) {
        result.push(Math.floor(diff / 60 / 60) + "h")
        diff -= Math.floor(diff / 60 / 60) * 60 * 60;
    }

    if(diff >= 60 && originalTime < 24*60*60) {
        result.push(Math.floor(diff / 60) + "m")
        diff -= Math.floor(diff / 60) * 60;
    }

    if(diff > 0  && originalTime < 60*60) {
        result.push(Math.floor(diff) + "s")
    }

    return result.join(", ");
}

exports.category = "Information";
exports.help = () => {
    return "Get birthday of a ship or list upcomming ones"
}
exports.usage = () => {
    return "birthday"
}
exports.prefix = (client) => {
    return client.config.prefix;
}