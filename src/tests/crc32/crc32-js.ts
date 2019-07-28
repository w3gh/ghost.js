import {CRC32} from "../../CRC32";

import fs = require('fs');
import {ByteUInt32, ByteDecodeToString} from "../../Bytes";

function main() {
    const argv = process.argv;

    if (argv.length > 2) {
        const m_CRC = new CRC32();

        if (fs.existsSync(argv[2])) {
            const m_MapData = fs.readFileSync(argv[2]);
            const crc = m_CRC.fullCRC(m_MapData);
            const MapInfo = ByteUInt32(crc);

            console.log(crc);
            console.log(ByteDecodeToString(MapInfo));
            process.exit(0)
        }
    }

    console.log('argv', argv);

    process.exit(1);
}

main();