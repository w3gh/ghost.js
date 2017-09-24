import {PluginInterface} from '../../src/Plugin';
import * as chalk from 'chalk';
import {IncomingChatEvent} from "../../src/bnet/IncomingChatEvent";

// black
// red
// green
// yellow
// blue
// magenta
// cyan
// white
// gray

module.exports = function (Plugin: PluginInterface) {
    return class Chat extends Plugin {
        /**
         * @param {BNetConnection} bnet
         */
        onBNetInit(bnet) {
            bnet.on('SID_CHATEVENT', this.SID_CHATEVENT.bind(this));
        }

        SID_CHATEVENT(bnet, event: IncomingChatEvent) {
            if (this.config.consolePrint) {
                this.print(bnet.alias, event);
            }
        }

        print(alias, event: IncomingChatEvent) {
            const bnet = chalk.blue(`BNET[${alias}] `);
            let message = '';

            if (event.isError())
                message = bnet + chalk.red(event.message);
            if (event.isInfo())
                message = bnet + chalk.blue(event.message);
            if (event.isWhisper())
                message = bnet + chalk.magenta(`[${event.user}] ${event.message}`);
            if (event.isEmote())
                message = bnet + chalk.yellow(event.user) + ' ' + chalk.gray(event.message);
            if (event.isTalk())
                message = bnet + chalk.yellow(event.user) + ' ' + event.message;
            if (event.isShowUser())
                message = bnet + chalk.yellow(event.user) + ' ' + event.message;
            if (event.isUserFlags())
                message = bnet + chalk.yellow(event.user) + ' ' + event.message;

            message && console.log(message);
        }
    };
};