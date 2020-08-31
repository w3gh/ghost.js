import * as fs from 'fs';
import * as path from 'path';

import {BytesExtract, BYTEARRAY, ByteArray, ByteUInt32, ByteDecodeToString} from '../Bytes';
import {GameSlot} from './GameSlot';
import {createLoggerFor} from '../Logger';
import {Config} from "../Config";
import {GHost} from "../GHost";
import {arch} from "os";
import {MPQ} from "../storm";

const {debug, info, error} = createLoggerFor('Map');

export interface MapJSON {
    localpath: string,
    path: string,
    size: BYTEARRAY,
    info: BYTEARRAY,
    crc: BYTEARRAY,
    sha1: BYTEARRAY,
    speed: number,
    visibility: number,
    observers: number,
    flags: number,
    gametype: number,
    width: BYTEARRAY,
    height: BYTEARRAY
    players: number,
    teams: number,
    slots: Array<number>
}

export class Map {
    static SPEED_SLOW = 1;
    static SPEED_NORMAL = 2;
    static SPEED_FAST = 3;
    static VIS_HIDETERRAIN = 1;
    static VIS_EXPLORED = 2;
    static VIS_ALWAYSVISIBLE = 3;
    static VIS_DEFAULT = 4;
    static OBS_NONE = 1;
    static OBS_ONDEFEAT = 2;
    static OBS_ALLOWED = 3;
    static OBS_REFEREES = 4;
    static FLAG_TEAMSTOGETHER = 1;
    static FLAG_FIXEDTEAMS = 2;
    static FLAG_UNITSHARE = 4;
    static FLAG_RANDOMHERO = 8;
    static FLAG_RANDOMRACES = 16;
    static OPT_HIDEMINIMAP = 1 << 0;
    static OPT_MODIFYALLYPRIORITIES = 1 << 1;
    static OPT_MELEE = 1 << 2;		// the bot cares about this one...
    static OPT_REVEALTERRAIN = 1 << 4;
    static OPT_FIXEDPLAYERSETTINGS = 1 << 5;
    // and this one...
    static OPT_CUSTOMFORCES = 1 << 6;
    // and this one the rest don't affect the bot's logic
    static OPT_CUSTOMTECHTREE = 1 << 7;
    static OPT_CUSTOMABILITIES = 1 << 8;
    static OPT_CUSTOMUPGRADES = 1 << 9;
    static OPT_WATERWAVESONCLIFFSHORES = 1 << 11;
    static OPT_WATERWAVESONSLOPESHORES = 1 << 12;
    static FILTER_MAKER_USER = 1;
    static FILTER_MAKER_BLIZZARD = 2;
    static FILTER_TYPE_MELEE = 1;
    static FILTER_TYPE_SCENARIO = 2;
    static FILTER_SIZE_SMALL = 1;
    static FILTER_SIZE_MEDIUM = 2;
    static FILTER_SIZE_LARGE = 4;
    static FILTER_OBS_FULL = 1;
    static FILTER_OBS_ONDEATH = 2;
    static FILTER_OBS_NONE = 4;
    static TYPE_UNKNOWN0 = 1;
    // always set except for saved games?
    // AuthenticatedMakerBlizzard = 1 << 3
    // OfficialMeleeGame = 1 << 5
    static TYPE_SAVEDGAME = 1 << 9;
    static TYPE_PRIVATEGAME = 1 << 11;
    static TYPE_MAKERUSER = 1 << 13;
    static TYPE_MAKERBLIZZARD = 1 << 14;
    static TYPE_TYPEMELEE = 1 << 15;
    static TYPE_TYPESCENARIO = 1 << 16;
    static TYPE_SIZESMALL = 1 << 17;
    static TYPE_SIZEMEDIUM = 1 << 18;
    static TYPE_SIZELARGE = 1 << 19;
    static TYPE_OBSFULL = 1 << 20;
    static TYPE_OBSONDEATH = 1 << 21;
    static TYPE_OBSNONE = 1 << 22;

    private gameFlags: number = 0;
    public slots: GameSlot[] = [];
    private valid: boolean;
    public mapPath: string;
    public mapSize: Buffer;
    public mapInfo: Buffer;
    public mapCRC: Buffer;
    public mapSHA1: Buffer;
    private speed: number;
    private visibility: number;
    private observers: number;
    private flags: number;
    private filterMarker: number;
    private filterType: number;
    private filterSize: number;
    private filterObserver: number;
    private options: number;
    public mapWidth: Buffer;
    public mapHeight: Buffer;
    public mapNumPlayers: number;
    public mapNumTeams: number;

    constructor(private ghost: GHost, path) {
        if (!this.load(path)) {
            this.loadDefaultMap();
        }
    }

    loadDefaultMap() {
        /**
         [AURA] extracting Scripts\common.j from MPQ file to [mapcfgs/common.j]
         [AURA] extracting Scripts\blizzard.j from MPQ file to [mapcfgs/blizzard.j]
         [CONFIG] loading file [mapcfgs/emerlands.cfg]
         [MAP] loading MPQ file [maps/(12)EmeraldGardens.w3x]
         [MAP] calculated map_size = 67 224 4 0
         [MAP] calculated map_info = 147 79 155 253
         [MAP] calculated map_crc = 108 250 204 59
         [MAP] calculated map_sha1 = 35 81 104 182 223 63 204 215 1 17 87 234 220 66 3 185 82 99 6 13
         [MAP] calculated map_options = 4
         [MAP] calculated map_width = 172 0
         [MAP] calculated map_height = 172 0
         [MAP] calculated map_numplayers = 12
         [MAP] calculated map_numteams = 1
         [MAP] calculated map_slot1 = 0 255 0 0 0 0 1 1 100
         [MAP] calculated map_slot2 = 0 255 0 0 0 1 2 1 100
         [MAP] calculated map_slot3 = 0 255 0 0 0 2 8 1 100
         [MAP] calculated map_slot4 = 0 255 0 0 0 3 4 1 100
         [MAP] calculated map_slot5 = 0 255 0 0 0 4 1 1 100
         [MAP] calculated map_slot6 = 0 255 0 0 0 5 2 1 100
         [MAP] calculated map_slot7 = 0 255 0 0 0 6 8 1 100
         [MAP] calculated map_slot8 = 0 255 0 0 0 7 4 1 100
         [MAP] calculated map_slot9 = 0 255 0 0 0 8 1 1 100
         [MAP] calculated map_slot10 = 0 255 0 0 0 9 2 1 100
         [MAP] calculated map_slot11 = 0 255 0 0 0 10 8 1 100
         [MAP] calculated map_slot12 = 0 255 0 0 0 11 4 1 100
         [MAP] found melee map, initializing slots
         [MAP] adding 12 observer slots
         */
        this.valid = true;
        this.mapPath = 'Maps\\FrozenThrone\\(12)EmeraldGardens.w3x';
        this.mapSize = BytesExtract('67 224 4 0', 4);
        this.mapInfo = BytesExtract('147 79 155 253', 4);
        this.mapCRC = BytesExtract('108 250 204 59', 4);
        this.mapSHA1 = BytesExtract('35 81 104 182 223 63 204 215 1 17 87 234 220 66 3 185 82 99 6 13', 20);

        info('using hardcoded Emerald Gardens map data for Warcraft 3 version 1.27 & 1.27b');

        this.speed = Map.SPEED_FAST;
        this.visibility = Map.VIS_DEFAULT;
        this.observers = Map.OBS_NONE;
        this.flags = Map.FLAG_TEAMSTOGETHER | Map.FLAG_FIXEDTEAMS;
        this.filterMarker = Map.FILTER_MAKER_BLIZZARD;
        this.filterType = Map.FILTER_TYPE_MELEE;
        this.filterSize = Map.FILTER_SIZE_LARGE;
        this.filterObserver = Map.FILTER_OBS_NONE;
        this.options = Map.OPT_MELEE;

        this.mapWidth = BytesExtract('172 0', 2);
        this.mapHeight = BytesExtract('172 0', 2);

        this.mapNumPlayers = 12;
        this.mapNumTeams = 1;

        this.slots = [
            new GameSlot(0, 255, GameSlot.STATUS_OPEN, 0, 0, 0, GameSlot.RACE_RANDOM | GameSlot.RACE_SELECTABLE),
            new GameSlot(0, 255, GameSlot.STATUS_OPEN, 0, 1, 1, GameSlot.RACE_RANDOM | GameSlot.RACE_SELECTABLE),
            new GameSlot(0, 255, GameSlot.STATUS_OPEN, 0, 2, 2, GameSlot.RACE_RANDOM | GameSlot.RACE_SELECTABLE),
            new GameSlot(0, 255, GameSlot.STATUS_OPEN, 0, 3, 3, GameSlot.RACE_RANDOM | GameSlot.RACE_SELECTABLE),
            new GameSlot(0, 255, GameSlot.STATUS_OPEN, 0, 4, 4, GameSlot.RACE_RANDOM | GameSlot.RACE_SELECTABLE),
            new GameSlot(0, 255, GameSlot.STATUS_OPEN, 0, 5, 5, GameSlot.RACE_RANDOM | GameSlot.RACE_SELECTABLE),
            new GameSlot(0, 255, GameSlot.STATUS_OPEN, 0, 6, 6, GameSlot.RACE_RANDOM | GameSlot.RACE_SELECTABLE),
            new GameSlot(0, 255, GameSlot.STATUS_OPEN, 0, 7, 7, GameSlot.RACE_RANDOM | GameSlot.RACE_SELECTABLE),
            new GameSlot(0, 255, GameSlot.STATUS_OPEN, 0, 8, 8, GameSlot.RACE_RANDOM | GameSlot.RACE_SELECTABLE),
            new GameSlot(0, 255, GameSlot.STATUS_OPEN, 0, 9, 9, GameSlot.RACE_RANDOM | GameSlot.RACE_SELECTABLE),
            new GameSlot(0, 255, GameSlot.STATUS_OPEN, 0, 10, 10, GameSlot.RACE_RANDOM | GameSlot.RACE_SELECTABLE),
            new GameSlot(0, 255, GameSlot.STATUS_OPEN, 0, 11, 11, GameSlot.RACE_RANDOM | GameSlot.RACE_SELECTABLE)
        ];

        this.calculateHashes();
    }

    load(filepath) {
        if (!fs.existsSync(filepath)) {
            error(`Failed to load map from ${filepath}`);
            return false;
        }

        const file = new Config(filepath);

        this.valid = true;
        this.mapPath = file.item('path', '');
        this.mapSize = ByteArray(file.item('size', []));
        this.mapInfo = ByteArray(file.item('info', []));
        this.mapCRC = ByteArray(file.item('crc', []));
        this.mapSHA1 = ByteArray(file.item('sha1', []));

        info('using loaded', this.mapPath);

        this.speed = file.item('speed', Map.SPEED_NORMAL);
        this.flags = file.item('flags', 0);
        this.observers = file.item('observers', 0);
        this.visibility = file.item('visibility', 0);
        this.filterType = Map.FILTER_TYPE_MELEE;
        this.filterSize = Map.FILTER_SIZE_LARGE;
        this.filterMarker = Map.FILTER_MAKER_BLIZZARD;
        this.filterObserver = Map.FILTER_OBS_NONE;
        this.options = Map.OPT_MELEE;

        this.mapWidth = ByteArray(file.item('width', []));
        this.mapHeight = ByteArray(file.item('height', []));

        this.mapNumPlayers = file.item('players', 0);
        this.mapNumTeams = file.item('teams', 0);

        if (Array.isArray(file.item('slots'))) {
            for (let slot of file.item('slots', [])) {
                this.slots.push(new GameSlot(
                    slot[0],
                    slot[1],
                    slot[2],
                    slot[3],
                    slot[4],
                    slot[5],
                    slot[6],
                    slot[7],
                    slot[8]
                ));
            }
        } else {
            error('no slots in map')
        }
    }

    calculateHashes() {
        const localMapPath = path.join.apply(path, this.mapPath.split('\\').map(path.normalize.bind(path)));
        const mapPath = path.join(this.ghost.war3Path, localMapPath);
        let mapSize, mapInfo, mapCRC, mapSHA1;

        if (fs.existsSync(mapPath)) {
            try {
                const mapFile = fs.readFileSync(mapPath);

                this.readMPQ(mapPath, (mapMPQ) => {
                    info(`loading MPQ file [${mapPath}]`);

                    mapSize = ByteUInt32(mapFile.length);
                    info(`calculated map_size = ${ByteDecodeToString(mapSize)}`);

                    const crc = this.ghost.CRC.fullCRC(mapFile);

                    mapInfo = ByteUInt32(crc);
                    info(`calculated map_info = ${ByteDecodeToString(mapInfo)}`);

                    const {SHA1} = this.ghost;
                    const commonJPath = path.join(this.ghost.mapConfigsPath, 'common.j');
                    const commonJ = fs.readFileSync(commonJPath);

                    SHA1.reset();

                    if (!commonJ.length) {
                        info(`unable to calculate map_crc/sha1 - unable to read file '${commonJPath}'`)
                    } else {
                        const blizzardJPath = path.join(this.ghost.mapConfigsPath, 'blizzard.j');
                        const blizzardJ = fs.readFileSync(blizzardJPath);

                        if (!blizzardJ.length) {
                            info(`unable to calculate map_crc/sha1 - unable to read file '${blizzardJPath}'`);
                        } else {
                            let val = 0; //uint32

                            let overrodeCommonJ = false;
                            let overrodeBlizzardJ = false;

                            // override common.j
                            const mapCommonJ = this.readMPQFile(mapMPQ, 'Scripts\\common.j');

                            if (mapCommonJ) {
                                info(`overriding default common.j with map copy while calculating map_crc/sha1`);
                                overrodeCommonJ = true;

                                val = val ^ this.XORRotateLeft(mapCommonJ, mapCommonJ.byteLength());
                                SHA1.update(mapCommonJ);
                            }

                            if (!overrodeCommonJ) {
                                val = val ^ this.XORRotateLeft(commonJ, commonJ.length);
                                SHA1.update(commonJ);
                            }

                            // override blizzard.j
                            const mapBlizzardJ = this.readMPQFile(mapMPQ, 'Scripts\\blizzard.j');

                            if (mapBlizzardJ) {
                                info(`overriding default blizzard.j with map copy while calculating map_crc/sha1`);
                                overrodeBlizzardJ = true;

                                val = val ^ this.XORRotateLeft(mapBlizzardJ, mapBlizzardJ.length);
                                SHA1.update(mapBlizzardJ);
                            }

                            if (!overrodeBlizzardJ) {
                                val = val ^ this.XORRotateLeft(blizzardJ, blizzardJ.length);
                                SHA1.update(blizzardJ);
                            }

                            val = this.ROTL(val, 3);
                            val = this.ROTL(val ^ 0x03F1379E, 3);
                            SHA1.update("\x9E\x37\xF1\x03");

                            const mapFilesList = [
                                "war3map.j",
                                "scripts\\war3map.j",
                                "war3map.w3e",
                                "war3map.wpm",
                                "war3map.doo",
                                "war3map.w3u",
                                "war3map.w3b",
                                "war3map.w3d",
                                "war3map.w3a",
                                "war3map.w3q"
                            ];

                            let foundMapScript = false;

                            for (let mapFile of mapFilesList) {

                                // don't use scripts\war3map.j if we've already used war3map.j (yes, some maps have both but only war3map.j is used)
                                if (foundMapScript && mapFile === "scripts\\war3map.j") {
                                    continue;
                                }

                                let mapFileData = this.readMPQFile(mapMPQ, mapFile);

                                if (mapFileData) {
                                    if (mapFile === "war3map.j" || mapFile === "scripts\\war3map.j")
                                        foundMapScript = true;

                                    val = this.ROTL(val ^ this.XORRotateLeft(mapFileData, mapFileData.length), 3);
                                    SHA1.update(mapFileData);
                                }
                            }

                            !foundMapScript && info(`couldn't find war3map.j or scripts\\war3map.j in MPQ file, calculated map_crc/sha1 is probably wrong`);

                            // mapCRC = ByteUInt32(val);
                            // info(`calculated map_crc = ${ByteDecodeToString(mapCRC)}`);
                            //
                            // mapSHA1 = SHA1.digest();
                            // info(`calculated map_sha1 = ${ByteDecodeToString(mapSHA1)}`);
                        }
                    }
                });
            } catch (e) {
                error(e.message);
                info(`unable to calculate map_crc/sha1 - map MPQ file ${mapPath} not loaded`)
            }

        } else {
            error(`unable to calculate map_crc/sha1 - map MPQ file ${mapPath} not found`);
        }

        if (mapSize) {
            this.mapSize = mapSize;
        }

        if (mapInfo) {
            this.mapInfo = mapInfo;
        }

        if (mapCRC) {
            this.mapCRC = mapCRC;
        }

        if (mapSHA1) {
            this.mapSHA1 = mapSHA1;
        }
    }

    readMPQ(mpqPath, cb) {
        return MPQ.open(mpqPath, null, cb);
    }

    readMPQFile(archive, filename) {
        if (archive.files.contains(filename)) {
            const file = archive.files.get(filename);
            const fileContents = file.data;
            file.close();

            return fileContents;
        }

        return null;
    }

    getGameFlags() {
        /*
         Speed: (mask 0x00000003) cannot be combined
         0x00000000 - Slow game speed
         0x00000001 - Normal game speed
         0x00000002 - Fast game speed
         Visibility: (mask 0x00000F00) cannot be combined
         0x00000100 - Hide terrain
         0x00000200 - Map explored
         0x00000400 - Always visible (no fog of war)
         0x00000800 - Default
         Observers/Referees: (mask 0x40003000) cannot be combined
         0x00000000 - No Observers
         0x00002000 - Observers on Defeat
         0x00003000 - Additional players as observer allowed
         0x40000000 - Referees
         Teams/Units/Hero/Race: (mask 0x07064000) can be combined
         0x00004000 - Teams Together (team members are placed at neighbored starting locations)
         0x00060000 - Fixed teams
         0x01000000 - Unit share
         0x02000000 - Random hero
         0x04000000 - Random races
         */

        this.gameFlags = 0;

        // speed
        switch (this.speed) {
            case Map.SPEED_SLOW:
                this.gameFlags = 0x00000000;
                break;
            case Map.SPEED_NORMAL:
                this.gameFlags = 0x00000001;
                break;
            default:
                this.gameFlags = 0x00000002;
                break;
        }

        // visibility
        switch (this.visibility) {
            case Map.VIS_HIDETERRAIN:
                this.gameFlags |= 0x00000100;
                break;
            case Map.VIS_EXPLORED:
                this.gameFlags |= 0x00000200;
                break;
            case Map.VIS_ALWAYSVISIBLE:
                this.gameFlags |= 0x00000400;
                break;
            default:
                this.gameFlags |= 0x00000800;
        }

        // observers
        switch (this.observers) {
            case Map.OBS_ONDEFEAT:
                this.gameFlags |= 0x00002000;
                break;
            case Map.OBS_ALLOWED:
                this.gameFlags |= 0x00003000;
                break;
            case Map.OBS_REFEREES:
                this.gameFlags |= 0x40000000;
                break;
        }

        if (this.flags & Map.FLAG_TEAMSTOGETHER) {
            this.gameFlags |= 0x00004000;
        }
        if (this.flags & Map.FLAG_FIXEDTEAMS) {
            this.gameFlags |= 0x00060000;
        }
        if (this.flags & Map.FLAG_UNITSHARE) {
            this.gameFlags |= 0x01000000;
        }
        if (this.flags & Map.FLAG_RANDOMHERO) {
            this.gameFlags |= 0x02000000;
        }
        if (this.flags & Map.FLAG_RANDOMRACES) {
            this.gameFlags |= 0x04000000;
        }

        return ByteUInt32(this.gameFlags);
    }

    getLayoutStyle(): number {
        // 0 = melee
        // 1 = custom forces
        // 2 = fixed player settings (not possible with the Warcraft III map editor)
        // 3 = custom forces + fixed player settings

        if (!(this.options & Map.OPT_CUSTOMFORCES))
            return 0;

        if (!(this.options & Map.OPT_FIXEDPLAYERSETTINGS))
            return 1;

        return 3;
    }

    getOptions() {
       return this.options;
    }

    getFlags() {
        return this.flags;
    }

    getPath() {
        return this.mapPath
    }

    getSize() {
        return this.mapSize
    }

    getInfo() {
        return this.mapInfo
    }

    getCRC() {
        return this.mapCRC
    }

    getSHA1() {
        return this.mapSHA1
    }

    ROTL(x, n) {
        return ((x) << (n)) | ((x) >> (32 - (n)));
    }

    ROTR(x, n) {
        return ((x) >> (n)) | ((x) << (32 - (n)));
    }

    XORRotateLeft(data, length) {
        // a big thank you to Strilanc for figuring this out

        let i = 0;
        let Val = 0;

        if (length > 3) {
            while (i < length - 3) {
                Val = this.ROTL(Val ^ ( data[i] + ( data[i + 1] << 8 ) + ( data[i + 2] << 16 ) + ( data[i + 3] << 24 ) ), 3);
                i += 4;
            }
        }

        while (i < length) {
            Val = this.ROTL(Val ^ data[i], 3);
            ++i;
        }

        return Val;
    }
}
