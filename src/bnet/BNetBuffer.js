import {ByteArray, AssignLength} from './../Bytes';

const BNET_HEADER_CONSTANT = '\xff';
const NULL_2 = '\x00\x00';

/**
 * Basic function for construct packets for BNet
 * @param id Packet type
 * @param args Packet data
 * @returns {Buffer}
 * @constructor
 */
export default function BNetBuffer(id, ...args) {
	return AssignLength(ByteArray([BNET_HEADER_CONSTANT, id, NULL_2, ...args]));
};