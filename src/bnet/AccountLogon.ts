import {ValidateLength} from "../Bytes";
import * as assert from "assert";

export class AccountLogon {
    public readonly status: number;
    public readonly salt: Buffer;
    public readonly serverPublicKey: Buffer;

    constructor(buff: Buffer) {
        assert(ValidateLength(buff) && buff.length >= 8);

        /**
         * (DWORD)         Status
         * (BYTE[32])     Salt (s)
         * (BYTE[32])     Server Key (B)
         Reports the success or failure of the logon request.
         Possible status codes:
         0x00: Logon accepted, requires proof.
         0x01: Account doesn't exist.
         0x05: Account requires upgrade.
         Other: Unknown (failure).
         */

        this.status = buff.readInt32LE(4); //buff.slice(4, 8);
        this.salt = buff.slice(8, 40);
        this.serverPublicKey = buff.slice(40, 72);
    }
}
