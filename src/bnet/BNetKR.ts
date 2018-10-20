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
  */
export enum BNetKR {
    OLD_GAME_VERSION = 0x100, //0x100
    INVALID_VERSION = 0x101, //0x101
    MUST_BE_DOWNGRADED = 0x102, //0x102
    INVALID_CD_KEY = 0x200, //0x200
    ROC_KEY_IN_USE = 0x201, //0x201
    TFT_KEY_IN_USE = 0x211, //0x211
    BANNED_KEY = 0x202, //0x202
    WRONG_PRODUCT = 0x203, //0x203
}
