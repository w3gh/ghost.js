import { resolveLibraryPath, call, outPtr } from "../util";
import { open, DataType } from "ffi-rs";

open({
  library: "libbncsutil",
  path: resolveLibraryPath("bncsutil"),
});

const bncsutil = {
  extractMPQNumber(name: string): number {
    return call({
      library: "libbncsutil",
      funcName: "extractMPQNumber",
      retType: DataType.I32,
      paramsType: [DataType.String],
      paramsValue: [name],
    });
  },

  //MEXP(int) bncsutil_getVersionString(char* outbuf)
  bncsutil_getVersionString(): string {
    const out = outPtr(32);
    const length = call({
      library: "libbncsutil",
      funcName: "bncsutil_getVersionString",
      retType: DataType.I32,
      paramsType: [DataType.External],
      paramsValue: [out.ptr],
    });
    return out.read().toString("utf8", 0, length);
  },

  //MEXP(int) getExeInfo(const char* file_name, char* exe_info, size_t exe_info_size, uint32_t* version, int platform)
  getExeInfo(fileName: string, exeInfoSize: number, platform: number) {
    const exeInfo = outPtr(exeInfoSize);
    const version = outPtr(4);
    const length = call({
      library: "libbncsutil",
      funcName: "getExeInfo",
      retType: DataType.I32,
      paramsType: [
        DataType.String,
        DataType.External,
        DataType.U64,
        DataType.External,
        DataType.I32,
      ],
      paramsValue: [fileName, exeInfo.ptr, exeInfoSize, version.ptr, platform],
    });
    return {
      length,
      exeInfo: exeInfo.read().subarray(
        0,
        Math.min(length, exeInfoSize)
      ),
      exeVersion: version.read(),
    };
  },

  //MEXP(int) checkRevisionFlat(const char* valueString, const char* file1, const char* file2, const char* file3, int mpqNumber, unsigned long* checksum)
  checkRevisionFlat(valueString, file1, file2, file3, mpqNumber): Buffer {
    const checksum = outPtr(8); // unsigned long is 8 bytes on 64-bit unix
    call({
      library: "libbncsutil",
      funcName: "checkRevisionFlat",
      retType: DataType.I32,
      paramsType: [
        DataType.String,
        DataType.String,
        DataType.String,
        DataType.String,
        DataType.I32,
        DataType.External,
      ],
      paramsValue: [valueString, file1, file2, file3, mpqNumber, checksum.ptr],
    });
    return checksum.read().subarray(0, 4);
  },

  //MEXP(void) hashPassword(const char* password, char* outBuffer)
  hashPassword(password: string): Buffer {
    const out = outPtr(20);
    call({
      library: "libbncsutil",
      funcName: "hashPassword",
      retType: DataType.Void,
      paramsType: [DataType.String, DataType.External],
      paramsValue: [password, out.ptr],
    });
    return out.read();
  },

  //MEXP(int) kd_quick(const char* cd_key, uint32_t client_token, uint32_t server_token, uint32_t* public_value, uint32_t* product, char* hash_buffer, size_t buffer_len)
  kd_quick(CDKey: string, clientToken: number, serverToken: number) {
    const publicValue = outPtr(4);
    const product = outPtr(4);
    const hash = outPtr(20);
    call({
      library: "libbncsutil",
      funcName: "kd_quick",
      retType: DataType.I32,
      paramsType: [
        DataType.String,
        DataType.I32,
        DataType.I32,
        DataType.External,
        DataType.External,
        DataType.External,
        DataType.U64,
      ],
      paramsValue: [
        CDKey,
        clientToken | 0, // uint32 passed as same-bits int32
        serverToken | 0,
        publicValue.ptr,
        product.ptr,
        hash.ptr,
        20,
      ],
    });
    return {
      publicValue: publicValue.read().readUInt32LE(0),
      product: product.read().readUInt32LE(0),
      hash: hash.read(),
    };
  },

  //MEXP(void) nls_get_M1(nls_t* nls, char* out, const char* B, const char* salt)
  nls_get_M1(nls_t, B: Buffer, salt: Buffer): Buffer {
    const out = outPtr(20);
    call({
      library: "libbncsutil",
      funcName: "nls_get_M1",
      retType: DataType.Void,
      paramsType: [
        DataType.External,
        DataType.External,
        DataType.U8Array,
        DataType.U8Array,
      ],
      paramsValue: [nls_t, out.ptr, B, salt],
    });
    return out.read();
  },

  //MEXP(void) nls_get_A(nls_t* nls, char* out)
  nls_get_A(nls_t): Buffer {
    const out = outPtr(32);
    call({
      library: "libbncsutil",
      funcName: "nls_get_A",
      retType: DataType.Void,
      paramsType: [DataType.External, DataType.External],
      paramsValue: [nls_t, out.ptr],
    });
    return out.read();
  },

  nls_init_l(username, usernameLen, password, passwordLen) {
    return call({
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
