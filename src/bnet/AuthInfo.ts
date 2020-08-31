import * as assert from "assert";
import {ByteExtractString, ByteExtractUInt32, BytesExtract, ValidateLength} from "../Bytes";
import {BNCSUtil} from "../bncsutil/BNCSUtil";
import {createLoggerFor, hex} from '../Logger';
import {BNetConnection} from "./BNetConnection";

const {debug, info, error} = createLoggerFor('AuthInfo');

export class AuthInfo {
    public readonly logonType: Buffer;
    public readonly serverToken: Buffer;
    public readonly mpqFileTime: Buffer;
    public readonly valueString: string;
    public readonly ix86VerFileName: string;

    constructor(buff: Buffer) {
        assert(ValidateLength(buff) && buff.length >= 25, 'RECEIVE_SID_AUTH_INFO');
        // 2 bytes					-> Header
        // 2 bytes					-> Length
        // 4 bytes					-> LogonType
        // 4 bytes					-> ServerToken
        // 4 bytes					-> UDPValue
        // 8 bytes					-> MPQFileTime
        // null terminated string	-> IX86VerFileName
        // null terminated string	-> ValueStringFormula
        // other bytes              -> ServerSignature

        // (DWORD)		 Logon Type
        // (DWORD)		 Server Token
        // (DWORD)		 UDPValue**
        // (FILETIME)	 MPQ filetime
        // (STRING) 	 IX86ver filename
        // (STRING) 	 ValueString

        this.logonType = buff.slice(4, 8); // p[4:8];

        this.serverToken = buff.slice(8, 12); // p[8:12];
        this.mpqFileTime = buff.slice(16, 24); // p[16:24];
        this.ix86VerFileName = ByteExtractString(buff.slice(24)); // p[24:].split(NULL, 1)[0]
        this.valueString = ByteExtractString(buff.slice(25 + this.ix86VerFileName.length)); // p[25 + len(ix86VerFileName):].split(this.NULL, 1)[0]
    }

    handle(conn: BNetConnection) {
        let {exeInfo, exeVersion} = BNCSUtil.getExeInfo(conn.war3exePath, BNCSUtil.getPlatform());

        if (conn.exeVersion.length) {
            exeVersion = BytesExtract(conn.exeVersion, 4);

            info(`[${conn.alias}] using custom exe version custom.exeversion ${JSON.stringify(exeVersion.toJSON().data)}`);
        } else {
            //exeVersion = bp.pack('<I', exeVersion);
            //exeVersion = ByteInt32()

            info(`[${conn.alias}] using exe version ${JSON.stringify(exeVersion.toJSON().data)}`);
        }

        let exeVersionHash;

        if (conn.exeVersionHash.length) {
            exeVersionHash = BytesExtract(conn.exeVersionHash, 4);

            info(`[${conn.alias}] using custom exe version hash custom.exeversionhash ${JSON.stringify(exeVersionHash.toJSON().data)}`);
        } else {
            exeVersionHash = BNCSUtil.checkRevisionFlat(
                this.valueString,
                conn.war3exePath,
                conn.stormdllPath,
                conn.gamedllPath,
                BNCSUtil.extractMPQNumber(this.ix86VerFileName)
            );

            //exeVersionHash = bp.pack('<I', exeVersionHash);

            info(`[${conn.alias}] using exe version hash ${JSON.stringify(exeVersionHash.toJSON().data)}`);
        }

        const clientTokenValue = ByteExtractUInt32(conn.clientToken);
        const serverTokenValue = ByteExtractUInt32(this.serverToken);

        let keyInfoROC = BNCSUtil.createKeyInfo(
            conn.keyROC,
            clientTokenValue,
            serverTokenValue
        );

        let keyInfoTFT: Buffer;

        if (conn.TFT) {
            keyInfoTFT = BNCSUtil.createKeyInfo(
                conn.keyTFT,
                clientTokenValue,
                serverTokenValue
            );

            info(`[${conn.alias}] attempting to auth as "Warcraft III: The Frozen Throne"`);
        } else {
            info(`[${conn.alias}] attempting to auth as "Warcraft III: Reign of Chaos"`);
        }

        return {
            exeVersion,
            exeVersionHash,
            keyInfoROC,
            keyInfoTFT,
            exeInfo
        }
    }
}
