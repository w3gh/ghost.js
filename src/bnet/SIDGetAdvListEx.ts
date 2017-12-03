import {ByteExtractString, ValidateLength} from "../Bytes";
import {IncomingGameHost} from "./IncomingGameHost";

export class SIDGetAdvListEx {
    constructor(buff: Buffer) {
        // 2 bytes					-> Header
        // 2 bytes					-> Length
        // 4 bytes					-> GamesFound
        // if( GamesFound > 0 )
        //		10 bytes			-> ???
        //		2 bytes				-> Port
        //		4 bytes				-> IP
        //		null term string	-> GameName
        //		2 bytes				-> ???
        //		8 bytes				-> HostCounter

        let games = [];

        if (ValidateLength(buff) && buff.length >= 8) {
            let i = 8;
            let gamesFound = buff.readInt32LE(4);

            console.log('gamesFound', gamesFound, buff);

            if (gamesFound > 0 && buff.length >= 25) {
                while (gamesFound > 0) {
                    gamesFound--;

                    if (buff.length < i + 33)
                        break;

                    let gameType = buff.readInt16LE(i);
                    i += 2;
                    let parameter = buff.readInt16LE(i);
                    i += 2;
                    let languageID = buff.readInt32LE(i);
                    i += 4;
                    // AF_INET
                    i += 2;
                    let port = buff.readInt32LE(i);
                    let ip = buff.slice(i, i + 4);
                    i += 4;
                    // zeros
                    i += 4;
                    // zeros
                    i += 4;
                    let status = buff.readInt32LE(i);
                    i += 4;
                    let elapsedTime = buff.readInt32LE(i);
                    i += 4;
                    let gameName = ByteExtractString(buff.slice(i));
                    i += gameName.length + 1;

                    if (buff.length < i + 1)
                        break;

                    let gamePassword = ByteExtractString(buff.slice(i));
                    i += gamePassword.length + 1;

                    if (buff.length < i + 10)
                        break;

                    // SlotsTotal is in ascii hex format
                    let slotsTotal = buff[i];
                    i++;

                    let hostCounterRaw = buff.slice(i, i + 8);
                    let hostCounterString = hostCounterRaw.toString();
                    let hostCounter = 0;

                    //@TODO handle hostCounter from hostCounterString

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

        return games;
    }
}
