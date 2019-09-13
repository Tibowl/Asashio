

module.exports = (client) => {
    console.log(`In ${client.channels.size} channels on ${client.guilds.size} servers, for a total of ${client.users.size} users.`);
    client.linkManager.loadLinks(client);
    client.timerManager.init(client);
    client.tweetManager.init(client);
}