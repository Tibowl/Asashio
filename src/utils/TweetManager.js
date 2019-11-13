const Twit = require("twit")
const Discord = require("discord.js")
const Utils = require("./Utils.js")
const Logger = require("log4js").getLogger("TweetManager")
const OneHourDraw = require("./../commands/tools/1hdraw.js")

exports.stream = undefined

exports.init = () => {
    const T = new Twit(global.config.twitter)

    this.toFollow = global.config.toTweet
    this.stream = T.stream("statuses/filter", { follow: this.toFollow })
    this.stream.on("tweet", this.handleTweet)

    T.get("search/tweets", {q: "お題は from:kancolle_1draw", result_type: "recent", count: 1}, (err, data) => {
        if(err || !data.statuses || data.statuses.length == 0) return

        OneHourDraw.setTweet(data.statuses[0])
    })

    Logger.info(`Following ${this.toFollow.length} twitter account(s)!`)
}

exports.handleTweet = (tweet) => {
    if(!this.toFollow.includes(tweet.user.id_str)) return
    const tweetLink = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
    if(tweet.retweeted_status && this.toFollow.includes(tweet.retweeted_status.user.id_str)) return Logger.debug(`Skipping RT ${tweetLink}`)

    // @KCServerWatcher
    if(tweet.user.id_str == "980204936687489025") {
        let text = tweet.text

        if(tweet.extended_tweet)
            text = tweet.extended_tweet.full_text

        if(text.includes("Game version") || text.includes("Maintenance ended") || text.includes("Maintenance ongoing"))
            Utils.sendToChannels(global.config.tweetChannels, text.replace("&gt;", ">"))

        return
    }

    // @kancolle_1draw
    if(tweet.user.id_str == "3098155465") {
        let text = tweet.text

        if(tweet.extended_tweet)
            text = tweet.extended_tweet.full_text

        if(text.includes("お題は"))
            OneHourDraw.setTweet(tweet)

        return
    }

    Logger.info(`Sending tweet to channels: ${tweetLink}`)

    if(tweet.retweeted_status)
        tweet = tweet.retweeted_status

    const embed = new Discord.RichEmbed()
        .setAuthor(tweet.user.name, tweet.user.profile_image_url_https, `https://twitter.com/${tweet.user.screen_name}`)
        .setColor(`#${tweet.user.profile_background_color}`)

    // Tweet has media, don't embed it
    if(tweet.extended_entities && tweet.extended_entities.media) {
        if(tweet.extended_entities.media[0].type != "photo")  {
            Utils.sendToChannels(global.config.tweetChannels, tweetLink)
            return
        } else
            embed.setImage(tweet.extended_entities.media[0].media_url_https)
    }

    let text = tweet.text

    if(tweet.extended_tweet) {
        text = tweet.extended_tweet.full_text
        for(const url of tweet.extended_tweet.entities.urls)
            text = text.replace(url.url, url.expanded_url)

        // Tweet has media, don't embed it
        if(tweet.extended_tweet.entities && tweet.extended_tweet.entities.media) {
            if(tweet.extended_tweet.entities.media[0].type != "photo")  {
                Utils.sendToChannels(global.config.tweetChannels, tweetLink)
                return
            } else
                embed.setImage(tweet.extended_tweet.entities.media[0].media_url_https)
        }

    } else {
        for(const url of tweet.entities.urls)
            text = text.replace(url.url, url.expanded_url)
    }

    embed.setDescription(text)

    Utils.sendToChannels(global.config.tweetChannels, `<${tweetLink}>`, embed)
}

exports.shutdown = () => {
    if(this.stream !== undefined)
        this.stream.stop()
}
