import {ByteArray, AssignLength} from './Bytes';

/**
 * Abstract class for BNet and Game protocols
 * have basic help methods
 */
export default class Protocol {
	/**
	 * Basic function for construct packets for hosted game
	 * @param header Packet header constant
	 * @param id Packet type
	 * @param args Packet data
	 * @returns {Buffer}
	 */
	buffer(header, id, ...args) {
		return AssignLength(
			ByteArray(
				[
					header,
					id,
					'\x00\x00', //null bytes for length
					...args
				]
			)
		);
	}
}

