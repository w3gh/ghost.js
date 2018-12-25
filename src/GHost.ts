import * as path from 'path';
import * as dgram from 'dgram';
import {getTime} from './util';
import {AdminGame} from './game/AdminGame';
import {Map} from './game/Map';
import {Game} from './game/Game';
import {Bot} from './Bot';
import {createLoggerFor} from './Logger';
import {CRC32} from './CRC32';
import {BNetCollection} from "./bnet/BNetCollection";
import {GhostBNetSIDHandler} from "./ghost/bnet/GhostBNetSIDHandler";
import {GhostBNetSIDReceiver} from "./ghost/bnet/GhostBNetSIDReceiver";
import {Config} from "./Config";

const {debug, info, error} = createLoggerFor('GHost');

export class GHost extends Bot {
    private currentGame?: Game = null;
    private adminGame?: AdminGame = null;
    private bnetExiting: boolean = false;
    private adminExiting: boolean = false;
    public hostCounter: number = 1;
    private lastUpdateTime: number = getTime();
    private games: Game[] = [];

    public udpSocket: dgram.Socket = dgram.createSocket('udp4');
    private haveAdminGame: boolean;
    public TFT: number;
    private hostPort: number;
    private defaultMapName: string;
    public mapConfigsPath: string;
    public war3Path: string;
    private adminGamePort: number;
    private adminGamePassword: string;
    private adminGameMapName: string;
    public lanWar3Version: string;
    // private adminMap: Map;

    public CRC = new CRC32();
    private bnet: BNetCollection;

    constructor(cfg: Config) {
        super(cfg);

        this.configure();

        this.bnet = new BNetCollection(this.cfg, this.TFT, this.hostPort, new GhostBNetSIDHandler(), new GhostBNetSIDReceiver());

        // this.extractScripts();
        this.udpSocketSetup();

        // setTimeout(() => {
        //     this.adminGameSetup();
        // }, 5000); //host admin game after 5 seconds, so all mpq scripts are extracted

        setTimeout(() => {
            this.bnet.queueGetGameList('', 20)
        }, 5000);

        this.on('update', this.onUpdate)
    }

    onUpdate = () => {
        this.lastUpdateTime = getTime();

        if (this.exitingNice) {
            if (this.bnet.isEmpty()) {
                info('deleting all battle.net connections in preparation for exiting nicely');

                this.bnet.destroy();
            }

            if (!this.games.length) {
                //@TODO handle games and child processes
            }
        }

        if (this.bnet.update()) {
            this.bnetExiting = true;
        }

    };

    getMapPath(filename) {
        return path.resolve(path.join(this.mapConfigsPath, `${filename}.json`))
    };

    protected udpSocketSetup() {
        this.udpSocket.on('listening', this.onListening);
        this.udpSocket.on('message', this.onMessage);
        this.udpSocket.on('error', this.onError);
        this.udpSocket.on('close', this.onClose);
        //this.udpSocket.setBroadcast(true);
    }

    // protected extractScripts() {
    //     const mpq = require('mech-mpq');
    //     const fs = require('fs');
    //     const patchPath = path.normalize(`${this.war3Path}/War3Patch.mpq`);
    //     const archive = mpq.openArchive(patchPath);
    //
    //     if (archive) {
    //         info(`loading MPQ file '${patchPath}'`);
    //
    //         // common.j
    //         const commonJ = archive.openFile("Scripts\\common.j");
    //         if (commonJ) {
    //             const commonJContent = commonJ.read();
    //
    //             commonJ.close();
    //
    //             fs.writeFile(`${this.mapConfigsPath}/common.j`, commonJContent, (err) => {
    //                 if (err) throw err;
    //                 info(`extracting Scripts\\common.j from MPQ file to '${this.mapConfigsPath}/common.j'`);
    //             });
    //         }
    //
    //         // blizzard.j
    //         const blizzardJ = archive.openFile("Scripts\\blizzard.j");
    //
    //         if (blizzardJ) {
    //             const blizzardJContent = commonJ.read();
    //
    //             blizzardJ.close();
    //
    //             fs.writeFile(`${this.mapConfigsPath}/blizzard.j`, blizzardJContent, (err) => {
    //                 if (err) throw err;
    //                 info(`extracting Scripts\\blizzard.j from MPQ file to '${this.mapConfigsPath}/blizzard.j'`);
    //             });
    //         }
    //     }
    // }

    onMessage = (...args) => {
        debug('Bot', 'message', ...args);
    };

    onClose = (...args) => {
        debug('Bot', 'close', ...args);
    };

    onError = (...args) => {
        debug('Bot', 'error', ...args);
    };

    onListening = (...args) => {
        debug('Bot', 'listening', ...args);
    };

    protected configure() {
        const config = this.cfg;

        this.TFT = config.item('tft', 1);
        this.hostPort = config.item('bot.hostport', 6112);
        this.defaultMapName = config.item('bot.defaultmap', 'map');
        this.mapConfigsPath = config.item('bot.mapcfgpath', './maps');
        this.war3Path = config.item('bot.war3path', 'war3');

        this.haveAdminGame = config.item('admingame.create', false);
        this.adminGamePort = config.item('admingame.port', 6114);
        this.adminGamePassword = config.item('admingame.password', '');
        this.adminGameMapName = config.item('admingame.map', 'map');

        this.lanWar3Version = config.item('bot.war3version', "26");
    }

    queueBNetsChatCommand(command: string) {
        this.bnet.queueChatCommand(command);
    }
}
