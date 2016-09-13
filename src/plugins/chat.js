import BNetProtocol from '../bnet/BNetProtocol';
import chalk from 'chalk';


// black
// red
// green
// yellow
// blue
// magenta
// cyan
// white
// gray

class ChatEvent {
	/**
	 *
	 * @param {Number} id
	 * @param {Number} ping
	 * @param user
	 * @param message
	 * @param {BNetProtocol} protocol
	 */
	constructor({id, ping, user, message}, protocol) {
		this.id = id;
		this.ping = ping;
		this.user = user;
		this.message = message;
		this.protocol = protocol;
	}

	/**
	 * @returns {String}
	 * @constructor
	 */
	idType() {
		switch (this.id) {
			case this.protocol.EID_SHOWUSER:
				return 'SHOWUSER';
			case this.protocol.EID_JOIN:
				return 'JOIN';
			case this.protocol.EID_LEAVE:
				return 'LEAVE';
			case this.protocol.EID_WHISPER:
				return 'WHISPER';
			case this.protocol.EID_TALK:
				return 'TALK';
			case this.protocol.EID_BROADCAST:
				return 'BROADCAST';
			case this.protocol.EID_CHANNEL:
				return 'CHANNEL';
			case this.protocol.EID_USERFLAGS:
				return 'USERFLAGS';
			case this.protocol.EID_WHISPERSENT:
				return 'WHISPERSENT';
			case this.protocol.EID_CHANNELFULL:
				return 'CHANNELFULL';
			case this.protocol.EID_CHANNELDOESNOTEXIST:
				return 'CHANNELDOESNOTEXIST';
			case this.protocol.EID_CHANNELRESTRICTED:
				return 'CHANNELRESTRICTED';
			case this.protocol.EID_INFO:
				return 'INFO';
			case this.protocol.EID_ERROR:
				return 'ERROR';
			case this.protocol.EID_EMOTE:
				return 'EMOTE';
		}
	}

	isJoin() {
		return this.idType() === 'JOIN';
	}

	isLeave() {
		return this.idType() === 'LEAVE';
	}

	isWhisper() {
		return this.idType() === 'WHISPER';
	}

	isTalk() {
		return this.idType() === 'TALK';
	}

	isError() {
		return this.idType() === 'ERROR';
	}

	isInfo() {
		return this.idType() === 'INFO';
	}

	isEmote() {
		return this.idType() === 'EMOTE';
	}

	printConsole(alias) {
		const bnet = chalk.blue(`BNET[${alias}] `);

		switch (this.idType()) {
			case 'ERROR':
				console.log(bnet + chalk.red(this.message));
				break;
			case 'INFO':
				console.log(bnet + chalk.blue(this.message));
				break;
			case 'WHISPER':
				console.log(bnet + chalk.magenta(`[${this.user}] ${this.message}`));
				break;
			case 'EMOTE':
				console.log(bnet + chalk.yellow(this.user) + ' ' + chalk.gray(this.message));
				break;
			case 'TALK':
				console.log(bnet + chalk.yellow(this.user) + ' ' + this.message);
				break;
		}
	}
}

module.exports = function (config) {
	return {
		/**
		 *
		 * @param {BNet} bnet
		 */
		bnet: function (bnet) {
			bnet.on('SID_CHATEVENT', (that, data) => {
				const event = new ChatEvent(data, that.protocol);

				if (event.isWhisper()) {
					that.emit('whisper', that, event);
				}

				if (event.isTalk()) {
					that.emit('talk', that, event);
				}

				if (event.isEmote()) {
					that.emit('emote', that, event);
				}

				if (event.isJoin()) {
					that.emit('join', that, event);
				}

				if (event.isLeave()) {
					that.emit('leave', that, event);
				}

				if(event.isEmote() && event.message[0] === that.commandTrigger) {
					const argv = event.message.substr(1, event.message.length).split(' ');

					that.emit('command', that, argv);
				}

				if (config.consolePrint) {
					event.printConsole(bnet.alias);
				}
			});
		}
	};
};