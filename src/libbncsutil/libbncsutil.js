const FFI = require('ffi-napi'),
    ref = require('ref-napi'),
    path = require('path');

const voidPtr = ref.refType(ref.types.void);

exports.CONSTANTS = {
  '': {
      P_ALL: 0,
      P_PID: 1,
      P_PGID: 2,
      '0': 'P_ALL',
      '1': 'P_PID',
      '2': 'P_PGID',
  },
};

// var siginfo_t = exports.siginfo_t = voidPtr;
// var siginfo_tPtr = exports.siginfo_tPtr = ref.refType(siginfo_t);
// var div_t = exports.div_t = Struct({
//   quot: ref.types.int32,
//   rem: ref.types.int32,
// });
// var div_tPtr = exports.div_tPtr = ref.refType(div_t);
// var ldiv_t = exports.ldiv_t = Struct({
//   quot: ref.types.long,
//   rem: ref.types.long,
// });
// var ldiv_tPtr = exports.ldiv_tPtr = ref.refType(ldiv_t);
// var lldiv_t = exports.lldiv_t = Struct({
//   quot: ref.types.longlong,
//   rem: ref.types.longlong,
// });
// var lldiv_tPtr = exports.lldiv_tPtr = ref.refType(lldiv_t);
// var wchar_t = exports.wchar_t = Struct({
//   __darwin_wchar_t: ref.types.int32,
// });
// var wchar_tPtr = exports.wchar_tPtr = ref.refType(wchar_t);
const uint32_t = exports.uint32_t = voidPtr;
const uint32_tPtr = exports.uint32_tPtr = ref.refType(uint32_t);
const nls_t = exports.nls_t = voidPtr;
const nls_tPtr = exports.nls_tPtr = ref.refType(nls_t);

const platform = process.platform;
const cwd = process.cwd();
let libPath = null;

if (platform === 'win32'){
    libPath = '/libbncsutil.dll';
}else if(platform === 'linux'){
    libPath = '/libbncsutil.so';
}else if(platform === 'darwin'){
    libPath = '/libbncsutil.dylib';
}else{
    throw new Error('unsupported plateform for mathlibLoc');
}

exports.libbncsutil = new FFI.Library(path.resolve(cwd + libPath), {
  extractMPQNumber: [ref.types.int32, [
    ref.types.CString,
  ]],
  checkRevisionFlat: [ref.types.int32, [
    ref.types.CString,
    ref.types.CString,
    ref.types.CString,
    ref.types.CString,
    ref.types.int32,
    ref.refType(ref.types.ulong),
  ]],
  getExeInfo: [ref.types.int32, [
    ref.types.CString,
    ref.types.CString,
    ref.types.ulong,
    uint32_t,
    ref.types.int32,
  ]],
  get_mpq_seed: [ref.types.long, [
    ref.types.int32,
  ]],
  set_mpq_seed: [ref.types.long, [
    ref.types.int32,
    ref.types.long,
  ]],
  calcHashBuf: [ref.types.void, [
    ref.types.CString,
    ref.types.ulong,
    ref.types.CString,
  ]],
  // bsha1_hash: [ref.types.void, [
  //   ref.types.CString,
  //   ref.types.uint32,
  //   ref.types.CString,
  // ]],
  doubleHashPassword: [ref.types.void, [
    ref.types.CString,
    ref.types.uint32,
    ref.types.uint32,
    ref.types.CString,
  ]],
  hashPassword: [ref.types.void, [
    ref.types.CString,
    ref.types.CString,
  ]],
  kd_quick: [ref.types.int32, [
    ref.types.CString,
    ref.types.uint32,
    ref.types.uint32,
    uint32_tPtr,
    uint32_tPtr,
    ref.types.CString,
    ref.types.ulong,
  ]],
  kd_init: [ref.types.int32, [
  ]],
  kd_create: [ref.types.int32, [
    ref.types.CString,
    ref.types.int32,
  ]],
  kd_free: [ref.types.int32, [
    ref.types.int32,
  ]],
  kd_val2Length: [ref.types.int32, [
    ref.types.int32,
  ]],
  kd_product: [ref.types.int32, [
    ref.types.int32,
  ]],
  kd_val1: [ref.types.int32, [
    ref.types.int32,
  ]],
  kd_val2: [ref.types.int32, [
    ref.types.int32,
  ]],
  kd_longVal2: [ref.types.int32, [
    ref.types.int32,
    ref.types.CString,
  ]],
  kd_calculateHash: [ref.types.int32, [
    ref.types.int32,
    ref.types.uint32,
    ref.types.uint32,
  ]],
  kd_getHash: [ref.types.int32, [
    ref.types.int32,
    ref.types.CString,
  ]],
  kd_isValid: [ref.types.int32, [
    ref.types.int32,
  ]],
  nls_init: [nls_t, [
    ref.types.CString,
    ref.types.CString,
  ]],
  nls_init_l: [nls_tPtr, [
    ref.types.CString,
    ref.types.ulong,
    ref.types.CString,
    ref.types.ulong,
  ]],
  nls_free: [ref.types.void, [
    nls_tPtr,
  ]],
  nls_reinit: [nls_tPtr, [
    nls_tPtr,
    ref.types.CString,
    ref.types.CString,
  ]],
  nls_reinit_l: [nls_tPtr, [
    nls_tPtr,
    ref.types.CString,
    ref.types.ulong,
    ref.types.CString,
    ref.types.ulong,
  ]],
  nls_account_create: [ref.types.ulong, [
    nls_tPtr,
    ref.types.CString,
    ref.types.ulong,
  ]],
  nls_account_logon: [ref.types.ulong, [
    nls_tPtr,
    ref.types.CString,
    ref.types.ulong,
  ]],
  nls_account_change_proof: [nls_tPtr, [
    nls_tPtr,
    ref.types.CString,
    ref.types.CString,
    ref.types.CString,
    ref.types.CString,
  ]],
  nls_get_S: [ref.types.void, [
    nls_tPtr,
    ref.types.CString,
    ref.types.CString,
    ref.types.CString,
  ]],
  nls_get_v: [ref.types.void, [
    nls_tPtr,
    ref.types.CString,
    ref.types.CString,
  ]],
  nls_get_A: [ref.types.void, [
    nls_tPtr,
    ref.types.CString,
  ]],
  nls_get_K: [ref.types.void, [
    nls_tPtr,
    ref.types.CString,
    ref.types.CString,
  ]],
  nls_get_M1: [ref.types.void, [
    nls_tPtr,
    ref.types.CString,
    ref.types.CString,
    ref.types.CString,
  ]],
  nls_check_M2: [ref.types.int32, [
    nls_tPtr,
    ref.types.CString,
    ref.types.CString,
    ref.types.CString,
  ]],
  nls_check_signature: [ref.types.int32, [
    ref.types.uint32,
    ref.types.CString,
  ]],
  bncsutil_getVersion: [ref.types.ulong, [
  ]],
  bncsutil_getVersionString: [ref.types.int32, [
    ref.types.CString,
  ]],
});

