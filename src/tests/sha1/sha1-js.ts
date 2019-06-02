import crypto = require('crypto');
import fs = require('fs');
import {ByteUInt32, ByteExtractString, ByteDecodeToString, ByteToArrayBuffer} from "../../Bytes";
import {SHA1} from "../../SHA1";

function main() {
    const argv = process.argv;

    if (argv.length > 2) {
        // const m_SHA1 = crypto.createHash('sha1');
        const m_SHA1 = new SHA1();
        m_SHA1.reset();

        if (fs.existsSync(argv[2])) {
            const m_MapData = fs.readFileSync(argv[2]);
            m_SHA1.update(m_MapData.toString());

            const MapSHA1 = m_SHA1.digest();
            console.log(ByteDecodeToString(MapSHA1));
            process.exit(0)
        }
    }

    console.log('argv', argv);

    process.exit(1);
}

main();