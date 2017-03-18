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

            if (event.isError())
                console.log(bnet + chalk.red(event.message));
            if (event.isInfo())
                console.log(bnet + chalk.blue(event.message));
            if (event.isWhisper())
                console.log(bnet + chalk.magenta(`[${event.user}] ${event.message}`));
            if (event.isEmote())
                console.log(bnet + chalk.yellow(event.user) + ' ' + chalk.gray(event.message));
            if (event.isTalk())
                console.log(bnet + chalk.yellow(event.user) + ' ' + event.message);
            if (event.isShowUser())
                console.log(bnet + chalk.yellow(event.user) + ' ' + event.message);
            if (event.isUserFlags())
                console.log(bnet + chalk.yellow(event.user) + ' ' + event.message);
        }
    };
};