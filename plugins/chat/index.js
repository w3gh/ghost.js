import {ChatEvent} from './ChatEvent';

// black
// red
// green
// yellow
// blue
// magenta
// cyan
// white
// gray

module.exports = function (Plugin) {
	return class Chat extends Plugin {
		/**
		 * @param {BNet} bnet
		 */
		onBNetInit(bnet) {
			bnet.on('SID_CHATEVENT', this.SID_CHATEVENT.bind(this));
		}

		SID_CHATEVENT(bnet, data) {
			const event = new ChatEvent(data, bnet.protocol);

			if (event.isWhisper()) {
				bnet.emit('whisper', bnet, event);
			}

			if (event.isTalk()) {
				bnet.emit('talk', bnet, event);
			}

			if (event.isEmote()) {
				bnet.emit('emote', bnet, event);
			}

			if (event.isJoin()) {
				bnet.emit('join', bnet, event);
			}

			if (event.isLeave()) {
				bnet.emit('leave', bnet, event);
			}

			if (event.isEmote() && event.message[0] === bnet.commandTrigger) {
				const argv = event.message.substr(1, event.message.length).split(' ');

				bnet.emit('command', bnet, argv);
			}

			if (this.config.consolePrint) {
				event.printConsole(bnet.alias);
			}
		}
	};
};