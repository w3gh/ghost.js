import {ByteExtractString, ByteExtractUInt32, ValidateLength} from "../Bytes";
import {IncomingGameHost} from "./IncomingGameHost";

const reverse = (n: number) => parseInt(String(n).split('').reverse().join(''), 10);

export class SIDGetAdvListEx {
    constructor(buff: Buffer) {
        // 2 bytes					-> Header
        // 2 bytes					-> Length
        // 4 bytes					-> GamesFound
        // for( 1 .. GamesFound )
        //		2 bytes				-> GameType
        //		2 bytes				-> Parameter
        //		4 bytes				-> Language ID
        //		2 bytes				-> AF_INET
        //		2 bytes				-> Port
        //		4 bytes				-> IP
        //		4 bytes				-> zeros
        //		4 bytes				-> zeros
        //		4 bytes				-> Status
        //		4 bytes				-> ElapsedTime
        //		null term string	-> GameName
        //		1 byte				-> GamePassword
        //		1 byte				-> SlotsTotal
        //		8 bytes				-> HostCounter (ascii hex format)
        //		null term string	-> StatString

        let games = [];

        if (ValidateLength(buff) && buff.length >= 8) {
            let i = 8;
            let gamesFound = buff.readInt32LE(4);

            if (gamesFound > 0 && buff.length >= 25) {
                while (gamesFound > 0) {
                    gamesFound--;

                    if (buff.length < i + 33)
                        break;

                    const gameType = buff.readInt16LE(i);
                    i += 2;
                    const parameter = buff.readInt16LE(i);
                    i += 2;
                    const languageID = buff.readInt32LE(i);
                    i += 4;
                    // AF_INET
                    i += 2;
                    const port = reverse(buff.readInt32LE(i));
                    const ip = buff.slice(i, i + 4);
                    i += 4;
                    // zeros
                    i += 4;
                    // zeros
                    i += 4;
                    const status = buff.readInt32LE(i);
                    i += 4;
                    const elapsedTime = buff.readInt32LE(i);
                    i += 4;
                    const gameName = ByteExtractString(buff.slice(i));
                    i += gameName.length + 1;

                    if (buff.length < i + 1)
                        break;

                    const gamePassword = ByteExtractString(buff.slice(i));
                    i += gamePassword.length + 1;

                    if (buff.length < i + 10)
                        break;

                    // SlotsTotal is in ascii hex format
                    const slotsTotal = buff[i];
                    i++;

                    let hostCounterRaw = buff.slice(i, i + 8);
                    let hostCounterString = hostCounterRaw.toString();
                    let hostCounter = 0;

                    for (let j = 0; j < 4; j++) {
                        let c = hostCounterString.substr(j * 2, 2);

                        hostCounter |= parseInt(c) << ( 24 - j * 8 );
                    }

                    i += 8;
                    let statString = ByteExtractString(buff.slice(i));
                    i += statString.length + 1;

                    games.push(
                        new IncomingGameHost(
                            gameType,
                            parameter,
                            languageID,
                            port,
                            ip,
                            status,
                            elapsedTime,
                            gameName,
                            slotsTotal,
                            hostCounter,
                            statString
                        )
                    );
                }
            }
        }

        // console.log('games', games);

        return games;
    }
}
