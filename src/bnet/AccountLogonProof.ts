import {ValidateLength, ByteExtractString} from '../Bytes';
import {createLoggerFor, hex} from '../Logger';
import * as assert from "assert";

const {debug, info, error} = createLoggerFor('AccountLogonProof');

export class AccountLogonProof {
    public readonly proof: Buffer;
    public readonly status: number;
    public readonly message: string;

    constructor(buffer: Buffer) {
        assert(ValidateLength(buffer) && buffer.length >= 8);

        /*
         (DWORD)		 Status
         (BYTE[20])	 Server Password Proof (M2)
         (STRING) 	 Additional information

         This message confirms the validity of the client password proof and supplies the server password proof. See [NLS/SRP Protocol] for more information.

         Status

         0x00: Logon successful.
         0x02: Incorrect password.
         0x0E: An email address should be registered for this account.
         0x0F: Custom error. A string at the end of this message contains the error.
         */

        this.status = buffer.readInt32LE(4);
        this.proof = buffer.slice(8, 20);
        this.message = ByteExtractString(buffer.slice(20 + this.proof.length));
    }

    isValid() {
        /*
       0x00: Logon successful.
       0x02: Incorrect password.
       0x0E(14): An email address should be registered for this account.
       0x0F(15): Custom error. A string at the end of this message contains the error.
       */

        if (this.status > 0) {
            switch (this.status) {
                case 2:
                    error('logon proof failed - incorrect password');
                    return false;
                case 14:
                    error('logon proof failed - an email address should be registered for this account');
                    return false;
                case 15:
                    error(`logon proof failed - ${this.message}`);
                    return false;
                default:
                    error(`logon proof failed - rejected with status ${this.status}`);
                    return false;
            }
        }

        return true;
    }
}
