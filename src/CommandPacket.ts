/**
 * @param {Number} type
 * @param {Number} id
 * @param {Buffer} buffer
 * @constructor
 */
export class CommandPacket {
    constructor(public type: Number, public id: number, public buffer: Buffer) {}
}
