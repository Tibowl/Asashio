module.exports = async (client, message) => {
    if (message.author.bot) return;

    if(message.channel.type === "dm")
        console.log(`${message.author.id} (${message.author.username}) in ${message.channel.name || message.channel.type}: ${message.content}`)
    const args = message.content.slice(1).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    const cmd = client.commands.get(command);

    // If that command doesn't exist, silently exit and do nothing
    if (!cmd) return;
    if (message.content.indexOf(cmd.prefix(client)) !== 0) return;

    try {
        if(message.channel.type !== "dm")
            console.log(`${message.author.id} (${message.author.username}) in ${message.channel.name || message.channel.type}: ${message.content}`)
        const msg = cmd.run(client, message, args, command);
        if(!msg || message.channel.type !== "text") return;
        const reply = await msg;
        if(!reply) return;

        await reply.react('❌')
        reply.awaitReactions(
                (reaction, user) => reaction.emoji.name == '❌' && (user.id == message.author.id), 
                {max: 1, time: 30000, errors: ['time']}
            ).then(() => 
                reply.delete()
            ).catch(() =>
                reply.reactions.forEach((reaction) => reaction.me ? reaction.remove() : 0)
            )
        client.recentMessages.push(reply);
        setTimeout(() => {
            client.recentMessages.shift();
        }, 35000);
    } catch (error) {
        console.error(error);
    }
};