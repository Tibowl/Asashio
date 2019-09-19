const Twit = require('twit')
exports.client = undefined;
exports.stream = undefined;

exports.init = (client) => {
    this.client = client;
    const T = new Twit(client.config.twitter);

    const toFollow = client.config.toTweet;
    this.stream = T.stream("statuses/filter", { follow: toFollow})
    this.stream.on('tweet', (tweet) => {
        if(!toFollow.includes(tweet.user.id_str)) return;

        const tweetLink =` https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;
        console.log(`Sending tweet to channels: ${tweetLink}`)

        for(let channel of client.config.tweetChannels)
            this.client.channels.get(channel).send(tweetLink)
    })
    console.log(`Following ${toFollow.length} twitter account(s)!`)
}

exports.shutdown = () => {
    if(this.stream !== undefined) 
        this.stream.stop();
}