
import {BNetConnection} from "./BNetConnection";
import {Config} from "../Config";
import {create, hex} from '../Logger';
import {IBNetSIDReceiver} from "./IBNetSIDReceiver";
import {IBNetSIDHandler} from "./IBNetSIDHandler";

const {debug, info, error} = create('BNetCollection');

const MAX_CONNECTIONS = 32;

export class BNetCollection {
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

    queueChatCommand(command: string) {
        this.bnets.forEach((bn) => bn.queueChatCommand(command))
    }

    queueGetGameList(gameName = '', numGames = 1) {
        this.bnets.forEach((bn) => bn.queueGetGameList(gameName, numGames))
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
