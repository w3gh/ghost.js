import * as path from 'path';
import * as dgram from 'dgram';
import {getTicks, getTime, localIP} from './util';
import {BNetConnection} from './bnet/BNetConnection';
import {AdminGame} from './game/AdminGame';
import {Map} from './game/Map';
import {Game} from './game/Game';
import {Bot} from './Bot';
import {create} from './Logger';

const {debug, info, error} = create('GHost');

export class GHost extends Bot {
    private currentGame?: Game = null;
    private adminGame?: AdminGame = null;
    private exitingNice: boolean = false;
    private bnetExiting: boolean = false;
    private adminExiting: boolean = false;
    public hostCounter: number = 1;
    private lastUpdateTime: number = getTime();
    private bnets: BNetConnection[] = [];
    private games: Game[] = [];

    public udpSocket: dgram.Socket = dgram.createSocket('udp4');
    private haveAdminGame: boolean;
    public TFT: number;
    private hostPort: number;
    private defaultMapName: string;
    private mapConfigsPath: string;
    private war3Path: string;
    private adminGamePort: number;
    private adminGamePassword: string;
    private adminGameMapName: string;
    public lanWar3Version: string;
    private adminMap: Map;

    constructor(cfg) {
        super(cfg);

        this.configure();
        this.configureBNet();

        this.extractScripts();
        this.udpSocketSetup();
        this.adminGameSetup();

        this.on('update', this.onUpdate)
    }

    onUpdate = () => {
        this.lastUpdateTime = getTime();

        if (this.exitingNice) {
            if (this.bnets.length) {
                info('deleting all battle.net connections in preparation for exiting nicely');

                this.bnets.forEach((bn) => bn.disconnect());
                this.bnets = [];
            }

            if (this.currentGame) {
                info('deleting current game in preparation for exiting nicely');
                this.currentGame.close();
                this.currentGame = null;
            }

            if (this.adminGame) {
                info('deleting admin game in preparation for exiting nicely');
                this.adminGame.close();
                this.adminGame = null;
            }

            if (!this.games.length) {
                //@TODO handle games and child processes
            }
        }

        if (this.bnets.length) {
            for (let bnet of this.bnets) {
                if (bnet.update()) {
                    this.bnetExiting = true;
                }
            }
        }

        if (this.adminGame) {
            if (this.adminGame.update()) {
                info('deleting admin game');
                this.adminGame = null;
                this.adminExiting = true;
            }
        }
    };

    getMapPath(filename) {
        return path.resolve(path.join(this.mapConfigsPath, `${filename}.json`))
    };

    udpSocketSetup() {
        this.udpSocket.on('listening', this.onListening);
        this.udpSocket.on('message', this.onMessage);
        this.udpSocket.on('error', this.onError);
        this.udpSocket.on('close', this.onClose);
        //this.udpSocket.setBroadcast(true);
    }

    extractScripts() {
        const mpq = require('mech-mpq');
        const fs = require('fs');
        const patchPath = `${this.war3Path}/War3Patch.mpq`;

        const archive = mpq.openArchive(patchPath);

        if (archive) {
            info(`loading MPQ file [${patchPath}]`);

            // common.j
            const commonJ = archive.openFile("Scripts\\common.j");
            if (commonJ) {
                const commonJContent = commonJ.read();

                commonJ.close();

                fs.writeFile(`${this.mapConfigsPath}/common.j`, commonJContent, (err) => {
                    if (err) throw err;
                    info(`extracting Scripts\\common.j from MPQ file to [${this.mapConfigsPath}/common.j]`);
                });
            }

            // blizzard.j
            const blizzardJ = archive.openFile("Scripts\\blizzard.j");
            if (blizzardJ) {
                const blizzardJContent = commonJ.read();

                blizzardJ.close();

                fs.writeFile(`${this.mapConfigsPath}/blizzard.j`, blizzardJContent, (err) => {
                    if (err) throw err;
                    info(`extracting Scripts\\blizzard.j from MPQ file to [${this.mapConfigsPath}/blizzard.j]`);
                });
            }
        }
    }

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

    configure() {
        const config = this.cfg;

        this.TFT = config.item('tft', 1);
        this.hostPort = config.item('bot.hostport', 6112);
        this.defaultMapName = config.item('bot.defaultmap', 'map');
        this.mapConfigsPath = config.item('bot.mapcfgpath', './maps');
        this.war3Path = config.item('bot.war3path', 'war3');

        this.haveAdminGame = this.cfg.item('admingame.create', false);
        this.adminGamePort = this.cfg.item('admingame.port', 6114);
        this.adminGamePassword = this.cfg.item('admingame.password', '');
        this.adminGameMapName = this.cfg.item('admingame.map', 'map');

        this.lanWar3Version = this.cfg.item('bot.war3version', "26");
    }

    configureBNet() {
        const config = this.cfg;

        for (let i = 0; i < 32; ++i) {
            const prefix = `bnet.${i}`,
                prefixedConfig = config.slice(prefix);

            if (prefixedConfig) {
                const enabled = prefixedConfig.item('enabled', true);

                if (enabled) {
                    this.bnets.push(
                        new BNetConnection(i, this.TFT, this.hostPort, prefixedConfig)
                    );
                }
            }
        }

        if (this.bnets.length < 1) {
            error('no battle.net connections found in config')
        }
    }

    adminGameSetup() {
        this.adminMap = new Map(this.getMapPath(this.adminGameMapName));

        if (this.haveAdminGame) {
            this.adminGame = new AdminGame(
                this,
                this.adminMap, null,
                this.adminGamePort,
                0,
                'Admin Game',
                'JiLiZART'
            );
        }
    }
}