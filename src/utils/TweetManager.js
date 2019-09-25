const Twit = require("twit")
const Discord = require("discord.js")
const Utils = require("./Utils.js")

exports.client = undefined
exports.stream = undefined

exports.init = (client) => {
    this.client = client
    const T = new Twit(client.config.twitter)

    const toFollow = client.config.toTweet
    this.stream = T.stream("statuses/filter", { follow: toFollow})
    this.stream.on("tweet", (tweet) => {
        if(!toFollow.includes(tweet.user.id_str)) return
        const tweetLink = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
        if(tweet.retweeted_status) return console.log(`Skipping RT ${tweetLink}`)

        // @KCServerWatcher
        if(tweet.user.id_str == "980204936687489025") {
            let text = tweet.text

            if(tweet.extended_tweet)
                text = tweet.extended_tweet.full_text

            if(text.includes("Game version") || text.includes("Maintenance ended") || text.includes("Maintenance ongoing"))
                Utils.sendToChannels(client, client.config.tweetChannels, text)

            return
        }

        console.log(`Sending tweet to channels: ${tweetLink}`)

        if(tweet.retweeted_status)
            tweet = tweet.retweeted_status

        // Tweet has media, don't embed it
        if(tweet.extended_entities || (tweet.extended_tweet && tweet.extended_tweet.extended_entities)) {
            Utils.sendToChannels(client, client.config.tweetChannels, tweetLink)
            return
        }

        let text = tweet.text

        if(tweet.extended_tweet) {
            text = tweet.extended_tweet.full_text
            for(const url of tweet.extended_tweet.entities.urls)
                text = text.replace(url.url, url.expanded_url)
        } else {
            for(const url of tweet.entities.urls)
                text = text.replace(url.url, url.expanded_url)
        }

        const embed = new Discord.RichEmbed()
            .setAuthor(tweet.user.name, tweet.user.profile_image_url_https, `https://twitter.com/${tweet.user.screen_name}`)
            .setDescription(text)
            .setColor(`#${tweet.user.profile_background_color}`)

        Utils.sendToChannels(client, client.config.tweetChannels, `<${tweetLink}>`, embed)
    })
    console.log(`Following ${toFollow.length} twitter account(s)!`)
}

exports.shutdown = () => {
    if(this.stream !== undefined)
        this.stream.stop()
}
