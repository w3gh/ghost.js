import {ByteArray, AssignLength} from './Bytes';
import {createLoggerFor, hex} from "./Logger";

const {debug, info, error} = createLoggerFor('BaseGame');


/**
 * Abstract class for BNet and Game protocols
 * have basic help methods
 */
export class Protocol {
    /**
     * Basic function for construct packets for hosted game
     * @param header Packet header constant
     * @param id Packet type
     * @param args Packet data
     * @returns {Buffer}
     */
    buffer(header: number|string, id: any, ...args: Array<any>): Buffer {
        const buffer = AssignLength(
            ByteArray(
                [
                    [header],
                    [id],
                    [0, 0], //null bytes for length
                    ...args
                ]
            )
        );

        debug('packet', header, id);
        // hex(buffer);

        return buffer;
    }
}

