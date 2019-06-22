import {IPlugin} from '../../Plugin';
import * as chalk from 'chalk';
import {IncomingChatEvent} from "../../bnet/IncomingChatEvent";
import {IBNetConnection} from "../../bnet/IBNetConnection";

// black
// red
// green
// yellow
// blue
// magenta
// cyan
// white
// gray

const stringReverse = (s) => s.split('').reverse().join('');

module.exports = function (Plugin: IPlugin) {
    return class Chat extends Plugin {
        /**
         * @param {IBNetConnection} bnet
         */
        onBNetInit(bnet: IBNetConnection) {
            bnet
                .on('SID_CHATEVENT', this.ON_SID_CHATEVENT)
                .on('chatCommand', this.chatCommand);
        }

        /**
         *
         * @param {IBNetConnection} bnet
         * @param {IncomingChatEvent} event
         * @constructor
         */
        ON_SID_CHATEVENT = (bnet: IBNetConnection, event: IncomingChatEvent) => {
            if (this.config.consolePrint) {
                this.print(bnet.alias, event);
            }
        };

        /**
         *
         * @param {IBNetConnection} bnet
         * @param {string} command
         */
        chatCommand = (bnet: IBNetConnection, command: string) => {
            if (this.config.consolePrint) {
                console.log(chalk.blue(`BNET[${bnet.alias}] `) + command)
            }
        };

        /**
         *
         * @param {string} BNetAlias
         * @param {IncomingChatEvent} event
         */
        print(BNetAlias: string, event: IncomingChatEvent) {
            const alias = chalk.blue(`BNET[${BNetAlias}] `);
            const user = chalk.yellow(event.user);
            let message = '';

            if (event.isError())
                message = alias + chalk.red(event.message);
            if (event.isInfo())
                message = alias + chalk.blue(event.message);
            if (event.isWhisper())
                message = alias + chalk.magenta(`[${event.user}] ${event.message}`);
            if (event.isEmote())
                message = alias + user + ' ' + chalk.gray(event.message);
            if (event.isTalk())
                message = alias + user + ' ' + event.message;
            if (event.isShowUser())
                message = alias + user + ' SHOW USER ' + stringReverse(event.message);
            if (event.isUserFlags())
                message = alias + user+ ' FLAGS ' + stringReverse(event.message);

            message && console.log(message);
        }
    };
};
