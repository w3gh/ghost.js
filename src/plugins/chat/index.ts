import {PluginInterface} from '../../Plugin';
import * as chalk from 'chalk';
import {IncomingChatEvent} from "../../bnet/IncomingChatEvent";
import {BNetConnection} from "../../bnet/BNetConnection";

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
        onBNetInit(bnet: BNetConnection) {
            bnet
                .on('SID_CHATEVENT', this.SID_CHATEVENT.bind(this))
                .on('chatCommand', this.chatCommand.bind(this));
        }

        /**
         *
         * @param {BNetConnection} bnet
         * @param {IncomingChatEvent} event
         * @constructor
         */
        SID_CHATEVENT(bnet: BNetConnection, event: IncomingChatEvent) {
            if (this.config.consolePrint) {
                this.print(bnet.alias, event);
            }
        }

        /**
         *
         * @param {BNetConnection} bnet
         * @param {string} command
         */
        chatCommand(bnet: BNetConnection, command: string) {
            if (this.config.consolePrint) {
                console.log(chalk.blue(`BNET[${bnet.alias}] `) + command)
            }
        }

        /**
         *
         * @param {string} BNetAlias
         * @param {IncomingChatEvent} event
         */
        print(BNetAlias: string, event: IncomingChatEvent) {
            const bnet = chalk.blue(`BNET[${BNetAlias}] `);
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
