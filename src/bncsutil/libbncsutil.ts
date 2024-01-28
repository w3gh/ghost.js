import { resolveLibraryPath } from "../util";
import { open, load, DataType, createPointer, restorePointer } from "ffi-rs";

// const ref = require("ref-napi");

// const voidPtr = ref.refType(ref.types.void);

// const CONSTANTS = {
//   "": {
//     P_ALL: 0,
//     P_PID: 1,
//     P_PGID: 2,
//     "0": "P_ALL",
//     "1": "P_PID",
//     "2": "P_PGID",
//   },
// };

// const uint32_t = (exports.uint32_t = voidPtr);
// const uint32_tPtr = (exports.uint32_tPtr = ref.refType(uint32_t));
// const nls_t = (exports.nls_t = voidPtr);
// const nls_tPtr = (exports.nls_tPtr = ref.refType(nls_t));

open({
  library: "libbncsutil",
  path: resolveLibraryPath("bncsutil"),
});

const bncsutil = {
  extractMPQNumber(name: string) {
    return load({
      library: "libbncsutil",
      funcName: "extractMPQNumber",
      retType: DataType.I32,
      paramsType: [DataType.String],
      paramsValue: [name],
    });
  },
  bncsutil_getVersionString(cstr) {
    return load({
      library: "libbncsutil",
      funcName: "bncsutil_getVersionString",
      retType: DataType.I32,
      paramsType: [DataType.U8Array],
      paramsValue: [cstr],
    });
  },

  getExeInfo(fileName, exeInfo, exeInfoLen, exeVersion, platform) {
    return load({
      library: "libbncsutil",
      funcName: "getExeInfo",
      retType: DataType.I32,
      paramsType: [
        DataType.String,
        DataType.U8Array,
        DataType.I32,
        DataType.U8Array,
        DataType.I32,
      ],
      paramsValue: [fileName, exeInfo, exeInfoLen, exeVersion, platform],
    });
  },

  checkRevisionFlat(valueString, file1, file2, file3, mpqNumber, checksum) {
    return load({
      library: "libbncsutil",
      funcName: "checkRevisionFlat",
      retType: DataType.I32,
      paramsType: [
        DataType.String,
        DataType.String,
        DataType.String,
        DataType.String,
        DataType.I32,
        DataType.U8Array,
      ],
      paramsValue: [valueString, file1, file2, file3, mpqNumber, checksum],
    });
  },

  hashPassword(password, buffer) {
    return load({
      library: "libbncsutil",
      funcName: "hashPassword",
      retType: DataType.I32,
      paramsType: [DataType.String, DataType.External],
      paramsValue: [password, buffer],
    });
  },

  kd_quick(
    CDKey,
    clientToken,
    serverToken,
    publicValue,
    product,
    hashBuffer,
    hashBufferLen
  ) {
    return load({
      library: "libbncsutil",
      funcName: "kd_quick",
      retType: DataType.I32,
      paramsType: [
        DataType.String,
        DataType.I32,
        DataType.I32,
        DataType.U8Array,
        DataType.U8Array,
        DataType.U8Array,
        DataType.I32,
      ],
      paramsValue: [
        CDKey,
        clientToken,
        serverToken,
        publicValue,
        product,
        hashBuffer,
        hashBufferLen,
      ],
    });
  },

  nls_get_M1(nls_t, buffer, B, salt) {
    console.log("nls_get_M1", nls_t);

    return load({
      library: "libbncsutil",
      funcName: "nls_get_M1",
      retType: DataType.I32,
      paramsType: [
        DataType.External,
        DataType.String,
        DataType.String,
        DataType.String,
      ],
      paramsValue: [nls_t, buffer, B, salt],
    });
  },

  nls_get_A(nls_t, buffer) {
    console.log("nls_get_A", nls_t);

    return load({
      library: "libbncsutil",
      funcName: "nls_get_A",
      retType: DataType.I32,
      paramsType: [DataType.External, DataType.String],
      paramsValue: [nls_t, buffer],
    });
  },

  nls_init_l(username, usernameLen, password, passwordLen) {
    console.log("nls_init_l", username, usernameLen, password, passwordLen);

    const nls_t = load({
      library: "libbncsutil",
      funcName: "nls_init_l",
      retType: DataType.External,
      paramsType: [
        DataType.String,
        DataType.U64,
        DataType.String,
        DataType.U64,
      ],
      paramsValue: [username, usernameLen, password, passwordLen],
    });

    return nls_t;
  },
};

// const bncsutil2 = new FFI.Library(resolveLibraryPath("bncsutil"), {
//   extractMPQNumber: [ref.types.int32, [ref.types.CString]],
//   checkRevisionFlat: [
//     ref.types.int32,
//     [
//       ref.types.CString,
//       ref.types.CString,
//       ref.types.CString,
//       ref.types.CString,
//       ref.types.int32,
//       ref.refType(ref.types.ulong),
//     ],
//   ],
//   getExeInfo: [
//     ref.types.int32,
//     [
//       ref.types.CString,
//       ref.types.CString,
//       ref.types.ulong,
//       uint32_t,
//       ref.types.int32,
//     ],
//   ],
//   get_mpq_seed: [ref.types.long, [ref.types.int32]],
//   set_mpq_seed: [ref.types.long, [ref.types.int32, ref.types.long]],
//   calcHashBuf: [
//     ref.types.void,
//     [ref.types.CString, ref.types.ulong, ref.types.CString],
//   ],
//   doubleHashPassword: [
//     ref.types.void,
//     [ref.types.CString, ref.types.uint32, ref.types.uint32, ref.types.CString],
//   ],
//   hashPassword: [ref.types.void, [ref.types.CString, ref.types.CString]],
//   kd_quick: [
//     ref.types.int32,
//     [
//       ref.types.CString,
//       ref.types.uint32,
//       ref.types.uint32,
//       uint32_tPtr,
//       uint32_tPtr,
//       ref.types.CString,
//       ref.types.ulong,
//     ],
//   ],
//   kd_init: [ref.types.int32, []],
//   kd_create: [ref.types.int32, [ref.types.CString, ref.types.int32]],
//   kd_free: [ref.types.int32, [ref.types.int32]],
//   kd_val2Length: [ref.types.int32, [ref.types.int32]],
//   kd_product: [ref.types.int32, [ref.types.int32]],
//   kd_val1: [ref.types.int32, [ref.types.int32]],
//   kd_val2: [ref.types.int32, [ref.types.int32]],
//   kd_longVal2: [ref.types.int32, [ref.types.int32, ref.types.CString]],
//   kd_calculateHash: [
//     ref.types.int32,
//     [ref.types.int32, ref.types.uint32, ref.types.uint32],
//   ],
//   kd_getHash: [ref.types.int32, [ref.types.int32, ref.types.CString]],
//   kd_isValid: [ref.types.int32, [ref.types.int32]],
//   nls_init: [nls_t, [ref.types.CString, ref.types.CString]],
//   nls_init_l: [
//     nls_tPtr,
//     [ref.types.CString, ref.types.ulong, ref.types.CString, ref.types.ulong],
//   ],
//   nls_free: [ref.types.void, [nls_tPtr]],
//   nls_reinit: [nls_tPtr, [nls_tPtr, ref.types.CString, ref.types.CString]],
//   nls_reinit_l: [
//     nls_tPtr,
//     [
//       nls_tPtr,
//       ref.types.CString,
//       ref.types.ulong,
//       ref.types.CString,
//       ref.types.ulong,
//     ],
//   ],
//   nls_account_create: [
//     ref.types.ulong,
//     [nls_tPtr, ref.types.CString, ref.types.ulong],
//   ],
//   nls_account_logon: [
//     ref.types.ulong,
//     [nls_tPtr, ref.types.CString, ref.types.ulong],
//   ],
//   nls_account_change_proof: [
//     nls_tPtr,
//     [
//       nls_tPtr,
//       ref.types.CString,
//       ref.types.CString,
//       ref.types.CString,
//       ref.types.CString,
//     ],
//   ],
//   nls_get_S: [
//     ref.types.void,
//     [nls_tPtr, ref.types.CString, ref.types.CString, ref.types.CString],
//   ],
//   nls_get_v: [ref.types.void, [nls_tPtr, ref.types.CString, ref.types.CString]],
//   nls_get_A: [ref.types.void, [nls_tPtr, ref.types.CString]],
//   nls_get_K: [ref.types.void, [nls_tPtr, ref.types.CString, ref.types.CString]],
//   nls_get_M1: [
//     ref.types.void,
//     [nls_tPtr, ref.types.CString, ref.types.CString, ref.types.CString],
//   ],
//   nls_check_M2: [
//     ref.types.int32,
//     [nls_tPtr, ref.types.CString, ref.types.CString, ref.types.CString],
//   ],
//   nls_check_signature: [ref.types.int32, [ref.types.uint32, ref.types.CString]],
//   bncsutil_getVersion: [ref.types.ulong, []],
//   bncsutil_getVersionString: [ref.types.int32, [ref.types.CString]],
// });

export { bncsutil };
