import fetch from "node-fetch"
import log4js from "log4js"
import { exists, unlink, move, writeFile, existsSync, readFileSync } from "fs-extra"
import { join } from "path"

import client from "../main"
import { QuestDB, ShipDB, EquipmentDB, MiscDB, Expedition, Birthday, Store, APIStart2, MapInfoDB, Alias, Quest, AssetCategory, AssetType, Extension, Equipment, MapInfo, ShipExtended } from "./Types"

const Logger = log4js.getLogger("DataManager")
const existsP = async (path: string): Promise<boolean> => new Promise((resolve) => exists(path, resolve))

const defaultMisc: MiscDB = {
    "RangeNames": {
        "0": "None",
        "1": "Short",
        "2": "Medium",
        "3": "Long",
        "4": "Very Long",
        "5": "Very Long+"
    },
    "RarityNames": {
        "1": "Very Common",
        "2": "Common",
        "3": "Uncommon",
        "4": "Rare",
        "5": "Very Rare",
        "6": "Holo",
        "7": "S Holo",
        "8": "SS Holo",
    },
    "SpeedNames": {
        "0": "None",
        "5": "Slow",
        "10": "Fast",
        "15": "Fast+",
        "20": "Fastest"
    },
    "ShipCodes": {
        "1": "DE",
        "2": "DD",
        "3": "CL",
        "4": "CLT",
        "5": "CA",
        "6": "CAV",
        "7": "CVL",
        "8": "FBB",
        "9": "BB",
        "10": "BBV",
        "11": "CV",
        "12": "B",
        "13": "SS",
        "14": "SSV",
        "15": "AP",
        "16": "AV",
        "17": "LHA",
        "18": "CVB",
        "19": "AR",
        "20": "AS",
        "21": "CT",
        "22": "AO"
    },
    "ShipTypes": {
        "1": "Coastal Defense Ship",
        "2": "Destroyer",
        "3": "Light Cruiser",
        "4": "Torpedo Cruiser",
        "5": "Heavy Cruiser",
        "6": "Aviation Cruiser",
        "7": "Light Carrier",
        "8": "Fast Battleship",
        "9": "Battleship",
        "10": "Aviation Battleship",
        "11": "Standard Aircraft Carrier",
        "12": "Super Dreadnought",
        "13": "Submarine",
        "14": "Aircraft Carrying Submarine",
        "15": "Transport Ship",
        "16": "Seaplane Tender",
        "17": "Amphibious Assault Ship",
        "18": "Armored Carrier",
        "19": "Repair Ship",
        "20": "Submarine Tender",
        "21": "Training Cruiser",
        "22": "Fleet Oiler"
    },
    "EquipmentRarityNames": {
        "0": "Common",
        "1": "Rare",
        "2": "Holo",
        "3": "S Holo",
        "4": "SS Holo",
        "5": "SS Holo",
        "6": "SS Holo+",
        "7": "SS++"
    },
}

const path = join(__dirname, "../../src/data/")
const store = join(path, "store.json")
const oldstore = join(path, "store.json.old")

export default class DataManager {
    ships: ShipDB = {}
    quests: QuestDB = {}
    misc: MiscDB = defaultMisc
    equips: EquipmentDB = {}
    expeds: Expedition[] = []

    birthdays: Birthday[] = []
    oneHourDrawOverides: { [x: string]: string } = {}
    api_start2: APIStart2 = {
        api_mst_ship: [],
        api_mst_slotitem: []
    }
    levels_exp: number[] = [0]

    store: Store = {
        maintInfo: {},
        versionInfo: {}
    }

    constructor() {
        try {
            if (existsSync(store))
                try {
                    this.store = JSON.parse(readFileSync(store).toString())
                    return
                } catch (error) {
                    Logger.error("Failed to read/parse store.json")
                }

            if (existsSync(oldstore))
                try {
                    this.store = JSON.parse(readFileSync(oldstore).toString())
                    Logger.error("Restored from old store!")
                    return
                } catch (error) {
                    Logger.error("Failed to read/parse store.json.old")
                }

            // writeFileSync(store, JSON.stringify(this.store))
        } catch (error) {
            Logger.error("Failed to open store.json", error)
        }
    }

    mapInfoCache: MapInfoDB = {}

    shipAliases: Alias[] = []
    equipAliases: Alias[] = []
    getMaxLevel = (): number => this.levels_exp.length
    getServerIP = (): string => "http://203.104.209.23"
    eventID = (): number => this.store.eventID ?? 46

    getShipByName(name: string): ShipExtended {
        name = name.toLowerCase()

        const findShip = (toSearch: string): ShipExtended | undefined => {
            toSearch = toSearch.toLowerCase().trim()
            return Object.values(this.ships).find((ship: ShipExtended) => {
                return ship.full_name?.toLowerCase() == toSearch
                    || ship.japanese_name?.toLowerCase() == toSearch
                    || ship.nick?.toLowerCase() == toSearch
                    || (ship.reading && ship.reading.toLowerCase() == toSearch)
            })
        }

        for (const alias of this.shipAliases)
            name = name.replace(new RegExp("^" + alias[0]), alias[1])

        let result = this.getShipById(name)
        if (result != undefined) return result

        result = findShip(name)
        if (result != undefined) return result

        if (name.includes(" k2")) {
            result = findShip(name = name.replace(" k2", " kai ni "))
            if (result != undefined) return result
        }
        if (name.endsWith("k2")) {
            result = findShip(name = (name.substring(0, name.length - 2) + " kai ni"))
            if (result != undefined) return result
        }

        if (name.includes(" k") && !name.includes(" kai ni")) {
            result = findShip(name = name.replace(/ k( |$)/, " kai "))
            if (result != undefined) return result
        }

        let shipList: ShipExtended[] = Object.values(this.ships).filter(k => k.full_name.toLowerCase().includes(name))
        if (shipList.length == 0)
            shipList = Object.values(this.ships)

        const dists: number[] = shipList.map(ship => this.lenz(ship.full_name.toLowerCase(), name.trim()))
        const minDist = Math.min(...dists)
        return shipList[dists.indexOf(minDist)]
    }

    getBirthdayByName = (name: string): Birthday => {
        name = name.toLowerCase()

        const findShip = (toSearch: string): Birthday | undefined => {
            toSearch = toSearch.toLowerCase().trim()
            return this.birthdays.find(ship => {
                return ship.name?.toLowerCase() == toSearch
            })
        }

        for (const alias of this.shipAliases)
            name = name.replace(new RegExp("^" + alias[0]), alias[1])

        let result = this.birthdays.find(ship => ship.id === +name)
        if (result != undefined) return result

        result = findShip(name)
        if (result != undefined) return result

        let shipList = this.birthdays.filter(k => k.name.toLowerCase().includes(name))
        if (shipList.length == 0)
            shipList = this.birthdays

        const dists = shipList.map(ship => this.lenz(ship.name.toLowerCase(), name.trim()))
        const minDist = Math.min(...dists)
        return shipList[dists.indexOf(minDist)]
    }

    get1HrDrawName = (name: string): string | undefined => {
        const override = Object.entries(this.oneHourDrawOverides).find(([k, v]) => k.toLowerCase() == name.toLowerCase() || v.toLowerCase() == name.toLowerCase())
        if (override)
            return override[1]

        const candidate = client.data.getShipByName(name)
        if (candidate && (name == candidate.japanese_name || name == candidate.reading || name.toLowerCase() == candidate.name.toLowerCase()))
            return candidate.name
        return undefined
    }

    normalizeName = (name: string): string => name.toLowerCase().replace(/\./g, " ").trim()
    getEquipByName = (name: string): Equipment[] | undefined => {
        name = this.normalizeName(name)

        const result = this.getEquipById(name)
        if (result != undefined) return [result]

        const exactResult = Object.values(this.equips).find(k => this.normalizeName(k.name) == name)
        if (exactResult != undefined) return [exactResult]

        for (const alias of this.equipAliases)
            name = name.replace(alias[0], alias[1]).trim()

        const firstWord = name.split(" ")[0]
        const equipList = Object.values(this.equips).filter(k => {
            const equipName = this.normalizeName(k.name)
            return equipName.includes(" " + firstWord) || equipName.startsWith(firstWord)
        })

        if (equipList.length == 0) return

        const dists = equipList.map(equip => this.distance(this.normalizeName(equip.name), name))
        const minDist = Math.min(...dists)
        return equipList.filter((_, i) => dists[i] == minDist)
    }

    getMapInfo = async (map: string): Promise<MapInfo> => {
        if (!this.mapInfoCache[map]) {
            Logger.info(`Map data for ${map} not cached. Loading...`)
            this.mapInfoCache[map] = await (await fetch(`http://kc.piro.moe/api/routing/maps/${map}`)).json()
        }
        return this.mapInfoCache[map]
    }

    getShipById = (id: number | string): ShipExtended | undefined => {
        return this.ships[id]
    }

    getQuestByName = (id: string): Quest | undefined => {
        id = id.toUpperCase()
        return this.quests[id]
    }
    getQuestsByDescription = (desc: string): Quest[] => {
        desc = desc.toLowerCase().trim()
        const filters: ((q: Quest) => boolean)[] = [
            (q: Quest): boolean => !!q.title_en?.toLowerCase().includes(desc),
            (q: Quest): boolean => !!q.title?.toLowerCase().includes(desc),
            (q: Quest): boolean => !!q.detail_en?.toLowerCase().includes(desc),
            (q: Quest): boolean => !!q.reward_other?.toLowerCase().includes(desc),
            (q: Quest): boolean => !!q.note?.toLowerCase().includes(desc)
        ]

        const quests = []
        for (const filter of filters)
            quests.push(...Object.values(this.quests).filter(filter))

        return quests.filter((obj, pos, self) => self.indexOf(obj) == pos)
    }
    getEquipById = (id: string): Equipment => {
        return this.equips[id]
    }
    getBGMLink = (id: number | string): string => {
        return this.getServerIP() + this.getPath(+id, "bgm", "battle", "mp3")
    }
    getEquipLink = (id: number | string): string => {
        return this.getServerIP() + this.getPath(+id, "slot", "card", "png")
    }
    getExpedByID = (id: number | string): Expedition | undefined => {
        return this.expeds.find(k => k.id == id)
    }

    resource = [6657, 5699, 3371, 8909, 7719, 6229, 5449, 8561, 2987, 5501, 3127, 9319, 4365, 9811, 9927, 2423, 3439, 1865, 5925, 4409, 5509, 1517, 9695, 9255, 5325, 3691, 5519, 6949, 5607, 9539, 4133, 7795, 5465, 2659, 6381, 6875, 4019, 9195, 5645, 2887, 1213, 1815, 8671, 3015, 3147, 2991, 7977, 7045, 1619, 7909, 4451, 6573, 4545, 8251, 5983, 2849, 7249, 7449, 9477, 5963, 2711, 9019, 7375, 2201, 5631, 4893, 7653, 3719, 8819, 5839, 1853, 9843, 9119, 7023, 5681, 2345, 9873, 6349, 9315, 3795, 9737, 4633, 4173, 7549, 7171, 6147, 4723, 5039, 2723, 7815, 6201, 5999, 5339, 4431, 2911, 4435, 3611, 4423, 9517, 3243]
    key = (s: string): number => s.split("").reduce((a, e) => a + e.charCodeAt(0), 0)
    create = (id: number, type: string): string => (17 * (id + 7) * this.resource[(this.key(type) + id * type.length) % 100] % 8973 + 1000).toString()
    pad = (id: number, eors: AssetCategory): string => id.toString().padStart(eors == "ship" ? 4 : 3, "0")
    getPath = (id: number, eors: AssetCategory, type: AssetType, ext: Extension): string => {
        let suffix = ""
        let outType: string = type
        if (type.indexOf("_d") > 0 && type.indexOf("_dmg") < 0) {
            suffix = "_d"
            outType = type.replace("_d", "")
        }
        return `/kcs2/resources/${eors}/${outType}/${this.pad(id, eors)}${suffix}_${this.create(id, `${eors}_${outType}`)}.${ext}`
    }

    distance = (name: string, toSearch: string): number => {
        const wordsName = name.split(" "), wordsSearch = toSearch.split(" ")

        let score = 0, wordsIndex = 0
        for (const word of wordsSearch) {
            const previous = wordsIndex
            for (let i = wordsIndex; i < wordsName.length; i++) {
                if (wordsName[i].startsWith(word)) {
                    wordsIndex = i
                    score -= 5
                    score += this.lenz(wordsName[i], word)
                    break
                }
            }

            if (previous != wordsIndex)
                score += this.lenz(wordsName[wordsIndex], word)

            if (wordsIndex >= wordsName.length - 1) break
        }
        return score
    }

    lenz = (a: string, b: string): number => {
        if (a.length == 0) return b.length
        if (b.length == 0) return a.length

        // swap to save some memory O(min(a,b)) instead of O(a)
        if (a.length > b.length) [a, b] = [b, a]

        const row = []
        // init the row
        for (let i = 0; i <= a.length; i++)
            row[i] = i


        // fill in the rest
        for (let i = 1; i <= b.length; i++) {
            let prev = i
            for (let j = 1; j <= a.length; j++) {
                const val = (b.charAt(i - 1) == a.charAt(j - 1)) ? row[j - 1] : Math.min(row[j - 1] + 1, prev + 1, row[j] + 1)
                row[j - 1] = prev
                prev = val
            }
            row[a.length] = prev
        }

        return row[a.length]
    }

    lastStore: number | NodeJS.Timeout | undefined = undefined
    saveStore(): void {
        if (this.lastStore == undefined) {
            this.lastStore = setTimeout(async () => {
                try {
                    if (await existsP(oldstore))
                        await unlink(oldstore)

                    if (await existsP(store))
                        await move(store, oldstore)

                    await writeFile(store, JSON.stringify(this.store, undefined, 4))
                } catch (error) {
                    Logger.error("Failed to save", error)
                }
                this.lastStore = undefined
            }, 1000)
        }
    }

    reloadShipData = async (): Promise<void> => {
        const shipData = await (await fetch("https://raw.githubusercontent.com/kcwiki/kancolle-data/master/wiki/ship.json")).json()

        this.ships = {}
        Object.keys(shipData).forEach(shipName => {
            const ship = shipData[shipName]
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const shipNew: any = {}
            Object.keys(ship).map(key => shipNew[key.replace("_", "")] = ship[key])
            this.ships[shipNew.api_id] = shipNew
        })
        Logger.info(`Loaded ship data! ${Object.keys(this.ships).length} ships loaded`)// , this.ships[95])

        const questData = await (await fetch("https://raw.githubusercontent.com/kcwiki/kancolle-data/master/wiki/quest.json")).json()

        this.quests = {}
        Object.keys(questData).forEach(questId => {
            this.quests[questId.toUpperCase()] = questData[questId]
        })
        Logger.info(`Loaded quest data! ${Object.keys(this.quests).length} quests loaded`)// , this.quests["B100"])

        this.misc = await (await fetch("https://raw.githubusercontent.com/kcwiki/kancolle-data/master/wiki/misc.json")).json()
        Logger.info(`Loaded misc ${Object.keys(this.misc).join(", ")} data`)

        const equipmentData = await (await fetch("https://raw.githubusercontent.com/kcwiki/kancolle-data/master/wiki/equipment.json")).json()

        this.equips = {}
        Object.keys(equipmentData).forEach(equipName => {
            const equip = equipmentData[equipName]
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const equipNew: any = {}
            Object.keys(equip).map(key => equipNew[key.replace("_", "")] = equip[key])
            if (equipNew.reading == false) delete equipNew.reading
            this.equips[equipNew.id] = equipNew
        })
        Logger.info(`Loaded equipment data! ${Object.keys(this.equips).length} equips loaded`)// , this.equips[1])

        this.api_start2 = await (await fetch("https://raw.githubusercontent.com/Tibowl/api_start2/master/start2.json")).json()
        if (this.api_start2 && this.api_start2.api_mst_maparea) {
            const eventID = Math.max(...this.api_start2.api_mst_maparea.map(area => area.api_id))
            if (eventID > 10 && this.store.eventID != eventID) {
                Logger.log("Updated event ID!")
                this.store.eventID = eventID
            }
        }
        Logger.info(`Loaded api_start2! Last event ID: ${this.eventID()}`)

        this.birthdays = require("../../src/data/kcbirthday.json")
        Logger.info(`Loaded birthdays! ${Object.keys(this.birthdays).length} birthdays!`)
        client.timerManager.scheduleNextBirthday()

        this.oneHourDrawOverides = require("../../src/data/oneHourDrawOverides.json")
        Logger.info(`Loaded oneHourDrawOverides! ${Object.keys(this.oneHourDrawOverides).length} overrides!`)

        this.expeds = require("../../src/data/exped.json")
        Logger.info(`Loaded expeds! ${this.expeds.length} expeds!`)

        this.levels_exp = require("../../src/data/levels.json")
        Logger.info(`Loaded level <-> xp! ${this.levels_exp.length} levels!`)

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const aliases = require("../../src/data/aliases.json")
        this.shipAliases = Object.entries(aliases.shipAliases)
        this.equipAliases = Object.entries(aliases.equipAliases)
        Logger.info(`Loaded name aliases! ${this.shipAliases.length} ship and ${this.equipAliases.length} equipments!`)

        this.saveStore()
    }
}
