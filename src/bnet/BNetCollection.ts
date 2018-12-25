
import {BNetConnection} from "./BNetConnection";
import {Config} from "../Config";
import {createLoggerFor, hex} from '../Logger';
import {IBNetSIDReceiver} from "./IBNetSIDReceiver";
import {IBNetSIDHandler} from "./IBNetSIDHandler";
import {IBNet} from "./IBNet";

const {debug, info, error} = createLoggerFor('BNetCollection');

const MAX_CONNECTIONS = 32;

export class BNetCollection implements IBNet {
    private bnets: BNetConnection[] = [];

    constructor(config: Config, TFT: number, hostPort: number, packetHandler: IBNetSIDHandler, packetReceiver: IBNetSIDReceiver) {
        for (let i = 0; i < MAX_CONNECTIONS; ++i) {
            const prefix = `bnet.${i}`,
                prefixedConfig = config.slice(prefix);

            if (prefixedConfig) {
                const enabled = prefixedConfig.item('enabled', true);

                if (enabled) {
                    this.bnets.push(
                        new BNetConnection(i, TFT, hostPort, prefixedConfig, packetHandler, packetReceiver)
                    );
                }
            }
        }

        if (this.bnets.length < 1) {
            error('no battle.net connections found in config')
        }
    }

    isEmpty() {
        return this.bnets.length === 0;
    }

    destroy() {
        this.disconnect();

        this.bnets = []
    }

    private execAll(cb: (bnet: IBNet) => void) {
        this.bnets.forEach(cb)
    }

    sendJoinChannel(channel: string) {
        this.execAll(bn => bn.sendJoinChannel(channel))
    }

    sendGetFriendsList() {
        this.execAll(bn => bn.sendGetFriendsList())
    }

    sendGetClanList() {
        this.execAll(bn => bn.sendGetClanList())
    }

    queueEnterChat() {
        this.execAll(bn => bn.queueEnterChat())
    }

    queueWhisperCommand(username: string, command: string) {
        this.execAll(bn => bn .queueWhisperCommand(username, command))
    }

    queueJoinGame(gameName: string) {
        this.execAll(bn => bn.queueJoinGame(gameName))
    }

    queueChatCommand(command: string) {
        this.execAll(bn => bn.queueChatCommand(command))
    }

    queueGetGameList(gameName = '', numGames = 1) {
        this.execAll(bn => bn.queueGetGameList(gameName, numGames))
    }

    update() {
        for (let bnet of this.bnets) {
            if (bnet.update()) {
                return true;
            }
        }

        return false;
    }

    disconnect() {
        this.bnets.forEach((bn) => bn.disconnect());
    }
}
