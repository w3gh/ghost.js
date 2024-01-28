import { ByteExtractString, ByteExtractUInt32, ValidateLength } from "../Bytes";
import * as assert from "assert";
import { BNetConnection } from "./BNetConnection";
import { createLoggerFor, hex } from "../Logger";
import { BNetKR } from "./BNetKR";
import { BNCSUtil } from "../bncsutil/BNCSUtil";
import { IAuthState } from "./IAuthState";

const { debug, info, error } = createLoggerFor("AuthState");

/*
 0x000: Passed challenge
 0x100: Old game version (Additional info field supplies patch MPQ filename)
 0x101: Invalid version
 0x102: Game version must be downgraded (Additional info field supplies patch MPQ filename)
 0x0NN: (where NN is the version code supplied in SID_AUTH_INFO): Invalid version code (note that 0x100 is not set in this case).
 0x200: Invalid CD key *
 0x201: CD key in use (Additional info field supplies name of user)
 0x202: Banned key
 0x203: Wrong product

 KR_ROC_KEY_IN_USE = 513; //0x201
 KR_TFT_KEY_IN_USE = 529; //0x211

 KR_OLD_GAME_VERSION = 256;
 KR_INVALID_VERSION = 257;

 KR_MUST_BE_DOWNGRADED = 258;
 KR_INVALID_CD_KEY = 512; //0x200

 KR_BANNED_KEY = 514; //0x202
 KR_WRONG_PRODUCT = 515; //0x203
 */

export class AuthState implements IAuthState {
  public readonly state: Number;
  public readonly description: string;
  private alias: string;
  private nls: Buffer;

  constructor(buff: Buffer) {
    assert(ValidateLength(buff) && buff.length >= 9);
    // 2 bytes					-> Header
    // 2 bytes					-> Length
    // 4 bytes					-> KeyState
    // null terminated string	-> KeyStateDescription

    this.state = ByteExtractUInt32(buff.slice(4, 8));
    this.description = ByteExtractString(buff.slice(8));
  }

  createClientPublicKey({ username, password, alias }: BNetConnection) {
    let clientPublicKey = BNCSUtil.createClientPublicKey(username, password);

    info(`[${alias}] create client public key for ${username}`);

    if (clientPublicKey.length !== 32) {
      // retry since bncsutil randomly fails
      clientPublicKey = BNCSUtil.createClientPublicKey(username, password);

      assert(clientPublicKey.length === 32, "client public key wrong length");
    }

    return clientPublicKey;
  }

  isValid() {
    info("AuthState", this.state, this.description);

    if (this.state > 0) {
      switch (this.state) {
        case BNetKR.ROC_KEY_IN_USE:
          error(
            `logon failed - ROC CD key in use by user [${this.description}], disconnecting`
          );
          break;
        case BNetKR.TFT_KEY_IN_USE:
          error(
            `logon failed - TFT CD key in use by user [${this.description}], disconnecting`
          );
          break;
        case BNetKR.OLD_GAME_VERSION:
          error(`logon failed - game version is too old, disconnecting`);
          break;
        case BNetKR.INVALID_VERSION:
          error(`logon failed - game version is invalid, disconnecting`);
          break;
        case BNetKR.MUST_BE_DOWNGRADED:
          error(
            `logon failed - game version must be downgraded, disconnecting`
          );
          break;
        case BNetKR.INVALID_CD_KEY:
          error(`logon failed - cd key is invalid, disconnecting`);
          break;
        case BNetKR.BANNED_KEY:
          error(`logon failed - cd key is banned, disconnecting`);
          break;
        default:
          error(`logon failed - cd keys not accepted, disconnecting`);
      }

      return false;
    }

    return true;
  }
}
