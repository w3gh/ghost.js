
import {BNetConnection} from "./BNetConnection";
import {Config} from "../Config";
import {create, hex} from '../Logger';

const {debug, info, error} = create('BNetCollection');

export class BNetCollection {
    private bnets: BNetConnection[] = [];

    constructor(config: Config, TFT: number, hostPort: number) {
        for (let i = 0; i < 32; ++i) {
            const prefix = `bnet.${i}`,
                prefixedConfig = config.slice(prefix);

            if (prefixedConfig) {
                const enabled = prefixedConfig.item('enabled', true);

                if (enabled) {
                    this.bnets.push(
                        new BNetConnection(i, TFT, hostPort, prefixedConfig)
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
