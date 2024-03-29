import { CommandInteraction, Message } from "discord.js"
import { APIMessage } from "discord-api-types/v9"

export type CommandSource = Message | CommandInteraction
export type SendMessage = Message | APIMessage
export type CommandResponse = Promise<SendMessage | undefined> | undefined

export interface WebResult<T> {
    result: T
    error: string
    retrieved: string
}

export interface Ship {
    aa: number
    aa_max: false | number
    aa_mod: boolean | number
    ammo: number
    api_id: number
    armor: number
    armor_max: number
    armor_mod: boolean | number
    asw: number
    asw_max: false | number
    cg_damaged_reference?: string
    cg_reference?: string
    class: string
    class_number: boolean | number
    equipment: (ShipEquipment)[] | false
    evasion: number
    evasion_max: number | false
    firepower: number
    firepower_max: number
    firepower_mod: boolean | number
    fuel: number
    hp: number
    hp_max: number
    id: number
    japanese_name: string
    los: number
    los_max: false | number
    luck: number
    luck_max: number
    luck_mod: boolean | number
    name: string
    range: number
    rarity: number
    reading: string | false
    remodel_ammo?: number
    remodel_blueprint?: boolean | number
    remodel_catapult?: boolean | number
    remodel_development_material?: boolean | number
    remodel_from: boolean | string
    remodel_level: false | number
    remodel_steel?: number
    remodel_to: boolean | string
    scrap_ammo: boolean | number
    scrap_baux: boolean | number
    scrap_fuel: number
    scrap_steel: number
    speed: number
    suffix?: boolean | string
    torpedo: number
    torpedo_max: false | number
    torpedo_mod: false | number
    true_id: false | number
    type: number
    full_name: string
    implementation_date: number[]
    voice_actor: string
    artist: string
    availability: unknown
    wikipedia?: string
    buildable?: boolean
    buildable_lsc?: boolean
    build_time: number
    gun_fit_properties?: Gunfitproperties
    voice_flag?: number
    remodel_report?: boolean | number
    remodel_airmat?: boolean
    japanese_nick?: string
    nick?: string
    reading_nick?: boolean | string
    page?: string
    get_message?: string
    overlay?: string
    remodel_construction_material?: boolean | number
    back?: number
    remodel_to_ammo?: number
    remodel_to_blueprint?: boolean
    remodel_to_catapult?: boolean
    remodel_to_development_material?: boolean | number
    remodel_to_level?: number
    remodel_to_steel?: number
    remodel_gunmat?: number
    remodel_to_construction_material?: number
    nsfw_damaged?: boolean
    reversible?: boolean
    localized_name?: string
}

export interface ShipExtended extends Ship {
    class_description: string
    hp_married: number
    asw_ring: number
    los_ring: number
    evasion_ring: number
    speed_name: string
    range_name: string
    mods: string
    scraps: string
    equipment_text?: string
    remodel_text?: string
    ship_type: string
    rarity_name: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
}

interface Gunfitproperties {
    [key: string]: boolean | number
}

interface ShipEquipment {
    equipment: boolean | string
    size: number
    stars?: number
}

export interface ShipDB {
    [key: string]: ShipExtended
}

export interface ShipListDB {
    [key: string]: string[]
}

export interface Improvements {
    _ammo: number
    _bauxite: number
    _fuel: number
    _steel: number
    _products: { [key: string]: unknown }
}

export interface Equipment {
    aa: boolean | number
    armor: boolean | number
    asw: boolean | number
    back?: number
    bombing: boolean | number
    buildable?: boolean
    evasion: boolean | number
    firepower: boolean | number
    gun_fit_group?: string
    icon: number
    id: number
    improvements?: Improvements | false
    info?: string
    japanese_name: string
    los: boolean | number
    luck: boolean
    name: string
    page?: boolean
    range: false | number
    rarity: number
    reading?: string
    scrap_ammo: boolean | number
    scrap_bauxite: boolean | number
    scrap_fuel: boolean | number
    scrap_steel: boolean | number
    shelling_accuracy: boolean | number
    special: boolean | string
    speed: boolean
    torpedo: boolean | number
    torpedo_accuracy: boolean | number
    type: number
    wikipedia?: string
    flight_cost?: boolean | number
    flight_range?: boolean | number
    upgradable?: boolean
    item_id?: number
    stars?: number
    can_attack_installations?: boolean
    localized_name?: boolean | string
    asset_name?: string
    improvable?: boolean
    types?: number[]
    asw_damage_type?: string
    album_type?: string
    upgradeable?: boolean
    card_japanese_name?: string
    card_localized_name?: boolean
    card_name?: string
    card_reading?: string
}

export interface EquipmentDB {
    [key: string]: Equipment
}

export interface MapInfo {
    route: Routes
    spots: Spots
}
export interface MapInfoDB {
    [key: string]: MapInfo
}

export type Spot = [number, number, string | null]
export interface Spots {
    [key: string]: Spot
}

export type Route = [null | string, string, number, number]
export interface Routes {
    [key: string]: Route
}

export interface MapEntries {
    entryCount?: number
    pageCount: number
    perPage: number
    entries: MapEntry[]
}

export interface MapEntry {
    id: number
    map: string
    hqLvl: number
    cleared?: boolean
    fleet1: string[]
    fleet1data: FleetData[]
    fleet2: string[]
    fleet2data: FleetData[]
    sortiedFleet: number
    fleetSpeed: number
    edgeId: number[]
    los: number[]
    datetime: string
    fleetIds: number[]
    fleetLevel: number
    fleetOneEquips: number[]
    fleetOneExSlots: number[]
    fleetOneTypes: number[]
    fleetTwoEquips: number[]
    fleetTwoExSlots: number[]
    fleetTwoTypes: number[]
    radars: number
    radarShips: number
    radars5los: number
    radarShips5los: number
    nodeInfo: string
    difficulty?: number
    gaugeType?: number
    gaugeNum?: number
    currentMapHp?: number
    maxMapHp?: number
}

export interface FleetData {
    id: number
    name: string
    name_en: string
    level: number
    type: number
    speed: number
    equip: number[]
    stars: number[]
    ace: number[]
    exslot: number
}

export interface MiscDB {
    EquipmentCompatibility?: { [key: string]: [] | EquipmentCompatibilityClass }
    EquipmentIcons?: { [key: string]: string }
    EquipmentRarityNames: { [key: string]: string }
    EquipmentTypes?: { [key: string]: string }
    EquipmentTypesPlural?: { [key: string]: string }
    GunFitGroups?: GunFitGroups
    RangeNames: { [key: string]: string }
    RarityNames: { [key: string]: string }
    ShipCodes: { [key: string]: string }
    ShipTypes: { [key: string]: string }
    SpeedNames: { [key: string]: string }
    StatIcons?: { [key: string]: string }
}

export interface EquipmentCompatibilityClass {
    [key: string]: {
        code: string
        note: string
        value: number
    }
}

export interface GunFitGroups {
    large_caliber: string[]
}


export interface Birthday {
    id?: number
    name: string
    class?: string
    type?: string
    day: number
    month: number
    year: number
    builder: string
    note?: string
}

export interface Quest {
    detail_en?: string
    label: string
    letter?: QuestLetter
    note?: string
    reward_ammo?: number
    reward_bauxite?: number
    reward_fuel?: number
    reward_other?: string
    reward_steel?: number
    title?: string
    title_en?: null | string
    category?: null
    detail?: null
    id?: null
    requires?: null
    type?: null
    unlocks?: null
    alias_of?: string
}

export type QuestLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G"

export interface QuestDB {
    [key: string]: Quest
}

export interface Expedition {
    id: string
    rsc: number[]
    fleet: string
    fs_lvl?: number
    fleet_lvl?: number | string
    misc_req?: string
}

export type FollowCategory = "birthday" | "1hrdraw" | "maint" | "twitter" | "timers" | "twitter_replies"
export interface Follower {
    channelID: string
    category: FollowCategory
    filter: string
    addedOn: number
    addedBy: string
}

export type AssetCategory = "ship" | "slot" | "bgm"
export type AssetType = "full" | "full_dmg" | "battle" | "card"
export type Extension = "png" | "json" | "mp3"

export interface APIStart2 {
    api_mst_bgm?: APIMstBgm[]
    api_mst_const?: APIMstConst
    api_mst_equip_exslot?: number[]
    api_mst_equip_exslot_ship?: APIMstEquipExslotShip[]
    api_mst_equip_ship?: APIMstEquipShip[]
    api_mst_furniture?: APIMstFurniture[]
    api_mst_furnituregraph?: APIMstFurnituregraph[]
    api_mst_item_shop?: APIMstItemShop
    api_mst_maparea?: APIMstMaparea[]
    api_mst_mapbgm?: APIMstMapbgm[]
    api_mst_mapinfo?: APIMstMapinfo[]
    api_mst_mission?: APIMstMission[]
    api_mst_payitem?: APIMstPayitem[]
    api_mst_ship: APIMstShip[]
    api_mst_shipgraph?: APIMstShipgraph[]
    api_mst_shipupgrade?: APIMstShipupgrade[]
    api_mst_slotitem: APIMstSlotitem[]
    api_mst_slotitem_equiptype?: APIMstSlotitemEquiptype[]
    api_mst_stype?: APIMstStype[]
    api_mst_useitem?: APIMstUseitem[]
}

export interface APIMstBgm {
    api_id: number
    api_name: string
}

export interface APIMstConst {
    api_boko_max_ships: APIBokoMaxShipsClass
    api_dpflag_quest: APIBokoMaxShipsClass
    api_parallel_quest_max: APIBokoMaxShipsClass
}

export interface APIBokoMaxShipsClass {
    api_int_value: number
    api_string_value: string
}

export interface APIMstEquipExslotShip {
    api_ship_ids: number[]
    api_slotitem_id: number
}

export interface APIMstEquipShip {
    api_equip_type: number[]
    api_ship_id: number
}

export interface APIMstFurniture {
    api_active_flag: number
    api_description: string
    api_id: number
    api_no: number
    api_outside_id: number
    api_price: number
    api_rarity: number
    api_saleflg: number
    api_season: number
    api_title: string
    api_type: number
    api_version: number
}

export interface APIMstFurnituregraph {
    api_filename: string
    api_id: number
    api_no: number
    api_type: number
    api_version: string
}

export interface APIMstItemShop {
    api_cabinet_1: number[]
    api_cabinet_2: number[]
}

export interface APIMstMaparea {
    api_id: number
    api_name: string
    api_type: number
}

export interface APIMstMapbgm {
    api_boss_bgm: number[]
    api_id: number
    api_map_bgm: number[]
    api_maparea_id: number
    api_moving_bgm: number
    api_no: number
}

export interface APIMstMapinfo {
    api_id: number
    api_infotext: string
    api_item: number[]
    api_level: number
    api_maparea_id: number
    api_max_maphp: null
    api_name: string
    api_no: number
    api_opetext: string
    api_required_defeat_count: number | null
    api_sally_flag: number[]
}

export interface APIMstMission {
    api_damage_type: number
    api_deck_num: number
    api_details: string
    api_difficulty: number
    api_disp_no: string
    api_id: number
    api_maparea_id: number
    api_name: string
    api_reset_type: number
    api_return_flag: number
    api_sample_fleet: number[]
    api_time: number
    api_use_bull: number
    api_use_fuel: number
    api_win_item1: number[]
    api_win_item2: number[]
    api_win_mat_level: number[]
}

export interface APIMstPayitem {
    api_description: string
    api_id: number
    api_item: number[]
    api_name: string
    api_price: number
    api_shop_description: string
    api_type: number
}

export type Range = 0 | 1 | 2 | 3 | 4
export type Speed = 0 | 5 | 10 | 15 | 20

export interface APIMstShip {
    api_id: number
    api_sortno: number
    api_sort_id: number
    api_name: string
    api_yomi: string
    api_stype: number
    api_ctype: number
    api_afterlv: number
    api_aftershipid: string
    api_taik: number[]
    api_souk: number[]
    api_houg: number[]
    api_raig: number[]
    api_tyku: number[]
    api_luck: number[]
    api_soku: Speed
    api_leng: Range
    api_slot_num: number
    api_maxeq: number[]
    api_buildtime: number
    api_broken: number[]
    api_powup: number[]
    api_backs: number
    api_getmes: string
    api_afterfuel: number
    api_afterbull: number
    api_fuel_max: number
    api_bull_max: number
    api_voicef: number
}

export interface APIMstShipgraph {
    api_battle_d?: number[]
    api_battle_n?: number[]
    api_boko_d?: number[]
    api_boko_n?: number[]
    api_ensyue_n?: number[]
    api_ensyuf_d?: number[]
    api_ensyuf_n?: number[]
    api_filename: string
    api_id: number
    api_kaisyu_d?: number[]
    api_kaisyu_n?: number[]
    api_kaizo_d?: number[]
    api_kaizo_n?: number[]
    api_map_d?: number[]
    api_map_n?: number[]
    api_pa?: number[]
    api_sortno?: number
    api_version: string[]
    api_weda?: number[]
    api_wedb?: number[]
}

export interface APIMstShipupgrade {
    api_aviation_mat_count: number
    api_catapult_count: number
    api_current_ship_id: number
    api_drawing_count: number
    api_id: number
    api_original_ship_id: number
    api_report_count: number
    api_sortno: number
    api_upgrade_level: number
    api_upgrade_type: number
}

export interface APIMstSlotitem {
    api_atap: number
    api_bakk: number
    api_baku: number
    api_broken: number[]
    api_cost?: number
    api_distance?: number
    api_houg: number
    api_houk: number
    api_houm: number
    api_id: number
    api_leng: Range
    api_luck: number
    api_name: string
    api_raig: number
    api_raik: number
    api_raim: number
    api_rare: number
    api_sakb: number
    api_saku: number
    api_soku: number
    api_sortno: number
    api_souk: number
    api_taik: number
    api_tais: number
    api_tyku: number
    api_type: number[]
    api_usebull: string
    api_version?: number
}

export interface APIMstSlotitemEquiptype {
    api_id: number
    api_name: string
    api_show_flg: number
}

export interface APIMstStype {
    api_equip_type: { [key: string]: number }
    api_id: number
    api_kcnt: number
    api_name: string
    api_scnt: number
    api_sortno: number
}

export interface APIMstUseitem {
    api_category: number
    api_description: string[]
    api_id: number
    api_name: string
    api_price: number
    api_usetype: number
}

interface ShipCache {
    screen_name: string
    ships: string[]
    date: string
}

export interface Store {
    maintInfo: MaintInfo
    versionInfo: VersionInfo
    eventID?: number
    stats?: Stats
    cachedShips?: ShipCache
}

export interface Stats {
    [key: string]: CommandStats
}
export interface CommandStats {
    [key: string]: number
}

export interface MaintInfo {
    lastLine?: string
}
export interface VersionInfo {
    lastMainVersion?: string
    lastKCAVersion?: string
    lastMaintString?: string
    lastMaintOngoing?: boolean
}

export type Alias = [string, string]

export type DBType = "poi" | "tsundb"
export type Rank = "S" | "A" | "B" | "C" | "D" | "E"
export type padding = 0 | 1

export interface NameTable {
    [key: number]: string
}

export interface DropData {
    map: string
    difficulty: number
    node: string
    rank: Rank
    rate0?: string
    samples0?: string
    rate1?: string
    samples1?: string
    rateTotal: string
    samplesTotal: string
    rateRem?: string
    samplesRem?: string
    totalDrops: number
}

export interface Cache {
    time: number
    dropData: { [key: string]: DropData }
    ship: Ship
    rank: Rank
    loading?: boolean
    generateTime?: number
    error?: boolean
    callback?: (() => Promise<void>)[]
}

export interface Cached {
    [key: string]: Cache
}

export interface DamageType {
    scratch: number
    normal: number
    overkill: number
    damages: Damages
}

export interface Damages {
    [key: number]: number
}


export interface Stages {
    sunk: number
    taiha: number
    chuuha: number
    shouha: number
    ok: number
    overkill: number
    normal: number
    scratch: number
    hps: number[]
    minhp: number
    maxhp: number
    maxdmg: number
    mindmg: number
}

export interface TimeStamps {
    quest: number
    weeklyQuest?: number
    monthlyQuest?: number
    quarterlyQuest?: number
    pvp: number
    rank: number
    monthlyRank: number
    eoReset: number
    monthlyExped: number
}
