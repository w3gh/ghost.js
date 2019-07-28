import crc32 from 'crc/lib/es6/crc32';

export class CRC32 {
    fullCRC(sData: Buffer) {
        return crc32(sData)
    }
}