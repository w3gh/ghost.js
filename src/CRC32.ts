
export class CRC32 {
    ulTable = new Uint32Array(256);

    CRC32_POLYNOMIAL = 0x04c11db7;

    constructor() {
        this.init();
    }

    init() {
        let ulTable = this.ulTable;

        for (let iCodes = 0; iCodes <= 0xFF; ++iCodes) {
            ulTable[iCodes] = this.reflect(iCodes, 8) << 24;

            for (let iPos = 0; iPos < 8; iPos++)
                ulTable[iCodes] = ( ulTable[iCodes] << 1 ) ^ ( ulTable[iCodes] & (1 << 31) ? this.CRC32_POLYNOMIAL : 0 );

            ulTable[iCodes] = this.reflect(ulTable[iCodes], 32);
        }
    }

    reflect(ulReflect: number, cChar: number) {
        let ulValue = 0;

        for (let iPos = 1; iPos < ( cChar + 1 ); ++iPos) {
            if (ulReflect & 1)
                ulValue |= 1 << ( cChar - iPos );

            ulReflect >>= 1;
        }

        return ulValue;
    }

    fullCRC(sData: Buffer, ulLength: number) {
        let ulCRC = 0xFFFFFFFF;

        ulCRC = this.partialCRC(ulCRC, sData, ulLength);

        const uints = new Uint32Array([ulCRC ^ 0xFFFFFFFF]);

        return uints[0]
    }

    partialCRC(ulInCRC: number, sData: Uint8Array, ulLength: number) {
        let ulTable = this.ulTable;
        let initCRC = ulInCRC;

        for (let index = 0; index < ulLength; index++) {
            const byte = sData[index];
            initCRC = ulTable[(initCRC ^ byte) & 0xff] ^ initCRC >>> 8;
        }

        return initCRC
    }
}