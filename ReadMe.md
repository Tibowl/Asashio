Asashio
=======
Asashio is a discord bot with mainly KanColle related commands.

Installation
------------
0. This bot requires [Node](https://nodejs.org/en/)
1. Install dependencies with `npm i`
2. Set up config in `src/config.json`. An example can be found in `src/config-example.json`. See [Configuration](#Configuration) for more information
3. Start bot with `npm start`.

Configuration
-------------
- `config.json`
    - `token` is the discord client secret that can be acquired in the [Discord Developer Portal](https://discordapp.com/developers/applications/)
    - `activity` is the `Playing ...` shown in discord.
    - `admins` is a list of user ids which have higher privileges. They can update links, change avatar, shutdown the bot, etc...
    - There are multiple lists of channels where to send specific messages to
        - `timerChannels` - quarterly/monthly/weekly/daily quest/pvp/monthly expedition/etc resets
        - `tweetChannels` - to dump tweets in from `toTweet`
        - `birthdayChannels` - birthday wishes defined in `src/kcbirthday.json`
    - `toTweet` List of twitter ids to follow and post about
    - `timerOffsetms` Offset for timer/birthday messages in ms
    - `twitter` Twitter API keys. See [Twitter Developers Apps](https://developer.twitter.com/en/apps)
- `emoji.json`
    - K,V pairs of emoji that can be used by, for example, the quest command.
- `kcbirthday.json`
    - List of birthdays. Data provided by swdn.