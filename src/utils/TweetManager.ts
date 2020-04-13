import Twit from "twit"
import Discord from "discord.js"
import log4js from "log4js"
import config from "../data/config.json"
import { sendToChannels } from "./Utils"

const Logger = log4js.getLogger("TweetManager")

interface Tweet {
    created_at: string
    user: User
    extended_tweet?: Tweet
    retweeted_status?: Tweet
    entities?: Entities
    extended_entities?: Entities
    text: string
    full_text?: string

    [key: string]: unknown
}

interface Entities {
    hashtags?: unknown[]
    media?: {
        media_url_https: string
        url: string
        type: "photo" | "video" | "animated_gif"

        [key: string]: unknown
    }[]
    user_mentions?: unknown[]
    symbols?: unknown[]
    urls?: {
        expanded_url: string
        url: string

        [key: string]: unknown
    }[]

    [key: string]: unknown
}

interface User {
    screen_name: string
    id_str: string
    profile_image_url_https: string

    [key: string]: unknown
}

interface ShipCache {
    ships: string[]
    date: string
}

export default class Tweetmanager {
    stream: Twit.Stream | undefined = undefined
    toFollow = config.toTweet


    init(): void {
        const T = new Twit(config.twitter)

        this.stream = T.stream("statuses/filter", { follow: this.toFollow })
        this.stream.on("tweet", this.handleTweet)

        // eslint-disable-next-line @typescript-eslint/camelcase
        T.get("search/tweets", { q: "お題は from:kancolle_1draw", result_type: "recent", count: 1 }, (err, data: { statuses?: Tweet[] }) => {
            if (err || !data.statuses || data.statuses.length == 0) return

            this.set1hrDrawTweet(data.statuses[0])
        })

        Logger.info(`Following ${this.toFollow.length} twitter account(s)!`)
    }

    handleTweet = (tweet: Tweet): void => {
        if (!this.toFollow.includes(tweet.user.id_str)) return
        const tweetLink = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
        if (tweet.retweeted_status && this.toFollow.includes(tweet.retweeted_status.user.id_str)) return Logger.debug(`Skipping RT ${tweetLink}`)

        let text = tweet.extended_tweet?.full_text ?? tweet.text

        // @KCServerWatcher
        if (tweet.user.id_str == "980204936687489025") {
            if (text.includes("Game version") || text.includes("Maintenance ended") || text.includes("Maintenance ongoing"))
                sendToChannels(config.tweetChannels, text.replace("&gt;", ">"))

            return
        }

        // @kancolle_1draw
        if (tweet.user.id_str == "3098155465") {
            if (text.includes("お題は"))
                this.set1hrDrawTweet(tweet)

            return
        }

        Logger.info(`Sending tweet to channels: ${tweetLink}`)

        if (tweet.retweeted_status)
            tweet = tweet.retweeted_status

        const embed = new Discord.MessageEmbed()
            .setAuthor(tweet.user.name, tweet.user.profile_image_url_https, `https://twitter.com/${tweet.user.screen_name}`)
            .setColor(`#${tweet.user.profile_background_color}`)

        // Tweet has media, don't embed it
        if (tweet.extended_entities?.media) {
            if (tweet.extended_entities.media[0].type != "photo") {
                sendToChannels(config.tweetChannels, tweetLink)
                return
            } else
                embed.setImage(tweet.extended_entities.media[0].media_url_https)
        }


        if (tweet.extended_tweet?.entities) {
            const entities = tweet.extended_tweet.entities

            if(entities.urls)
                for (const url of entities.urls)
                    text = text.replace(url.url, url.expanded_url)

            // Tweet has media, don't embed it
            if (entities.media) {
                if (entities.media[0].type != "photo") {
                    sendToChannels(config.tweetChannels, tweetLink)
                    return
                } else
                    embed.setImage(entities.media[0].media_url_https)
            }

        } else if(tweet.entities?.urls) {
            for (const url of tweet.entities.urls)
                text = text.replace(url.url, url.expanded_url)
        }

        embed.setDescription(text)

        sendToChannels(config.tweetChannels, `<${tweetLink}>`, embed)
    }

    shutdown = (): void => {
        if (this.stream !== undefined)
            this.stream.stop()
    }

    cachedShips: ShipCache = {
        ships: [],
        date: ""
    }

    set1hrDrawTweet(tweet: Tweet): void {
        let text = tweet.extended_tweet?.full_text ?? tweet.text

        Logger.info(`Received new tweet: ${text}`)
        let match = text.match(/お題は(.*)(になります|となります)/)
        if (match) {
            const ships = match[1].trim().split(" ")

            this.cachedShips = {
                ships,
                date: new Date(tweet.created_at).toLocaleString("en-UK", {
                    timeZone: "Asia/Tokyo",
                    timeZoneName: "short",
                    hour12: false,
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                })
            }

            Logger.info(`Cached data set to: ${this.cachedShips.ships.join(", ")} at ${this.cachedShips.date}`)
        }
    }
}
