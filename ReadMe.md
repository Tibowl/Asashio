Asashio
=======
[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/A0A81MOVN)

Asashio is a discord bot with mainly KanColle related commands. An invite link for this bot can be found [here](https://discordapp.com/oauth2/authorize?client_id=621009359627091968&scope=bot&permissions=0).

Development
------------
1. Install dependencies with `npm i`
2. Set up config in `src/config.json`. An example can be found in `src/config-example.json`. See [Configuration](#Configuration) for more information
3. Develop with `npm run-script dev`

Running
-------
1. Build bot with `npm run-script build`.
2. Start bot with `npm start`.

Configuration
-------------
- `config.json`
    - `token` is the discord client secret that can be acquired in the [Discord Developer Portal](https://discordapp.com/developers/applications/)
    - `prefix` is the bot prefix (1 char max)
    - `activity` is the `Playing ...` shown in discord.
    - `admins` is a list of user ids which have higher privileges. They can update links, change avatar, shutdown the bot, etc...
    - There are multiple lists of channels where to send specific messages to
        - `timerChannels` - quarterly/monthly/weekly/daily quest/pvp/monthly expedition/etc resets
        - `tweetChannels` - to dump tweets in from `toTweet`
        - `birthdayChannels` - birthday wishes defined in `src/kcbirthday.json`
        - `maintChannels` - to post maint updates (requires to be connected to Japan VPN due to gadget 403 block)
    - `toTweet` List of twitter ids to follow and post about
    - `timerOffsetms` Offset for timer/birthday messages in ms
    - `twitter` Twitter API keys. See [Twitter Developers Apps](https://developer.twitter.com/en/apps)
- `emoji.json`
    - K,V pairs of emoji that can be used by, for example, the quest command.
- `kcbirthday.json`
    - List of birthdays. Data provided by swdn.
- `levels.json`
    - List of KC levels
- `exped.json`
    - Expedition data, the ones that aren't included in api_start2
- `aliases.json`
    - List of ship/equip name aliases