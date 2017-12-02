import {ByteExtractString, ValidateLength} from "../Bytes";
import {IncomingFriend} from "./IncomingFriend";
import * as assert from "assert";

export class FriendList {
    constructor(buff: Buffer) {
        assert(ValidateLength(buff) && buff.length >= 5, 'RECEIVE_SID_FRIENDSLIST');

        // 2 bytes					-> Header
        // 2 bytes					-> Length
        // 1 byte					-> Total
        // for( 1 .. Total )
        //		null term string	-> Account
        //		1 byte				-> Status
        //		1 byte				-> Area
        //		4 bytes				-> ???
        //		null term string	-> Location

        // (STRING) Account
        // (BYTE) Location
        // (BYTE) Status
        // (DWORD) ProductID
        // (STRING) Location name

        const friends: IncomingFriend[] = [];
        let total = buff[4];
        let i = 5;

        while (total > 0) {
            total--;

            if (buff.length < i + 1) {
                break;
            }

            const account = ByteExtractString(buff.slice(i));

            i += account.length + 1;

            if (buff.length < i + 7) {
                break;
            }

            const location = buff[i], //uchar
                status = buff[i + 1], //uchar
                productID = buff.slice(i + 2, i + 6).toString().split('').reverse().join(''); //4 chars client

            i += 6;

            const locationName = ByteExtractString(buff.slice(i)); //bp.unpack('<S', buff.slice(i))[0];
            i += locationName.length + 1;

            friends.push(new IncomingFriend(account, location, status, productID, locationName))
        }
    }
}
